import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { transformToEngram } from '@/lib/engram-transformer';

export const runtime = 'nodejs';

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
    const logPath = path.join(logsDir, `engram-agent-${testId}.log`);
    ensureDir(testDir);

    writeLog(logPath, `Starting Engram agent test ${testId}`);

    const generated = transformToEngram(formData);
    Object.entries(generated.files).forEach(([relativePath, content]) => {
      const targetPath = path.join(testDir, relativePath);
      ensureDir(path.dirname(targetPath));
      fs.writeFileSync(targetPath, content);
    });

    writeLog(logPath, `Generated ${Object.keys(generated.files).length} files for agent test.`);

    const endpoint = process.env.OPENCLAW_ENDPOINT || 'http://localhost:18789';
    const runPath = process.env.OPENCLAW_RUN_PATH || '/run';
    const token = process.env.OPENCLAW_TOKEN || process.env.OPENCLAW_BEARER_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'OPENCLAW_TOKEN is missing.' }, { status: 400 });
    }

    const prompt = `
You are a test execution agent validating an Engram skill.

Goals:
- Execute the skill end-to-end using the generated Engram files.
- Use only the provided file tree in ${testDir}.
- Read from ${srcDir} if needed, but DO NOT modify it without approval.
- You may write freely to ${testsDir} and ${logsDir}.
- Simulate any network requests or cloud infrastructure changes (no real side effects).
- Do not perform destructive actions or change billing-related infrastructure.

Return a concise report:
- pass/fail
- missing inputs
- unclear steps or conflicts
- simulated external actions
- files written
`;

    const payload = {
      task: prompt,
      workspace: repoRoot,
      inputs: {
        testDir,
        engramId: generated.id,
      },
      permissions: {
        read: [repoRoot, testDir],
        write: [
          { path: srcDir, mode: 'approval' },
          { path: testsDir, mode: 'auto' },
          { path: logsDir, mode: 'auto' },
        ],
      },
      simulate_external: true,
      allow_writes: Boolean(allowWrites),
    };

    writeLog(logPath, `Invoking OpenClaw at ${endpoint}${runPath}`);
    const response = await fetch(`${endpoint}${runPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    writeLog(logPath, `OpenClaw response status: ${response.status}`);

    if (!response.ok) {
      writeLog(logPath, `OpenClaw error: ${rawText}`);
      return NextResponse.json({ error: rawText || 'OpenClaw execution failed.', logPath }, { status: 500 });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    writeLog(logPath, 'OpenClaw execution completed.');

    return NextResponse.json({
      success: true,
      testId,
      testDir,
      logPath,
      result: parsed,
    });
  } catch (error: any) {
    console.error('Engram agent test error:', error);
    return NextResponse.json({ error: error.message || 'Engram agent test failed.' }, { status: 500 });
  }
}
