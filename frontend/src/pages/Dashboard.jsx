import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { fmtCurrency } from '../utils/format';
import { 
  TrendingUp, Users, CreditCard, AlertTriangle, CheckCircle, 
  DollarSign, PiggyBank, ArrowUpRight, Wallet, History,
  BarChart3, PieChart, Activity, ShieldCheck, Plus
} from 'lucide-react';



export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getMetrics()
      .then(r => setMetrics(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 160, borderRadius: 20 }} />
      ))}
    </div>
  );

  const totalPAR = (metrics?.parStats?.par1to30 || 0) + 
                   (metrics?.parStats?.par31to60 || 0) + 
                   (metrics?.parStats?.par61to90 || 0) + 
                   (metrics?.parStats?.par90Plus || 0);

  const collectionRate = metrics?.collectionEfficiency?.toFixed(1) || 0;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Management Overview</h1>
          <p className="page-subtitle">Track your portfolio health and savings at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/loans/new" className="btn btn-primary">
              <Plus size={18} /> New Loan
            </Link>
            <Link to="/customers/new" className="btn btn-outline">
              <Users size={18} /> New Customer
            </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid #1e40af' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Active Loan Portfolio</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(metrics?.outstandingBalance)}</h2>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.8125rem', fontWeight: 700 }}>
             <Activity size={14} /> {metrics?.activeLoans} active loans
          </div>
        </div>

        <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid #0d9488' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Total Susu Savings</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0d9488' }}>{fmtCurrency(metrics?.totalSusu)}</h2>
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', fontSize: '0.8125rem', fontWeight: 700 }}>
             <PiggyBank size={14} /> {fmtCurrency(metrics?.todaySusuWithdrawals)} withdrawn today
          </div>
        </div>

        <div className="card" style={{ padding: '1.75rem', borderLeft: '4px solid #059669' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Recovery Efficiency</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#059669' }}>{collectionRate}%</h2>
          <div style={{ marginTop: '1rem', width: '100%', height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
             <div style={{ width: `${collectionRate}%`, height: '100%', background: '#059669' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Risk Assessment */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#dc2626" /> Portfolio Risk (PAR)
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px' }}>
              Total: {fmtCurrency(totalPAR)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b' }}>Overdue (1-30 Days)</span>
                <span style={{ fontWeight: 700 }}>{fmtCurrency(metrics?.parStats?.par1to30)}</span>
              </div>
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }}>
                <div style={{ width: `${totalPAR > 0 ? (metrics?.parStats?.par1to30 / totalPAR) * 100 : 0}%`, height: '100%', background: '#fbbf24', borderRadius: 2 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b' }}>Critical (31+ Days)</span>
                <span style={{ fontWeight: 700 }}>{fmtCurrency((metrics?.parStats?.par31to60 || 0) + (metrics?.parStats?.par90Plus || 0))}</span>
              </div>
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }}>
                <div style={{ width: `${totalPAR > 0 ? ((totalPAR - metrics?.parStats?.par1to30) / totalPAR) * 100 : 0}%`, height: '100%', background: '#dc2626', borderRadius: 2 }} />
              </div>
            </div>
          </div>

          <Link to="/repayments" className="btn btn-outline btn-sm btn-full" style={{ marginTop: '2rem' }}>
            View Overdue List
          </Link>
        </div>

        {/* Customer & Loan Activity */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#0d9488" /> Recent Scale
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Total Customers</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metrics?.customerStats?.totalCustomers}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>New (This Month)</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>+{metrics?.customerStats?.newCustomersThisMonth}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Disbursed Total</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{fmtCurrency(metrics?.totalDisbursed)}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>Loans Issued</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metrics?.totalLoans}</p>
            </div>
          </div>

          <Link to="/susu" className="btn btn-gold btn-sm btn-full" style={{ marginTop: '1.5rem' }}>
            Record Daily Susu
          </Link>
        </div>

      </div>
    </div>
  );
}
