import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing recording file.' }, { status: 400 });
    }

    const transcript = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file,
    });

    return NextResponse.json({ text: transcript.text || '' });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed.' }, { status: 500 });
  }
}
