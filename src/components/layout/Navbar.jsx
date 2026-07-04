'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { QrCode, Flag, BarChart2, Activity, Info, X, Menu, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { getDashboardHref } from '@/lib/authHelpers';
import './Navbar.css';

const NAV_LINKS = [
  { href: '/scan',         label: 'Scan',          icon: QrCode      },
  { href: '/interactions', label: 'Interactions',   icon: Activity    },
  { href: '/report',       label: 'Report',         icon: Flag        },
  { href: '/pharmacies',   label: 'Pharmacies',     icon: BarChart2   },
  { href: '/demo',         label: 'How It Works',   icon: Info        },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [user, setUser]             = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser  = localStorage.getItem('mg_user');
      const storedToken = localStorage.getItem('mg_token');
      if (storedUser && storedToken) {
        try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
      } else {
        setUser(null);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    const interval = setInterval(checkAuth, 1000);
    return () => { window.removeEventListener('storage', checkAuth); clearInterval(interval); };
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_user');
    setUser(null);
    setMenuOpen(false);
    window.location.href = '/login';
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">

          {/* Brand */}
          <Link href="/" className="navbar-brand">
            <Image src="/logo.svg" alt="SafeDose" width={28} height={28} priority className="navbar-logo" />
            <span className="navbar-title">SafeDose</span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-links">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${pathname === href ? ' nav-link-active' : ''}`}
              >
                <Icon size={15} className="nav-icon" />
                {label}
              </Link>
            ))}
            {user && (
              <Link
                href={getDashboardHref(user.role)}
                className={`nav-link${pathname.startsWith('/dashboard') ? ' nav-link-active' : ''}`}
              >
                <LayoutDashboard size={15} className="nav-icon" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="navbar-actions">
            {user ? (
              <>
                <span className="navbar-user-name">{user.name?.split(' ')[0]}</span>
                <button
                  onClick={handleLogout}
                  className="navbar-logout-btn"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link href="/login" className="navbar-cta-neutral">
                Sign In
              </Link>
            )}
            <button
              className="navbar-burger"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`mobile-overlay ${menuOpen ? 'mobile-overlay-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer ${menuOpen ? 'mobile-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="mobile-drawer-header">
          <Link href="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
            <Image src="/logo.svg" alt="SafeDose" width={26} height={26} />
            <span className="navbar-title">SafeDose</span>
          </Link>
          <button className="mobile-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <nav className="mobile-nav">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-link${pathname === href ? ' mobile-nav-link-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {user && (
            <Link
              href={getDashboardHref(user.role)}
              className={`mobile-nav-link${pathname.startsWith('/dashboard') ? ' mobile-nav-link-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          )}
        </nav>

        <div className="mobile-drawer-cta">
          {user ? (
            <button onClick={handleLogout} className="mobile-cta-btn">
              <LogOut size={18} />
              Log Out — {user.name?.split(' ')[0]}
            </button>
          ) : (
            <Link href="/login" className="mobile-cta-btn" onClick={() => setMenuOpen(false)}>
              <LogIn size={18} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
