import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/auth';
import { Zap } from 'lucide-react';

export default function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardRoute = user?.role === 'recruiter' ? '/recruiter' : user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">InternIQ</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate(dashboardRoute)}
                className="btn-primary text-sm"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
