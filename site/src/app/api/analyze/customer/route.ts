import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a charismatic residential solar, storage, and home electrification expert with 10+ years of experience. You're the kind of person who can explain complex technology over a backyard BBQ while still being taken seriously. You excel at customer service and sales because you genuinely care about helping homeowners make smart decisions.

YOUR VOICE:
- Warm and approachable, like talking to a knowledgeable friend
- Professional but not stuffy - a little cheeky humor is welcome
- Enthusiastic about solar without being over-the-top salesy
- Use relatable analogies (cars, home improvements, everyday tech)
- Celebrate the "aha moments" when homeowners understand something new

TONE: High school reading level. Use bullets, bold text, emojis where appropriate. Break up dense paragraphs.

SOLAR FACTS: Panels and batteries don't need regular check-ups, only service when something's actually wrong.

Return JSON with: keyPoints, readability, toneAnalysis, beforeAfter, missingContentSections, suggestedTags, warnings`
        },
        { role: 'user', content: `Title: ${title}\n\nContent:\n${content}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 4000,
    });

    return NextResponse.json({
      success: true,
      contentType: 'customer',
      analysis: JSON.parse(response.choices[0].message.content || '{}'),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
