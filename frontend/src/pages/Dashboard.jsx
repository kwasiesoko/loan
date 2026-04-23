import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { fmtCurrency } from '../utils/format';
import { 
  TrendingUp, Users, CreditCard, AlertTriangle, CheckCircle, 
  DollarSign, PiggyBank, ArrowUpRight, Wallet, History,
  BarChart3, PieChart, Activity, ShieldCheck
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, bg, sub }) {
  return (
    <div className="stat-card" style={{ cursor: 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} aria-hidden="true" />
        </div>
        {sub !== undefined && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
            <ArrowUpRight size={12} aria-hidden="true" />{sub}
          </span>
        )}
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.375rem', fontWeight: 500 }}>{label}</p>
    </div>
  );
}

function PARItem({ label, amount, total, color }) {
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.8125rem' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(amount)}</span>
            </div>
            <div className="metric-bar-bg" style={{ height: 6 }}>
                <div className="metric-bar-fill" style={{ width: `${percentage}%`, height: 6, background: color }} />
            </div>
        </div>
    );
}

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
      {Array(8).fill(0).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
      ))}
    </div>
  );

  const totalPAR = (metrics?.parStats?.par1to30 || 0) + 
                   (metrics?.parStats?.par31to60 || 0) + 
                   (metrics?.parStats?.par61to90 || 0) + 
                   (metrics?.parStats?.par90Plus || 0);

  const collectionRate = metrics?.collectionEfficiency?.toFixed(1) || 0;
  const customerStats = metrics?.customerStats || {};

  // Max value for chart scaling
  const maxTrendVal = metrics?.trends ? Math.max(...metrics.trends.map(t => Math.max(t.loans, t.susu)), 1000) : 1000;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Management Dashboard</h1>
          <p className="page-subtitle">Loan Portfolio & Susu Savings Performance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/loans/new" className="btn btn-primary btn-sm">New Loan</Link>
            <Link to="/susu" className="btn btn-gold btn-sm">Record Susu</Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={CreditCard} label="Total Disbursed" value={fmtCurrency(metrics?.totalDisbursed)} color="#1e40af" bg="#dbeafe" />
        <StatCard icon={PiggyBank} label="Active Portfolio" value={fmtCurrency(metrics?.outstandingBalance)} color="#d97706" bg="#fef3c7" />
        <StatCard icon={Wallet} label="Total Susu Savings" value={fmtCurrency(metrics?.totalSusu)} color="#0d9488" bg="#f0fdfa" />
        <StatCard icon={ShieldCheck} label="Collection Efficiency" value={`${collectionRate}%`} color="#059669" bg="#d1fae5" />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Customer Snapshot</h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>A quick view of registration and portfolio coverage</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          <StatCard icon={Users} label="Total Customers" value={customerStats.totalCustomers || 0} color="#0f172a" bg="#e2e8f0" />
          <StatCard icon={TrendingUp} label="New This Month" value={customerStats.newCustomersThisMonth || 0} color="#059669" bg="#dcfce7" />
          <StatCard icon={CreditCard} label="Customers With Loans" value={customerStats.customersWithLoans || 0} color="#7c3aed" bg="#f3e8ff" />
          <StatCard icon={CheckCircle} label="Customers With Ghana Card" value={customerStats.customersWithGhanaCard || 0} color="#d97706" bg="#fef3c7" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={Users} label="Total Loans" value={metrics?.totalLoans || 0} color="#64748b" bg="#f1f5f9" />
        <StatCard icon={Activity} label="Active Loans" value={metrics?.activeLoans || 0} color="#059669" bg="#ecfdf5" />
        <StatCard icon={TrendingUp} label="Completed" value={metrics?.completedLoans || 0} color="#7c3aed" bg="#f5f3ff" />
        <StatCard icon={AlertTriangle} label="Defaulted" value={metrics?.defaultedLoans || 0} color="#dc2626" bg="#fef2f2" />
      </div>

      {/* Analysis Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Trend Chart Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={18} color="#0d9488" /> Performance Trends
                </h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#0d9488' }} /> Loans
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: '#d97706' }} /> Susu
                    </div>
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 200, paddingBottom: '2rem', position: 'relative' }}>
                {metrics?.trends?.map((t, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                            <div style={{ 
                                width: '12px', 
                                height: `${(t.loans / maxTrendVal) * 100}%`, 
                                background: '#0d9488', 
                                borderRadius: '4px 4px 0 0',
                                minHeight: t.loans > 0 ? 4 : 0
                            }} title={`Loans: ${fmtCurrency(t.loans)}`} />
                            <div style={{ 
                                width: '12px', 
                                height: `${(t.susu / maxTrendVal) * 100}%`, 
                                background: '#d97706', 
                                borderRadius: '4px 4px 0 0',
                                minHeight: t.susu > 0 ? 4 : 0
                            }} title={`Susu: ${fmtCurrency(t.susu)}`} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{t.month}</span>
                    </div>
                ))}
                {/* Y-Axis Label Placeholder */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: '2.5rem', borderLeft: '1px dashed #e2e8f0' }} />
            </div>
          </div>

          {/* PAR BreakDown Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#dc2626" /> Portfolio At Risk (PAR)
            </h3>
            
            <div style={{ marginBottom: '2rem' }}>
                <PARItem label="1 - 30 Days Overdue" amount={metrics?.parStats?.par1to30 || 0} total={totalPAR} color="#fbbf24" />
                <PARItem label="31 - 60 Days Overdue" amount={metrics?.parStats?.par31to60 || 0} total={totalPAR} color="#f59e0b" />
                <PARItem label="61 - 90 Days Overdue" amount={metrics?.parStats?.par61to90 || 0} total={totalPAR} color="#ea580c" />
                <PARItem label="90+ Days (High Risk)" amount={metrics?.parStats?.par90Plus || 0} total={totalPAR} color="#dc2626" />
            </div>

            <div style={{ background: '#fff5f5', padding: '1rem', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Total Risk Value</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{fmtCurrency(totalPAR)}</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Loan Status Distribution */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PieChart size={18} color="#7c3aed" /> Loan Status Distribution
            </h3>
            
            <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', background: '#f1f5f9' }}>
               <div style={{ width: `${metrics?.totalLoans ? (metrics?.activeLoans / metrics?.totalLoans) * 100 : 0}%`, background: '#059669', transition: 'width 1s ease' }} title="Active" />
               <div style={{ width: `${metrics?.totalLoans ? (metrics?.completedLoans / metrics?.totalLoans) * 100 : 0}%`, background: '#7c3aed', transition: 'width 1s ease' }} title="Completed" />
               <div style={{ width: `${metrics?.totalLoans ? (metrics?.defaultedLoans / metrics?.totalLoans) * 100 : 0}%`, background: '#dc2626', transition: 'width 1s ease' }} title="Defaulted" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#059669' }} /> <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>Active Loans</span></div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{metrics?.activeLoans || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#7c3aed' }} /> <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>Completed</span></div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{metrics?.completedLoans || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><div style={{ width: 12, height: 12, borderRadius: 4, background: '#dc2626' }} /> <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>Defaulted</span></div>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{metrics?.defaultedLoans || 0}</span>
                </div>
            </div>
          </div>

          {/* Financial Health Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={18} color="#1e40af" /> Financial Health
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Disbursed Capital</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(metrics?.totalDisbursed)}</span>
                </div>
                <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4 }}>
                   <div style={{ background: '#3b82f6', width: '100%', height: '100%', borderRadius: 4 }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Expected Returns</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#059669' }}>{fmtCurrency(metrics?.totalExpectedReturn)}</span>
                </div>
                <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4 }}>
                   <div style={{ background: '#10b981', width: `${metrics?.totalExpectedReturn > 0 ? 100 : 0}%`, height: '100%', borderRadius: 4 }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>Actual Recovered</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#d97706' }}>{fmtCurrency(metrics?.totalCollected)}</span>
                </div>
                <div style={{ background: '#f1f5f9', height: 8, borderRadius: 4 }}>
                   <div style={{ background: '#f59e0b', width: `${Math.min(100, metrics?.totalExpectedReturn ? (metrics?.totalCollected / metrics?.totalExpectedReturn) * 100 : 0)}%`, height: '100%', borderRadius: 4, transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Collection card - Wide */}
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Monthly Collection Efficiency</h3>
                <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', fontWeight: 700 }}>
                    Target: 95%
                </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ 
                        width: 72, height: 72, borderRadius: '50%', 
                        border: '8px solid #f1f5f9', borderTopColor: '#059669',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transform: 'rotate(-45deg)'
                    }}>
                        <span style={{ transform: 'rotate(45deg)', fontSize: '1rem', fontWeight: 800, color: '#059669' }}>{collectionRate}%</span>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>Recovery Rate</p>
                        <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Excellent performance</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Expected Repayments</span>
                        <span style={{ fontWeight: 700 }}>{fmtCurrency(metrics?.totalExpectedReturn)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>Actual Collected</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>{fmtCurrency(metrics?.totalCollected)}</span>
                    </div>
                    <div className="metric-bar-bg">
                        <div className="metric-bar-fill" style={{ width: `${collectionRate}%` }} />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
