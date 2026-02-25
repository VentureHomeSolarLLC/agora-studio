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
        content: `You are an expert at analyzing and improving customer support content for a solar company. Your job is to make content friendly, accessible, and easy to understand.

ANALYZE FOR:
1. **Key Points** - 3-5 main takeaways customers need to know
2. **FAQs** - Anticipate customer questions and provide clear answers
3. **Readability** - Check reading level (target: middle school to high school). Flag technical jargon.
4. **Tone** - Should be upbeat, friendly, and encouraging. Not corporate or stiff.
5. **Missing Content** - What's NOT covered that customers will wonder about?
6. **Suggested Edit** - Rewrite the content to be more customer-friendly unless it's already perfect

Return JSON:
{
  "keyPoints": ["..."],
  "faqs": [{"question": "...", "answer": "..."}],
  "readability": {
    "gradeLevel": "middle|high|college",
    "issues": ["technical terms used", "complex sentences", "jargon"],
    "score": 1-10
  },
  "tone": {
    "current": "description of current tone",
    "recommended": "friendlier, more upbeat version",
    "suggestedEdit": "full rewritten text if improvements needed, or null if perfect"
  },
  "missingContent": ["what's not covered", "questions customers will still have"],
  "suggestedTags": ["..."],
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
        content: `You are an expert at analyzing internal business documentation. Extract structure and identify gaps.

ANALYZE FOR:
1. **Sections** - Break content into logical sections with importance levels (high/medium/low)
2. **Technical Details** - Extract key technical information, specs, requirements
3. **Edge Cases** - What scenarios aren't covered? What can go wrong?
4. **Missing Content** - What would a new employee still not know after reading this?
5. **Related Topics** - What other internal docs should this link to?
6. **Suggested Improvements** - How to make this more complete and actionable

Return JSON:
{
  "sections": [{"title": "...", "content": "...", "importance": "high|medium|low"}],
  "technicalDetails": ["..."],
  "edgeCases": ["..."],
  "missingContent": ["what's not covered", "gaps in the documentation"],
  "relatedTopics": ["topics to link to"],
  "suggestedImprovements": ["specific additions needed"],
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
        content: `You are an expert at converting human-written procedures into AI-optimized instructions. You MUST aggressively restructure content for machine consumption.

AGORA/ENGRAM ARCHITECTURE:
- **SKILL.md** = Core step-by-step procedure. ONLY the essential actions an AI must take.
- **concepts/** = Reference material, conditional logic, background info, decision criteria
- **lessons/** = Edge cases, exceptions, what went wrong before, troubleshooting

YOUR JOB:
1. **Aggressively Edit** - Human writing is verbose. AI needs lean, precise instructions. Cut fluff. Use imperative voice. One action per step.

2. **Structure for AI Search:**
   - Extract clear STEPS for SKILL.md (checkbox or text type)
   - Extract CONDITIONS/REFERENCE for concepts/ (if X then Y, lookup tables, criteria)
   - Extract EDGE CASES for lessons/ (exceptions, failures, workarounds)

3. **Optimize for Context Window:**
   - Break long paragraphs into atomic steps
   - Make each step independently understandable
   - Use consistent terminology (tag suggestions help here)
   - Decision points must be explicit: "IF [condition] THEN [action] ELSE [action]"

4. **Missing Content Detection:**
   - What prerequisites are assumed but not stated?
   - What error handling is missing?
   - What decisions require human judgment vs can be automated?

5. **AI Searchability Score:**
   - Rate 1-10 how searchable this will be
   - Suggest specific tags/categories
   - Identify ambiguous terms that need clarification

Return AGGRESSIVELY REWRITTEN content plus structure:

{
  "steps": [
    {
      "title": "Action-oriented step name",
      "content": "Precise instructions. No fluff.",
      "type": "text|checkbox|decision",
      "decisionLogic": "IF condition THEN action ELSE action (for decision type)"
    }
  ],
  "concepts": [
    {
      "title": "Reference topic name",
      "content": "Background info, criteria, lookup data",
      "shouldLinkTo": "which steps reference this"
    }
  ],
  "lessons": [
    {
      "title": "Edge case name",
      "scenario": "When this happens...",
      "handling": "Do this...",
      "whyItMatters": "Context for the AI"
    }
  ],
  "prerequisites": ["must be true before starting"],
  "decisionPoints": [
    {
      "question": "Decision the AI must make",
      "criteria": "How to decide from concepts/",
      "outcomes": ["path A", "path B"]
    }
  ],
  "risks": ["what can go wrong"],
  "missingContent": [
    "assumed prerequisites not stated",
    "missing error handling",
    "ambiguous decisions needing clarification"
  ],
  "searchability": {
    "score": 1-10,
    "issues": ["why it's not searchable"],
    "suggestedTags": ["...", "..."],
    "improvements": ["how to make it more findable"]
  },
  "suggestedEdit": "Aggressively rewritten, AI-optimized version of the full content"
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
