import { useState, useRef } from 'react';
import { useAuth } from '@/integrations/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, aiResumeService, aiUsageService } from '@/services';
import { analyzeResume } from '@/services/ai';
import { ALL_SKILLS, SKILL_CATEGORIES, CITIES, CATEGORIES, AI_RATE_LIMITS } from '@/constants';
import { Plus, X, Upload, Brain, CheckCircle2, AlertCircle, Loader2, Github, Linkedin, Globe } from 'lucide-react';
import type { Education, Project, StudentProfileForm } from '@/types';

function SkillTag({ skill, onRemove }: { skill: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full border border-primary-100">
      {skill}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-primary-900 ml-0.5"><X className="w-3 h-3" /></button>
      )}
    </span>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => studentService.getProfile(user!.id),
    enabled: !!user,
  });

  const { data: latestReview } = useQuery({
    queryKey: ['resume-review', user?.id],
    queryFn: () => aiResumeService.getLatest(user!.id),
    enabled: !!user,
  });

  const [form, setForm] = useState<StudentProfileForm>({
    name: '', phone: '', city: '', bio: '', skills: [],
    preferred_categories: [], portfolio_url: '', github_url: '', linkedin_url: '',
    education: [], projects: [],
  });

  const [skillInput, setSkillInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'skills' | 'edu' | 'projects' | 'review'>('basic');

  // Populate form when profile loads
  useState(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        city: profile.city || '',
        bio: profile.bio || '',
        skills: profile.skills || [],
        preferred_categories: profile.preferred_categories || [],
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        education: profile.education || [],
        projects: profile.projects || [],
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: () => studentService.upsertProfile(user!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await studentService.uploadResume(user!.id, file);
      await studentService.upsertProfile(user!.id, { ...form, resume_url: url });
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    } finally {
      setUploading(false);
    }
  };

  const handleAiReview = async () => {
    if (!profile) return;
    const allowed = await aiUsageService.checkAndIncrement(user!.id, 'resume', AI_RATE_LIMITS.resumeCallsPerDay);
    if (!allowed) { alert('Daily AI review limit reached (3/day). Try again tomorrow.'); return; }
    setReviewLoading(true);
    try {
      const result = await analyzeResume(profile);
      await aiResumeService.save({
        student_id: user!.id,
        profile_score: result.score,
        missing_sections: result.missing_sections,
        suggested_skills: result.suggested_keywords,
        tone_suggestions: result.tone_suggestions,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        improvement_checklist: result.improvement_checklist,
        raw_feedback: null,
        model_version: 'gpt-4o',
      });
      qc.invalidateQueries({ queryKey: ['resume-review'] });
    } catch (e) {
      alert('AI review failed. Check your OpenAI key.');
    } finally {
      setReviewLoading(false);
    }
  };

  const addSkill = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm((f) => ({ ...f, skills: [...f.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const addEducation = () => {
    setForm((f) => ({
      ...f,
      education: [...f.education, { institution: '', degree: '', field: '', graduation_year: new Date().getFullYear() }],
    }));
  };

  const addProject = () => {
    setForm((f) => ({
      ...f,
      projects: [...f.projects, { title: '', description: '', url: '', skills: [] }],
    }));
  };

  const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-500';
  const profileScore = profile?.profile_score ?? 0;

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-6 h-6 text-primary-500" /></div>;

  const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'skills', label: 'Skills' },
    { id: 'edu', label: 'Education' },
    { id: 'projects', label: 'Projects' },
    { id: 'review', label: '✨ AI Review' },
  ] as const;

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Keep it updated to get better AI matches</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-2xl font-black ${scoreColor(profileScore)}`}>{profileScore}%</div>
            <div className="text-xs text-gray-400">Profile Score</div>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : null}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-500"
          style={{ width: `${profileScore}%` }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card">
        {/* BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name *</label>
                <input className="input-base" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input className="input-base" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select className="input-base" value={form.city ?? ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}>
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio <span className="text-gray-400 font-normal">({(form.bio?.length ?? 0)}/300)</span></label>
              <textarea
                className="input-base min-h-[100px] resize-none"
                value={form.bio ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                maxLength={300}
                placeholder="A short intro about yourself, your interests and goals..."
              />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Links</p>
              <div className="space-y-3">
                {([
                  { key: 'github_url', icon: Github, placeholder: 'https://github.com/username' },
                  { key: 'linkedin_url', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
                  { key: 'portfolio_url', icon: Globe, placeholder: 'https://yourportfolio.com' },
                ] as const).map(({ key, icon: Icon, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      className="input-base"
                      value={form[key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Resume</p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-all"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading…' : 'Upload PDF'}
                </button>
                {profile?.resume_url && (
                  <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                    View current resume →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Your skills *</label>
              <div className="flex flex-wrap gap-2 mb-3 min-h-[40px]">
                {form.skills.map((s) => (
                  <SkillTag key={s} skill={s} onRemove={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))} />
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Type a skill and press Enter"
                  list="skill-suggestions"
                />
                <datalist id="skill-suggestions">
                  {ALL_SKILLS.filter((s) => s.toLowerCase().includes(skillInput.toLowerCase())).slice(0, 10).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <button onClick={() => addSkill(skillInput)} className="btn-primary px-4 text-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Quick add from categories</p>
              {Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => (
                <div key={cat} className="mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-1.5">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <button
                        key={s}
                        onClick={() => { if (!form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] })); }}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          form.skills.includes(s)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-gray-200 text-gray-600 hover:border-primary-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Preferred internship categories</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setForm((f) => ({
                        ...f,
                        preferred_categories: f.preferred_categories.includes(c)
                          ? f.preferred_categories.filter((x) => x !== c)
                          : [...f.preferred_categories, c],
                      }));
                    }}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-all ${
                      form.preferred_categories.includes(c)
                        ? 'bg-secondary-500 text-white border-secondary-500'
                        : 'border-gray-200 text-gray-600 hover:border-secondary-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EDUCATION */}
        {activeTab === 'edu' && (
          <div className="space-y-4">
            {form.education.map((edu, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Education {i + 1}</p>
                  <button onClick={() => setForm((f) => ({ ...f, education: f.education.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Institution</label>
                    <input className="input-base text-sm" value={edu.institution} onChange={(e) => {
                      const ed = [...form.education]; ed[i] = { ...ed[i], institution: e.target.value };
                      setForm((f) => ({ ...f, education: ed }));
                    }} placeholder="University / College" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Degree</label>
                    <input className="input-base text-sm" value={edu.degree} onChange={(e) => {
                      const ed = [...form.education]; ed[i] = { ...ed[i], degree: e.target.value };
                      setForm((f) => ({ ...f, education: ed }));
                    }} placeholder="B.Tech / BCA / MBA" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Field of Study</label>
                    <input className="input-base text-sm" value={edu.field} onChange={(e) => {
                      const ed = [...form.education]; ed[i] = { ...ed[i], field: e.target.value };
                      setForm((f) => ({ ...f, education: ed }));
                    }} placeholder="Computer Science" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Graduation Year</label>
                    <input type="number" className="input-base text-sm" value={edu.graduation_year} onChange={(e) => {
                      const ed = [...form.education]; ed[i] = { ...ed[i], graduation_year: +e.target.value };
                      setForm((f) => ({ ...f, education: ed }));
                    }} placeholder="2025" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addEducation} className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700">
              <Plus className="w-4 h-4" /> Add education
            </button>
          </div>
        )}

        {/* PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            {form.projects.map((proj, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Project {i + 1}</p>
                  <button onClick={() => setForm((f) => ({ ...f, projects: f.projects.filter((_, j) => j !== i) }))} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input className="input-base text-sm" value={proj.title} onChange={(e) => {
                  const ps = [...form.projects]; ps[i] = { ...ps[i], title: e.target.value };
                  setForm((f) => ({ ...f, projects: ps }));
                }} placeholder="Project title" />
                <textarea className="input-base text-sm min-h-[80px] resize-none" value={proj.description} onChange={(e) => {
                  const ps = [...form.projects]; ps[i] = { ...ps[i], description: e.target.value };
                  setForm((f) => ({ ...f, projects: ps }));
                }} placeholder="What did you build? What problem does it solve?" />
                <input className="input-base text-sm" value={proj.url ?? ''} onChange={(e) => {
                  const ps = [...form.projects]; ps[i] = { ...ps[i], url: e.target.value };
                  setForm((f) => ({ ...f, projects: ps }));
                }} placeholder="https://github.com/..." />
              </div>
            ))}
            <button onClick={addProject} className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:text-primary-700">
              <Plus className="w-4 h-4" /> Add project
            </button>
          </div>
        )}

        {/* AI REVIEW */}
        {activeTab === 'review' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900">AI Resume Review</h3>
                <p className="text-xs text-gray-500 mt-0.5">3 reviews per day · Powered by GPT-4o</p>
              </div>
              <button
                onClick={handleAiReview}
                disabled={reviewLoading || !profile}
                className="flex items-center gap-2 btn-primary text-sm disabled:opacity-60"
              >
                {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {reviewLoading ? 'Analysing…' : 'Analyse my profile'}
              </button>
            </div>

            {!latestReview && !reviewLoading && (
              <div className="text-center py-12 text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Click "Analyse my profile" to get AI-powered feedback</p>
              </div>
            )}

            {latestReview && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`text-4xl font-black ${scoreColor(latestReview.profile_score)}`}>
                    {latestReview.profile_score}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Profile Score</p>
                    <p className="text-xs text-gray-500">{new Date(latestReview.generated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {latestReview.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Strengths</p>
                    <ul className="space-y-1">
                      {latestReview.strengths.map((s, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-green-500 flex-shrink-0">✓</span>{s}</li>)}
                    </ul>
                  </div>
                )}

                {latestReview.weaknesses.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-yellow-500" /> Areas to improve</p>
                    <ul className="space-y-1">
                      {latestReview.weaknesses.map((w, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-yellow-500 flex-shrink-0">⚠</span>{w}</li>)}
                    </ul>
                  </div>
                )}

                {latestReview.missing_sections.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Missing sections</p>
                    <div className="flex flex-wrap gap-2">
                      {latestReview.missing_sections.map((s, i) => (
                        <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {latestReview.improvement_checklist.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Improvement checklist</p>
                    <ul className="space-y-2">
                      {latestReview.improvement_checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestReview.suggested_skills.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Trending keywords to add</p>
                    <div className="flex flex-wrap gap-2">
                      {latestReview.suggested_skills.map((s, i) => (
                        <button key={i} onClick={() => { if (!form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] })); }}
                          className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-full hover:bg-primary-100 transition-all">
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
