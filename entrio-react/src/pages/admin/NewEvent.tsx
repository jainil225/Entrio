import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Info, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { createEvent, addTicketType, getMe } from '../../api';
import toast from 'react-hot-toast';

interface TicketType { name: string; price: number; total_qty: number; }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
  borderRadius: 9, fontSize: 14, fontFamily: 'Inter,sans-serif',
  color: '#0f172a', outline: 'none', background: '#fafafa', transition: 'border 0.15s'
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 7 }}>{label}</label>
      {children}
    </div>
  );
}

export default function NewEvent() {
  const nav = useNavigate();
  const [adminName, setAdminName] = useState('Admin');
  const [saving, setSaving] = useState(false);

  // Event fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');

  // Ticket types
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ttName, setTtName] = useState('');
  const [ttPrice, setTtPrice] = useState('');
  const [ttQty, setTtQty] = useState('');

  useEffect(() => {
    getMe().then(r => setAdminName(r.data.name)).catch(() => nav('/admin/login'));
  }, []);

  function addTicket() {
    if (!ttName.trim()) { toast.error('Ticket type name is required'); return; }
    const price = parseFloat(ttPrice);
    const qty = parseInt(ttQty);
    if (isNaN(price) || price < 0) { toast.error('Price must be 0 or more'); return; }
    if (isNaN(qty) || qty < 1) { toast.error('Quantity must be at least 1'); return; }
    setTickets(prev => [...prev, { name: ttName.trim(), price, total_qty: qty }]);
    setTtName(''); setTtPrice(''); setTtQty('');
    toast.success('Ticket type added');
  }

  function removeTicket(i: number) {
    setTickets(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!name.trim()) { toast.error('Event name is required'); return; }
    if (!venue.trim()) { toast.error('Venue is required'); return; }
    if (!eventDate) { toast.error('Date & time is required'); return; }

    setSaving(true);
    try {
      const res = await createEvent({ name: name.trim(), description: description.trim(), venue: venue.trim(), event_date: eventDate });
      const eventId = res.data.id;

      // Add ticket types one by one
      for (const tt of tickets) {
        await addTicketType(String(eventId), tt);
      }

      toast.success('Event created!');
      nav(`/admin/events/${eventId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout adminName={adminName}>
      <div style={{ padding: '32px 36px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          <a href="/admin" style={{ color: '#94a3b8', textDecoration: 'none' }}>Events</a>
          <ChevronRight size={14} />
          <span style={{ color: '#475569' }}>New Event</span>
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 28 }}>Create New Event</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Event details card */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f8faff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📋</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Event Details</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Basic information about the event</div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                <Field label="Event Name *">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. TechConf 2025 — Annual Developer Summit" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                </Field>
                <Field label="Description">
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell attendees what to expect…"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.5 }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Venue *">
                    <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. NSCI Dome, Mumbai" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                  </Field>
                  <Field label="Date & Time *">
                    <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#fafafa'; }} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Ticket types card */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f8faff', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎫</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ticket Types</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Add one or more pricing tiers</div>
                </div>
              </div>
              <div style={{ padding: 24 }}>
                {/* Existing tickets */}
                {tickets.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 36px', gap: 8, padding: '6px 12px', borderBottom: '2px solid #e2e8f0', marginBottom: 6 }}>
                      {['Name', 'Price', 'Qty', ''].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>)}
                    </div>
                    {tickets.map((t, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 36px', gap: 8, alignItems: 'center', padding: '10px 12px', background: '#f8faff', borderRadius: 8, marginBottom: 6, border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{t.name}</span>
                        <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600 }}>{t.price === 0 ? 'Free' : `₹${t.price}`}</span>
                        <span style={{ fontSize: 13, color: '#64748b' }}>{t.total_qty} seats</span>
                        <button onClick={() => removeTicket(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new ticket row */}
                <div style={{ background: '#f8faff', border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 12, marginBottom: 12 }}>
                    {[
                      { label: 'Type Name', val: ttName, set: setTtName, ph: 'e.g. Early Bird', type: 'text' },
                      { label: 'Price (₹)', val: ttPrice, set: setTtPrice, ph: '999', type: 'number' },
                      { label: 'Quantity', val: ttQty, set: setTtQty, ph: '100', type: 'number' },
                    ].map(({ label, val, set, ph, type }) => (
                      <div key={label}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</label>
                        <input type={type} value={val} placeholder={ph} onChange={e => set(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addTicket()}
                          style={{ width: '100%', padding: '9px 11px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13, fontFamily: 'Inter,sans-serif', outline: 'none', background: '#fff' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                      </div>
                    ))}
                  </div>
                  <button onClick={addTicket} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                    background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                    border: '1.5px solid #c7d2fe', borderRadius: 8,
                    fontSize: 13, fontWeight: 700, fontFamily: 'Inter,sans-serif', cursor: 'pointer'
                  }}>
                    <Plus size={14} /> Add Ticket Type
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sticky panel */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: 24 }}>
                <button onClick={handleCreate} disabled={saving} style={{
                  width: '100%', padding: 14, background: saving ? '#9ca3af' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  fontFamily: 'Inter,sans-serif', cursor: saving ? 'not-allowed' : 'pointer',
                  marginBottom: 10, letterSpacing: '-0.01em'
                }}>
                  {saving ? 'Creating…' : 'Create Event →'}
                </button>
                <a href="/admin" style={{
                  display: 'block', padding: 11, textAlign: 'center', background: '#fff',
                  color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none'
                }}>Cancel</a>

                <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid #e0e7ff', borderRadius: 12, padding: 16, marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    <Info size={12} /> After creating
                  </div>
                  {['Event starts as a Draft', 'Add more ticket types anytime', 'Publish when ready to go live', "Buyers can't book until published"].map(s => (
                    <div key={s} style={{ fontSize: 12, color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: '#6366f1', fontWeight: 700, marginTop: 1 }}>✓</span> {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
