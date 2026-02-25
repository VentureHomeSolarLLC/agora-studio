import { NextRequest, NextResponse } from 'next/server';
import { transformToEngram, validateEngramForm } from '@/lib/engram-transformer';
import { createMultipleFiles, FileChange } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    const errors = validateEngramForm(formData);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const engram = transformToEngram(formData);
    const basePath = `${process.env.ENGRAMS_PATH || 'engrams-v2'}/${engram.id}`;
    
    const changes: FileChange[] = Object.entries(engram.files).map(([filename, content]) => ({
      path: `${basePath}/${filename}`,
      content,
    }));

    const result = await createMultipleFiles(changes, `Create engram: ${formData.title}`);

    return NextResponse.json({
      success: true,
      engram_id: engram.id,
      commit_sha: result.sha,
      commit_url: result.html_url,
      preview_url: `https://help.venturehome.com/engrams/${engram.id}`,
      files_created: result.paths,
    });

  } catch (error: any) {
    console.error('Failed to create engram:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create engram', details: error.message },
      { status: 500 }
    );
  }
}
