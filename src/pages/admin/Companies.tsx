import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/integrations/auth';
import { companyService, adminService } from '@/services';
import { CheckCircle2, XCircle, Building2, ExternalLink } from 'lucide-react';
import type { Company } from '@/types';

export default function AdminCompanies() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => companyService.getAll(),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: 'verified' | 'rejected'; reason?: string }) => {
      const company = companies.find((c: Company) => c.id === id);
      await companyService.updateVerification(id, status, user!.id, reason);
      await adminService.logAction(
        user!.id,
        status === 'verified' ? 'verify_company' : 'reject_company',
        'company',
        id,
        { verification_status: company?.verification_status },
        { verification_status: status },
        reason,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-companies'] }),
  });

  const pending = companies.filter((c: Company) => c.verification_status === 'pending');
  const displayed = activeTab === 'pending' ? pending : companies;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Companies</h1>
          <p className="text-gray-400 text-sm">{pending.length} pending verification</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 p-1 rounded-xl mb-6 max-w-xs">
        {[{ id: 'pending', label: `Pending (${pending.length})` }, { id: 'all', label: 'All' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'pending' | 'all')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
      ) : displayed.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl text-center py-16">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">No companies to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((company: Company) => (
            <div key={company.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <div className="flex items-start gap-4 mb-4">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-700" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-400">
                    {company.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{company.display_name ?? company.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      company.verification_status === 'verified' ? 'bg-green-900/30 text-green-400 border-green-800' :
                      company.verification_status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' :
                      'bg-red-900/30 text-red-400 border-red-800'
                    }`}>
                      {company.verification_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{company.industry ?? 'Unknown industry'} · {company.city ?? 'No city'}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    {company.gstin && <span>GSTIN: <span className="font-mono text-gray-300">{company.gstin}</span></span>}
                    {company.pan && <span>PAN: <span className="font-mono text-gray-300">{company.pan}</span></span>}
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-accent-500 flex items-center gap-0.5 hover:text-accent-400">
                        Website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {company.description && (
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">{company.description}</p>
              )}

              {company.verification_status === 'pending' && (
                <div className="border-t border-gray-700 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Rejection reason (required if rejecting)</label>
                    <input
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500 placeholder:text-gray-500"
                      value={rejectReason[company.id] ?? ''}
                      onChange={(e) => setRejectReason((r) => ({ ...r, [company.id]: e.target.value }))}
                      placeholder="e.g. Invalid GSTIN, incomplete information…"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => verifyMutation.mutate({ id: company.id, status: 'verified' })}
                      disabled={verifyMutation.isPending}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify Company
                    </button>
                    <button
                      onClick={() => verifyMutation.mutate({ id: company.id, status: 'rejected', reason: rejectReason[company.id] })}
                      disabled={verifyMutation.isPending || !rejectReason[company.id]}
                      className="flex items-center gap-2 border border-red-700 text-red-400 hover:bg-red-900/20 font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              )}

              {company.verification_status === 'rejected' && company.rejection_reason && (
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-red-400">Rejection reason: {company.rejection_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
