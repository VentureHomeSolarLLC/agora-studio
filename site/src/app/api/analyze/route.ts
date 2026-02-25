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
        content: `You are an expert residential solar consultant with 10+ years of experience helping homeowners understand solar. Your job is to transform rough notes into polished, professional customer content.

TONE & STYLE REQUIREMENTS:
- Write as a knowledgeable solar expert who is friendly and approachable
- Target reading level: HIGH SCHOOL (not college, not middle school)
- Use clear, everyday language - no industry jargon without explanation
- Be upbeat and encouraging but professional
- Use formatting aggressively: bullets, numbered lists, bold text, short paragraphs
- Add punctuation where needed to improve clarity
- Break up long sentences and dense paragraphs

YOUR TASK:
1. Analyze the content for what's missing
2. Rewrite for high school readability with professional solar expert tone
3. WRITE THE MISSING SECTIONS - don't just list what's missing, actually write the content that should be added
4. Show a complete "After" version that includes: original content + tone improvements + suggested additions

Return JSON:
{
  "keyPoints": ["3-5 main takeaways"],
  "readability": {
    "gradeLevel": "high school",
    "score": 1-10,
    "issues": ["what needs fixing"]
  },
  "toneAnalysis": {
    "current": "description of current tone",
    "improved": "description of improved tone",
    "suggestedEdit": "FULL REWRITTEN ARTICLE with better tone and formatting"
  },
  "suggestedAdditions": [
    {
      "section": "What to call this addition (e.g., 'Cost Savings Example')",
      "content": "The actual written content to add - write it as a solar expert would",
      "placement": "where it goes (e.g., 'After paragraph 2', 'End of article')"
    }
  ],
  "missingContent": ["brief list of what was missing"],
  "beforeAfter": {
    "before": "the original content they submitted",
    "after": "COMPLETE FINAL VERSION with all improvements and additions integrated"
  },
  "suggestedTags": ["relevant tags"],
  "warnings": ["important caveats"]
}`
      },
      {
        role: 'user',
        content: `Title: ${title}\n\nContent:\n${content}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeInternalContent(content: string, title: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing internal business documentation. Extract structure and identify gaps.

ANALYZE FOR:
1. **Sections** - Break content into logical sections with importance levels
2. **Technical Details** - Extract key technical information
3. **Edge Cases** - What scenarios aren't covered?
4. **Missing Content** - What would a new employee still not know?
5. **Related Topics** - What other docs should this link to?

Return JSON:
{
  "sections": [{"title": "...", "content": "...", "importance": "high|medium|low"}],
  "technicalDetails": ["..."],
  "edgeCases": ["..."],
  "missingContent": ["..."],
  "relatedTopics": ["..."],
  "suggestedTags": ["..."],
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
        content: `You are an expert at creating AI agent instructions. Convert human-written procedures into AI-optimized instructions.

AGORA/ENGRAM ARCHITECTURE:
- SKILL.md = Core step-by-step procedure
- concepts/ = Reference material, conditional logic
- lessons/ = Edge cases, exceptions

YOUR JOB:
1. Aggressively edit for AI consumption - cut fluff, use imperative voice
2. Extract clear STEPS for SKILL.md
3. Extract CONDITIONS/REFERENCE for concepts/
4. Extract EDGE CASES for lessons/
5. Optimize for context window efficiency

Return JSON:
{
  "steps": [{"title": "...", "content": "...", "type": "text|checkbox|decision"}],
  "prerequisites": ["..."],
  "concepts": [{"title": "...", "content": "..."}],
  "lessons": [{"title": "...", "scenario": "...", "handling": "..."}],
  "risks": ["..."],
  "missingContent": ["..."],
  "searchability": {"score": 1-10, "improvements": ["..."]},
  "suggestedTags": ["..."],
  "suggestedEdit": "aggressively rewritten version"
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
