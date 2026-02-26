import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content, contentType, title } = await request.json();

    if (!content || !contentType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check for duplicates first
    const duplicateCheck = await checkForDuplicates(title, content);

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
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      contentType,
      analysis,
      duplicateCheck,
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function checkForDuplicates(title: string, content: string) {
  // Simple keyword-based check (in production, use embeddings)
  const keyTerms = title.toLowerCase().split(' ').filter(w => w.length > 3);
  
  return {
    similar: false, // TODO: implement real similarity check
    matchTitle: null,
    similarity: 0,
    viewUrl: null,
  };
}

async function analyzeCustomerContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a solar expert. Analyze customer content and identify what could be extracted for AI agent training.

Return JSON with:
- keyPoints: main takeaways
- readability: {gradeLevel, score, issues}
- beforeAfter: {before, after} - show original vs improved
- missingContentSections: [{sectionTitle, content, placement, whyImportant}]
- agentTrainingPotential: {
    hasExtractableContent: boolean,
    suggestedConcepts: [{title, content, forEngram: string}],
    suggestedLessons: [{title, scenario, solution, forEngram: string}]
  }
- suggestedTags: array
- warnings: array

IMPORTANT: Solar panels and batteries don't need regular check-ups, only when there's an issue.`
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

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeInternalContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Analyze internal docs. Return JSON with sections, technicalDetails, edgeCases, missingContent, suggestedTags.'
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
}

async function analyzeAgentInstructions(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Convert to AI instructions. Return JSON with steps, concepts, lessons, searchability, suggestedEdit. Be aggressive about restructuring.'
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
}
