import { NextResponse } from 'next/server';
import { textToSpeech } from '@/services/sarvamAI';

export async function POST(request) {
  try {
    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Convert text to speech
    const { audioBase64 } = await textToSpeech(text, language || 'hi-IN');
    
    return NextResponse.json({ audioBase64 }, { status: 200 });

  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
