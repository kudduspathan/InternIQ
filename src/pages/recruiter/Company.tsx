import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/integrations/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services';
import { INDUSTRIES, CITIES } from '@/constants';
import { Building2, Upload, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import type { CompanyForm, TeamSize } from '@/types';

const TEAM_SIZES: TeamSize[] = ['1-10', '11-50', '51-200', '200+'];

const VERIFICATION_STATUS = {
  pending: { label: 'Verification Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
  verified: { label: 'Verified ✓', cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected: { label: 'Verification Rejected', cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-4 h-4" /> },
};

export default function CompanyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => companyService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const [form, setForm] = useState<CompanyForm>({
    name: '', display_name: '', website: '', description: '',
    industry: '', city: '', gstin: '', pan: '',
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? '',
        display_name: company.display_name ?? '',
        website: company.website ?? '',
        description: company.description ?? '',
        industry: company.industry ?? '',
        team_size: company.team_size ?? undefined,
        city: company.city ?? '',
        gstin: company.gstin ?? '',
        pan: company.pan ?? '',
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (company) {
        return companyService.update(company.id, form);
      } else {
        return companyService.create(user!.id, form);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setLogoUploading(true);
    try {
      const url = await companyService.uploadLogo(company.id, file);
      await companyService.update(company.id, { ...form });
      qc.invalidateQueries({ queryKey: ['company'] });
    } finally {
      setLogoUploading(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-6 h-6 text-primary-500" /></div>;

  const verStatus = company?.verification_status ?? 'pending';
  const vsConfig = VERIFICATION_STATUS[verStatus];

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Company Profile</h1>
          <p className="text-gray-500 text-sm">Verified companies get a badge and higher trust from students</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.name}
          className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
          {saved ? 'Saved!' : company ? 'Update' : 'Create Company'}
        </button>
      </div>

      {/* Verification status */}
      {company && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${vsConfig.cls}`}>
          {vsConfig.icon}
          <div>
            <p className="text-sm font-semibold">{vsConfig.label}</p>
            {verStatus === 'pending' && <p className="text-xs opacity-75">Admin will review your company details and documents.</p>}
            {verStatus === 'rejected' && company.rejection_reason && (
              <p className="text-xs opacity-75">Reason: {company.rejection_reason}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Logo */}
        {company && (
          <div className="card">
            <p className="text-sm font-semibold text-gray-700 mb-4">Company Logo</p>
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt="Company logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                  {company.name?.[0] ?? '?'}
                </div>
              )}
              <div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:border-primary-400 transition-all"
                >
                  {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {logoUploading ? 'Uploading…' : 'Upload logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>
        )}

        {/* Basic info */}
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary-500" /> Company Details
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Legal Name *</label>
              <input className="input-base" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Pvt Ltd" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Brand Name</label>
              <input className="input-base" value={form.display_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} placeholder="Acme" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Website</label>
              <input className="input-base" value={form.website ?? ''} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://acme.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Industry</label>
              <select className="input-base" value={form.industry ?? ''} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Team Size</label>
              <select className="input-base" value={form.team_size ?? ''} onChange={(e) => setForm((f) => ({ ...f, team_size: e.target.value as TeamSize }))}>
                <option value="">Select size</option>
                {TEAM_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">City</label>
              <select className="input-base" value={form.city ?? ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Description <span className="text-gray-400 font-normal">({(form.description?.length ?? 0)}/500)</span></label>
            <textarea className="input-base min-h-[100px] resize-none" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} maxLength={500} placeholder="What does your company do?" />
          </div>
        </div>

        {/* Verification docs */}
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">Verification Documents</p>
          <p className="text-xs text-gray-500">Providing GST/PAN speeds up verification and adds trust for students.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">GSTIN</label>
              <input className="input-base font-mono text-sm" value={form.gstin ?? ''} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" maxLength={15} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Company PAN</label>
              <input className="input-base font-mono text-sm" value={form.pan ?? ''} onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))} placeholder="AABCA1234C" maxLength={10} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
