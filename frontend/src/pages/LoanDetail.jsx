import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loansApi } from '../services/api';
import { fmtCurrency, fmtDate } from '../utils/format';
import { 
  ArrowLeft, CheckCircle, Clock, AlertTriangle, 
  DollarSign, PiggyBank, Loader, History, Calendar, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusColors = {
  ACTIVE: 'badge-active',
  COMPLETED: 'badge-completed',
  DEFAULTED: 'badge-defaulted',
  CANCELLED: 'badge-cancelled',
};

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [repaying, setRepaying] = useState(false);
  const [tab, setTab] = useState('installments');
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchLoan = () => {
    setLoading(true);
    loansApi.getOne(id)
      .then(r => setLoan(r.data))
      .catch(() => {
        toast.error('Could not load loan details');
        navigate('/loans');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLoan(); }, [id]);

  const handleRepayment = async e => {
    if (e) e.preventDefault();
    
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast.error('Please enter a valid repayment amount');
      return;
    }

    setRepaying(true);
    setShowConfirm(false);
    
    try {
      await loansApi.addRepayment(id, { 
        amount: parseFloat(repayAmount), 
        note: repayNote 
      });
      toast.success('Repayment recorded successfully!');
      setRepayAmount('');
      setRepayNote('');
      fetchLoan();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record repayment');
    } finally {
      setRepaying(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
    </div>
  );

  if (!loan) return null;

  const totalPaid = loan.repayments?.reduce((s, r) => s + r.amount, 0) || 0;
  const progress = Math.min(100, (totalPaid / loan.totalRepayable) * 100);
  const paidInstallments = loan.installments?.filter(i => i.paid).length || 0;
  const overdueInstallments = loan.installments?.filter(i => !i.paid && new Date(i.dueDate) < new Date()).length || 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', borderRadius: 10 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.125rem' }}>Loan Detail</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            {loan.customer?.firstName} {loan.customer?.lastName}
          </h1>
        </div>
        <span className={`badge ${statusColors[loan.status] || 'badge-cancelled'}`} style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>{loan.status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="md:grid-cols-3">
        {/* Loan Summary Card */}
        <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Loan Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Principal', value: fmtCurrency(loan.amount), color: 'var(--text-main)' },
                { label: 'Monthly', value: fmtCurrency(loan.monthlyPayment), color: 'var(--success)' },
                { label: 'Repayable', value: fmtCurrency(loan.totalRepayable), color: 'var(--warning)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 800, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>Repayment Progress</span>
                <span style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 800 }}>{progress.toFixed(1)}%</span>
              </div>
              <div style={{ background: 'var(--bg-active)', borderRadius: 999, height: 8 }}>
                <div style={{ width: `${progress}%`, height: 8, borderRadius: 999, background: 'var(--success)', transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Paid</span>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 700 }}>{fmtCurrency(totalPaid)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Remaining</span>
                  <span style={{ color: 'var(--warning)', fontSize: '0.875rem', fontWeight: 700 }}>{fmtCurrency(loan.totalRepayable - totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Record Repayment Form */}
          {loan.status === 'ACTIVE' && (
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-main)' }}>Make a Repayment</h3>
              </div>
              
              <form onSubmit={e => { e.preventDefault(); setShowConfirm(true); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="sm:grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Amount (GHS) *</label>
                    <input type="number" min="0.01" step="0.01" required
                      value={repayAmount} onChange={e => setRepayAmount(e.target.value)}
                      className="form-input" placeholder={`Recommended: ${loan.monthlyPayment}`} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Note (Optional)</label>
                    <input type="text" value={repayNote} onChange={e => setRepayNote(e.target.value)}
                      className="form-input" placeholder="e.g. Received via Mobile Money" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => setRepayAmount(String(loan.monthlyPayment.toFixed(2)))}
                    className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                    Set to Monthly Amount
                  </button>
                  <button type="submit" disabled={repaying} className="btn btn-primary btn-sm" style={{ flex: 2 }}>
                    {repaying ? <Loader size={16} className="animate-spin" /> : 'Record Repayment'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 className="card-title" style={{ marginBottom: '1rem' }}>Loan Statistics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{loan.durationMonths} Months</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Interest Rate</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{loan.interestRate}% Flat</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Installments Paid</span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>{paidInstallments} of {loan.installments?.length || 0}</span>
              </div>
              {overdueInstallments > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.5rem', background: 'var(--danger-light)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Overdue</span>
                  <span style={{ fontWeight: 800, color: 'var(--danger)' }}>{overdueInstallments}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h4 className="card-title" style={{ marginBottom: '1rem' }}>Customer Reference</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9375rem' }}>
                {loan.customer?.firstName} {loan.customer?.lastName}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{loan.customer?.phone}</p>
            </div>
            <Link to={`/customers/${loan.customerId}`} className="btn btn-outline btn-sm btn-full" style={{ marginTop: '1rem' }}>View Profile</Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 12, padding: 4, marginTop: '2rem', marginBottom: '1.25rem' }}>
        <button onClick={() => setTab('installments')} style={{
          flex: 1, padding: '0.625rem', borderRadius: 9, border: 'none', cursor: 'pointer',
          fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s',
          background: tab === 'installments' ? 'white' : 'transparent',
          color: tab === 'installments' ? '#1e40af' : '#64748b',
          boxShadow: tab === 'installments' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        }}>
          Payment Schedule ({loan.installments?.length || 0})
        </button>
        <button onClick={() => setTab('repayments')} style={{
          flex: 1, padding: '0.625rem', borderRadius: 9, border: 'none', cursor: 'pointer',
          fontSize: '0.875rem', fontWeight: 700, transition: 'all 0.2s',
          background: tab === 'repayments' ? 'white' : 'transparent',
          color: tab === 'repayments' ? '#1e40af' : '#64748b',
          boxShadow: tab === 'repayments' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        }}>
          Received Payments ({loan.repayments?.length || 0})
        </button>
      </div>

      {tab === 'installments' ? (
        <div className="table-container animate-fade-in">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {loan.installments?.map((inst, i) => {
                const isOverdue = !inst.paid && new Date(inst.dueDate) < new Date();
                return (
                  <tr key={inst.id}>
                    <td style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ color: isOverdue ? '#dc2626' : '#374151', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} style={{ opacity: 0.5 }} />
                        {fmtDate(inst.dueDate)}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>{fmtCurrency(inst.amount)}</td>
                    <td>
                      {inst.paid ? (
                        <span className="badge badge-active">Paid</span>
                      ) : isOverdue ? (
                        <span className="badge badge-defaulted">Overdue</span>
                      ) : (
                        <span className="badge badge-pending">Pending</span>
                      )}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {inst.paidAt ? fmtDate(inst.paidAt) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container animate-fade-in">
          {loan.repayments?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <History size={32} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ fontWeight: 700, color: '#1e293b' }}>No payments received yet</p>
              <p style={{ fontSize: '0.875rem' }}>Record a repayment using the form above.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Processing Date</th>
                  <th>Amount Received</th>
                  <th>Note / Reference</th>
                </tr>
              </thead>
              <tbody>
                {loan.repayments?.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: '#374151' }}>{fmtDate(r.paidAt)}</td>
                    <td style={{ fontWeight: 800, color: '#059669' }}>{fmtCurrency(r.amount)}</td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: r.note ? 'normal' : 'italic' }}>
                      {r.note || 'No reference note'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-icon" style={{ background: '#d1fae5' }}>
              <CheckCircle size={32} color="#059669" />
            </div>
            <h3 className="modal-title">Confirm Repayment</h3>
            <p className="modal-message">
              You are about to record a repayment of <strong style={{ color: '#059669' }}>{fmtCurrency(parseFloat(repayAmount))}</strong>. 
              This will update the loan balance and installment schedule. Are you sure?
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleRepayment}>Yes, Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

