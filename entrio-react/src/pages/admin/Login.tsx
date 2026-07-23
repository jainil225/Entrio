import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle } from 'lucide-react';
import { login } from '../../api';
import toast from 'react-hot-toast';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@entrio.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      nav('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', background: '#0f0f13' }}>
      {/* Left panel */}
      <div style={{
        background: 'linear-gradient(145deg,#1a1035 0%,#0f0a24 40%,#0c1a3a 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%,rgba(99,102,241,0.18) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(139,92,246,0.12) 0%,transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ticket size={20} color="#fff" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              entrio<span style={{ color: '#818cf8' }}>.</span>
            </div>
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 16 }}>
            Manage events<br />
            that <span style={{ background: 'linear-gradient(90deg,#818cf8,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>sell out.</span>
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 340 }}>
            Create events, set ticket tiers, track bookings — all from one clean dashboard.
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 32 }}>
          {[['3K+', 'Events created'], ['99.9%', 'Uptime'], ['0', 'Oversold tickets']].map(([n, l]) => (
            <div key={l} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{n}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 6 }}>Welcome back</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 36 }}>Sign in to your admin dashboard</div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '11px 14px', fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Email address', type: 'email', value: email, set: setEmail, placeholder: 'admin@entrio.com' },
              { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
            ].map(({ label, type, value, set, placeholder }) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</label>
                <input
                  type={type} value={value} placeholder={placeholder}
                  onChange={e => set(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'Inter,sans-serif', color: '#0f172a', outline: 'none', background: '#fafafa' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
                />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 13, background: loading ? '#9ca3af' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              fontFamily: 'Inter,sans-serif', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em'
            }}>
              {loading ? 'Signing in…' : 'Sign in to Dashboard'}
            </button>
          </form>

          <div style={{ height: 1, background: '#f1f5f9', margin: '28px 0' }} />
          <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
            Demo: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#6366f1' }}>admin@entrio.com</code> / <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#6366f1' }}>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
