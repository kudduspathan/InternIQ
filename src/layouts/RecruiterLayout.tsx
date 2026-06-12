import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/auth';
import { LayoutDashboard, Building2, Plus, FileText, Users, LogOut, Zap } from 'lucide-react';

const NAV = [
  { to: '/recruiter', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recruiter/company', icon: Building2, label: 'Company' },
  { to: '/recruiter/post', icon: Plus, label: 'Post Internship' },
  { to: '/recruiter/listings', icon: FileText, label: 'My Listings' },
  { to: '/recruiter/applicants', icon: Users, label: 'Applicants' },
];

export default function RecruiterLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed h-full z-40">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm">InternIQ</span>
              <span className="block text-xs text-gray-400 -mt-0.5">Recruiter</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/recruiter'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500">Recruiter</p>
            </div>
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="flex items-center gap-3 px-3 py-2 w-full text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 overflow-y-auto pb-20 md:pb-0">
        <Outlet />
      </main>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/recruiter'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`
              }
            >
              <Icon className="w-5 h-5" />
              {label.split(' ')[0]}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
