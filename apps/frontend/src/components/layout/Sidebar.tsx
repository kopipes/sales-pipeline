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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/deals', label: 'Pipeline / Deals', icon: TrendingUp },
  { to: '/activities', label: 'Aktivitas', icon: Activity },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/contacts', label: 'Contacts', icon: Users },
  { to: '/jobs', label: 'Jobs & P&L', icon: Briefcase },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Provaliant</p>
        <p className="text-lg font-bold leading-tight">Sales OS</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
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
