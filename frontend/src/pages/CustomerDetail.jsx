import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customersApi, loansApi } from '../services/api';
import { ArrowLeft, Phone, Mail, IdCard, CreditCard, Plus } from 'lucide-react';

const fmt = (v) => `GHS ${(v || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;
const statusColors = { ACTIVE: 'badge-active', COMPLETED: 'badge-completed', DEFAULTED: 'badge-defaulted', CANCELLED: 'badge-cancelled' };

function KYCImageInProfile({ path }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!path) return;
    const filename = path.split('/').pop();
    customersApi.getKycBlob(filename)
      .then(res => setUrl(URL.createObjectURL(res.data)))
      .catch(console.error);
    
    return () => url && URL.revokeObjectURL(url);
  }, [path]);

  if (!url) return null;
  return <img src={url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

function KYCImage({ path, label }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!path) return;
    const filename = path.split('/').pop();
    customersApi.getKycBlob(filename)
      .then(res => setUrl(URL.createObjectURL(res.data)))
      .catch(() => setError(true));
    
    return () => url && URL.revokeObjectURL(url);
  }, [path]);

  if (!path) return null;

  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.5rem' }}>{label}</p>
      <div style={{ 
        height: 140, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' 
      }} onClick={() => url && window.open(url, '_blank')}>
        {url ? (
          <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : error ? (
          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Failed to load</span>
        ) : (
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersApi.getOne(id)
      .then(r => setCustomer(r.data))
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: '1rem' }} />)}
    </div>
  );

  if (!customer) return null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', borderRadius: 8 }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Customer Profile</h1>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.5rem',
              overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)'
            }}
          >
            {customer.photo ? (
               <KYCImageInProfile path={customer.photo} />
            ) : (
               customer.firstName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 800 }}>{customer.firstName} {customer.lastName}</h2>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                <Phone size={12} /> {customer.phone}
              </span>
              {customer.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                  <Mail size={12} /> {customer.email}
                </span>
              )}
            </div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Joined {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* KYC info */}
      {(customer.ghanaCardFront || customer.ghanaCardBack) && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <IdCard size={16} color="#d97706" />
            <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>KYC Verification Documents</h3>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <KYCImage path={customer.ghanaCardFront} label="Ghana Card (Front)" />
            <KYCImage path={customer.ghanaCardBack} label="Ghana Card (Back)" />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', fontStyle: 'italic' }}>
            Click an image to view in full resolution. Documents are securely stored and only accessible to authorized loan officers.
          </p>
        </div>
      )}

      {/* Loans */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={16} color="#1e40af" />
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>Loans ({customer.loans?.length || 0})</h3>
          </div>
          <Link to={`/loans/new`} className="btn btn-primary btn-sm">
            <Plus size={13} /> New Loan
          </Link>
        </div>

        {!customer.loans?.length ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>No loans yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {customer.loans.map(l => (
              <Link key={l.id} to={`/loans/${l.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '0.875rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'border-color 0.2s', cursor: 'pointer'
                }}>
                  <div>
                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>{fmt(l.amount)}</p>
                    <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>{l.durationMonths} months • {fmt(l.monthlyPayment)}/mo</p>
                  </div>
                  <span className={`badge ${statusColors[l.status] || 'badge-cancelled'}`}>{l.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
