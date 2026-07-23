import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, ChevronRight, Info } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { createEvent, addTicketType, getMe } from '../../api';
import toast from 'react-hot-toast';

interface TicketType { name: string; price: number; total_qty: number; }

export default function NewEvent() {
  const nav = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ttName, setTtName] = useState('');
  const [ttPrice, setTtPrice] = useState('');
  const [ttQty, setTtQty] = useState('');

  useEffect(() => {
    getMe().then(r => setAdminName(r.data.name)).catch(() => nav('/admin/login'));
  }, []); // eslint-disable-line

  function addTicket() {
    if (!ttName.trim()) { toast.error('Name required'); return; }
    const price = parseFloat(ttPrice);
    const qty = parseInt(ttQty);
    if (isNaN(price) || price < 0) { toast.error('Price must be 0 or more'); return; }
    if (isNaN(qty) || qty < 1) { toast.error('Quantity must be at least 1'); return; }
    setTickets(prev => [...prev, { name: ttName.trim(), price, total_qty: qty }]);
    setTtName(''); setTtPrice(''); setTtQty('');
    toast.success('Ticket type added');
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error('Event name is required'); return; }
    if (!venue.trim()) { toast.error('Venue is required'); return; }
    if (!eventDate) { toast.error('Date & time is required'); return; }
    setSaving(true);
    try {
      const res = await createEvent({ name: name.trim(), description: description.trim(), venue: venue.trim(), event_date: eventDate });
      const eventId = res.data.id;
      for (const tt of tickets) await addTicketType(String(eventId), tt);
      toast.success('Event created!');
      nav(`/admin/events/${eventId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create event');
    } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 14, fontFamily: 'Inter,sans-serif', color: '#0f172a', outline: 'none', background: '#fafafa' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 };

  return (
    <AdminLayout adminName={adminName}>
      <style>{`
        .ne-pad { padding: 24px 28px; }
        .ne-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
        .ne-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ne-tt-row { display: grid; grid-template-columns: 1fr 100px 100px; gap: 10px; }
        @media (max-width: 768px) {
          .ne-pad { padding: 16px; }
          .ne-grid { grid-template-columns: 1fr; }
          .ne-row2 { grid-template-columns: 1fr; gap: 0; }
          .ne-tt-row { grid-template-columns: 1fr 1fr; }
          .ne-tt-qty { grid-column: 1 / -1; }
          .ne-sticky { position: static !important; }
        }
      `}</style>
      <div className="ne-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 18 }}>
          <Link to="/admin" style={{ color: '#94a3b8', textDecoration: 'none' }}>Events</Link>
          <ChevronRight size={13} />
          <span style={{ color: '#475569' }}>New Event</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 22 }}>Create New Event</div>

        <div className="ne-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Details card */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8faff', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Event Details</div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Event Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechConf 2025" style={inp}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell attendees what to expect…"
                    style={{ ...inp, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                </div>
                <div className="ne-row2">
                  <div style={{ marginBottom: 16 }}>
                    <label style={lbl}>Venue *</label>
                    <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. NSCI Dome, Mumbai" style={inp}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                  </div>
                  <div style={{ marginBottom: 0 }}>
                    <label style={lbl}>Date & Time *</label>
                    <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inp}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket types card */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8faff', display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🎫</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ticket Types</div>
              </div>
              <div style={{ padding: 20 }}>
                {tickets.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    {tickets.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8faff', borderRadius: 8, marginBottom: 6, border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>{t.price === 0 ? 'Free' : `₹${t.price}`}</span>
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.total_qty} seats</span>
                          <button onClick={() => setTickets(p => p.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ background: '#f8faff', border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: 14 }}>
                  <div className="ne-tt-row" style={{ marginBottom: 10 }}>
                    <div>
                      <label style={{ ...lbl, fontSize: 10 }}>Type Name</label>
                      <input value={ttName} onChange={e => setTtName(e.target.value)} placeholder="Early Bird" onKeyDown={e => e.key === 'Enter' && addTicket()}
                        style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', background: '#fff' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div>
                      <label style={{ ...lbl, fontSize: 10 }}>Price (₹)</label>
                      <input type="number" value={ttPrice} onChange={e => setTtPrice(e.target.value)} placeholder="999" onKeyDown={e => e.key === 'Enter' && addTicket()}
                        style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', background: '#fff' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div className="ne-tt-qty">
                      <label style={{ ...lbl, fontSize: 10 }}>Quantity</label>
                      <input type="number" value={ttQty} onChange={e => setTtQty(e.target.value)} placeholder="100" onKeyDown={e => e.key === 'Enter' && addTicket()}
                        style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', background: '#fff' }}
                        onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                  </div>
                  <button onClick={addTicket} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1.5px solid #c7d2fe', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer' }}>
                    <Plus size={13} /> Add Ticket Type
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky panel */}
          <div className="ne-sticky" style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 20 }}>
              <button onClick={handleCreate} disabled={saving} style={{ width: '100%', padding: 13, background: saving ? '#9ca3af' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: saving ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
                {saving ? 'Creating…' : 'Create Event →'}
              </button>
              <Link to="/admin" style={{ display: 'block', padding: 11, textAlign: 'center', background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Cancel</Link>
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid #e0e7ff', borderRadius: 12, padding: 14, marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                  <Info size={11} /> After creating
                </div>
                {['Starts as Draft', 'Add ticket types anytime', 'Publish when ready', "Buyers can't book until published"].map(s => (
                  <div key={s} style={{ fontSize: 12, color: '#64748b', marginBottom: 5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#6366f1', fontWeight: 700 }}>✓</span> {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}