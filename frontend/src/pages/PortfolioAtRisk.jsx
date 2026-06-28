import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loansApi } from '../services/api';
import { fmtCurrency, fmtDate } from '../utils/format';
import {
  AlertTriangle, ShieldAlert, TrendingDown, ArrowUpRight,
  Clock, Search, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OVERDUE = 'overdue';
const STATUS_CRITICAL = 'critical';

function DaysBadge({ days }) {
  const isCritical = days >= 31;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: '0.75rem',
      fontWeight: 800,
      background: isCritical ? '#fef2f2' : '#fffbeb',
      color: isCritical ? '#dc2626' : '#d97706',
      border: `1px solid ${isCritical ? '#fecaca' : '#fde68a'}`,
      whiteSpace: 'nowrap',
    }}>
      {days} day{days !== 1 ? 's' : ''}
    </span>
  );
}

function SummaryCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{label}</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color }}>{value}</h2>
          {sub && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</p>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

function ParTable({ rows, emptyLabel }) {
  const [search, setSearch] = useState('');

  const filtered = rows.filter(r => {
    const name = `${r.loan?.customer?.firstName} ${r.loan?.customer?.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div>
      {/* Search */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-input"
            placeholder="Search by customer name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#94a3b8' }}>
          <p style={{ fontWeight: 600 }}>{search ? `No results for "${search}"` : emptyLabel}</p>
        </div>
      ) : (
        <div className="table-container" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
                <th>Installment Amt</th>
                <th>Penalty</th>
                <th>Officer</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inst => (
                <tr key={inst.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        background: inst.daysOverdue >= 31
                          ? 'linear-gradient(135deg,#dc2626,#ef4444)'
                          : 'linear-gradient(135deg,#d97706,#fbbf24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '0.75rem'
                      }}>
                        {inst.loan?.customer?.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          {inst.loan?.customer?.firstName} {inst.loan?.customer?.lastName}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{inst.loan?.customer?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.875rem' }}>{fmtDate(inst.dueDate)}</td>
                  <td><DaysBadge days={inst.daysOverdue} /></td>
                  <td style={{ fontWeight: 700 }}>{fmtCurrency(inst.amount)}</td>
                  <td style={{ color: inst.penaltyAmount > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
                    {inst.penaltyAmount > 0 ? fmtCurrency(inst.penaltyAmount) : '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>{inst.loan?.officer?.name || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/loans/${inst.loanId}`} className="btn btn-outline btn-sm">
                      View Loan <ArrowUpRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <span className="pagination-info">Showing {filtered.length} of {rows.length} records</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortfolioAtRisk() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(STATUS_OVERDUE);

  const load = () => {
    setLoading(true);
    loansApi.getPar()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load PAR data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalPAR = data?.summary?.totalPar || 0;
  const overdueTotal = data?.summary?.overdueTotal || 0;
  const criticalTotal = data?.summary?.criticalTotal || 0;
  const parPct = totalPAR > 0 ? ((criticalTotal / totalPAR) * 100).toFixed(1) : '0.0';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={24} color="#dc2626" /> Portfolio at Risk (PAR)
          </h1>
          <p className="page-subtitle">
            Monitor overdue and defaulted loan installments — Real & Fast Point Ent.
          </p>
        </div>
        <button onClick={load} className="btn btn-outline btn-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary Banner */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <SummaryCard
            label="Total PAR"
            value={fmtCurrency(totalPAR)}
            icon={TrendingDown}
            color="#dc2626"
            sub={`${(data?.summary?.overdueCount || 0) + (data?.summary?.criticalCount || 0)} installments at risk`}
          />
          <SummaryCard
            label="Overdue (1–30 Days)"
            value={fmtCurrency(overdueTotal)}
            icon={Clock}
            color="#d97706"
            sub={`${data?.summary?.overdueCount || 0} installments`}
          />
          <SummaryCard
            label="Critical (31+ Days)"
            value={fmtCurrency(criticalTotal)}
            icon={ShieldAlert}
            color="#dc2626"
            sub={`${data?.summary?.criticalCount || 0} installments`}
          />
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid #7c3aed' }}>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Critical PAR Ratio</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#7c3aed' }}>{parPct}%</h2>
            <div style={{ marginTop: '0.75rem', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${parPct}%`, height: '100%', background: 'linear-gradient(90deg,#d97706,#dc2626)', borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>Critical ÷ Total PAR</p>
          </div>
        </div>
      )}

      {/* Policy Note */}
      <div style={{
        background: 'linear-gradient(135deg,#fef9c3,#fefce8)',
        border: '1px solid #fde047',
        borderRadius: 12,
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        fontSize: '0.8125rem',
        color: '#713f12',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}>
        <AlertTriangle size={16} color="#ca8a04" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>PAR Policy — Real & Fast Point Ent.:</strong>{' '}
          A <strong>1% overdue charge</strong> is applied after 3 days of non-payment (1–30 days).
          A <strong>12.5% default charge</strong> on the outstanding balance is applied after 31 days of non-payment.
          Reminder SMS is sent <strong>3 days before</strong> the due date. All charges are applied automatically at midnight daily.
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {[
            { key: STATUS_OVERDUE, label: `Overdue (1–30 Days)`, count: data?.summary?.overdueCount, color: '#d97706' },
            { key: STATUS_CRITICAL, label: `Critical (31+ Days)`, count: data?.summary?.criticalCount, color: '#dc2626' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                padding: '1rem 1.25rem',
                border: 'none',
                background: 'none',
                borderBottom: tab === t.key ? `3px solid ${t.color}` : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: tab === t.key ? t.color : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
              {!loading && t.count !== undefined && (
                <span style={{
                  background: tab === t.key ? t.color : '#e2e8f0',
                  color: tab === t.key ? 'white' : '#64748b',
                  borderRadius: 20,
                  padding: '1px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
          </div>
        ) : tab === STATUS_OVERDUE ? (
          <ParTable
            rows={data?.overdue || []}
            emptyLabel="No overdue installments — great portfolio health!"
          />
        ) : (
          <ParTable
            rows={data?.critical || []}
            emptyLabel="No critical (31+ day) defaults — excellent!"
          />
        )}
      </div>
    </div>
  );
}
