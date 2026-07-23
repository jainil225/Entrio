import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Search, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { getPublicEvents } from '../../api';

export default function Home() {
  const [events, setEvents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicEvents()
      .then(r => { setEvents(r.data); setFiltered(r.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? events.filter(e =>
      e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
    ) : events);
  }, [search, events]);

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ background: '#07070d', minHeight: '100vh', color: '#fff', fontFamily: 'Inter,sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,7,13,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 40px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ticket size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.4px' }}>
            entrio<span style={{ color: '#6366f1' }}>.</span>
          </span>
        </div>
        <Link to="/admin/login" style={{
          fontSize: 12, fontWeight: 700, padding: '7px 14px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 8, color: 'rgba(255,255,255,0.6)', textDecoration: 'none',
          transition: 'all 0.15s',
        }}>Admin →</Link>
      </nav>

      {/* ── HERO ── */}
      <div style={{ padding: '72px 40px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse,rgba(99,102,241,0.22) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '20%', width: 300, height: 300, background: 'radial-gradient(ellipse,rgba(139,92,246,0.1) 0%,transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Live badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', color: '#a5b4fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 999, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            Live ticketing platform
          </div>

          <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 18, color: '#fff' }}>
            Events worth<br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8 0%,#c4b5fd 55%,#f0abfc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              showing up for.
            </span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.42)', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Discover, book, and experience moments that matter.
          </p>

          {/* Search */}
          <div style={{
            display: 'flex', maxWidth: 460, margin: '0 auto',
            background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.09)',
            borderRadius: 14, overflow: 'hidden', transition: 'border 0.2s',
          }}
            onFocus={() => {}} // handled by input
          >
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
              <Search size={15} color="rgba(255,255,255,0.28)" />
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search events or venues…"
              style={{ flex: 1, background: 'none', border: 'none', padding: '14px 12px', fontSize: 14, color: '#fff', fontFamily: 'Inter,sans-serif', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ padding: '0 14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 18 }}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* ── EVENTS GRID ── */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 40px 80px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Upcoming Events</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''} available</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 260, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>No events found</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>{search ? 'Try a different search' : 'Check back soon!'}</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 20 }}>
            {filtered.map((e: any) => {
              const rem = parseInt(e.total_remaining);
              const soldOut = rem <= 0;
              const lowStock = !soldOut && rem <= 5;
              const price = e.min_price === null ? 'Free' : parseFloat(e.min_price) === 0 ? 'Free' : `₹${parseFloat(e.min_price).toFixed(0)}`;

              return (
                <Link key={e.id} to={`/events/${e.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div
                    style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', transition: 'transform 0.2s,border-color 0.2s,box-shadow 0.2s', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.35)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(99,102,241,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = '';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '';
                    }}
                  >
                    {/* Color stripe */}
                    <div style={{ height: 3, background: soldOut ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)', flexShrink: 0 }} />

                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {/* Top row: date + availability */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} color="#6366f1" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{fmtDate(e.event_date)}</span>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                          background: soldOut ? 'rgba(239,68,68,0.12)' : lowStock ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                          color: soldOut ? '#f87171' : lowStock ? '#fbbf24' : '#34d399',
                          border: `1px solid ${soldOut ? 'rgba(239,68,68,0.2)' : lowStock ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.2)'}`,
                        }}>
                          {soldOut ? '✗ Sold Out' : lowStock ? `⚡ ${rem} left` : '✓ Available'}
                        </span>
                      </div>

                      {/* Event name */}
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.3, marginBottom: 8 }}>{e.name}</h3>

                      {/* Venue */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                        <MapPin size={12} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.3 }}>{e.venue}</span>
                      </div>

                      {/* Time */}
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
                        🕐 {fmtTime(e.event_date)}
                      </div>

                      {/* Description */}
                      {e.description && (
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', lineHeight: 1.55, marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                          {e.description}
                        </p>
                      )}

                      {/* Spacer */}
                      {!e.description && <div style={{ flex: 1 }} />}

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Starting from</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>{price}</div>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                          background: soldOut ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          color: soldOut ? 'rgba(255,255,255,0.25)' : '#fff',
                        }}>
                          {soldOut ? 'Sold Out' : <><span>Book Now</span><ArrowRight size={13} /></>}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '-0.3px' }}>
          entrio<span style={{ color: '#6366f1' }}>.</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>© 2025 Entrio · Zero overselling, guaranteed.</div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.28); }
      `}</style>
    </div>
  );
}