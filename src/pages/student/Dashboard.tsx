import { useAuth } from '@/integrations/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, aiMatchService, listingService } from '@/services';
import { analyzeResume, generateMatchScore } from '@/services/ai';
import { Link } from 'react-router-dom';
import { Brain, TrendingUp, FileText, Search, Zap, ChevronRight, Star } from 'lucide-react';
import type { MatchTier, Listing } from '@/types';

function MatchBadge({ tier }: { tier: MatchTier }) {
  const classes: Record<MatchTier, string> = {
    'Strong Match': 'badge-tier-strong',
    'Good Fit': 'badge-tier-good',
    'Partial Match': 'badge-tier-partial',
    'Explore Role': 'badge-tier-explore',
  };
  return <span className={classes[tier]}>{tier}</span>;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 75 ? '#059669' : score >= 50 ? '#3B82F6' : score >= 30 ? '#F59E0B' : '#9CA3AF';
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
      style={{ background: `conic-gradient(${color} ${score * 3.6}deg, #E5E7EB ${score * 3.6}deg)` }}
    >
      <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-xs font-bold" style={{ color }}>
        {score}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => studentService.getProfile(user!.id),
    enabled: !!user,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['ai-matches', user?.id],
    queryFn: () => aiMatchService.getByStudent(user!.id),
    enabled: !!user,
  });

  const { data: activeListing } = useQuery({
    queryKey: ['active-listings-sample'],
    queryFn: () => listingService.getActive(),
  });

  const generateMatchesMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !activeListing) return;
      const top5 = (activeListing as Listing[]).slice(0, 5);
      for (const listing of top5) {
        const result = await generateMatchScore(profile, listing);
        await aiMatchService.upsert({
          student_id: user!.id,
          listing_id: listing.id,
          score: result.score,
          tier: result.tier,
          explanation: result.explanation,
          top_matching_skills: result.top_matching_skills,
          model_version: 'gpt-4o',
          prompt_version: 'v1',
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-matches'] }),
  });

  const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-blue-600' : 'text-yellow-600';
  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Hey {firstName} 👋</h1>
        <p className="text-gray-500">Your AI-powered internship command centre</p>
      </div>

      {/* Profile score + quick links */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4 sm:col-span-1">
          <div className="relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E5E7EB" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="#4F7CFF" strokeWidth="3"
                strokeDasharray={`${(profile?.profile_score ?? 0) * 0.97} 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
              {profile?.profile_score ?? 0}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Profile Score</p>
            <p className="text-xs text-gray-500">{(profile?.profile_score ?? 0) < 60 ? 'Complete your profile to get better matches' : 'Great profile!'}</p>
            <Link to="/profile" className="text-xs text-primary-600 font-medium hover:underline mt-0.5 inline-block">
              Edit profile →
            </Link>
          </div>
        </div>

        <Link to="/browse" className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Browse listings</p>
            <p className="text-xs text-gray-500">Filter by skills, location, stipend</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>

        <Link to="/applications" className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">My applications</p>
            <p className="text-xs text-gray-500">Track your progress</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
      </div>

      {/* AI Match Feed */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">AI Match Feed</h2>
              <p className="text-xs text-gray-500">Personalised for your profile</p>
            </div>
          </div>
          <button
            onClick={() => generateMatchesMutation.mutate()}
            disabled={generateMatchesMutation.isPending || !profile}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            {generateMatchesMutation.isPending ? 'Generating…' : 'Refresh matches'}
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              {(profile?.profile_score ?? 0) < 60
                ? 'Complete your profile first, then generate matches.'
                : 'Click "Refresh matches" to generate AI-powered matches.'}
            </p>
            {(profile?.profile_score ?? 0) < 60 && (
              <Link to="/profile" className="btn-primary text-sm">Complete profile</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <Link
                key={m.id}
                to={`/internships/${m.listing_id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-all"
              >
                <ScoreCircle score={m.score} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {m.listing?.title ?? 'Internship'}
                    </p>
                    <MatchBadge tier={m.tier} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {m.listing?.company?.name ?? 'Company'} · {m.listing?.location ?? 'Remote'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{m.explanation}</p>
                  {m.top_matching_skills.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {m.top_matching_skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-medium">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`text-sm font-bold ${scoreColor(m.score)}`}>{m.score}%</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent listings */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          Latest listings
        </h2>
        <Link to="/browse" className="text-sm text-primary-600 font-medium hover:underline">View all →</Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {(activeListing as Listing[] | undefined)?.slice(0, 4).map((l) => (
          <Link
            key={l.id}
            to={`/internships/${l.id}`}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3 mb-3">
              {l.company?.logo_url ? (
                <img src={l.company.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-bold flex-shrink-0">
                  {l.company?.name?.[0] ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{l.title}</p>
                <p className="text-xs text-gray-500">{l.company?.name}</p>
              </div>
              {l.company?.verification_status === 'verified' && (
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">✓ Verified</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {l.required_skills.slice(0, 3).map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{l.remote ? '🌐 Remote' : `📍 ${l.location}`}</span>
              {l.stipend_amount && (
                <span className="font-medium text-gray-700">₹{l.stipend_amount.toLocaleString()}/mo</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
