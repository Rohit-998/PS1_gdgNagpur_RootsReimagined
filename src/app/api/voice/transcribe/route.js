import { NextResponse } from 'next/server';
import { speechToText, textToSpeech } from '@/services/sarvamAI';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const language = formData.get('language') || 'hi-IN'; // e.g., hi-IN, ta-IN

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    
    // 1. Transcribe the audio
    const { transcript } = await speechToText(arrayBuffer, language);
    
    // Here we would typically parse the transcript to find medicine name and batch ID.
    // For demo purposes, we will return the transcript directly so the frontend can then call the verify endpoint.
    // Or we could run the verification here and then convert the result to speech.
    
    // Let's assume we do the verification on the frontend or it calls verify API separately.
    // Then the frontend calls another endpoint to synthesize the result text.
    
    return NextResponse.json({ transcript }, { status: 200 });

  } catch (error) {
    console.error("Voice API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
