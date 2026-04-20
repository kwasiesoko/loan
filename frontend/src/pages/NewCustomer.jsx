import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../services/api';
import { ArrowLeft, Upload, CheckCircle, Loader, User, Phone, Mail, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', ghanaCardNumber: '' });
  const [files, setFiles] = useState({ ghanaCardFront: null, ghanaCardBack: null });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFile = e => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (files.ghanaCardFront) fd.append('ghanaCardFront', files.ghanaCardFront);
      if (files.ghanaCardBack) fd.append('ghanaCardBack', files.ghanaCardBack);

      await customersApi.create(fd);
      toast.success('Customer registered successfully!');
      navigate('/customers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', borderRadius: 10 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Register New Customer</h1>
            <p className="page-subtitle">Add a new client and their KYC documents</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Personal Information */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="#1e40af" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Personal Information</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-cols-1 md:grid-cols-2">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name *</label>
              <input 
                id="firstName" name="firstName" required 
                value={form.firstName} onChange={handleChange}
                className="form-input" placeholder="e.g. Samuel" 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name *</label>
              <input 
                id="lastName" name="lastName" required 
                value={form.lastName} onChange={handleChange}
                className="form-input" placeholder="e.g. Boateng" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }} className="grid-cols-1 md:grid-cols-2">
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  id="phone" name="phone" required type="tel"
                  value={form.phone} onChange={handleChange}
                  className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="024 XXX XXXX" 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  id="email" name="email" type="email"
                  value={form.email} onChange={handleChange}
                  className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="customer@example.com" 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ghanaCardNumber">Ghana Card Number *</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  id="ghanaCardNumber" name="ghanaCardNumber" required 
                  value={form.ghanaCardNumber} onChange={handleChange}
                  className="form-input" style={{ paddingLeft: '2.75rem' }} placeholder="GHA-XXXXXXXXX-X" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* KYC Documents */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="#d97706" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>KYC Verification</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>A valid Ghana Card is required for all new registrations</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-cols-1 md:grid-cols-2">
            {[
              { field: 'ghanaCardFront', label: 'Ghana Card Front' },
              { field: 'ghanaCardBack', label: 'Ghana Card Back' }
            ].map(({ field, label }) => (
              <div key={field} className="form-group">
                <label className="form-label">{label} *</label>
                <div 
                  className={`file-upload-area ${files[field] ? 'has-file' : ''}`}
                  onClick={() => document.getElementById(`file-${field}`).click()}
                  style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                >
                  <input 
                    type="file" id={`file-${field}`} name={field} accept="image/*,.pdf" 
                    onChange={handleFile} style={{ display: 'none' }} 
                  />
                  {files[field] ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <CheckCircle size={24} color="#059669" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ color: '#065f46', fontWeight: 700, fontSize: '0.875rem', wordBreak: 'break-all' }}>
                        {files[field].name}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Click to change</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <Upload size={24} color="#94a3b8" style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Click to upload file</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.75rem' }}>JPG, PNG or PDF</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" style={{ flex: 1, padding: '1rem' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
            {loading ? <Loader size={20} className="animate-spin" /> : 'Register Customer Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
