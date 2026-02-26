import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, title } = await request.json();

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'Content and contentType required' },
        { status: 400 }
      );
    }

    // Simple mock response for testing
    const mockAnalysis = {
      keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      readability: { 
        gradeLevel: 'high school', 
        score: 8,
        issues: ['Some long sentences']
      },
      beforeAfter: {
        before: content,
        after: `## ${title}\n\n` + content + '\n\n**Improved with better formatting!**'
      },
      suggestedTags: ['solar', 'customer-support', 'billing'],
      missingContent: ['Could add more detail about next steps']
    };

    return NextResponse.json({
      success: true,
      contentType,
      analysis: mockAnalysis,
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 }
    );
  }
}
