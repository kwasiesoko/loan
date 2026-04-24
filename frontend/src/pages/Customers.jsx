import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customersApi } from '../services/api';
import { fmtDate } from '../utils/format';
import { UserPlus, Search, User, Phone, Mail, Eye, ChevronRight } from 'lucide-react';

function KYCImageThumbnail({ path, initials }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!path) return;
    const filename = path.split('/').pop();
    customersApi.getKycBlob(filename)
      .then(res => setUrl(URL.createObjectURL(res.data)))
      .catch(() => {});
    
    return () => url && URL.revokeObjectURL(url);
  }, [path]);

  if (url) return <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  return initials;
}

export default function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    customersApi.getAll()
      .then(r => setCustomers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    `${c.firstName} ${c.lastName} ${c.phone} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} registered customers in your portfolio</p>
        </div>
        <Link to="/customers/new" className="btn btn-primary btn-pulse">
          <UserPlus size={18} aria-hidden="true" /> Add New Customer
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div className="search-wrapper" style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} className="search-icon" aria-hidden="true" />
            <input
              className="form-input"
              placeholder="Search by name, phone number, or email address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search customers"
            />
          </div>
          <Link to="/customers/new" className="btn btn-outline hidden md:flex" title="Quick Add">
            <UserPlus size={18} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: 24, background: '#f8fafc', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
            border: '2px solid #e2e8f0' 
          }}>
            <User size={32} color="#94a3b8" />
          </div>
          <h3 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No customers found</h3>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '2rem', maxWidth: '340px', margin: '0 auto 2rem' }}>
            {search ? `Searching for "${search}" yielded no results. Try another name or phone number.` : 'Your customer portfolio is currently empty. Start growing your client base now.'}
          </p>
          {!search && <Link to="/customers/new" className="btn btn-primary btn-lg">Add Your First Customer</Link>}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container hidden md:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Email Address</th>
                  <th>Date Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)',
                          overflow: 'hidden'
                        }}>
                          <KYCImageThumbnail path={c.photo} initials={c.firstName.charAt(0).toUpperCase()} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#0f172a' }}>{c.firstName} {c.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {c.id.split('-')[0].toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={14} color="#94a3b8" />
                        {c.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="#94a3b8" />
                        <span style={{ color: c.email ? '#374151' : '#94a3b8' }}>{c.email || 'No email provided'}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                      {fmtDate(c.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/customers/${c.id}`} className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                        <Eye size={14} /> View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination UI Placeholder */}
            <div className="pagination">
              <span className="pagination-info">Showing {filtered.length} of {customers.length} customers</span>
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
            {filtered.map(c => (
              <Link key={c.id} to={`/customers/${c.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    color: 'white', fontWeight: 800, fontSize: '1.125rem', flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    <KYCImageThumbnail path={c.photo} initials={c.firstName.charAt(0).toUpperCase()} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.125rem' }}>{c.firstName} {c.lastName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={12} /> {c.phone}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
      
      {/* Floating Action Button (Mobile) */}
      <Link to="/customers/new" className="fab md:hidden" aria-label="Add new customer">
        <UserPlus size={24} />
      </Link>
    </div>
  );
}

