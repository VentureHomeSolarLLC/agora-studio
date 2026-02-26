import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('API /analyze called');
  
  try {
    let body;
    try {
      body = await request.json();
      console.log('Body received:', { hasContent: !!body?.content, contentType: body?.contentType });
    } catch (e) {
      console.error('Parse error:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { content, contentType, title } = body;

    if (!content || !contentType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const response = {
      success: true,
      contentType,
      analysis: {
        keyPoints: ['Point 1', 'Point 2'],
        readability: { gradeLevel: 'high school', score: 7, issues: [] },
        beforeAfter: {
          before: content.substring(0, 50),
          after: `## ${title}\n\n${content}`
        },
        suggestedTags: ['test', 'solar'],
        missingContent: []
      }
    };

    console.log('Response ready');
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
