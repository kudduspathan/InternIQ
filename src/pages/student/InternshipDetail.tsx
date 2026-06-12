import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/integrations/auth';
import { listingService, applicationService, studentService, aiMatchService, aiUsageService } from '@/services';
import { generateMatchScore } from '@/services/ai';
import {
  MapPin, Clock, IndianRupee, Users, Calendar, Wifi, ArrowLeft,
  Brain, Zap, CheckCircle2, Loader2, ExternalLink, AlertCircle,
} from 'lucide-react';
import type { MatchTier } from '@/types';

function MatchBadge({ tier, score }: { tier: MatchTier; score: number }) {
  const config: Record<MatchTier, { cls: string; emoji: string }> = {
    'Strong Match': { cls: 'bg-green-50 text-green-700 border-green-200', emoji: '🔥' },
    'Good Fit':     { cls: 'bg-blue-50 text-blue-700 border-blue-200',   emoji: '✅' },
    'Partial Match':{ cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', emoji: '🟡' },
    'Explore Role': { cls: 'bg-gray-50 text-gray-600 border-gray-200',   emoji: '🔍' },
  };
  const { cls, emoji } = config[tier];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${cls}`}>
      <span>{emoji}</span>
      <span>{tier}</span>
      <span className="font-black">{score}%</span>
    </div>
  );
}

export default function InternshipDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [coverNote, setCoverNote] = useState('');
  const [matchLoading, setMatchLoading] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingService.getById(id!),
    enabled: !!id,
  });

  const { data: profile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => studentService.getProfile(user!.id),
    enabled: !!user,
  });

  const { data: existingMatch } = useQuery({
    queryKey: ['ai-match', user?.id, id],
    queryFn: async () => {
      const matches = await aiMatchService.getByStudent(user!.id);
      return matches.find((m) => m.listing_id === id) ?? null;
    },
    enabled: !!user && !!id,
  });

  const { data: hasApplied } = useQuery({
    queryKey: ['has-applied', user?.id, id],
    queryFn: () => applicationService.hasApplied(user!.id, id!),
    enabled: !!user && !!id,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!listing || !user) throw new Error('Missing data');
      await applicationService.apply(
        user.id,
        listing.id,
        listing.company_id,
        listing.recruiter_id,
        existingMatch?.score,
        coverNote || undefined,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['has-applied'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const handleGetMatchScore = async () => {
    if (!profile || !listing || !user) return;
    const allowed = await aiUsageService.checkAndIncrement(user.id, 'match', 20);
    if (!allowed) { alert('Daily match limit reached (20/day).'); return; }
    setMatchLoading(true);
    try {
      const result = await generateMatchScore(profile, listing);
      await aiMatchService.upsert({
        student_id: user.id,
        listing_id: listing.id,
        score: result.score,
        tier: result.tier,
        explanation: result.explanation,
        top_matching_skills: result.top_matching_skills,
        model_version: 'gpt-4o',
        prompt_version: 'v1',
      });
      qc.invalidateQueries({ queryKey: ['ai-match'] });
    } finally {
      setMatchLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 text-primary-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500">Listing not found</p>
        <Link to="/browse" className="btn-primary text-sm">← Back to browse</Link>
      </div>
    );
  }

  const company = listing.company;

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              {company?.logo_url ? (
                <img src={company.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center text-2xl font-bold text-primary-400 flex-shrink-0">
                  {company?.name?.[0] ?? '?'}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{listing.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-600 font-medium">{company?.name}</span>
                  {company?.verification_status === 'verified' && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      ✓ Verified Company
                    </span>
                  )}
                  {company?.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              {listing.remote ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Location</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-primary-500" /> Remote</span>
                </div>
              ) : listing.location ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Location</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary-500" /> {listing.location}</span>
                </div>
              ) : null}
              {listing.duration && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Duration</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary-500" /> {listing.duration}</span>
                </div>
              )}
              {listing.stipend_amount ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Stipend</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-primary-500" />
                    ₹{listing.stipend_amount.toLocaleString()}/{listing.stipend_period === 'monthly' ? 'mo' : 'total'}
                  </span>
                </div>
              ) : null}
              {listing.openings && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Openings</span>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary-500" /> {listing.openings}</span>
                </div>
              )}
            </div>

            {/* Required skills */}
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-700 mb-2">Required skills</p>
              <div className="flex flex-wrap gap-2">
                {listing.required_skills.map((s) => (
                  <span key={s} className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2.5 py-1 rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
            {listing.nice_to_have_skills.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mt-3 mb-2">Nice to have</p>
                <div className="flex flex-wrap gap-2">
                  {listing.nice_to_have_skills.map((s) => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="font-bold text-gray-900 mb-4">About the role</h2>
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </div>
          </div>

          {/* Company info */}
          {company && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4">About {company.display_name ?? company.name}</h2>
              {company.description && <p className="text-sm text-gray-600 mb-3">{company.description}</p>}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {company.industry && <span>🏷️ {company.industry}</span>}
                {company.team_size && <span>👥 {company.team_size} employees</span>}
                {company.city && <span>📍 {company.city}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Match Score */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900">AI Match Score</h3>
            </div>

            {existingMatch ? (
              <div className="space-y-3">
                <MatchBadge tier={existingMatch.tier} score={existingMatch.score} />
                <p className="text-xs text-gray-500 leading-relaxed">{existingMatch.explanation}</p>
                {existingMatch.top_matching_skills.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1.5">Matching skills</p>
                    <div className="flex flex-wrap gap-1">
                      {existingMatch.top_matching_skills.map((s) => (
                        <span key={s} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-gray-500 mb-3">See how well you match this role</p>
                <button
                  onClick={handleGetMatchScore}
                  disabled={matchLoading || !profile}
                  className="flex items-center gap-2 btn-primary text-xs w-full justify-center disabled:opacity-60"
                >
                  {matchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {matchLoading ? 'Calculating…' : 'Get match score'}
                </button>
                {!profile && (
                  <p className="text-xs text-gray-400 mt-2">
                    <Link to="/profile" className="text-primary-600 hover:underline">Complete your profile</Link> first
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Apply card */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Apply now</h3>

            {hasApplied ? (
              <div className="text-center py-3">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-green-700">Application submitted!</p>
                <p className="text-xs text-gray-500 mt-1">Track status in My Applications</p>
                <Link to="/applications" className="mt-3 text-xs text-primary-600 font-medium hover:underline block">
                  View applications →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Cover note <span className="text-gray-400 font-normal">(optional, {coverNote.length}/300)</span>
                  </label>
                  <textarea
                    className="input-base text-sm min-h-[80px] resize-none"
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    maxLength={300}
                    placeholder="Why are you a great fit for this role?"
                  />
                </div>
                <button
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending || !user}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {applyMutation.isPending ? 'Submitting…' : 'Quick Apply'}
                </button>
                {applyMutation.isError && (
                  <p className="text-xs text-red-600">
                    {applyMutation.error instanceof Error ? applyMutation.error.message : 'Already applied or error occurred.'}
                  </p>
                )}
                {!user && (
                  <p className="text-xs text-center text-gray-500">
                    <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link> to apply
                  </p>
                )}
              </div>
            )}

            {listing.apply_deadline && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-3">
                <Calendar className="w-3 h-3" />
                Deadline: {new Date(listing.apply_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          <Link
            to={`/interview-prep?listing=${listing.id}&title=${encodeURIComponent(listing.title)}`}
            className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">Interview Prep</p>
              <p className="text-xs text-gray-500">AI-powered questions for this role</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
