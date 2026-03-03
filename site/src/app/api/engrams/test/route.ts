import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { transformToEngram } from '@/lib/engram-transformer';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

type IntegrationCheckResult = {
  name: string;
  status: 'pass' | 'fail' | 'skipped';
  detail: string;
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeLog(logPath: string, message: string) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
}

function extractEmails(text: string): string[] {
  if (!text) return [];
  const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  return Array.from(new Set(text.match(regex) || []));
}

async function testMicrosoftGraph(content: string, logPath: string): Promise<IntegrationCheckResult> {
  const tenantId = process.env.GRAPH_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET;
  const scope = process.env.GRAPH_SCOPE || 'https://graph.microsoft.com/.default';
  const mailbox = process.env.GRAPH_MAILBOX || extractEmails(content)[0];

  if (!tenantId || !clientId || !clientSecret) {
    return {
      name: 'Microsoft Graph API',
      status: 'skipped',
      detail: 'Missing GRAPH_TENANT_ID / GRAPH_CLIENT_ID / GRAPH_CLIENT_SECRET',
    };
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope,
  });

  try {
    writeLog(logPath, 'Graph: requesting access token');
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      return { name: 'Microsoft Graph API', status: 'fail', detail: `Token error: ${text}` };
    }
    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return { name: 'Microsoft Graph API', status: 'fail', detail: 'No access token returned.' };
    }

    if (!mailbox) {
      return { name: 'Microsoft Graph API', status: 'pass', detail: 'Token OK (no mailbox detected for message read).' };
    }

    writeLog(logPath, `Graph: checking mailbox ${mailbox}`);
    const messagesUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/messages?$top=1&$select=subject,receivedDateTime`;
    const msgResponse = await fetch(messagesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!msgResponse.ok) {
      const text = await msgResponse.text();
      return { name: 'Microsoft Graph API', status: 'fail', detail: `Mailbox check failed: ${text}` };
    }

    return { name: 'Microsoft Graph API', status: 'pass', detail: 'Token OK and mailbox read succeeded.' };
  } catch (error: any) {
    return { name: 'Microsoft Graph API', status: 'fail', detail: error?.message || 'Graph check failed.' };
  }
}

async function testSalesforce(logPath: string): Promise<IntegrationCheckResult> {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const oauthUrl = process.env.SALESFORCE_OAUTH_URL || 'https://login.salesforce.com/services/oauth2/token';
  const apiVersion = process.env.SALESFORCE_API_VERSION || 'v59.0';

  if (!clientId || !clientSecret) {
    return {
      name: 'Salesforce API',
      status: 'skipped',
      detail: 'Missing SALESFORCE_CLIENT_ID / SALESFORCE_CLIENT_SECRET',
    };
  }

  try {
    writeLog(logPath, 'Salesforce: requesting access token');
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });
    const tokenResponse = await fetch(oauthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      return { name: 'Salesforce API', status: 'fail', detail: `Token error: ${text}` };
    }
    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;
    const instanceUrl = tokenJson.instance_url;
    if (!accessToken || !instanceUrl) {
      return { name: 'Salesforce API', status: 'fail', detail: 'Token response missing access_token or instance_url.' };
    }

    const limitsUrl = `${instanceUrl}/services/data/${apiVersion}/limits`;
    writeLog(logPath, 'Salesforce: checking limits endpoint');
    const limitsResponse = await fetch(limitsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!limitsResponse.ok) {
      const text = await limitsResponse.text();
      return { name: 'Salesforce API', status: 'fail', detail: `Limits check failed: ${text}` };
    }

    return { name: 'Salesforce API', status: 'pass', detail: 'Token OK and limits endpoint responded.' };
  } catch (error: any) {
    return { name: 'Salesforce API', status: 'fail', detail: error?.message || 'Salesforce check failed.' };
  }
}

async function testGoogleSuite(allowWrites: boolean, logPath: string): Promise<IntegrationCheckResult> {
  try {
    await execFileAsync('which', ['gog']);
  } catch {
    return { name: 'Google Workspace (GOG)', status: 'skipped', detail: 'gog CLI not installed.' };
  }

  const gogAccount = process.env.GOG_ACCOUNT;
  if (!gogAccount) {
    return { name: 'Google Workspace (GOG)', status: 'skipped', detail: 'Missing GOG_ACCOUNT env var.' };
  }

  if (!allowWrites) {
    return { name: 'Google Workspace (GOG)', status: 'pass', detail: 'gog CLI available (writes disabled).' };
  }

  const testSheetId = process.env.GOOGLE_TEST_SHEET_ID;
  if (!testSheetId) {
    return {
      name: 'Google Workspace (GOG)',
      status: 'skipped',
      detail: 'Allow-writes enabled but GOOGLE_TEST_SHEET_ID not set.',
    };
  }

  try {
    writeLog(logPath, 'Google: appending test row via gog');
    const values = JSON.stringify([[new Date().toISOString(), 'engram-test']]);
    await execFileAsync('gog', [
      'sheets',
      'append',
      testSheetId,
      'Sheet1!A:B',
      '--values-json',
      values,
      '--insert',
      'INSERT_ROWS',
    ], { env: { ...process.env, GOG_ACCOUNT: gogAccount } });
    return { name: 'Google Workspace (GOG)', status: 'pass', detail: 'Test row appended to Google Sheet.' };
  } catch (error: any) {
    return { name: 'Google Workspace (GOG)', status: 'fail', detail: error?.message || 'Google Sheets write failed.' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { formData, allowWrites } = await request.json();
    if (!formData || !formData.title) {
      return NextResponse.json({ error: 'Missing form data.' }, { status: 400 });
    }

    const repoRoot = process.env.ENGRAM_TEST_REPO_PATH || '/home/alex';
    const srcDir = path.join(repoRoot, 'src');
    const testsDir = path.join(repoRoot, 'tests');
    const logsDir = path.join(repoRoot, 'logs');

    if (!fs.existsSync(srcDir) || !fs.existsSync(testsDir) || !fs.existsSync(logsDir)) {
      return NextResponse.json({ error: 'Testing repo path not initialized.' }, { status: 400 });
    }

    const slug = slugify(formData.title);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testId = `${slug}-${timestamp}`;
    const testDir = path.join(testsDir, testId);
    const logPath = path.join(logsDir, `engram-test-${testId}.log`);
    ensureDir(testDir);

    writeLog(logPath, `Starting Engram test ${testId}`);

    const generated = transformToEngram(formData);
    Object.entries(generated.files).forEach(([relativePath, content]) => {
      const targetPath = path.join(testDir, relativePath);
      ensureDir(path.dirname(targetPath));
      fs.writeFileSync(targetPath, content);
    });

    writeLog(logPath, `Generated ${Object.keys(generated.files).length} files for test.`);

    const checks: IntegrationCheckResult[] = [];
    const contentSource = formData.rawContent || '';

    checks.push(await testMicrosoftGraph(contentSource, logPath));
    checks.push(await testSalesforce(logPath));
    checks.push(await testGoogleSuite(Boolean(allowWrites), logPath));

    const summary = {
      passed: checks.filter((c) => c.status === 'pass').length,
      failed: checks.filter((c) => c.status === 'fail').length,
      skipped: checks.filter((c) => c.status === 'skipped').length,
    };

    writeLog(logPath, `Test complete. Passed ${summary.passed}, Failed ${summary.failed}, Skipped ${summary.skipped}`);

    return NextResponse.json({
      success: true,
      testId,
      testDir,
      logPath,
      checks,
      summary,
    });
  } catch (error: any) {
    console.error('Engram test error:', error);
    return NextResponse.json({ error: error.message || 'Engram test failed.' }, { status: 500 });
  }
}
