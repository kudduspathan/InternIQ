import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Mail, Github, Linkedin, Globe, ExternalLink, Loader2 } from 'lucide-react';
import type { ApplicationStatus } from '@/types';

export default function ApplicantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState('');

  const { data: application, isLoading } = useQuery({
    queryKey: ['application-detail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('applications')
        .select('*, listing:listings(*), student_profile:student_profiles(*), profile:profiles(email)')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ status }: { status: ApplicationStatus }) =>
      applicationService.updateStatus(id!, status, note || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application-detail', id] });
      qc.invalidateQueries({ queryKey: ['recruiter-applications'] });
    },
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-6 h-6 text-primary-500" /></div>;
  if (!application) return <div className="p-6"><p className="text-gray-500">Application not found.</p></div>;

  const profile = application.student_profile;
  const status = application.status as ApplicationStatus;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to applicants
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Candidate profile */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {profile?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{profile?.name ?? 'Student'}</h1>
                {application.email_revealed && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <a href={`mailto:${application.profile?.email}`} className="text-primary-600 hover:underline">
                      {application.profile?.email}
                    </a>
                  </p>
                )}
                {profile?.city && <p className="text-sm text-gray-500 mt-0.5">📍 {profile.city}</p>}
                <div className="flex gap-3 mt-2">
                  {profile?.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile?.portfolio_url && (
                    <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              {application.match_score != null && (
                <div className={`text-center flex-shrink-0 ${application.match_score >= 75 ? 'text-green-600' : application.match_score >= 50 ? 'text-blue-600' : 'text-yellow-600'}`}>
                  <div className="text-3xl font-black">{application.match_score}%</div>
                  <div className="text-xs text-gray-500">AI Match</div>
                </div>
              )}
            </div>

            {profile?.bio && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4 p-3 bg-gray-50 rounded-xl">{profile.bio}</p>
            )}

            {profile?.skills && profile.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s: string) => (
                    <span key={s} className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Education */}
          {profile?.education && profile.education.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Education</h3>
              <div className="space-y-3">
                {profile.education.map((edu: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{edu.degree as string} in {edu.field as string}</p>
                      <p className="text-xs text-gray-500">{edu.institution as string} · {edu.graduation_year as number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {profile?.projects && profile.projects.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Projects</h3>
              <div className="space-y-4">
                {profile.projects.map((proj: Record<string, unknown>, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{proj.title as string}</p>
                      {proj.url && (
                        <a href={proj.url as string} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-700">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{proj.description as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cover note */}
          {application.cover_note && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Cover Note</h3>
              <p className="text-sm text-gray-600 leading-relaxed italic">"{application.cover_note}"</p>
            </div>
          )}

          {/* Resume */}
          {profile?.resume_url && application.email_revealed && (
            <div className="card flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Resume</p>
              <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-4 py-2 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View Resume
              </a>
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Application Status</h3>
            <div className={`text-xs font-semibold px-3 py-2 rounded-lg mb-4 text-center ${
              status === 'applied' ? 'bg-blue-50 text-blue-700' :
              status === 'shortlisted' ? 'bg-green-50 text-green-700' :
              status === 'rejected' ? 'bg-red-50 text-red-700' :
              status === 'hired' ? 'bg-yellow-50 text-yellow-700' :
              'bg-gray-50 text-gray-600'
            }`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Internal Note</label>
              <textarea
                className="input-base text-sm min-h-[80px] resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Notes for your team (not visible to candidate)"
              />
            </div>

            <div className="space-y-2 mt-3">
              {status !== 'shortlisted' && status !== 'hired' && (
                <button
                  onClick={() => updateMutation.mutate({ status: 'shortlisted' })}
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Shortlist Candidate
                </button>
              )}
              {status === 'shortlisted' && (
                <button
                  onClick={() => updateMutation.mutate({ status: 'hired' })}
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
                >
                  <Trophy className="w-4 h-4" />
                  Mark as Hired
                </button>
              )}
              {status !== 'rejected' && status !== 'hired' && (
                <button
                  onClick={() => updateMutation.mutate({ status: 'rejected' })}
                  disabled={updateMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              )}
            </div>

            {!application.email_revealed && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Shortlist to reveal contact details
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
              <p>Applied: {new Date(application.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p>For: {application.listing?.title}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
