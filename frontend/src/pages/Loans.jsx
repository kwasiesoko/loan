import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loansApi } from '../services/api';
import { fmtCurrency, fmtDate } from '../utils/format';
import { Plus, Search, CreditCard, ChevronRight, Calendar, DollarSign } from 'lucide-react';

const statusColors = {
  ACTIVE: 'badge-active',
  COMPLETED: 'badge-completed',
  DEFAULTED: 'badge-defaulted',
  CANCELLED: 'badge-cancelled',
};

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loansApi.getAll()
      .then(r => setLoans(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = loans.filter(l => {
    const fn = l.customer?.firstName || '';
    const ln = l.customer?.lastName || '';
    const fullName = `${fn} ${ln}`.toLowerCase().trim();
    
    const matchSearch = search ? fullName.includes((search || '').toLowerCase().trim()) : true;
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-subtitle">{loans.length} total loan records found</p>
        </div>
        <Link to="/loans/new" className="btn btn-primary btn-pulse">
          <Plus size={18} aria-hidden="true" /> New Loan Application
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="search-wrapper" style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} className="search-icon" aria-hidden="true" />
              <input 
                className="form-input" 
                placeholder="Search by customer name..." 
                value={search}
                onChange={e => setSearch(e.target.value)} 
                aria-label="Search loans"
              />
            </div>
            <Link to="/loans/new" className="btn btn-outline hidden md:flex" title="Quick Add Loan">
              <Plus size={18} />
            </Link>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'ACTIVE', 'COMPLETED', 'DEFAULTED', 'CANCELLED'].map(s => (
              <button 
                key={s} 
                onClick={() => setStatusFilter(s)} 
                className="btn btn-sm"
                style={{
                  padding: '0.375rem 1rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                  border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s',
                  borderColor: statusFilter === s ? '#1e40af' : '#e2e8f0',
                  background: statusFilter === s ? '#dbeafe' : 'white',
                  color: statusFilter === s ? '#1e40af' : '#64748b',
                }}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' 
          }}>
            <CreditCard size={40} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>No loans found</h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '300px', margin: '0 auto 1.5rem' }}>
            {search || statusFilter !== 'ALL' 
              ? 'No loans match your current search or filter criteria.' 
              : 'You haven\'t processed any loans yet. Start by creating a new loan application.'}
          </p>
          {!search && statusFilter === 'ALL' && <Link to="/loans/new" className="btn btn-primary">Start New Application</Link>}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container hidden md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Principal</th>
                  <th>Monthly</th>
                  <th>Total Repayable</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} onClick={() => window.location.href = `/loans/${l.id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0
                        }}>
                          {l.customer?.firstName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700 }}>{l.customer?.firstName} {l.customer?.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{fmtDate(l.disbursedAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(l.amount)}</td>
                    <td style={{ color: '#059669', fontWeight: 600 }}>{fmtCurrency(l.monthlyPayment)}</td>
                    <td style={{ color: '#d97706', fontWeight: 600 }}>{fmtCurrency(l.totalRepayable)}</td>
                    <td style={{ color: '#64748b', fontSize: '0.875rem' }}>{l.durationMonths} months</td>
                    <td><span className={`badge ${statusColors[l.status] || 'badge-cancelled'}`}>{l.status}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/loans/${l.id}`} className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="pagination">
              <span className="pagination-info">Showing {filtered.length} of {loans.length} loans</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled aria-label="Previous page">
                  <ChevronRight style={{ transform: 'rotate(180deg)' }} size={16} />
                </button>
                <button className="page-btn active">1</button>
                <button className="page-btn" disabled aria-label="Next page">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="mobile-list md:hidden">
            {filtered.map(l => (
              <Link key={l.id} to={`/loans/${l.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '1rem'
                      }}>
                        {l.customer?.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{l.customer?.firstName} {l.customer?.lastName}</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.durationMonths} months • {fmtDate(l.disbursedAt)}</p>
                      </div>
                    </div>
                    <span className={`badge ${statusColors[l.status] || 'badge-cancelled'}`}>{l.status}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.125rem' }}>Principal</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(l.amount)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.125rem' }}>Monthly</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669' }}>{fmtCurrency(l.monthlyPayment)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.125rem' }}>Total</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#d97706' }}>{fmtCurrency(l.totalRepayable)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      
      {/* Floating Action Button (Mobile) */}
      <Link to="/loans/new" className="fab md:hidden" aria-label="Start new loan application">
        <Plus size={24} />
      </Link>
    </div>
  );
}

