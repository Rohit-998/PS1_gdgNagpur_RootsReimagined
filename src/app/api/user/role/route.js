import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticate, generateToken } from '@/middleware/auth';

export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();
    if (!['consumer', 'pharmacy', 'manufacturer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role selection' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(auth.user._id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow role changes if the user is completely unassigned (brand new user)
    // Once they pick a role, they are locked in forever.
    if (user.role !== 'unassigned') {
      return NextResponse.json({ error: 'Role has already been set and cannot be changed' }, { status: 403 });
    }

    user.role = role;
    await user.save();

    // Issue a new token with the updated role
    const newToken = generateToken(user._id.toString(), user.role);

    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
