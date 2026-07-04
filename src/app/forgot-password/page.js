'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    
    setLoading(true);
    // Simulate API
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  if (success) {
    return (
      <AuthLayout title="Check Your Inbox" subtitle="Password reset link sent.">
        <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
          <CheckCircle2 size={64} color="var(--color-verified)" style={{ margin: '0 auto var(--sp-6)' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--sp-8)', lineHeight: 1.6, fontSize: 'var(--text-base)' }}>
            If an account exists for <strong>{email}</strong>, you will receive password reset instructions shortly.
          </p>
          <Link href="/login" className="auth-submit" style={{ display: 'inline-flex', justifyContent: 'center', textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reset Password" 
      subtitle="Enter your email to receive reset instructions."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field" style={{ marginTop: 'var(--sp-4)' }}>
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

        {error && <div className="auth-error-text">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading} style={{ marginTop: 'var(--sp-4)' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="auth-footer" style={{ marginTop: 'var(--sp-10)' }}>
        <Link href="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
