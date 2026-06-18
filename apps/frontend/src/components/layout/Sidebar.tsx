import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Activity,
  Building2,
  Users,
  Briefcase,
  ChevronRight,
  LogOut,
  Settings,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';
import GlobalSearch from '../ui/GlobalSearch';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, adminOnly: false },
  { to: '/deals', label: 'Pipeline / Deals', icon: TrendingUp, adminOnly: false },
  { to: '/activities', label: 'Aktivitas', icon: Activity, adminOnly: false },
  { to: '/companies', label: 'Companies', icon: Building2, adminOnly: false },
  { to: '/contacts', label: 'Contacts', icon: Users, adminOnly: false },
  { to: '/jobs', label: 'Jobs & P&L', icon: Briefcase, adminOnly: false },
  { to: '/admin', label: 'Administrasi', icon: Settings, adminOnly: true },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside
      className="flex flex-col w-64 min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #1e3a5f 0%, #1a2e4a 50%, #162440 100%)',
        color: 'white',
      }}
    >
      {/* Logo + close button (mobile) */}
      <div
        className="px-5 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#93c5fd' }}>Provaliant</p>
          <p className="text-lg font-bold leading-tight text-white">Sales OS</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            aria-label="Tutup sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.filter(({ adminOnly }) => !adminOnly || isAdmin).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'hover:bg-white/10 text-blue-100',
              )
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-30" />
          </NavLink>
        ))}
      </nav>

      {/* Global Search */}
      <div className="px-3 pb-3">
        <GlobalSearch />
      </div>

      {/* User footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: '#3b82f6' }}
          >
            {user?.fullName?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs truncate" style={{ color: '#93c5fd' }}>{user?.role?.name}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
