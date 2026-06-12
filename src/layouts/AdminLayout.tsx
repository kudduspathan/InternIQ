import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/auth';
import { LayoutDashboard, Users, Building2, FileText, ScrollText, LogOut, Shield } from 'lucide-react';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/companies', icon: Building2, label: 'Companies' },
  { to: '/admin/listings', icon: FileText, label: 'Listings' },
  { to: '/admin/logs', icon: ScrollText, label: 'Audit Logs' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white fixed h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent-500" />
            <div>
              <span className="font-bold text-sm">InternIQ</span>
              <span className="block text-xs text-gray-400 -mt-0.5">Admin Console</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-gray-900 text-sm font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
