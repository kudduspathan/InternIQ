import { useAuth } from '@/integrations/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '@/services';
import { Link } from 'react-router-dom';
import { Plus, Eye, Users, Pause, Play, X, FileText } from 'lucide-react';
import type { ListingStatus } from '@/types';

const STATUS_COLOR: Record<ListingStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  pending_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  closed: 'bg-red-50 text-red-700 border-red-200',
  removed: 'bg-red-100 text-red-800 border-red-300',
};

export default function RecruiterListings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['recruiter-listings', user?.id],
    queryFn: () => listingService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      listingService.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-listings'] }),
  });

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Listings</h1>
          <p className="text-gray-500 text-sm">{listings.length} total</p>
        </div>
        <Link to="/recruiter/post" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse h-28 bg-gray-50" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No listings yet</h3>
          <Link to="/recruiter/post" className="btn-primary text-sm">Post your first internship</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{l.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_COLOR[l.status]}`}>
                      {l.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{l.category} · {l.remote ? 'Remote' : l.location}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {l.view_count} views</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {l.application_count} applicants</span>
                    <span>{new Date(l.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/recruiter/applicants?listing=${l.id}`}
                    className="text-xs border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" /> Applicants
                  </Link>
                  {l.status === 'active' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: l.id, status: 'closed' })}
                      className="text-xs border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Pause className="w-3 h-3" /> Close
                    </button>
                  )}
                  {l.status === 'closed' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: l.id, status: 'active' })}
                      className="text-xs border border-green-200 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Reopen
                    </button>
                  )}
                  {l.status === 'draft' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: l.id, status: 'pending_review' })}
                      className="text-xs btn-primary px-3 py-1.5 flex items-center gap-1"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
