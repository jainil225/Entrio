import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Plus, ExternalLink, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminEvent, publishEvent, addTicketType, getEventBookings, getMe } from '../../api';
import toast from 'react-hot-toast';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [adminName, setAdminName] = useState('Admin');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [ttName, setTtName] = useState('');
  const [ttPrice, setTtPrice] = useState('');
  const [ttQty, setTtQty] = useState('');
  const [savingTT, setSavingTT] = useState(false);

  useEffect(() => {
    getMe().then(r => setAdminName(r.data.name)).catch(() => nav('/admin/login'));
    load();
    loadBookings();
  }, [id]);

  async function load() {
    try { const r = await getAdminEvent(id!); setEvent(r.data); }
    catch { toast.error('Failed to load event'); }
  }

  async function loadBookings() {
    try { const r = await getEventBookings(id!); setBookings(r.data); }
    catch { }
  }

  async function togglePublish() {
    try {
      await publishEvent(id!, !event.is_published);
      toast.success(event.is_published ? 'Event unpublished' : 'Event published!');
      load();
    } catch { toast.error('Failed to update'); }
  }

  async function saveTT() {
    if (!ttName.trim()) { toast.error('Name required'); return; }
    const price = parseFloat(ttPrice);
    const qty = parseInt(ttQty);
    if (isNaN(price) || price < 0) { toast.error('Invalid price'); return; }
    if (isNaN(qty) || qty < 1) { toast.error('Invalid quantity'); return; }
    setSavingTT(true);
    try {
      await addTicketType(id!, { name: ttName.trim(), price, total_qty: qty });
      toast.success('Ticket type added!');
      setShowModal(false); setTtName(''); setTtPrice(''); setTtQty('');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setSavingTT(false); }
  }

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const confirmed = bookings.filter(b => b.status === 'confirmed');
  const revenue = confirmed.reduce((s: number, b: any) => s + parseFloat(b.total_amount || 0), 0);
  const tts = event?.ticket_types || [];
  const totalSold = tts.reduce((s: number, t: any) => s + t.sold_qty, 0);
  const totalCap = tts.reduce((s: number, t: any) => s + t.total_qty, 0);

  if (!event) return <AdminLayout adminName={adminName}><div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Loading…</div></AdminLayout>;

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'Inter,sans-serif', color: '#0f172a', outline: 'none' };

  return (
    <AdminLayout adminName={adminName}>
      <div style={{ padding: '32px 36px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          <Link to="/admin" style={{ color: '#94a3b8', textDecoration: 'none' }}>Events</Link>
          <ChevronRight size={14} />
          <span style={{ color: '#475569' }}>{event.name}</span>
        </div>

        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)', fontSize: 80, opacity: 0.08 }}>🎟</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, position: 'relative' }}>
            <div>
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, letterSpacing: '0.04em',
                  background: event.is_published ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                  color: event.is_published ? '#6ee7b7' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${event.is_published ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)'}`,
                }}>
                  {event.is_published ? '● Published' : '○ Draft'}
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 10 }}>{event.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>📅 {new Date(event.event_date).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>📍 {event.venue}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <a href={`/events/${event.id}`} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                <ExternalLink size={13} /> Public Page
              </a>
              <button onClick={togglePublish} style={{
                padding: '9px 18px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer',
                background: event.is_published ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff'
              }}>
                {event.is_published ? 'Unpublish' : 'Publish Event'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Confirmed Bookings', value: confirmed.length },
            { label: 'Tickets Sold', value: totalSold },
            { label: 'Remaining', value: totalCap - totalSold },
            { label: 'Revenue', value: revenue > 0 ? `₹${Math.round(revenue).toLocaleString('en-IN')}` : '₹0' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Ticket types + description */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8faff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ticket Types & Inventory</div>
              <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
                <Plus size={12} /> Add Type
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {tts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>No ticket types yet. Add one →</div>
              ) : tts.map((tt: any) => {
                const rem = tt.total_qty - tt.sold_qty;
                const pct = tt.total_qty > 0 ? Math.round(tt.sold_qty / tt.total_qty * 100) : 0;
                return (
                  <div key={tt.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid #f8faff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{tt.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{parseFloat(tt.price) === 0 ? 'Free' : `₹${parseFloat(tt.price).toFixed(0)}`}</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 5 }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct >= 80 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#94a3b8' }}>{tt.sold_qty} sold of {tt.total_qty}</span>
                      <span style={{ fontWeight: 700, color: rem === 0 ? '#ef4444' : rem <= 5 ? '#f59e0b' : '#10b981' }}>{rem === 0 ? 'Sold out' : `${rem} remaining`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8faff', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Description</div>
            <div style={{ padding: 20, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
              {event.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description added</span>}
            </div>
          </div>
        </div>

        {/* Bookings table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Bookings</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 4, background: '#f8faff', borderRadius: 8, padding: 3 }}>
                {['all', 'confirmed', 'pending', 'failed'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, border: 'none',
                    fontFamily: 'Inter,sans-serif', cursor: 'pointer', transition: 'all 0.15s',
                    background: filter === f ? '#fff' : 'transparent',
                    color: filter === f ? '#0f172a' : '#64748b',
                    boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    textTransform: 'capitalize',
                  }}>{f}</button>
                ))}
              </div>
              <button onClick={loadBookings} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8faff' }}>
                {['Reference', 'Buyer', 'Ticket Type', 'Qty', 'Amount', 'Status', 'Booked At'].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '11px 20px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>No {filter === 'all' ? '' : filter} bookings yet.</td></tr>
              ) : filteredBookings.map((b: any) => (
                <tr key={b.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <code style={{ fontSize: 12, background: '#f1f5f9', padding: '3px 7px', borderRadius: 5, color: '#475569', letterSpacing: '0.02em' }}>{b.reference}</code>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{b.buyer_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.buyer_email}</div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#475569' }}>{b.ticket_type_name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{b.quantity}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700 }}>₹{parseFloat(b.total_amount).toFixed(0)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                      borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: b.status === 'confirmed' ? '#dcfce7' : b.status === 'pending' ? '#fef9c3' : '#fee2e2',
                      color: b.status === 'confirmed' ? '#15803d' : b.status === 'pending' ? '#a16207' : '#dc2626',
                    }}>
                      {b.status === 'confirmed' ? <CheckCircle size={10} /> : b.status === 'pending' ? <Clock size={10} /> : <XCircle size={10} />}
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(b.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Ticket Type Modal */}
      {showModal && (
        <div onClick={e => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 460, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', marginBottom: 20 }}>Add Ticket Type</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Type Name *</label>
              <input value={ttName} onChange={e => setTtName(e.target.value)} placeholder="e.g. General Admission" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Price (₹)', val: ttPrice, set: setTtPrice, ph: '1499' },
                { label: 'Total Seats', val: ttQty, set: setTtQty, ph: '100' },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                  <input type="number" value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveTT} disabled={savingTT} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
                {savingTT ? 'Adding…' : 'Add Ticket Type'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
