import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request) {
  try {
    const { message, context } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const systemPrompt = `You are SafeDose AI — a helpful, friendly pharmaceutical assistant. You help users understand medicines, their uses, side effects, dosage, and safety information.

Rules:
- Keep answers concise (2-4 sentences max unless asked for detail)
- Always add a disclaimer: "Consult your doctor for personalized advice."
- If the user asks about drug interactions, warn them clearly
- Be empathetic and professional
- You can answer in Hindi or English based on the user's language
- If asked something non-medical, politely redirect to medicine-related topics
${context ? `\nContext about the medicine being viewed:\n${context}` : ''}`;

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\nUser question: ' + message }] }
      ]
    });

    const reply = response.text || 'Sorry, I could not process that. Please try again.';

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Fallback logic for demo
    const isInteractionCheck = message?.toLowerCase().includes('interact') || message?.toLowerCase().includes('safe with');
    const isSideEffects = message?.toLowerCase().includes('side effect');
    const mockReply = isInteractionCheck 
      ? "⚠️ Warning: Please consult your doctor before mixing these. Based on general pharmaceutical data, some combinations can be dangerous. What specific medicine combination are you asking about?"
      : isSideEffects
      ? "Common side effects can include nausea, dizziness, or drowsiness depending on the medicine. Always read the instructions on the packaging. Consult your doctor for personalized advice."
      : "I am SafeDose AI. For this demo, my connection to the Gemini API is temporarily restricted, but normally I would provide detailed pharmaceutical analysis here! Consult your doctor for personalized advice.";
      
    return NextResponse.json({ reply: mockReply }, { status: 200 });
  }
}
