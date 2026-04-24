import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../services/api';
import { ArrowLeft, Upload, CheckCircle, Loader, User, Phone, Mail, FileText, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewCustomer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', ghanaCardNumber: '' });
  const [files, setFiles] = useState({ ghanaCardFront: null, ghanaCardBack: null, photo: null });
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
      if (files.photo) fd.append('photo', files.photo);

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
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
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

      <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Personal Details Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#1e40af" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Customer Details</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input 
                name="firstName" required 
                value={form.firstName} onChange={handleChange}
                className="form-input" placeholder="e.g. Samuel" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input 
                name="lastName" required 
                value={form.lastName} onChange={handleChange}
                className="form-input" placeholder="e.g. Boateng" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  name="phone" required type="tel"
                  value={form.phone} onChange={handleChange}
                  className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="024 XXX XXXX" 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Ghana Card # *</label>
              <div style={{ position: 'relative' }}>
                <FileText size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  name="ghanaCardNumber" required 
                  value={form.ghanaCardNumber} onChange={handleChange}
                  className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="GHA-XXXX-X" 
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Email Address (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                name="email" type="email"
                value={form.email} onChange={handleChange}
                className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="customer@example.com" 
              />
            </div>
          </div>
        </div>

        {/* Media & Documents Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.25rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={18} color="#7c3aed" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Media & Documents</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            {/* Profile Photo */}
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem' }}>Profile Picture *</p>
              <div 
                className={`file-upload-area ${files.photo ? 'has-file' : ''}`}
                onClick={() => document.getElementById('file-photo').click()}
                style={{ 
                  width: '120px', height: '120px', borderRadius: '16px', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', position: 'relative', overflow: 'hidden', borderStyle: 'dashed'
                }}
              >
                <input 
                  type="file" id="file-photo" name="photo" accept="image/*" 
                  capture="user"
                  onChange={handleFile} style={{ display: 'none' }} 
                />
                {files.photo ? (
                  <img src={URL.createObjectURL(files.photo)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <Camera size={20} color="#94a3b8" style={{ marginBottom: '0.125rem', opacity: 0.5 }} />
                    <p style={{ color: '#64748b', fontSize: '0.625rem', fontWeight: 600 }}>Capture</p>
                  </div>
                )}
              </div>
            </div>

            {/* KYC Docs */}
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem' }}>Ghana Card (Front & Back) *</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { field: 'ghanaCardFront', label: 'Front' },
                  { field: 'ghanaCardBack', label: 'Back' }
                ].map(({ field, label }) => (
                  <div 
                    key={field}
                    className={`file-upload-area ${files[field] ? 'has-file' : ''}`}
                    onClick={() => document.getElementById(`file-${field}`).click()}
                    style={{ flex: 1, minHeight: '80px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <input type="file" id={`file-${field}`} name={field} accept="image/*,.pdf" onChange={handleFile} style={{ display: 'none' }} />
                    {files[field] ? (
                      <CheckCircle size={20} color="#059669" />
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                         <Upload size={18} color="#94a3b8" style={{ opacity: 0.5 }} />
                         <p style={{ fontSize: '0.625rem', color: '#94a3b8', marginTop: '0.25rem' }}>{label}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" style={{ flex: 1 }}>
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
