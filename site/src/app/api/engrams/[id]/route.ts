import { NextRequest, NextResponse } from 'next/server';
import { transformToEngram, validateEngramForm } from '@/lib/engram-transformer';
import { createOrUpdateFile } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({
      success: true,
      message: `Engram ${id}`,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.json();
    const errors = validateEngramForm(formData);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const engram = transformToEngram(formData);
    const basePath = `${process.env.ENGRAMS_PATH || 'engrams-v2'}/${id}`;
    
    const results = [];
    for (const [filename, content] of Object.entries(engram.files)) {
      const result = await createOrUpdateFile(
        `${basePath}/${filename}`,
        content,
        `Update engram: ${formData.title}`
      );
      results.push(result);
    }

    return NextResponse.json({
      success: true,
      engram_id: id,
      commit_sha: results[results.length - 1].sha,
      commit_url: results[results.length - 1].html_url,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    { success: false, error: 'Delete not implemented' },
    { status: 501 }
  );
}
