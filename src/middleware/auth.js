// Authentication & Authorization Middleware
// Simple token-based auth using crypto (no JWT dependency)

import crypto from 'crypto';
import User from '../models/User.js';
import connectDB from '../lib/mongodb.js';

const AUTH_SECRET = process.env.MEDIGUARD_SECRET_KEY || 'mediguard_demo_secret_2024';

/**
 * Generate a simple auth token
 * Format: base64(userId:timestamp:signature)
 */
export function generateToken(userId, role) {
  const timestamp = Date.now();
  const data = `${userId}:${role}:${timestamp}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');
  const token = Buffer.from(`${data}:${signature}`).toString('base64');
  return token;
}

/**
 * Verify and decode a token
 * Returns { userId, role, timestamp } or null
 */
export function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return null;

    const [userId, role, timestamp, signature] = parts;
    const data = `${userId}:${role}:${timestamp}`;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('hex');

    if (signature !== expectedSig) return null;

    // Token expires after 24 hours
    const age = Date.now() - parseInt(timestamp);
    if (age > 24 * 60 * 60 * 1000) return null;

    return { userId, role, timestamp: parseInt(timestamp) };
  } catch {
    return null;
  }
}

/**
 * Authenticate a request
 * Checks for Bearer token or x-api-key header
 * Returns { user, role } or null
 */
export async function authenticate(request) {
  await connectDB();

  // Check Bearer token
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await User.findById(decoded.userId).lean();
      if (user && user.active) {
        return { user, role: user.role };
      }
    }
  }

  // Check API key
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const user = await User.findOne({ api_key: apiKey, active: true }).lean();
    if (user) {
      return { user, role: user.role };
    }
  }

  return null;
}

/**
 * Authorization check — ensure user has required role
 * @param {Object} auth - Result from authenticate()
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export function authorize(auth, allowedRoles) {
  if (!auth) return false;
  return allowedRoles.includes(auth.role);
}

/**
 * Helper: Extract auth from request and validate role
 * Returns { auth, error } — if error is set, return it as response
 */
export async function requireAuth(request, allowedRoles = []) {
  const auth = await authenticate(request);

  if (!auth) {
    return { auth: null, error: { message: 'Authentication required', status: 401 } };
  }

  if (allowedRoles.length > 0 && !authorize(auth, allowedRoles)) {
    return { auth: null, error: { message: 'Insufficient permissions', status: 403 } };
  }

  return { auth, error: null };
}
