import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, title } = await request.json();

    if (!content || !contentType) {
      return NextResponse.json(
        { error: 'Content and contentType required' },
        { status: 400 }
      );
    }

    console.log(`Analyzing ${contentType} content: "${title?.substring(0, 50)}..."`);

    let analysis;
    
    switch (contentType) {
      case 'customer':
        analysis = await analyzeCustomerContent(content, title);
        break;
      case 'internal':
        analysis = await analyzeInternalContent(content, title);
        break;
      case 'agent':
        analysis = await analyzeAgentInstructions(content, title);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid contentType' },
          { status: 400 }
        );
    }

    console.log('Analysis complete:', Object.keys(analysis));

    return NextResponse.json({
      success: true,
      contentType,
      analysis,
    });

  } catch (error: any) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

async function analyzeCustomerContent(content: string, title: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert residential solar consultant. Transform rough notes into polished customer content.

TONE: Friendly, professional solar expert. High school reading level.
FORMATTING: Use bullets, bold text, short paragraphs aggressively.
SOLAR FACT: Panels and batteries don't need regular check-ups, only service when there's an issue.

Return JSON:
{
  "keyPoints": ["3-5 takeaways"],
  "readability": {"gradeLevel": "high school", "score": 1-10},
  "beforeAfter": {"before": "original", "after": "complete improved version"},
  "suggestedTags": ["..."]
}`
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent:\n${content}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure required fields exist
    return {
      keyPoints: result.keyPoints || [],
      readability: result.readability || { gradeLevel: 'high school', score: 5 },
      beforeAfter: result.beforeAfter || { before: content, after: content },
      suggestedTags: result.suggestedTags || [],
      ...result
    };
  } catch (error) {
    console.error('Customer analysis error:', error);
    throw error;
  }
}

async function analyzeInternalContent(content: string, title: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze internal documentation. Return JSON with sections, technicalDetails, edgeCases, missingContent, suggestedTags.`
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent:\n${content}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Internal analysis error:', error);
    throw error;
  }
}

async function analyzeAgentInstructions(content: string, title: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Convert procedures to AI-optimized instructions. Return JSON with steps, concepts, lessons, searchability score, suggestedEdit.`
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent:\n${content}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4000,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Agent analysis error:', error);
    throw error;
  }
}
