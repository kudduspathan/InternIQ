import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services';
import { Users, Building2, FileText, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
    refetchInterval: 60000,
  });

  const statCards = [
    { label: 'Total Users',        value: stats?.totalUsers ?? 0,        icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Students',           value: stats?.students ?? 0,          icon: Users,        color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Recruiters',         value: stats?.recruiters ?? 0,        icon: Building2,    color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Listings',    value: stats?.activeListings ?? 0,    icon: FileText,     color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Total Applications', value: stats?.totalApplications ?? 0, icon: TrendingUp,   color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Verified Companies', value: stats?.verifiedCompanies ?? 0, icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-50' },
  ];

  const quickActions = [
    { label: 'Company Verifications', desc: 'Review pending companies', to: '/admin/companies', icon: Building2, urgent: true },
    { label: 'Listing Moderation', desc: 'Review flagged listings', to: '/admin/listings', icon: FileText, urgent: false },
    { label: 'User Management', desc: 'Suspend or ban accounts', to: '/admin/users', icon: Users, urgent: false },
    { label: 'Audit Logs', desc: 'All admin actions', to: '/admin/logs', icon: Clock, urgent: false },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">Platform overview and moderation tools</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            {isLoading ? (
              <div className="h-7 w-16 bg-gray-700 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-2xl font-black text-white mb-0.5">{value.toLocaleString()}</div>
            )}
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {quickActions.map(({ label, desc, to, icon: Icon, urgent }) => (
            <Link
              key={to}
              to={to}
              className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${urgent ? 'bg-yellow-500/20' : 'bg-gray-700'}`}>
                  <Icon className={`w-5 h-5 ${urgent ? 'text-yellow-400' : 'text-gray-300'}`} />
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-accent-500 transition-colors">{label}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
