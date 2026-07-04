import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/middleware/auth';

// POST /api/auth/register — Create a new user
export async function POST(request) {
  try {
    await connectDB();
    const { email, name, password, role, organization } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'email, name, and password are required' }, { status: 400 });
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Validate role
    const validRoles = ['consumer', 'pharmacy', 'manufacturer', 'regulator'];
    const userRole = validRoles.includes(role) ? role : 'consumer';

    // Hash password
    const password_hash = User.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      name,
      password_hash,
      role: userRole,
      organization,
    });

    // Generate API key for non-consumer roles
    let api_key = null;
    if (userRole !== 'consumer') {
      api_key = user.generateApiKey();
      await user.save();
    }

    // Generate auth token
    const token = generateToken(user._id.toString(), user.role);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
      token,
      api_key, // null for consumers
      message: api_key 
        ? 'Account created. Save your API key — use it in the x-api-key header for programmatic access.'
        : 'Account created successfully.',
    }, { status: 201 });

  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
