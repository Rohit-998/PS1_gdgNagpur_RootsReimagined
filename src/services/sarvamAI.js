// Sarvam AI API integration

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_URL = 'https://api.sarvam.ai';

export async function speechToText(audioBuffer, languageCode) {
  // Mocking the call structure based on standard Sarvam STT approach
  // In reality, refer to their latest documentation for exact endpoints and payload
  
  if (!SARVAM_API_KEY) {
    console.warn("SARVAM_API_KEY is not set. Returning mock transcription.");
    return { transcript: "Paracetamol 500mg BATCH-SUN-2024-001" };
  }

  // Assuming a FormData approach for audio upload
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/wav' }), 'audio.wav');
  formData.append('language_code', languageCode); 
  
  try {
    const response = await fetch(`${SARVAM_URL}/speech-to-text-translate`, {
      method: 'POST',
      headers: {
        'API-Subscription-Key': SARVAM_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Sarvam STT failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { transcript: data.transcript }; // the extracted text
  } catch (error) {
    console.error("Sarvam STT Error:", error);
    throw error;
  }
}

export async function textToSpeech(text, targetLanguage) {
  if (!SARVAM_API_KEY) {
    console.warn("SARVAM_API_KEY is not set. Returning mock TTS.");
    // Return empty buffer or base64
    return { audioBase64: "" }; 
  }

  try {
    const response = await fetch(`${SARVAM_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Subscription-Key': SARVAM_API_KEY
      },
      body: JSON.stringify({
        inputs: [text],
        target_language_code: targetLanguage,
        speaker: 'manisha',
        pitch: 0,
        pace: 1.05,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v2'
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Sarvam TTS API Error Body:", errorBody);
      throw new Error(`Sarvam TTS failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Assuming the API returns base64 string of the audio
    return { audioBase64: data.audios[0] };
  } catch (error) {
    console.error("Sarvam TTS Error:", error);
    throw error;
  }
}
