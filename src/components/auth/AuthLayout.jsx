import Image from 'next/image';
import './AuthLayout.css';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-form-wrapper">
          <div className="auth-header">
            <Image src="/logo.svg" alt="SafeDose Logo" width={48} height={48} priority className="auth-logo" />
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <h2>Verify Medicines<br/>With Confidence</h2>
            <p>Protect consumers and pharmacies through intelligent medicine verification and trust assessment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
