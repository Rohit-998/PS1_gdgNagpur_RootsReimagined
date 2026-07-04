'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Cross, Factory, Loader2, LogOut } from 'lucide-react';
import { getDashboardHref } from '@/lib/authHelpers';

export default function OnboardingPage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const handleSelectRole = async (role) => {
    setLoadingRole(role);
    setError('');
    try {
      const token = localStorage.getItem('mg_token');
      const res = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      // Update local storage with new token and user
      localStorage.setItem('mg_token', data.token);
      localStorage.setItem('mg_user', JSON.stringify(data.user));

      // Redirect to correct dashboard
      router.push(getDashboardHref(role));
    } catch (err) {
      setError(err.message);
      setLoadingRole(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_user');
    router.push('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-default)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          How will you use SafeDose?
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Select your role to unlock the personalized dashboard and features best suited for your needs.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-danger)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem',
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          
          {/* Consumer Card */}
          <button 
            onClick={() => handleSelectRole('consumer')}
            disabled={loadingRole !== null}
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: loadingRole !== null ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              if (loadingRole === null) {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(210, 248, 3, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (loadingRole === null) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(91, 70, 255, 0.1)',
              color: 'var(--accent-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              {loadingRole === 'consumer' ? <Loader2 size={32} className="animate-spin" /> : <ShieldCheck size={32} />}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Consumer
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Verify medicines, track scan history, and report counterfeit products instantly.
            </p>
          </button>

          {/* Pharmacy Card */}
          <button 
            onClick={() => handleSelectRole('pharmacy')}
            disabled={loadingRole !== null}
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: loadingRole !== null ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              if (loadingRole === null) {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(91, 70, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (loadingRole === null) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              {loadingRole === 'pharmacy' ? <Loader2 size={32} className="animate-spin" /> : <Cross size={32} />}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Pharmacy
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Manage inventory, perform bulk verifications, and ensure supply chain integrity.
            </p>
          </button>

          {/* Manufacturer Card */}
          <button 
            onClick={() => handleSelectRole('manufacturer')}
            disabled={loadingRole !== null}
            style={{
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: loadingRole !== null ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              if (loadingRole === null) {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = '#F59E0B';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(245, 158, 11, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (loadingRole === null) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              {loadingRole === 'manufacturer' ? <Loader2 size={32} className="animate-spin" /> : <Factory size={32} />}
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Manufacturer
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Generate cryptographic QRs, monitor global scans, and secure your brand.
            </p>
          </button>

        </div>

        <button 
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <LogOut size={16} /> Sign out instead
        </button>

      </div>
    </div>
  );
}
