import { NextRequest, NextResponse } from 'next/server';
import { transformToEngram, validateEngramForm } from '@/lib/engram-transformer';
import { createOrUpdateFile } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return NextResponse.json({
      success: true,
      message: `Engram ${params.id} - implement full get if needed`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.json();
    const errors = validateEngramForm(formData);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const engram = transformToEngram(formData);
    const basePath = `${process.env.ENGRAMS_PATH || 'engrams-v2'}/${params.id}`;
    
    const results = [];
    for (const [filename, content] of Object.entries(engram.files)) {
      const result = await createOrUpdateFile(
        `${basePath}/${filename}`,
        content,
        `Update engram: ${formData.title} (${filename})`
      );
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      engram_id: params.id,
      commit_sha: results[results.length - 1].sha,
      commit_url: results[results.length - 1].html_url,
      files_updated: Object.keys(engram.files),
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update engram', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Delete not implemented - engrams should be archived, not deleted',
      suggestion: 'Move files manually via GitHub if needed'
    },
    { status: 501 }
  );
}
