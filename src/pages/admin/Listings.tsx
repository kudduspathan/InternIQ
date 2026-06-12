import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/integrations/auth';
import { listingService, adminService } from '@/services';
import { CheckCircle2, X, FileText, AlertTriangle } from 'lucide-react';
import type { Listing, ListingStatus } from '@/types';

const STATUS_COLOR: Record<ListingStatus, string> = {
  active:        'bg-green-900/30 text-green-400 border-green-800',
  draft:         'bg-gray-700 text-gray-400 border-gray-600',
  pending_review:'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  closed:        'bg-gray-700 text-gray-500 border-gray-600',
  removed:       'bg-red-900/30 text-red-400 border-red-800',
};

export default function AdminListings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending_review' | 'all'>('pending_review');

  const { data: pendingListings = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['admin-pending-listings'],
    queryFn: () => listingService.getPendingReview(),
  });

  const { data: allListings = [], isLoading: allLoading } = useQuery({
    queryKey: ['admin-all-listings'],
    queryFn: () => listingService.getActive(),
    enabled: activeTab === 'all',
  });

  const listings = activeTab === 'pending_review' ? pendingListings : allListings;
  const isLoading = activeTab === 'pending_review' ? pendingLoading : allLoading;

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, previous }: { id: string; status: string; previous: string }) => {
      await listingService.update(id, { status });
      await adminService.logAction(
        user!.id,
        status === 'active' ? 'approve_listing' : 'remove_listing',
        'listing',
        id,
        { status: previous },
        { status },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pending-listings'] });
      qc.invalidateQueries({ queryKey: ['admin-all-listings'] });
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Listing Moderation</h1>
        <p className="text-gray-400 text-sm">{pendingListings.length} pending review</p>
      </div>

      <div className="flex gap-1 bg-gray-800 p-1 rounded-xl mb-6 max-w-xs">
        {[{ id: 'pending_review', label: `Review Queue (${pendingListings.length})` }, { id: 'all', label: 'All Active' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'pending_review' | 'all')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === id ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-800 rounded-xl h-28 animate-pulse" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl text-center py-16">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">No listings to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(listings as Listing[]).map((listing) => (
            <div key={listing.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{listing.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[listing.status]}`}>
                      {listing.status.replace('_', ' ')}
                    </span>
                    {listing.flag_count > 0 && (
                      <span className="text-xs bg-red-900/30 text-red-400 border border-red-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {listing.flag_count} flags
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{listing.company?.name} · {listing.category} · {listing.remote ? 'Remote' : listing.location}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {listing.required_skills.slice(0, 5).map((s) => (
                      <span key={s} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {listing.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => updateMutation.mutate({ id: listing.id, status: 'active', previous: listing.status })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({ id: listing.id, status: 'removed', previous: listing.status })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 border border-red-700 text-red-400 hover:bg-red-900/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </>
                  )}
                  {listing.status === 'active' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: listing.id, status: 'removed', previous: listing.status })}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1 border border-red-700 text-red-400 hover:bg-red-900/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>
              <p className="text-xs text-gray-600 mt-2">Posted {new Date(listing.created_at).toLocaleDateString('en-IN')} · {listing.application_count} applications · {listing.view_count} views</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
