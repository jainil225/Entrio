import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Ticket, Minus, Plus, Lock, ArrowLeft, CheckCircle, MapPin, Clock, Calendar } from 'lucide-react';
import { getPublicEvent, createBooking } from '../../api';
import toast from 'react-hot-toast';

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTT, setSelectedTT] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState<any>(null);

  useEffect(() => { loadEvent(); }, [id]);

  async function loadEvent() {
    try { const r = await getPublicEvent(id!); setEvent(r.data); }
    catch { toast.error('Event not found'); }
    finally { setLoading(false); }
  }

  async function handlePay() {
    if (!name.trim()) { toast.error('Please enter your name'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email'); return; }
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    if (!selectedTT) { toast.error('Please select a ticket type'); return; }
    setPaying(true);
    try {
      const r = await createBooking({ ticket_type_id: selectedTT, quantity: qty, buyer_name: name.trim(), buyer_email: email.trim(), buyer_phone: phone.trim() });
      setConfirmed(r.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.');
      if (err.response?.status === 409) loadEvent();
    } finally { setPaying(false); }
  }

  const tt = event?.ticket_types?.find((t: any) => t.id === selectedTT);
  const price = tt ? parseFloat(tt.price) : 0;
  const total = price * qty;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)',
    borderRadius: 10, fontSize: 14, fontFamily: 'Inter,sans-serif', color: '#fff', outline: 'none',
  };

  // ── CONFIRMATION ──
  if (confirmed) {
    const bookedTT = event?.ticket_types?.find((t: any) => t.id === selectedTT);
    return (
      <div style={{ background: '#07070d', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter,sans-serif', color: '#fff' }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {/* Success icon */}
          <div style={{ width: 72, height: 72, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={34} color="#10b981" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>You're in! 🎉</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Your booking is confirmed</p>

          {/* Reference */}
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: '12px 20px', marginBottom: 28, display: 'inline-block' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(99,102,241,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Booking Reference</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#a5b4fc', letterSpacing: '0.12em', fontFamily: 'monospace' }}>{confirmed.reference}</div>
          </div>

          {/* Details */}
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, textAlign: 'left' }}>
            {[
              ['Event', event?.name],
              ['Ticket', `${bookedTT?.name} × ${qty}`],
              ['Venue', event?.venue],
              ['Date', new Date(event?.event_date).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
              ['Buyer', name],
              ['Amount', total === 0 ? 'Free' : `₹${total.toLocaleString('en-IN')}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 13, marginBottom: 10, gap: 16 }}>
                <span style={{ color: 'rgba(255,255,255,0.38)', flexShrink: 0 }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#fff', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            <ArrowLeft size={14} /> Browse more events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh', color: '#fff', fontFamily: 'Inter,sans-serif' }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,7,13,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.4px' }}>entrio<span style={{ color: '#6366f1' }}>.</span></span>
        </div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> All Events
        </Link>
      </nav>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
      ) : !event ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.3)' }}>Event not found.</div>
      ) : (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

            {/* ── LEFT: EVENT INFO ── */}
            <div>
              {/* Badge */}
              <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', padding: '4px 12px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
                Live Event
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 20, color: '#fff' }}>{event.name}</h1>

              {/* Meta chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={14} color="#818cf8" />
                  </div>
                  {new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={14} color="#818cf8" />
                  </div>
                  {new Date(event.event_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ width: 32, height: 32, background: 'rgba(99,102,241,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={14} color="#818cf8" />
                  </div>
                  {event.venue}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 22, marginBottom: 32 }}>
                  {event.description}
                </div>
              )}

              {/* ── TICKET TYPES ── */}
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginBottom: 14 }}>Select Tickets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {event.ticket_types.map((t: any) => {
                  const rem = parseInt(t.remaining);
                  const sold = rem <= 0;
                  const low = !sold && rem <= 5;
                  const sel = selectedTT === t.id;
                  return (
                    <div key={t.id} onClick={() => !sold && setSelectedTT(t.id)}
                      style={{
                        border: `2px solid ${sel ? '#6366f1' : sold ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 14, padding: '16px 20px', cursor: sold ? 'not-allowed' : 'pointer',
                        opacity: sold ? 0.4 : 1,
                        background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.025)',
                        transition: 'all 0.18s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{t.name}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: sold ? '#f87171' : low ? '#fbbf24' : '#34d399' }}>
                            {sold ? '✗ Sold out — no longer available' : low ? `⚡ Only ${rem} tickets left` : `✓ ${rem} available`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: sel ? '#a5b4fc' : '#fff', letterSpacing: '-0.5px' }}>{parseFloat(t.price) === 0 ? 'Free' : `₹${parseFloat(t.price).toFixed(0)}`}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>per ticket</div>
                        </div>
                        {/* Radio dot */}
                        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? '#6366f1' : 'rgba(255,255,255,0.18)'}`, background: sel ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}>
                          {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: BOOKING PANEL ── */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden' }}>
                {/* Panel header */}
                <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.18))', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '18px 22px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Book Tickets</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Lock size={10} /> Secure · Instant confirmation
                  </div>
                </div>

                <div style={{ padding: 22 }}>
                  {/* Fields */}
                  {([
                    { label: 'Full Name *', type: 'text', val: name, set: setName, ph: 'Ravi Kumar' },
                    { label: 'Email Address *', type: 'email', val: email, set: setEmail, ph: 'ravi@example.com' },
                    { label: 'Phone Number *', type: 'tel', val: phone, set: setPhone, ph: '+91 98765 43210' },
                  ] as any[]).map(({ label, type, val, set, ph }) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</label>
                      <input type={type} value={val} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value)} placeholder={ph} style={inputStyle}
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.background = 'rgba(99,102,241,0.06)'; }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                      />
                    </div>
                  ))}

                  {/* Quantity */}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Quantity</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)', borderRadius: 10, overflow: 'hidden' }}>
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 42, height: 42, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                        <Minus size={14} />
                      </button>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>{qty}</span>
                      <button onClick={() => setQty(q => Math.min(10, q + 1))} style={{ width: 42, height: 42, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Order summary */}
                  {selectedTT && (
                    <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(99,102,241,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Order Summary</div>
                      {[
                        ['Ticket', tt?.name],
                        ['Quantity', String(qty)],
                        ['Unit price', price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                          <span>{l}</span><span>{v}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#fff', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 6 }}>
                        <span>Total</span>
                        <span style={{ color: '#a5b4fc' }}>{total === 0 ? 'Free' : `₹${total.toLocaleString('en-IN')}`}</span>
                      </div>
                    </div>
                  )}

                  {/* Pay button */}
                  <button onClick={handlePay} disabled={paying || !selectedTT}
                    style={{
                      width: '100%', padding: '14px 0', fontSize: 15, fontWeight: 800,
                      fontFamily: 'Inter,sans-serif', borderRadius: 12, border: 'none', cursor: paying || !selectedTT ? 'not-allowed' : 'pointer', letterSpacing: '-0.02em', transition: 'opacity 0.15s',
                      background: paying || !selectedTT ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: paying || !selectedTT ? 'rgba(255,255,255,0.25)' : '#fff',
                    }}>
                    {paying ? '⏳ Processing…' : !selectedTT ? 'Select a ticket type above' : total === 0 ? 'Confirm Free Booking →' : `Pay ₹${total.toLocaleString('en-IN')} →`}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      <style>{`* { box-sizing: border-box; } input::placeholder { color: rgba(255,255,255,0.25); }`}</style>
    </div>
  );
}