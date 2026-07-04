import { NextResponse } from 'next/server';
import { generateRuralEducationText } from '@/services/aiAnalysis';
import { textToSpeech } from '@/services/sarvamAI';

/**
 * POST /api/voice/educate
 * Body: { medicineInfo, language }
 * Returns: { educationText, audioBase64, source }
 *
 * Uses GEMINI_API_KEY (via aiAnalysis) + SARVAM_API_KEY (via sarvamAI)
 * — both already in .env.local, no new keys needed.
 */
export async function POST(request) {
  try {
    const { medicineInfo, language = 'hi-IN' } = await request.json();

    if (!medicineInfo) {
      return NextResponse.json({ error: 'medicineInfo is required' }, { status: 400 });
    }

    // 1. Generate simple rural explanation via Gemini
    const { educationText, source } = await generateRuralEducationText(medicineInfo);

    // 2. Convert the text to speech via Sarvam AI in the user's regional language
    let audioBase64 = '';
    try {
      const ttsResult = await textToSpeech(educationText, language);
      audioBase64 = ttsResult.audioBase64 || '';
    } catch (ttsErr) {
      console.error('Sarvam TTS failed in /api/voice/educate:', ttsErr.message);
      // Audio failure is non-fatal — return text even if audio fails
    }

    return NextResponse.json({ educationText, audioBase64, source }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/voice/educate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
