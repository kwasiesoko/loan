import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader, AlertCircle, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!form.email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!isLogin) {
      if (!form.firstName.trim()) return 'First name is required.';
      if (!form.lastName.trim()) return 'Last name is required.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        setSuccess('Login successful! Redirecting…');
        setTimeout(() => navigate('/dashboard'), 900);
      } else {
        const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
        await register({ 
          email: form.email, 
          password: form.password, 
          name: fullName 
        });
        setSuccess('Account created! You can now sign in.');
        setIsLogin(true);
        setForm(f => ({ ...f, firstName: '', lastName: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(v => !v);
    setError('');
    setSuccess('');
    setForm({ email: '', password: '', firstName: '', lastName: '' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      background: 'white',
      overflow: 'hidden',
    }} className="login-split-container">

      {/* Left Half: Background Image */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }} className="hidden md:flex">
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/src/assets/login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
        }} />
        
        {/* Brand Content on Left */}
        <div style={{ 
          position: 'relative', 
          zIndex: 10, 
          padding: '3rem', 
          textAlign: 'center',
          color: 'white',
          maxWidth: 480
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 96, height: 96, borderRadius: 24,
            background: 'white',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            marginBottom: '2rem',
            padding: '10px'
          }}>
            <img src="/src/assets/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Real & Fast Point Ent.
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#ccfbf1', fontWeight: 600, opacity: 0.9, lineHeight: 1.6 }}>
            The professional standard for high-speed loan management and automated credit tracking. Trusted by thousands of loan officers across the region.
          </p>
          
          <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>10K+</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>Active Loans</p>
            </div>
            <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>99.9%</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase' }}>Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Half: Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#f8fafc',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeIn 0.6s ease-out' }}>
          
          {/* Mobile-only logo */}
          <div className="md:hidden" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: 16,
              background: 'linear-gradient(135deg, #0d9488, #0f766e)',
              boxShadow: '0 8px 32px rgba(13, 148, 136, 0.4)',
              marginBottom: '1rem',
              overflow: 'hidden',
            }}>
              <img src="/src/assets/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 1000, color: '#0f172a', letterSpacing: '-0.02em' }}>Real & Fast</h1>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>
              {isLogin ? 'Welcome back' : 'Create an officer profile'}
            </h3>
            <p style={{ color: '#64748b', fontWeight: 500 }}>
              {isLogin ? 'Enter your credentials to access the credit management system.' : 'Begin your journey with Real and Fast Point Enterprise.'}
            </p>
          </div>

          {/* Login Card */}
          <div style={{ 
            background: 'white', 
            borderRadius: 24, 
            padding: '2.5rem', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>

            {/* Tab switcher */}
            <div style={{
              display: 'flex', borderRadius: 12, background: '#f1f5f9', padding: 4,
              marginBottom: '1.75rem',
            }} role="tablist" aria-label="Authentication mode">
              {[{ key: true, label: 'Sign In' }, { key: false, label: 'Sign Up' }].map(({ key, label }) => (
                <button
                  key={label}
                  role="tab"
                  aria-selected={isLogin === key}
                  onClick={() => { setIsLogin(key); setError(''); setSuccess(''); setForm({ email: '', password: '', firstName: '', lastName: '' }); }}
                  style={{
                    flex: 1, padding: '0.5rem 1rem', borderRadius: 9,
                    fontSize: '0.875rem', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    background: isLogin === key ? 'white' : 'transparent',
                    color: isLogin === key ? '#0d9488' : '#64748b',
                    boxShadow: isLogin === key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

              {!isLogin && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="login-firstName" className="form-label">First Name</label>
                    <input
                      id="login-firstName" name="firstName" type="text"
                      required value={form.firstName} onChange={handleChange}
                      className="form-input" placeholder="John"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="login-lastName" className="form-label">Last Name</label>
                    <input
                      id="login-lastName" name="lastName" type="text"
                      required value={form.lastName} onChange={handleChange}
                      className="form-input" placeholder="Mensah"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="login-email" className="form-label">Work Email</label>
                <input
                  id="login-email" name="email" type="email"
                  required value={form.email} onChange={handleChange}
                  className={`form-input ${error?.toLowerCase()?.includes('email') ? 'invalid' : ''}`}
                  placeholder="officer@realfastpoint.com"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label htmlFor="login-password" className="form-label">Password</label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => navigate('/forgot-password')}
                      style={{ 
                        background: 'none', border: 'none', color: '#0d9488', 
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password" name="password" 
                    type={showPassword ? 'text' : 'password'}
                    required value={form.password} onChange={handleChange}
                    className={`form-input ${error?.toLowerCase()?.includes('password') ? 'invalid' : ''}`}
                    placeholder="••••••••"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '0.875rem', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ fontSize: '0.8125rem' }}>
                  <AlertCircle size={16} /> <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success" style={{ fontSize: '0.8125rem' }}>
                  <CheckCircle size={16} /> <span>{success}</span>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="btn btn-primary btn-lg btn-full"
                style={{ marginTop: '0.5rem', height: '3.5rem', borderRadius: 14 }}
              >
                {loading ? <Loader size={20} className="animate-spin" /> : 
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLogin ? 'Sign In Securely' : 'Complete Registration'}
                    <ArrowRight size={18} />
                  </span>
                }
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', marginTop: '1.5rem' }}>
              {isLogin ? "New to the system? " : 'Already registered? '}
              <button 
                onClick={switchMode} 
                className="btn btn-sm"
                style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                {isLogin ? 'Create Profile' : 'Sign In'}
              </button>
            </p>
        </div>
        </div>
      </div>
    </div>
  );
}
