import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, Plus, LogOut, Ticket } from 'lucide-react';
import { logout } from '../api';
import toast from 'react-hot-toast';

interface Props {
  children: React.ReactNode;
  adminName?: string;
}

export default function AdminLayout({ children, adminName = 'Admin' }: Props) {
  const loc = useLocation();
  const nav = useNavigate();

  async function doLogout() {
    await logout().catch(() => {});
    toast.success('Signed out');
    nav('/admin/login');
  }

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Events', exact: true },
    { to: '/', icon: Globe, label: 'Public Storefront', external: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', background: '#f8faff' }}>
      {/* Sidebar */}
      <aside style={{
        background: '#0f172a', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Ticket size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                entrio<span style={{ color: '#818cf8' }}>.</span>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.08em',
                background: 'rgba(99,102,241,0.2)', padding: '1px 7px', borderRadius: 4, display: 'inline-block', marginTop: 2
              }}>ADMIN</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '6px 8px 8px' }}>Main</div>
          {links.map(({ to, icon: Icon, label, exact, external }) => {
            const active = exact ? loc.pathname === to : loc.pathname.startsWith(to);
            return (
              <Link key={to} to={to} target={external ? '_blank' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                  borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.15s',
                  background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: active ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
                }}>
                <Icon size={16} />
                {label}
                {external && <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 'auto' }}>↗</span>}
              </Link>
            );
          })}

          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 8px 8px' }}>Quick Actions</div>
          <Link to="/admin/events/new" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
            borderRadius: 8, marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: 500,
            background: loc.pathname === '/admin/events/new' ? 'rgba(99,102,241,0.2)' : 'transparent',
            color: loc.pathname === '/admin/events/new' ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
            transition: 'all 0.15s',
          }}>
            <Plus size={16} /> New Event
          </Link>
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10 }}>
            <div style={{
              width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {adminName[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Administrator</div>
            </div>
            <button onClick={doLogout} title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
