import { useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Users, CreditCard, PiggyBank, LogOut, Menu, X, Bell, Wallet, Download, Moon, Sun
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/susu', icon: Wallet, label: 'Susu' },
  { to: '/loans', icon: CreditCard, label: 'Loans' },
  { to: '/repayments', icon: PiggyBank, label: 'Repayments' },
];

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar when a nav link is clicked (mobile)
  const handleNavClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <>
      <aside className="sidebar" style={{ transform: open ? 'translateX(0)' : undefined }} role="navigation" aria-label="Main navigation">
        {/* Logo Section */}
        <div style={{ padding: '1.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
              overflow: 'hidden'
            }}>
              <img 
                src="/src/assets/logo.png" 
                alt="RF Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ display: 'none', color: 'white', fontWeight: 900, fontSize: '1.125rem' }}>RF</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ color: 'white', fontWeight: 800, fontSize: '0.9375rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Real & Fast
              </h1>
              <p style={{ color: '#0d9488', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Point Ent.
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
          <p style={{
            color: '#475569', fontSize: '0.6875rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '0 0.25rem', marginBottom: '0.5rem'
          }}>
            Main Menu
          </p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleNavClick}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobile navigation">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          aria-label={label}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const handleExport = () => {
    // Simple fetch and download for CSV
    fetch('/api/loans/export/csv', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loans_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    });
  };

  return (
    <div className="page-container">
      {/* Desktop sidebar — always visible */}
      <div className="hidden md:block">
        <Sidebar open={true} onClose={() => {}} />
      </div>

      {/* Mobile sidebar and overlay */}
      <div className="md:hidden">
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <main className="with-sidebar" style={{ minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '0 1.5rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          transition: 'background 0.3s ease, border 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="md:hidden btn btn-outline btn-sm"
              style={{ padding: '0.5rem', borderRadius: 8 }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <div className="hidden md:block">
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Welcome back,</p>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user?.name || 'Loan Officer'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleExport}
              className="btn btn-outline btn-sm"
              title="Export Data"
            >
              <Download size={18} />
            </button>

            <button
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.5rem', borderRadius: 10 }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            
            <button
              className="btn btn-outline btn-sm"
              style={{ padding: '0.5rem', borderRadius: 10, position: 'relative' }}
              aria-label="Notifications"
            >
              <Bell size={18} aria-hidden="true" />
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 8, height: 8,
                background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-card)'
              }} />
            </button>

            <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 0.25rem' }} />
            
            <button
               onClick={() => { logout(); navigate('/login'); }}
               className="btn btn-primary btn-sm"
               style={{ padding: '0.5rem 1rem', borderRadius: 10, fontWeight: 800 }}
            >
              <LogOut size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
