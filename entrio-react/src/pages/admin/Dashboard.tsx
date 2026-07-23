import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, Users, TrendingUp, CheckCircle, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { getAdminEvents, publishEvent, getMe } from '../../api';
import toast from 'react-hot-toast';

interface Event {
  id: number; name: string; venue: string; event_date: string;
  is_published: boolean; booking_count: number; total_capacity: number; total_sold: number;
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filtered, setFiltered] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const nav = useNavigate();

  useEffect(() => {
    getMe().then(r => setAdminName(r.data.name)).catch(() => nav('/admin/login'));
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? events.filter(e => e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)) : events);
  }, [search, events]);

  async function load() {
    try { const r = await getAdminEvents(); setEvents(r.data); }
    catch { toast.error('Failed to load events'); }
  }

  async function toggle(id: number, state: boolean) {
    try {
      await publishEvent(String(id), state);
      toast.success(state ? 'Event published!' : 'Event unpublished');
      load();
    } catch { toast.error('Failed to update'); }
  }

  const stats = {
    total: events.length,
    published: events.filter(e => e.is_published).length,
    bookings: events.reduce((s, e) => s + Number(e.booking_count || 0), 0),
    sold: events.reduce((s, e) => s + Number(e.total_sold || 0), 0),
  };

  return (
    <AdminLayout adminName={adminName}>
      <div style={{ padding: '32px 36px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Events</div>
            <div style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Manage events and track ticket sales</div>
          </div>
          <Link to="/admin/events/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
            padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            textDecoration: 'none', letterSpacing: '-0.01em'
          }}>
            <Plus size={16} /> New Event
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Events', value: stats.total, icon: Calendar, color: '#6366f1' },
            { label: 'Published', value: stats.published, icon: CheckCircle, color: '#10b981' },
            { label: 'Total Bookings', value: stats.bookings, icon: Users, color: '#f59e0b' },
            { label: 'Tickets Sold', value: stats.sold, icon: TrendingUp, color: '#8b5cf6' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '20px 22px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ width: 32, height: 32, background: color + '18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={color} />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>All Events</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8faff', border: '1.5px solid #e2e8f0', borderRadius: 9, padding: '8px 14px' }}>
              <Search size={14} color="#94a3b8" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events…"
                style={{ border: 'none', background: 'none', fontSize: 13, fontFamily: 'Inter,sans-serif', color: '#0f172a', outline: 'none', width: 180 }} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8faff' }}>
                {['Event', 'Date', 'Bookings', 'Inventory', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 64, color: '#94a3b8', fontSize: 14 }}>
                  {search ? 'No events match your search.' : 'No events yet.'} {!search && <Link to="/admin/events/new" style={{ color: '#6366f1' }}>Create one →</Link>}
                </td></tr>
              ) : filtered.map(e => {
                const sold = Number(e.total_sold || 0), cap = Number(e.total_capacity || 0);
                const pct = cap > 0 ? Math.round(sold / cap * 100) : 0;
                return (
                  <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{e.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>📍 {e.venue}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(e.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{e.booking_count || 0}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{sold} / {cap}</div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, width: 110, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: pct >= 80 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{pct}% sold</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                        borderRadius: 999, fontSize: 12, fontWeight: 700,
                        background: e.is_published ? '#dcfce7' : '#f1f5f9',
                        color: e.is_published ? '#15803d' : '#64748b'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.7 }} />
                        {e.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Link to={`/admin/events/${e.id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                          background: '#f1f5f9', color: '#475569', textDecoration: 'none'
                        }}>
                          <Eye size={12} /> View
                        </Link>
                        <button onClick={() => toggle(e.id, !e.is_published)} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700,
                          border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                          background: e.is_published ? '#fef2f2' : '#dcfce7',
                          color: e.is_published ? '#dc2626' : '#15803d'
                        }}>
                          {e.is_published ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {e.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
