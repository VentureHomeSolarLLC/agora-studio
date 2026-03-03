import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { transformToEngram } from '@/lib/engram-transformer';

export const runtime = 'nodejs';

type OpenClawSummary = {
  status: 'pass' | 'fail' | 'unknown';
  missingInputs: string[];
  unclearSteps: string[];
  simulatedActions: string[];
  filesWritten: string[];
  notes: string[];
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

function normalizeList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n|,|;|\u2022|\*/g)
      .map((item) => item.replace(/^[-•\s]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function extractSection(text: string, label: string): string[] {
  if (!text) return [];
  const regex = new RegExp(`${label}\\s*:?\\s*([\\s\\S]*?)(?:\\n\\s*\\n|\\n[A-Z][\\w\\s]+:|$)`, 'i');
  const match = text.match(regex);
  if (!match || !match[1]) return [];
  return normalizeList(match[1]);
}

function buildSummaryFromObject(obj: any): OpenClawSummary {
  const candidate = obj?.summary || obj?.report || obj?.result || obj || {};
  const statusRaw =
    candidate.status ||
    candidate.result ||
    (candidate.pass === true ? 'pass' : candidate.fail === true ? 'fail' : undefined) ||
    (candidate.success === true ? 'pass' : undefined);
  const status = statusRaw === 'pass' || statusRaw === 'fail' ? statusRaw : 'unknown';
  return {
    status,
    missingInputs: normalizeList(
      candidate.missing_inputs || candidate.missingInputs || candidate.inputs_missing || candidate.missing
    ),
    unclearSteps: normalizeList(
      candidate.unclear_steps || candidate.unclearSteps || candidate.conflicts || candidate.issues
    ),
    simulatedActions: normalizeList(
      candidate.simulated_actions || candidate.simulatedActions || candidate.simulated_external_actions
    ),
    filesWritten: normalizeList(candidate.files_written || candidate.filesWritten),
    notes: normalizeList(candidate.notes || candidate.observations || candidate.summaryNotes),
  };
}

function buildSummaryFromText(rawText: string): OpenClawSummary {
  if (!rawText) {
    return {
      status: 'unknown',
      missingInputs: [],
      unclearSteps: [],
      simulatedActions: [],
      filesWritten: [],
      notes: [],
    };
  }
  const status =
    /pass\b/i.test(rawText) && !/fail\b/i.test(rawText)
      ? 'pass'
      : /fail\b/i.test(rawText)
      ? 'fail'
      : 'unknown';
  return {
    status,
    missingInputs: extractSection(rawText, 'missing inputs'),
    unclearSteps: extractSection(rawText, 'unclear steps|conflicts|issues'),
    simulatedActions: extractSection(rawText, 'simulated external actions|simulated actions'),
    filesWritten: extractSection(rawText, 'files written|files created|files updated'),
    notes: extractSection(rawText, 'notes|observations|summary'),
  };
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

Return JSON with:
{
  "status": "pass" | "fail" | "unknown",
  "missing_inputs": string[],
  "unclear_steps": string[],
  "simulated_actions": string[],
  "files_written": string[],
  "notes": string[]
}
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

    const summaryFromObject = buildSummaryFromObject(parsed);
    const summaryFromText = buildSummaryFromText(rawText);
    const summary: OpenClawSummary = {
      status: summaryFromObject.status !== 'unknown' ? summaryFromObject.status : summaryFromText.status,
      missingInputs: summaryFromObject.missingInputs.length ? summaryFromObject.missingInputs : summaryFromText.missingInputs,
      unclearSteps: summaryFromObject.unclearSteps.length ? summaryFromObject.unclearSteps : summaryFromText.unclearSteps,
      simulatedActions: summaryFromObject.simulatedActions.length ? summaryFromObject.simulatedActions : summaryFromText.simulatedActions,
      filesWritten: summaryFromObject.filesWritten.length ? summaryFromObject.filesWritten : summaryFromText.filesWritten,
      notes: summaryFromObject.notes.length ? summaryFromObject.notes : summaryFromText.notes,
    };

    writeLog(logPath, 'OpenClaw execution completed.');

    return NextResponse.json({
      success: true,
      testId,
      testDir,
      logPath,
      result: parsed,
      summary,
    });
  } catch (error: any) {
    console.error('Engram agent test error:', error);
    return NextResponse.json({ error: error.message || 'Engram agent test failed.' }, { status: 500 });
  }
}
