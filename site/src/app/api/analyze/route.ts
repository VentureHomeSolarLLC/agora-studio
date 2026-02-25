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
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing customer support content. Extract key information and suggest improvements.

Return JSON with this structure:
{
  "keyPoints": ["3-5 main takeaways"],
  "faqs": [{"question": "...", "answer": "..."}],
  "clarity": {
    "score": 1-10,
    "issues": ["unclear sections"],
    "improvements": ["specific suggestions"]
  },
  "suggestedTags": ["relevant tags"],
  "concepts": [{"title": "...", "content": "..."}],
  "warnings": ["important caveats"]
}`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeInternalContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing internal business documentation. Extract technical details, procedures, and edge cases.

Return JSON with this structure:
{
  "sections": [{"title": "...", "content": "...", "importance": "high|medium|low"}],
  "technicalDetails": ["key technical info"],
  "edgeCases": ["what can go wrong"],
  "relatedTopics": ["related concepts to link"],
  "suggestedTags": ["relevant tags"],
  "lessons": [{"title": "...", "scenario": "...", "solution": "..."}]
}`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeAgentInstructions(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating AI agent instructions. Extract structured procedures from informal descriptions.

Return JSON with this structure:
{
  "steps": [
    {
      "title": "Step name",
      "content": "Detailed instructions",
      "type": "text|checkbox|decision",
      "decisionLogic": "if applicable"
    }
  ],
  "prerequisites": ["what must be true before starting"],
  "decisionPoints": [{"question": "...", "options": ["..."], "outcomes": ["..."]}],
  "risks": ["what can go wrong"],
  "edgeCases": [{"scenario": "...", "handling": "..."}],
  "suggestedTags": ["relevant tags"],
  "concepts": [{"title": "...", "content": "..."}],
  "lessons": [{"title": "...", "scenario": "...", "solution": "..."}]
}`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
