import { useEffect, useState } from 'react';
import { susuApi, customersApi } from '../services/api';
import { fmtCurrency, fmtDate } from '../utils/format';
import { Wallet, Search, PlusCircle, History, User } from 'lucide-react';

export default function Susu() {
  const [contributions, setContributions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('DEPOSIT'); // DEPOSIT or WITHDRAWAL
  const [customerBalance, setCustomerBalance] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contRes, withRes, custRes] = await Promise.all([
        susuApi.getContributions(),
        susuApi.getWithdrawals(),
        customersApi.getAll()
      ]);
      setContributions(contRes.data);
      setWithdrawals(withRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error('Failed to fetch Susu data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount) {
      setError('Please select a customer and enter an amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const apiCall = formType === 'DEPOSIT' ? susuApi.createDeposit : susuApi.createWithdrawal;
      
      await apiCall({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      setFormData({ customerId: '', amount: '', note: '' });
      setCustomerSearch('');
      setShowForm(false);
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || `Failed to record ${formType.toLowerCase()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const allTransactions = [
    ...contributions.map(c => ({ ...c, type: 'DEPOSIT', date: c.collectedAt })),
    ...withdrawals.map(w => ({ ...w, type: 'WITHDRAWAL', date: w.withdrawnAt }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = allTransactions.filter(t =>
    `${t.customer?.firstName} ${t.customer?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalDeposited = contributions.reduce((s, c) => s + c.amount, 0);
  const totalWithdrawn = withdrawals.reduce((s, w) => s + w.amount, 0);
  const netBalance = totalDeposited - totalWithdrawn;
  
  const depositsToday = contributions
    .filter(c => new Date(c.collectedAt).toDateString() === new Date().toDateString())
    .reduce((s, c) => s + c.amount, 0);
    
  const withdrawalsToday = withdrawals
    .filter(w => new Date(w.withdrawnAt).toDateString() === new Date().toDateString())
    .reduce((s, w) => s + w.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Susu Savings</h1>
          <p className="page subtitle">Manage customer deposits and savings</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => {
              setFormType('DEPOSIT');
              setFormData({ customerId: '', amount: '', note: '' });
              setCustomerSearch('');
              setError('');
              setShowForm(true);
            }} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} /> Record Deposit
          </button>
          <button 
            onClick={() => {
              setFormType('WITHDRAWAL');
              setFormData({ customerId: '', amount: '', note: '' });
              setCustomerSearch('');
              setCustomerBalance(null);
              setError('');
              setShowForm(true);
            }} 
            className="btn btn-gold"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Wallet size={18} /> Record Withdrawal
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Net Savings Balance</span>
            <Wallet size={18} color="#0d9488" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0d9488' }}>{fmtCurrency(netBalance)}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Current liquidity in Susu fund</p>
        </div>
        
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Today's Activity</span>
            <History size={18} color="#1e40af" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e40af' }}>
            {fmtCurrency(depositsToday - withdrawalsToday)}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            In: {fmtCurrency(depositsToday)} | Out: {fmtCurrency(withdrawalsToday)}
          </p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Active Savers</span>
            <User size={18} color="#7c3aed" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>
            {new Set(contributions.map(c => c.customerId)).size}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Unique customers registered</p>
        </div>
      </div>

      {showForm && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowForm(false)}
          style={{ padding: '1rem', backdropFilter: 'blur(4px)' }}
        >
          <div 
            className="card modal-box" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '550px', 
              textAlign: 'left', 
              padding: 0,
              overflow: 'visible'
            }}
          >
            <div style={{ 
              borderBottom: '1px solid #f1f5f9', 
              padding: '1.25rem 1.5rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a' }}>
                  {formType === 'DEPOSIT' ? 'Record Susu Deposit' : 'Record Susu Withdrawal'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.125rem' }}>
                  {formType === 'DEPOSIT' ? 'Enter the details of the contribution collected.' : 'Deduct funds from the customer\'s savings balance.'}
                </p>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <PlusCircle size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Customer</label>
                  <div 
                    className="search-wrapper" 
                    style={{ position: 'relative' }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => {
                      // Slight delay to allow clicks on dropdown items
                      setTimeout(() => setShowCustomerDropdown(false), 200);
                    }}
                  >
                    <Search size={16} className="search-icon" style={{ left: '0.75rem' }} />
                    <input 
                      type="text"
                      className="form-input"
                      placeholder="Search by name or phone..."
                      style={{ paddingLeft: '2.5rem' }}
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    
                    {showCustomerDropdown && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50,
                        maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
                      }}>
                        {customers
                          .filter(c => 
                            `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone.includes(customerSearch)
                          )
                          .map(c => (
                            <div 
                              key={c.id}
                              style={{ 
                                padding: '0.75rem 1rem', cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                background: formData.customerId === c.id ? '#f0fdfa' : 'transparent'
                              }}
                              onMouseDown={() => {
                                setFormData({...formData, customerId: c.id});
                                setCustomerSearch(`${c.firstName} ${c.lastName}`);
                                setShowCustomerDropdown(false);
                                
                                // Fetch balance for withdrawals
                                if (formType === 'WITHDRAWAL') {
                                    susuApi.getBalance(c.id).then(r => setCustomerBalance(r.data.balance));
                                }
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.target.style.background = formData.customerId === c.id ? '#f0fdfa' : 'transparent'}
                            >
                              <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>{c.firstName} {c.lastName}</p>
                              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{c.phone}</p>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (GHS)</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#94a3b8', fontSize: '0.875rem' }}>GH₵</div>
                    <input 
                      type="number" 
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      style={{ paddingLeft: '3.5rem' }}
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  {customerBalance !== null && formType === 'WITHDRAWAL' && (
                    <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 600 }}>
                        Current Balance: {fmtCurrency(customerBalance)}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Note (Optional)</label>
                  <textarea 
                    className="form-input"
                    rows="2"
                    placeholder="e.g. Daily contribution"
                    style={{ resize: 'none' }}
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                  />
                </div>
              </div>
              
              {error && <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
              
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={formType === 'DEPOSIT' ? 'btn btn-primary' : 'btn btn-gold'} 
                  style={{ flex: 2 }}
                  disabled={submitting || (formType === 'WITHDRAWAL' && customerBalance !== null && parseFloat(formData.amount) > customerBalance)}
                >
                  {submitting ? 'Processing...' : formType === 'DEPOSIT' ? 'Complete Deposit' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="card">
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</h2>
          <div className="search-wrapper" style={{ minWidth: '240px' }}>
            <Search size={16} className="search-icon" />
            <input 
              className="form-input" 
              style={{ padding: '0.4rem 0.4rem 0.4rem 2.2rem', fontSize: '0.8125rem' }}
              placeholder="Filter by customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Officer</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan="5"><div className="skeleton" style={{ height: 24 }} /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No deposit records found.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: t.type === 'DEPOSIT' ? 'linear-gradient(135deg, #0d9488, #0f766e)' : 'linear-gradient(135deg, #d97706, #b45309)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '0.75rem'
                        }}>
                          {t.customer?.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{t.customer?.firstName} {t.customer?.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                        <span style={{ 
                            fontSize: '0.625rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px',
                            background: t.type === 'DEPOSIT' ? '#d1fae5' : '#fef3c7',
                            color: t.type === 'DEPOSIT' ? '#065f46' : '#92400e'
                        }}>
                            {t.type}
                        </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: t.type === 'DEPOSIT' ? '#0d9488' : '#dc2626' }}>
                        {t.type === 'DEPOSIT' ? '+' : '-'}{fmtCurrency(t.amount)}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.8125rem' }}>
                      {fmtDate(t.date)}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f1f5f9', borderRadius: 4, fontWeight: 600 }}>
                        {t.officer?.name}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      {t.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
