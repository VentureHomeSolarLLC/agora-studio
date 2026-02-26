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
    const changes: FileChange[] = Object.entries(engram.files).map(([filePath, content]) => ({
      path: filePath,
      content,
    }));

    const result = await createMultipleFiles(changes, `Create ${formData.contentType}: ${formData.title}`);

    const previewUrl = formData.contentType === 'customer'
      ? `https://help.venturehome.com/article/${engram.id}`
      : `https://help.venturehome.com/${engram.outputPath}/${engram.id}`;

    return NextResponse.json({
      success: true,
      engram_id: engram.id,
      content_type: formData.contentType,
      output_path: engram.outputPath,
      commit_sha: result.sha,
      commit_url: result.html_url,
      preview_url: previewUrl,
      files_created: result.paths,
    });

  } catch (error: any) {
    console.error('Failed to create:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create', details: error.message },
      { status: 500 }
    );
  }
}
