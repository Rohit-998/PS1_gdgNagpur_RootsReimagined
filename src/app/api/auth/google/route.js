import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(clientId);

export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Google credential missing' }, { status: 400 });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    if (!email) {
      return NextResponse.json({ error: 'Email not provided by Google' }, { status: 400 });
    }

    await connectDB();

    // Check if user exists by email or googleId
    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        email,
        name,
        googleId,
        role: 'unassigned', // Default role for new Google SSO users
        active: true,
      });
    } else if (!user.googleId) {
      // Link Google ID if user exists (e.g. they previously signed up with email/pass)
      user.googleId = googleId;
      await user.save();
    }

    if (!user.active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate our system's standard JWT token
    const token = generateToken(user._id.toString(), user.role);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 401 });
  }
}
