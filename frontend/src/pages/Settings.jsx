import { useState } from 'react';
import { customersApi } from '../services/api';
import { Settings as SettingsIcon, Trash2, AlertTriangle, Loader, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [password, setPassword] = useState('');

  const handleClearCustomers = async () => {
    if (!password) {
      toast.error('Please enter your password to confirm');
      return;
    }

    setLoading(true);
    try {
      await customersApi.bulkClear(password);
      toast.success('All customers and transactions have been soft-deleted from your account.');
      setConfirmClear(false);
      setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear account data. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and data</p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SettingsIcon size={20} color="var(--primary)" />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-main)' }}>Account Data Management</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.25rem' }}>Clear Account Data</h4>
                <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: '1.5rem' }}>
                  This action will soft-delete all customers and transaction history (loans, repayments, and susu records) created by your account. 
                  <strong> This action is sensitive and requires your account password.</strong>
                </p>
                
                {!confirmClear ? (
                  <button 
                    onClick={() => setConfirmClear(true)}
                    className="btn" 
                    style={{ background: '#dc2626', color: 'white', fontWeight: 700, borderRadius: 12, padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={18} style={{ marginRight: '0.5rem' }} />
                    Clear My Data
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="password"
                        placeholder="Enter your password to confirm"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem', borderColor: '#fecaca' }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button 
                        onClick={handleClearCustomers}
                        disabled={loading}
                        className="btn" 
                        style={{ background: '#991b1b', color: 'white', fontWeight: 700, borderRadius: 12, padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer', flex: 1 }}
                      >
                        {loading ? <Loader size={18} className="animate-spin" /> : 'Verify & Clear All'}
                      </button>
                      <button 
                        onClick={() => { setConfirmClear(false); setPassword(''); }}
                        disabled={loading}
                        className="btn btn-outline"
                        style={{ borderRadius: 12, fontWeight: 700 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
