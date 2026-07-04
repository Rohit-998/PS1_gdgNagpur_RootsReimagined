'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignUp() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const reqs = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    num: /[0-9]/.test(formData.password),
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!reqs.length || !reqs.upper || !reqs.lower || !reqs.num) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: 'consumer' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      // Auto-login after registration
      localStorage.setItem('mg_token', data.token);
      localStorage.setItem('mg_user', JSON.stringify(data.user));
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccountSelect = () => {
    setShowGoogleModal(false);
    setLoading(true);
    setTimeout(() => {
      const mockUser = { id: 'google_demo_user', email: 'judge@hackathon.com', name: 'Demo Judge', role: 'consumer' };
      localStorage.setItem('mg_token', 'mock_jwt_google_token');
      localStorage.setItem('mg_user', JSON.stringify(mockUser));
      router.push('/scan');
    }, 600);
  };

  if (success) {
    return (
      <AuthLayout title="Account Created" subtitle="Welcome to SafeDose.">
        <div style={{ textAlign: 'center', padding: 'var(--sp-8) 0' }}>
          <CheckCircle2 size={64} color="var(--color-verified)" style={{ margin: '0 auto var(--sp-6)' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--sp-4)', color: 'var(--text-primary)', fontWeight: 700 }}>You are all set!</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-8)', fontSize: 'var(--text-base)' }}>Your account has been successfully created. You are now logged in.</p>
          <Link href="/scan" className="auth-submit" style={{ display: 'inline-flex', justifyContent: 'center', textDecoration: 'none' }}>
            Start Verifying Medicines
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <>
      {/* Google Account Chooser Modal */}
      {showGoogleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', padding: 'var(--sp-8) var(--sp-6)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
            <svg viewBox="0 0 24 24" style={{ width: '48px', height: '48px', margin: '0 auto var(--sp-4)' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '0 0 var(--sp-2)', color: 'var(--text-primary)' }}>Sign in with Google</h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-8)' }}>Choose an account to continue to SafeDose</p>
            <div
              onClick={handleGoogleAccountSelect}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', padding: 'var(--sp-3) var(--sp-4)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', cursor: 'pointer', textAlign: 'left', transition: 'background var(--ease-fast)' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-inset)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-brand-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 700, flexShrink: 0 }}>D</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>Demo Judge</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>judge@hackathon.com</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--sp-6)', textAlign: 'right' }}>
              <button onClick={() => setShowGoogleModal(false)} style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary)', fontWeight: 600, cursor: 'pointer', padding: 'var(--sp-2) var(--sp-4)', fontSize: 'var(--text-sm)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <AuthLayout title="Create Account" subtitle="Join the trusted network of verified medicines.">
        <button className="google-btn" onClick={() => setShowGoogleModal(true)} type="button">
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="auth-divider">or sign up with email</div>

        <form className="auth-form" onSubmit={handleCreate}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">Full Name</label>
            <div className="auth-input-wrapper">
              <input
                id="name"
                type="text"
                className={`auth-input ${error && !formData.name ? 'auth-input-error' : ''}`}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <div className="auth-input-wrapper">
              <input
                id="email"
                type="email"
                className={`auth-input ${error && !formData.email ? 'auth-input-error' : ''}`}
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`auth-input ${error && !formData.password ? 'auth-input-error' : ''}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Live Validation Feedback */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {[
              { ok: reqs.length, label: 'Min 8 chars' },
              { ok: reqs.upper, label: '1 Uppercase' },
              { ok: reqs.lower, label: '1 Lowercase' },
              { ok: reqs.num, label: '1 Number' },
            ].map(({ ok, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: ok ? 'var(--color-verified)' : 'inherit' }}>
                {ok ? <CheckCircle2 size={12} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.5, display: 'inline-block' }} />}
                {label}
              </div>
            ))}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">Confirm Password</label>
            <div className="auth-input-wrapper">
              <input
                id="confirm"
                type={showPassword ? "text" : "password"}
                className={`auth-input ${(error && formData.password !== formData.confirmPassword) ? 'auth-input-error' : ''}`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>

          {error && <div className="auth-error-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> {error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link href="/login" className="auth-link">Login</Link>
        </div>
      </AuthLayout>
    </>
  );
}
