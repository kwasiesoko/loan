import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { ArrowLeft, Mail, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await authApi.forgotPassword(email);
      setSuccess(true);
      if (res.data.debug_code) {
        setDebugCode(res.data.debug_code);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request reset. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link to="/login" style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
          color: '#64748b', textDecoration: 'none', marginBottom: '2rem',
          fontWeight: 600, fontSize: '0.875rem'
        }}>
          <ArrowLeft size={16} /> Back to Sign In
        </Link>

        <div style={{ 
          background: 'white', borderRadius: 24, padding: '2.5rem', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' 
        }}>
          {!success ? (
            <>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.75rem' }}>
                Reset Password
              </h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                Enter the email address associated with your account and we'll send you a 6-digit code to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="email" required className="form-input" 
                      style={{ paddingLeft: '3.5rem' }} placeholder="officer@realfastpoint.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                    <AlertCircle size={16} /> <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit" disabled={loading} className="btn btn-primary btn-lg btn-full"
                  style={{ marginTop: '1.5rem', height: '3.5rem', borderRadius: 14 }}
                >
                  {loading ? <Loader size={20} className="animate-spin" /> : 'Send Reset Code'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' 
              }}>
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '1rem' }}>
                Check your email
              </h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
                We've sent a 6-digit reset code to <strong>{email}</strong>.
              </p>

              {debugCode && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, marginBottom: '2rem', border: '1px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Testing Mode: Reset Code
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d9488', letterSpacing: '0.2rem' }}>
                    {debugCode}
                  </p>
                </div>
              )}

              <button 
                onClick={() => navigate('/reset-password')} className="btn btn-primary btn-lg btn-full"
                style={{ height: '3.5rem', borderRadius: 14 }}
              >
                Enter Code & Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
