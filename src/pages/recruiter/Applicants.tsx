import { useState } from 'react';
import { useAuth } from '@/integrations/auth';
import { useQuery } from '@tanstack/react-query';
import { applicationService, listingService } from '@/services';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import type { ApplicationStatus } from '@/types';

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  applied:     'bg-blue-50 text-blue-700',
  shortlisted: 'bg-green-50 text-green-700',
  rejected:    'bg-red-50 text-red-700',
  hired:       'bg-yellow-50 text-yellow-700',
  withdrawn:   'bg-gray-50 text-gray-500',
};

export default function ApplicantsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const listingFilter = searchParams.get('listing');
  const [selectedListing, setSelectedListing] = useState(listingFilter ?? '');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['recruiter-applications', user?.id],
    queryFn: () => applicationService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['recruiter-listings', user?.id],
    queryFn: () => listingService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const filtered = selectedListing
    ? applications.filter((a) => a.listing_id === selectedListing)
    : applications;

  const sorted = [...filtered].sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Applicants</h1>
        <p className="text-gray-500 text-sm">{filtered.length} application{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="mb-4">
        <select
          className="input-base max-w-sm"
          value={selectedListing}
          onChange={(e) => setSelectedListing(e.target.value)}
        >
          <option value="">All listings</option>
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-20 bg-gray-50" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-semibold text-gray-900 mb-2">No applicants yet</p>
          <p className="text-sm text-gray-500">Applications will appear here once students apply.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((app) => (
            <Link
              key={app.id}
              to={`/recruiter/applicants/${app.id}`}
              className="card flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(app.student_profile?.name ?? app.profile?.email ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {app.student_profile?.name ?? 'Student'}
                    </p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{app.listing?.title} · Applied {new Date(app.applied_at).toLocaleDateString('en-IN')}</p>
                  {app.student_profile?.skills && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {app.student_profile.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {app.match_score != null && (
                  <div className="text-center">
                    <div className={`text-lg font-black ${app.match_score >= 75 ? 'text-green-600' : app.match_score >= 50 ? 'text-blue-600' : 'text-yellow-600'}`}>
                      {app.match_score}%
                    </div>
                    <div className="text-[10px] text-gray-400">match</div>
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
