import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function AppLayout() {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - hidden on mobile, sticky on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:sticky lg:top-0 lg:h-screen lg:flex-shrink-0 ${
        sidebarOpen ? 'block' : 'hidden lg:block'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'linear-gradient(90deg, #1e3a5f 0%, #1a2e4a 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            aria-label="Buka menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-white">Provaliant Sales OS</span>
        </div>

        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
