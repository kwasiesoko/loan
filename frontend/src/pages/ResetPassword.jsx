import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { ArrowLeft, Lock, Loader, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [form, setForm] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await authApi.resetPassword({
        token: form.token,
        newPassword: form.newPassword
      });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try requesting a new one.');
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
        <Link to="/forgot-password" style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
          color: '#64748b', textDecoration: 'none', marginBottom: '2rem',
          fontWeight: 600, fontSize: '0.875rem'
        }}>
          <ArrowLeft size={16} /> Previous step
        </Link>

        <div style={{ 
          background: 'white', borderRadius: 24, padding: '2.5rem', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' 
        }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.75rem' }}>
            Set New Password
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>
            Enter the 6-digit code we sent you and choose a strong new password.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">6-Digit Code</label>
              <input 
                required className="form-input" placeholder="000000"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.25rem' }}
                value={form.token} onChange={e => setForm({...form, token: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="password" required className="form-input" 
                  style={{ paddingLeft: '3.5rem' }} placeholder="••••••••"
                  value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="password" required className="form-input" 
                  style={{ paddingLeft: '3.5rem' }} placeholder="••••••••"
                  value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} /> <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" disabled={loading} className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: '0.5rem', height: '3.5rem', borderRadius: 14 }}
            >
              {loading ? <Loader size={20} className="animate-spin" /> : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} /> Update Password
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
