import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi, loansApi } from '../services/api';
import { fmtCurrency } from '../utils/format';
import { ArrowLeft, CreditCard, Calculator, Loader, ChevronDown, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewLoan() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ 
    customerId: '', 
    amount: '', 
    interestRate: '10', 
    durationMonths: '1', 
    interestModel: 'FLAT',
    repaymentFrequency: 'MONTHLY'
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const loanProducts = [
    { 
      id: 'monthly', 
      name: 'Monthly Plan', 
      description: '10% Interest / Month', 
      rate: 10, 
      frequency: 'MONTHLY', 
      model: 'FLAT',
      duration: 1
    },
    { 
      id: 'quarterly', 
      name: 'Quarterly Plan', 
      description: '20% Interest / Quarter', 
      rate: 20, 
      frequency: 'WEEKLY', 
      model: 'REDUCING',
      duration: 3
    }
  ];

  const selectProduct = (p) => {
    setForm(prev => ({
      ...prev,
      interestRate: String(p.rate),
      interestModel: p.model,
      repaymentFrequency: p.frequency,
      durationMonths: String(p.duration)
    }));
  };
  const filteredCustomers = customers.filter(c => 
    `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCustomer = (c) => {
    setForm(prev => ({ ...prev, customerId: c.id }));
    setSearch(`${c.firstName} ${c.lastName} (${c.phone})`);
    setShowDropdown(false);
  };

  useEffect(() => {
    customersApi.getAll()
      .then(r => setCustomers(r.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const prev = calculatePreview(
      parseFloat(form.amount),
      parseFloat(form.interestRate),
      parseInt(form.durationMonths),
      form.interestModel,
      form.repaymentFrequency
    );
    setPreview(prev);
  }, [form.amount, form.interestRate, form.durationMonths, form.interestModel, form.repaymentFrequency]);
  const calculatePreview = (amount, rate, months, model, frequency) => {
    if (amount > 0 && rate >= 0 && months > 0) {
      let totalInterest, totalRepayable, installmentAmount;
      const n = (frequency === 'WEEKLY') ? months * 4 : months;
      
      // Determine periodic rate
      // If frequency is WEEKLY and rate is 'per quarter' (20%), periodic rate is rate/12
      // If frequency is MONTHLY and rate is 'per month' (10%), periodic rate is rate/100
      let r;
      if (frequency === 'WEEKLY') {
          // Assuming 20% is for 3 months (12 weeks)
          r = (rate / 100) / 12;
      } else {
          r = rate / 100;
      }

      if (model === 'FLAT') {
        // For flat, we usually multiply rate by duration
        // If 10% per month, and duration is 'months'
        totalInterest = amount * (rate / 100) * months;
        totalRepayable = amount + totalInterest;
        installmentAmount = totalRepayable / n;
      } else {
        // Reducing Balance (Standard EMI)
        installmentAmount = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        totalRepayable = installmentAmount * n;
        totalInterest = totalRepayable - amount;
      }
      return { totalInterest, totalRepayable, installmentAmount, frequency };
    }
    return null;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.customerId) {
        toast.error('Please select a customer');
        return;
    }
    
    setLoading(true);
    try {
      await loansApi.create({
        customerId: form.customerId,
        amount: parseFloat(form.amount),
        interestRate: parseFloat(form.interestRate),
        durationMonths: parseInt(form.durationMonths),
        interestModel: form.interestModel,
        repaymentFrequency: form.repaymentFrequency
      });
      toast.success('Loan application approved and schedule generated!');
      navigate('/loans');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create loan');
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
            <h1 className="page-title">New Loan Application</h1>
            <p className="page-subtitle">Configure terms and generate repayment schedule</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Loan Product Selection */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={20} color="var(--primary)" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Select Loan Product</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {loanProducts.map(p => (
              <div 
                key={p.id}
                onClick={() => selectProduct(p)}
                style={{
                  padding: '1.25rem',
                  borderRadius: 16,
                  border: '2px solid',
                  borderColor: (form.interestRate === String(p.rate) && form.repaymentFrequency === p.frequency) ? 'var(--primary)' : 'var(--border)',
                  background: (form.interestRate === String(p.rate) && form.repaymentFrequency === p.frequency) ? 'var(--primary-light)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {(form.interestRate === String(p.rate) && form.repaymentFrequency === p.frequency) && (
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <CheckCircle size={16} color="var(--primary)" />
                  </div>
                )}
                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{p.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.description}</p>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{p.frequency}</span>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{p.model}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} color="var(--primary)" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Loan Details</h3>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="customerId">Target Customer *</label>

            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search by name or phone..." 
                className="form-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setForm(prev => ({ ...prev, customerId: '' }));
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                style={{ paddingRight: '2.5rem' }}
              />
              <ChevronDown 
                size={18} 
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} 
                onClick={() => setShowDropdown(!showDropdown)}
              />

              {showDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)',
                  marginTop: '0.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  maxHeight: '250px', overflowY: 'auto'
                }}>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        style={{
                          padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-muted)',
                          background: form.customerId === c.id ? 'var(--primary-light)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--border-muted)'}
                        onMouseLeave={(e) => e.target.style.background = form.customerId === c.id ? 'var(--primary-light)' : 'transparent'}
                      >
                        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{c.firstName} {c.lastName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone} • {c.ghanaCardNumber}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      No customers found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Interest Model *</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
                {['FLAT', 'REDUCING'].map(m => (
                    <button
                        key={m} type="button"
                        onClick={() => handleChange({ target: { name: 'interestModel', value: m } })}
                        className={`btn ${form.interestModel === m ? 'btn-primary' : 'btn-outline'}`}
                        style={{ flex: 1, textTransform: 'capitalize' }}
                    >
                        {m.toLowerCase()} Rate
                    </button>
                ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-cols-1 md:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Principal Amount (GHS) *</label>
              <input 
                name="amount" type="number" required min="1" step="0.01"
                value={form.amount} onChange={handleChange}
                className="form-input" placeholder="e.g. 1000.00" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Interest Rate (% {form.interestModel === 'FLAT' ? 'Flat' : 'Monthly'}) *</label>
              <input 
                name="interestRate" type="number" required min="0" step="0.1"
                value={form.interestRate} onChange={handleChange}
                className="form-input" placeholder="e.g. 15.0" 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">Loan Duration (Months) *</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {[3, 6, 12, 18, 24].map(m => (
                <button 
                  key={m} type="button" 
                  onClick={() => handleChange({ target: { name: 'durationMonths', value: String(m) } })}
                  className={`btn btn-sm ${form.durationMonths === String(m) ? 'btn-primary' : 'btn-outline'}`}
                  style={{ borderRadius: 999, padding: '0.25rem 1rem', fontSize: '0.75rem' }}
                >
                  {m} Months
                </button>
              ))}
            </div>
            <input 
              name="durationMonths" type="number" required min="1" max="120"
              value={form.durationMonths} onChange={handleChange}
              className="form-input" placeholder="Or enter custom duration..." 
            />
          </div>
        </div>

        {/* Loan Summary / Preview */}
        {preview && (
          <div className="card animate-fade-in" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={20} color="var(--primary)" />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Calculated Loan Summary</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="grid-cols-1 md:grid-cols-3">
              {[
                { label: 'Total Interest', val: fmtCurrency(preview.totalInterest), color: 'var(--text-main)' },
                { label: 'Total Repayable', val: fmtCurrency(preview.totalRepayable), color: 'var(--text-main)' },
                { label: `${preview.frequency === 'WEEKLY' ? 'Weekly' : 'Monthly'} Payment`, val: fmtCurrency(preview.installmentAmount), color: 'var(--success)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.375rem', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 800, color }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.8125rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 12 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <p>This is a <strong>{form.interestModel.toLowerCase()}</strong> interest model. Upon clicking "Disburse Loan", a fixed schedule of {form.repaymentFrequency === 'WEEKLY' ? parseInt(form.durationMonths) * 4 : form.durationMonths} {form.repaymentFrequency.toLowerCase()} installments will be automatically generated.</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={() => navigate('/loans')} className="btn btn-outline" style={{ flex: 1, height: '3.5rem' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, height: '3.5rem' }}>
            {loading ? <Loader size={20} className="animate-spin" /> : <><CheckCircle size={18} /> Disburse & Generate Schedule</>}
          </button>
        </div>
      </form>
    </div>
  );
}
