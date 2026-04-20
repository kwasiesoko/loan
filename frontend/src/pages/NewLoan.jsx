import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi, loansApi } from '../services/api';
import { fmtCurrency } from '../utils/format';
import { ArrowLeft, CreditCard, Calculator, Loader, ChevronDown, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewLoan() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ customerId: '', amount: '', interestRate: '', durationMonths: '', interestModel: 'FLAT' });
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [preview, setPreview] = useState(null);

  const filteredCustomers = customers.filter(c => 
    `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(customerSearch.toLowerCase())
  );

  useEffect(() => {
    customersApi.getAll()
      .then(r => setCustomers(r.data))
      .catch(console.error);
  }, []);

  const calculatePreview = (amount, rate, months, model) => {
    if (amount > 0 && rate >= 0 && months > 0) {
      let totalInterest, totalRepayable, monthlyPayment;

      if (model === 'FLAT') {
        totalInterest = (amount * rate) / 100;
        totalRepayable = amount + totalInterest;
        monthlyPayment = totalRepayable / months;
      } else {
        // Reducing Balance (Standard EMI)
        const r = rate / 100;
        const n = months;
        monthlyPayment = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        totalRepayable = monthlyPayment * n;
        totalInterest = totalRepayable - amount;
      }
      return { totalInterest, totalRepayable, monthlyPayment };
    }
    return null;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);

    const prev = calculatePreview(
      parseFloat(updated.amount),
      parseFloat(updated.interestRate),
      parseInt(updated.durationMonths),
      updated.interestModel
    );
    setPreview(prev);
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
        {/* Loan Configuration */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} color="var(--primary)" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Loan Configuration</h3>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="customerId">Target Customer *</label>
            <input 
              type="text" 
              placeholder="Type to search customers by name or phone..."
              className="form-input"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            />
            <div style={{ position: 'relative' }}>
              <select 
                id="customerId" name="customerId" required 
                value={form.customerId} onChange={handleChange}
                className="form-input" style={{ appearance: 'none', paddingRight: '2.5rem' }}
              >
                <option value="">-- Select a registered customer --</option>
                {filteredCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone})</option>
                ))}
              </select>
              <ChevronDown size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
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
                { label: 'Monthly Payment', val: fmtCurrency(preview.monthlyPayment), color: 'var(--success)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.375rem', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 800, color }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-main)', fontSize: '0.8125rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 12 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <p>This is a <strong>{form.interestModel.toLowerCase()}</strong> interest model. Upon clicking "Disburse Loan", a fixed schedule of {form.durationMonths} monthly installments will be automatically generated.</p>
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
