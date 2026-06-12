import { useAuth } from '@/integrations/auth';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '@/services';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, XCircle, Trophy, ArrowUpRight } from 'lucide-react';
import type { ApplicationStatus } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  applied:     { label: 'Applied',     cls: 'bg-blue-50 text-blue-700 border-blue-200',   icon: <Clock className="w-3 h-3" /> },
  shortlisted: { label: 'Shortlisted', cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:    { label: 'Rejected',    cls: 'bg-red-50 text-red-700 border-red-200',       icon: <XCircle className="w-3 h-3" /> },
  hired:       { label: 'Hired 🎉',    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Trophy className="w-3 h-3" /> },
  withdrawn:   { label: 'Withdrawn',   cls: 'bg-gray-50 text-gray-500 border-gray-200',   icon: null },
};

export default function ApplicationsPage() {
  const { user } = useAuth();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', user?.id],
    queryFn: () => applicationService.getByStudent(user!.id),
    enabled: !!user,
  });

  const stats = {
    total: applications.length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    hired: applications.filter((a) => a.status === 'hired').length,
    pending: applications.filter((a) => a.status === 'applied').length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Applications</h1>
        <p className="text-gray-500 text-sm">Track your application journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, cls: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, cls: 'text-blue-600' },
          { label: 'Shortlisted', value: stats.shortlisted, cls: 'text-green-600' },
          { label: 'Hired', value: stats.hired, cls: 'text-yellow-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="card text-center py-4">
            <div className={`text-2xl font-black mb-0.5 ${cls}`}>{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-50" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start browsing internships and apply with one click.</p>
          <Link to="/browse" className="btn-primary text-sm">Browse internships</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            const listing = app.listing;
            return (
              <div key={app.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {listing?.company?.logo_url ? (
                    <img src={listing.company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400 flex-shrink-0">
                      {listing?.company?.name?.[0] ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{listing?.title ?? 'Internship'}</h3>
                        <p className="text-sm text-gray-500">{listing?.company?.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Applied {new Date(app.applied_at).toLocaleDateString('en-IN')}</span>
                      {app.match_score != null && (
                        <span className="font-medium text-primary-600">Match: {app.match_score}%</span>
                      )}
                      {listing && (
                        <Link to={`/internships/${listing.id}`} className="flex items-center gap-1 text-primary-600 hover:underline ml-auto">
                          View listing <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                    {app.status === 'shortlisted' && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-700 font-medium">🎉 You've been shortlisted! The recruiter may contact you soon.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
