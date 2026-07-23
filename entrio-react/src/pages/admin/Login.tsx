import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { login } from '../../api';
import toast from 'react-hot-toast';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@entrio.com');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070d', display: 'flex', flexDirection: 'column', fontFamily: 'Inter,sans-serif' }}>
      <style>{`
        * { box-sizing: border-box; }
        .login-wrap { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
        .login-left { display: flex; flex-direction: column; justify-content: space-between; padding: 48px; position: relative; overflow: hidden; background: linear-gradient(145deg,#1a1035,#0f0a24,#0c1a3a); }
        .login-right { display: flex; align-items: center; justify-content: center; padding: 48px; background: #fff; }
        @media (max-width: 768px) {
          .login-wrap { grid-template-columns: 1fr; min-height: 100vh; }
          .login-left { display: none; }
          .login-right { padding: 24px 20px; align-items: flex-start; padding-top: 48px; background: #07070d; }
          .login-box { background: transparent !important; }
          .login-field input { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.12) !important; color: #fff !important; }
          .login-field input:focus { border-color: #6366f1 !important; background: rgba(99,102,241,0.08) !important; }
          .login-field input::placeholder { color: rgba(255,255,255,0.3) !important; }
          .login-label { color: rgba(255,255,255,0.5) !important; }
          .login-title { color: #fff !important; }
          .login-sub { color: rgba(255,255,255,0.4) !important; }
          .login-divider { background: rgba(255,255,255,0.08) !important; }
          .login-hint { color: rgba(255,255,255,0.3) !important; }
          .login-hint code { background: rgba(255,255,255,0.08) !important; color: #818cf8 !important; }
          .mobile-brand { display: flex !important; }
          .pw-toggle { color: rgba(255,255,255,0.4) !important; }
        }
      `}</style>

      <div className="login-wrap">
        {/* Left panel - desktop only */}
        <div className="login-left">
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
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="login-right">
          <div className="login-box" style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16 }}>
            {/* Mobile brand */}
            <div className="mobile-brand" style={{ display: 'none', alignItems: 'center', gap: 8, marginBottom: 36 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ticket size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px' }}>entrio<span style={{ color: '#6366f1' }}>.</span></span>
            </div>

            <div className="login-title" style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 4 }}>Welcome back</div>
            <div className="login-sub" style={{ fontSize: 14, color: '#64748b', marginBottom: 28 }}>Sign in to your admin dashboard</div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '11px 14px', fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field" style={{ marginBottom: 18 }}>
                <label className="login-label" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>Email address</label>
                <input type="email" value={email} placeholder="admin@entrio.com" onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'Inter,sans-serif', color: '#0f172a', outline: 'none', background: '#fafafa' }} />
              </div>
              <div className="login-field" style={{ marginBottom: 24, position: 'relative' }}>
                <label className="login-label" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={password} placeholder="••••••••" onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px 44px 12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'Inter,sans-serif', color: '#0f172a', outline: 'none', background: '#fafafa' }} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 13, background: loading ? '#9ca3af' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                fontFamily: 'Inter,sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <div className="login-divider" style={{ height: 1, background: '#f1f5f9', margin: '24px 0' }} />
            <div className="login-hint" style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
              Demo: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#6366f1' }}>admin@entrio.com</code> / <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11, color: '#6366f1' }}>admin123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}