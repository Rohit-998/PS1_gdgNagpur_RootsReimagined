// In-memory OTP store (works for demo; use Redis in production)
// Map: phone -> { otp, expiresAt }
const otpStore = new Map();

export function storeOTP(phone, otp) {
  otpStore.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
}

export function verifyOTP(phone, otp) {
  const record = otpStore.get(phone);
  if (!record) return { valid: false, reason: 'No OTP sent to this number' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, reason: 'OTP expired. Please request a new one.' };
  }
  if (record.otp !== otp) return { valid: false, reason: 'Incorrect OTP' };
  otpStore.delete(phone); // single use
  return { valid: true };
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export function maskPhone(phone) {
  // +919876543210 → +91******3210
  return phone.slice(0, 3) + '******' + phone.slice(-4);
}
