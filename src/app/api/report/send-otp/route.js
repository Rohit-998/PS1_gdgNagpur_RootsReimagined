import { NextResponse } from 'next/server';
import { storeOTP, generateOTP } from '@/lib/otpStore.js';

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const normalised = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`;
    const otp = generateOTP();

    storeOTP(normalised, otp);

    // Demo mode: OTP is returned in the response for hackathon demo purposes
    // In production, this would be sent via an SMS provider
    console.log(`[SafeDose OTP] ${normalised} → ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully. (Demo OTP: ${otp})`,
      demo_otp: otp,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
