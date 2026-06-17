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
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      {/* Logo + close button (mobile) */}
      <div className="px-5 py-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Provaliant</p>
          <p className="text-lg font-bold leading-tight">Sales OS</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-700 text-gray-400"
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
              )
            }
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* Global Search */}
      <div className="px-3 pb-3">
        <GlobalSearch />
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            {user?.fullName?.[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role?.name}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
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
