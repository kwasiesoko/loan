import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loansApi } from '../services/api';
import { fmtCurrency, fmtDate } from '../utils/format';
import { PiggyBank, Search, Receipt, ArrowUpRight } from 'lucide-react';

export default function Repayments() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loansApi.getAll()
      .then(r => setLoans(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Flatten all repayments with loan/customer context
  const allRepayments = loans.flatMap(l =>
    (l.repayments || []).map(r => ({ ...r, loan: l, customer: l.customer }))
  ).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

  const filtered = allRepayments.filter(r =>
    `${r.customer?.firstName} ${r.customer?.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = allRepayments.reduce((s, r) => s + r.amount, 0);
  const thisMonthCollected = allRepayments
    .filter(r => new Date(r.paidAt).getMonth() === new Date().getMonth() && new Date(r.paidAt).getFullYear() === new Date().getFullYear())
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Repayments Ledger</h1>
          <p className="page-subtitle">Historical record of all received payments</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Collections</span>
            <Receipt size={18} color="#059669" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{fmtCurrency(totalCollected)}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Lifetime received payments</p>
        </div>
        
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Month to Date</span>
            <ArrowUpRight size={18} color="#1e40af" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e40af' }}>{fmtCurrency(thisMonthCollected)}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Collected this calendar month</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Volume</span>
            <PiggyBank size={18} color="#7c3aed" />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>{allRepayments.length}</p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Total payment transactions</p>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input 
            className="form-input" 
            placeholder="Search repayments by customer name..."
            value={search} 
            onChange={e => setSearch(e.target.value)}
            aria-label="Search repayments"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: '#f1f5f9', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' 
          }}>
            <PiggyBank size={40} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>No repayments recorded</h3>
          <p style={{ fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto' }}>
            {search ? `No repayment records found for "${search}".` : 'Payment history will appear here once customers start making repayments.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Amount Paid</th>
                <th>Payment Date</th>
                <th>Reference/Note</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onClick={() => window.location.href = `/loans/${r.loanId}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0
                      }}>
                        {r.customer?.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <p style={{ fontWeight: 700 }}>{r.customer?.firstName} {r.customer?.lastName}</p>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, color: '#059669' }}>{fmtCurrency(r.amount)}</td>
                  <td style={{ color: '#64748b' }}>{fmtDate(r.paidAt)}</td>
                  <td style={{ color: '#64748b', fontSize: '0.8125rem', fontStyle: r.note ? 'normal' : 'italic' }}>
                    {r.note || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/loans/${r.loanId}`} className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                      View Loan
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <span className="pagination-info">Showing {filtered.length} of {allRepayments.length} transactions</span>
          </div>
        </div>
      )}
    </div>
  );
}

