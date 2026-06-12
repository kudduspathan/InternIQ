import { useState } from 'react';
import { useAuth } from '@/integrations/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, listingService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, CITIES, ALL_SKILLS, DURATION_OPTIONS } from '@/constants';
import { Plus, X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import type { ListingForm, StipendPeriod } from '@/types';

export default function PostListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => companyService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const [form, setForm] = useState<ListingForm>({
    title: '',
    description: '',
    category: '',
    required_skills: [],
    nice_to_have_skills: [],
    location: '',
    remote: false,
    stipend_period: 'monthly',
    openings: 1,
  });
  const [skillInput, setSkillInput] = useState('');
  const [niceSkillInput, setNiceSkillInput] = useState('');

  const createMutation = useMutation({
    mutationFn: () => listingService.create(user!.id, company!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruiter-listings'] });
      navigate('/recruiter/listings');
    },
  });

  const addSkill = (type: 'required' | 'nice', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (type === 'required' && !form.required_skills.includes(trimmed)) {
      setForm((f) => ({ ...f, required_skills: [...f.required_skills, trimmed] }));
      setSkillInput('');
    }
    if (type === 'nice' && !form.nice_to_have_skills.includes(trimmed)) {
      setForm((f) => ({ ...f, nice_to_have_skills: [...f.nice_to_have_skills ?? [], trimmed] }));
      setNiceSkillInput('');
    }
  };

  const removeSkill = (type: 'required' | 'nice', skill: string) => {
    if (type === 'required') setForm((f) => ({ ...f, required_skills: f.required_skills.filter((s) => s !== skill) }));
    else setForm((f) => ({ ...f, nice_to_have_skills: (f.nice_to_have_skills ?? []).filter((s) => s !== skill) }));
  };

  const isValid = form.title && form.description && form.category && form.required_skills.length > 0;

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <p className="font-semibold text-gray-900">Set up your company profile first</p>
        <button onClick={() => navigate('/recruiter/company')} className="btn-primary text-sm">Go to Company Profile</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Post an Internship</h1>
          <p className="text-gray-500 text-sm">Listings go for review before going live</p>
        </div>
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !isValid}
          className="btn-primary px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Submit for Review
        </button>
      </div>

      {createMutation.isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          Failed to create listing. Please try again.
        </div>
      )}

      <div className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-gray-700">Basic Information</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Internship Title *</label>
            <input className="input-base" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Frontend Developer Intern" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Category *</label>
            <select className="input-base" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Description *</label>
            <textarea
              className="input-base min-h-[160px] resize-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe the role, responsibilities, and what the intern will learn…"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-gray-700">Skills</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Required Skills *</label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[36px]">
              {form.required_skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full border border-primary-100">
                  {s} <button onClick={() => removeSkill('required', s)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-base flex-1 text-sm"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('required', skillInput); } }}
                placeholder="Add a required skill…"
                list="req-skills"
              />
              <datalist id="req-skills">{ALL_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
              <button onClick={() => addSkill('required', skillInput)} className="btn-primary px-3 text-sm"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Nice to Have</label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {(form.nice_to_have_skills ?? []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                  {s} <button onClick={() => removeSkill('nice', s)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="input-base flex-1 text-sm"
                value={niceSkillInput}
                onChange={(e) => setNiceSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill('nice', niceSkillInput); } }}
                placeholder="Add a nice-to-have skill…"
                list="nice-skills"
              />
              <datalist id="nice-skills">{ALL_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
              <button onClick={() => addSkill('nice', niceSkillInput)} className="border border-gray-200 text-gray-600 hover:border-gray-300 px-3 py-2 rounded-lg text-sm"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-gray-700">Logistics</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Duration</label>
              <select className="input-base" value={form.duration ?? ''} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}>
                <option value="">Select duration</option>
                {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Openings</label>
              <input type="number" min={1} className="input-base" value={form.openings ?? 1} onChange={(e) => setForm((f) => ({ ...f, openings: +e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Work Type</label>
              <div className="flex gap-3">
                {[{ value: false, label: 'On-site' }, { value: true, label: 'Remote/Hybrid' }].map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, remote: value }))}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      form.remote === value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!form.remote && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Location</label>
                <select className="input-base" value={form.location ?? ''} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}>
                  <option value="">Select city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Stipend (₹)</label>
              <input type="number" min={0} className="input-base" value={form.stipend_amount ?? ''} onChange={(e) => setForm((f) => ({ ...f, stipend_amount: e.target.value ? +e.target.value : undefined }))} placeholder="e.g. 10000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Stipend Period</label>
              <select className="input-base" value={form.stipend_period ?? 'monthly'} onChange={(e) => setForm((f) => ({ ...f, stipend_period: e.target.value as StipendPeriod }))}>
                <option value="monthly">Monthly</option>
                <option value="total">Total (one-time)</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Start Date</label>
              <input type="date" className="input-base" value={form.start_date ?? ''} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Apply By</label>
              <input type="date" className="input-base" value={form.apply_deadline ?? ''} onChange={(e) => setForm((f) => ({ ...f, apply_deadline: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
