import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { customersApi, loansApi } from '../services/api';
import { 
  ArrowLeft, Phone, Mail, IdCard, CreditCard, Plus, Edit, X, 
  Camera, Upload, CheckCircle, RefreshCw, FileText, Image as ImageIcon, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

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

function KYCImage({ path, label, previewUrl, onReplaceClick }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (previewUrl) {
      setUrl(previewUrl);
      return;
    }
    if (!path) {
      setUrl(null);
      return;
    }
    const filename = path.split('/').pop();
    customersApi.getKycBlob(filename)
      .then(res => setUrl(URL.createObjectURL(res.data)))
      .catch(() => setError(true));
    
    return () => url && !previewUrl && URL.revokeObjectURL(url);
  }, [path, previewUrl]);

  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>{label}</p>
        {onReplaceClick && (
          <button 
            type="button"
            onClick={onReplaceClick}
            style={{ 
              background: 'none', border: 'none', color: '#1e40af', fontSize: '0.75rem', 
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' 
            }}
          >
            <Upload size={12} /> {path || previewUrl ? 'Change' : 'Upload'}
          </button>
        )}
      </div>
      <div 
        style={{ 
          height: 140, borderRadius: 12, border: '1.5px dashed #cbd5e1', background: '#f8fafc',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          cursor: url ? 'zoom-in' : 'pointer', position: 'relative'
        }} 
        onClick={() => {
          if (url) {
            window.open(url, '_blank');
          } else if (onReplaceClick) {
            onReplaceClick();
          }
        }}
      >
        {url ? (
          <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : error ? (
          <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Failed to load</span>
        ) : path ? (
          <div className="skeleton" style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 0.25rem' }} />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>No document uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    ghanaCardNumber: ''
  });

  const [editFiles, setEditFiles] = useState({
    photo: null,
    ghanaCardFront: null,
    ghanaCardBack: null
  });

  const [filePreviews, setFilePreviews] = useState({
    photo: null,
    ghanaCardFront: null,
    ghanaCardBack: null
  });

  const fetchCustomer = () => {
    setLoading(true);
    customersApi.getOne(id)
      .then(r => {
        setCustomer(r.data);
        setEditForm({
          firstName: r.data.firstName,
          lastName: r.data.lastName,
          phone: r.data.phone,
          email: r.data.email || '',
          ghanaCardNumber: r.data.ghanaCardNumber || ''
        });
      })
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomer();
    if (location.state?.openEdit) {
      setShowEditModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [id, location.state]);

  const handleFileSelect = (field, file) => {
    if (!file) return;
    setEditFiles(prev => ({ ...prev, [field]: file }));
    const objectUrl = URL.createObjectURL(file);
    setFilePreviews(prev => ({ ...prev, [field]: objectUrl }));
  };

  const handleQuickPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    const toastId = toast.loading('Uploading profile picture...');
    try {
      await customersApi.update(id, fd);
      toast.success('Profile picture updated!', { id: toastId });
      fetchCustomer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update photo', { id: toastId });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const fd = new FormData();
      fd.append('firstName', editForm.firstName);
      fd.append('lastName', editForm.lastName);
      fd.append('phone', editForm.phone);
      if (editForm.email) fd.append('email', editForm.email);
      if (editForm.ghanaCardNumber) fd.append('ghanaCardNumber', editForm.ghanaCardNumber);

      if (editFiles.photo) fd.append('photo', editFiles.photo);
      if (editFiles.ghanaCardFront) fd.append('ghanaCardFront', editFiles.ghanaCardFront);
      if (editFiles.ghanaCardBack) fd.append('ghanaCardBack', editFiles.ghanaCardBack);

      await customersApi.update(id, fd);
      toast.success('Customer profile and documents updated successfully');
      setShowEditModal(false);
      setEditFiles({ photo: null, ghanaCardFront: null, ghanaCardBack: null });
      setFilePreviews({ photo: null, ghanaCardFront: null, ghanaCardBack: null });
      fetchCustomer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {Array(3).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: '1rem' }} />)}
    </div>
  );

  if (!customer) return null;

  if (showEditModal) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto', paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button onClick={() => setShowEditModal(false)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', borderRadius: 8 }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Edit Customer Profile</h1>
            <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Update client personal information and KYC verification documents</p>
          </div>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* Customer Photo Upload Section */}
            <div>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 800 }}>
                Profile Picture
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{
                  width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
                  background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0,
                  border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {filePreviews.photo ? (
                    <img src={filePreviews.photo} alt="New Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : customer.photo ? (
                    <KYCImageInProfile path={customer.photo} />
                  ) : (
                    customer.firstName.charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input 
                    type="file" 
                    id="edit-photo-input" 
                    accept="image/*" 
                    capture="user"
                    onChange={e => handleFileSelect('photo', e.target.files[0])} 
                    style={{ display: 'none' }} 
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('edit-photo-input').click()}
                      className="btn btn-outline btn-sm"
                      style={{ borderRadius: 8, gap: '0.375rem' }}
                    >
                      <Camera size={15} color="#1e40af" />
                      {editFiles.photo ? 'Change Selected Photo' : 'Upload / Capture New Photo'}
                    </button>
                    {editFiles.photo && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditFiles(prev => ({ ...prev, photo: null }));
                          setFilePreviews(prev => ({ ...prev, photo: null }));
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ borderRadius: 8, color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        <X size={14} /> Remove Selection
                      </button>
                    )}
                  </div>
                  {editFiles.photo ? (
                    <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={13} /> Selected: {editFiles.photo.name}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem' }}>
                      PNG, JPG, or Camera capture. Recommended square portrait.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem' }}>
                Personal Details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input 
                    className="form-input"
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input 
                    className="form-input"
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input 
                    className="form-input"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    className="form-input"
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Ghana Card Number</label>
                <input 
                  className="form-input"
                  value={editForm.ghanaCardNumber}
                  onChange={e => setEditForm({ ...editForm, ghanaCardNumber: e.target.value })}
                  placeholder="GHA-XXXXXXXXX-X"
                />
              </div>
            </div>

            {/* Ghana Card Documents Upload Section */}
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem' }}>
                Ghana Card Photos (Front & Back)
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                {/* Front Card */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Ghana Card (Front)</span>
                    {editFiles.ghanaCardFront && (
                      <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={12} /> New selected
                      </span>
                    )}
                  </div>

                  <input 
                    type="file" 
                    id="edit-card-front-input" 
                    accept="image/*,.pdf" 
                    onChange={e => handleFileSelect('ghanaCardFront', e.target.files[0])} 
                    style={{ display: 'none' }} 
                  />

                  <div 
                    onClick={() => document.getElementById('edit-card-front-input').click()}
                    style={{ 
                      height: 120, borderRadius: 10, border: '1.5px dashed #cbd5e1', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', overflow: 'hidden', background: 'white', position: 'relative'
                    }}
                  >
                    {filePreviews.ghanaCardFront ? (
                      <img src={filePreviews.ghanaCardFront} alt="New Card Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : customer.ghanaCardFront ? (
                      <KYCImage path={customer.ghanaCardFront} label="" />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <Upload size={22} color="#94a3b8" style={{ margin: '0 auto 0.25rem' }} />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Click to upload card front</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('edit-card-front-input').click()}
                      className="btn btn-outline btn-sm" 
                      style={{ flex: 1, borderRadius: 8, fontSize: '0.75rem', gap: '0.25rem' }}
                    >
                      <Upload size={13} /> {editFiles.ghanaCardFront ? 'Change File' : customer.ghanaCardFront ? 'Replace Front' : 'Upload Front'}
                    </button>
                    {editFiles.ghanaCardFront && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditFiles(prev => ({ ...prev, ghanaCardFront: null }));
                          setFilePreviews(prev => ({ ...prev, ghanaCardFront: null }));
                        }}
                        className="btn btn-outline btn-sm" 
                        style={{ borderRadius: 8, color: '#dc2626', borderColor: '#fca5a5', padding: '0.25rem 0.5rem' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Back Card */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>Ghana Card (Back)</span>
                    {editFiles.ghanaCardBack && (
                      <span style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={12} /> New selected
                      </span>
                    )}
                  </div>

                  <input 
                    type="file" 
                    id="edit-card-back-input" 
                    accept="image/*,.pdf" 
                    onChange={e => handleFileSelect('ghanaCardBack', e.target.files[0])} 
                    style={{ display: 'none' }} 
                  />

                  <div 
                    onClick={() => document.getElementById('edit-card-back-input').click()}
                    style={{ 
                      height: 120, borderRadius: 10, border: '1.5px dashed #cbd5e1', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', overflow: 'hidden', background: 'white', position: 'relative'
                    }}
                  >
                    {filePreviews.ghanaCardBack ? (
                      <img src={filePreviews.ghanaCardBack} alt="New Card Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : customer.ghanaCardBack ? (
                      <KYCImage path={customer.ghanaCardBack} label="" />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <Upload size={22} color="#94a3b8" style={{ margin: '0 auto 0.25rem' }} />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Click to upload card back</p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('edit-card-back-input').click()}
                      className="btn btn-outline btn-sm" 
                      style={{ flex: 1, borderRadius: 8, fontSize: '0.75rem', gap: '0.25rem' }}
                    >
                      <Upload size={13} /> {editFiles.ghanaCardBack ? 'Change File' : customer.ghanaCardBack ? 'Replace Back' : 'Upload Back'}
                    </button>
                    {editFiles.ghanaCardBack && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditFiles(prev => ({ ...prev, ghanaCardBack: null }));
                          setFilePreviews(prev => ({ ...prev, ghanaCardBack: null }));
                        }}
                        className="btn btn-outline btn-sm" 
                        style={{ borderRadius: 8, color: '#dc2626', borderColor: '#fca5a5', padding: '0.25rem 0.5rem' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-full" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditFiles({ photo: null, ghanaCardFront: null, ghanaCardBack: null });
                  setFilePreviews({ photo: null, ghanaCardFront: null, ghanaCardBack: null });
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving Profile & Documents...' : 'Save All Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm" style={{ padding: '0.5rem', borderRadius: 8 }}>
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Customer Profile</h1>
      </div>

      {/* Hidden input for quick photo update from avatar */}
      <input 
        type="file" 
        id="quick-photo-input" 
        accept="image/*" 
        capture="user"
        onChange={handleQuickPhotoUpload} 
        style={{ display: 'none' }} 
      />

      {/* Profile card */}
      <div className="card" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Avatar with quick camera edit button */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div 
              style={{
                width: 76, height: 76, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1.5rem',
                overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)'
              }}
            >
              {customer.photo ? (
                 <KYCImageInProfile path={customer.photo} />
              ) : (
                 customer.firstName.charAt(0).toUpperCase()
              )}
            </div>
            <button 
              type="button"
              onClick={() => document.getElementById('quick-photo-input').click()}
              title="Change Profile Photo"
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 28, height: 28, borderRadius: '50%',
                background: '#1e40af', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              <Camera size={14} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {customer.firstName} {customer.lastName}
                </h2>
                <button 
                    onClick={() => setShowEditModal(true)}
                    className="btn btn-sm"
                    style={{ 
                        background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', 
                        color: 'white', gap: '0.375rem', flexShrink: 0
                    }}
                >
                    <Edit size={14} /> Edit Profile
                </button>
            </div>
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
            {customer.ghanaCardNumber && (
              <p style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Ghana Card: <strong style={{ color: 'white' }}>{customer.ghanaCardNumber}</strong>
              </p>
            )}
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Joined {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* KYC info */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IdCard size={18} color="#d97706" />
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>KYC Verification Documents</h3>
          </div>
          <button 
            onClick={() => setShowEditModal(true)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', borderRadius: 8, gap: '0.25rem' }}
          >
            <Upload size={12} /> Update Documents
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <KYCImage 
            path={customer.ghanaCardFront} 
            label="Ghana Card (Front)" 
            onReplaceClick={() => setShowEditModal(true)}
          />
          <KYCImage 
            path={customer.ghanaCardBack} 
            label="Ghana Card (Back)" 
            onReplaceClick={() => setShowEditModal(true)}
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem', fontStyle: 'italic' }}>
          Click an image to view in full resolution or click "Update Documents" to upload new photos.
        </p>
      </div>

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
