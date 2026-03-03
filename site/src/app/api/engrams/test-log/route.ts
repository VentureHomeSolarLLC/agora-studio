import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

function isSafeLogPath(baseDir: string, target: string) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(target);
  return resolvedTarget.startsWith(resolvedBase);
}

export async function POST(request: NextRequest) {
  try {
    const { logPath } = await request.json();
    if (!logPath) {
      return NextResponse.json({ error: 'Missing logPath.' }, { status: 400 });
    }

    const repoRoot = process.env.ENGRAM_TEST_REPO_PATH || '/home/alex';
    const logsDir = path.join(repoRoot, 'logs');
    if (!isSafeLogPath(logsDir, logPath)) {
      return NextResponse.json({ error: 'Invalid log path.' }, { status: 400 });
    }

    if (!fs.existsSync(logPath)) {
      return NextResponse.json({ error: 'Log file not found.' }, { status: 404 });
    }

    const raw = fs.readFileSync(logPath, 'utf-8');
    const lines = raw.split('\n').filter(Boolean);
    const tail = lines.slice(-200).join('\n');

    return NextResponse.json({ text: tail });
  } catch (error: any) {
    console.error('Log read error:', error);
    return NextResponse.json({ error: error.message || 'Failed to read log.' }, { status: 500 });
  }
}
