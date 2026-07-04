'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import AuthLayout from '@/components/auth/AuthLayout';
import { getDashboardHref } from '@/lib/authHelpers';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('mg_token', data.token);
      localStorage.setItem('mg_user', JSON.stringify(data.user));
      // Role-based redirect
      router.push(getDashboardHref(data.user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Google login failed');
      
      localStorage.setItem('mg_token', data.token);
      localStorage.setItem('mg_user', JSON.stringify(data.user));
      router.push(getDashboardHref(data.user.role));
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Login was unsuccessful. Try again later.');
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthLayout
        title="Welcome Back"
        subtitle="Log in to verify medicine authenticity."
      >
        <div className="auth-form-wrapper">
          {error && <div className="auth-error-text" style={{ marginBottom: '16px' }}>{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} suppressHydrationWarning>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  id="email"
                  type="email"
                  className={`auth-input ${error ? 'auth-input-error' : ''}`}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`auth-input ${error ? 'auth-input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="auth-forgot">
                <Link href="/forgot-password" className="auth-link">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Continue'}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="google-auth-wrapper">
            {googleLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Loader2 size={16} className="animate-spin" /> Signing in...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
            )}
          </div>

          <div className="auth-footer">
            Don&apos;t have an account? <Link href="/signup" className="auth-link">Sign Up</Link>
          </div>
        </div>
      </AuthLayout>
    </GoogleOAuthProvider>
  );
}
