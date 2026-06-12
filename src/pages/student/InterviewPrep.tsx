import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/integrations/auth';
import { studentService, aiUsageService } from '@/services';
import { generateInterviewPrep } from '@/services/ai';
import { listingService } from '@/services';
import { Brain, ChevronDown, ChevronUp, Loader2, BookOpen, Map, Zap } from 'lucide-react';
import type { InterviewPrepResult, Listing } from '@/types';
import { CATEGORIES } from '@/constants';

function QuestionCard({ q }: { q: InterviewPrepResult['questions'][0] }) {
  const [open, setOpen] = useState(false);
  const catColor: Record<string, string> = {
    Technical: 'bg-blue-50 text-blue-700 border-blue-200',
    Behavioral: 'bg-purple-50 text-purple-700 border-purple-200',
    HR: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${catColor[q.category] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {q.category}
          </span>
          <span className="text-sm font-medium text-gray-800 truncate">{q.question}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Sample Answer</p>
          <p className="text-sm text-gray-700 leading-relaxed">{q.sample_answer}</p>
        </div>
      )}
    </div>
  );
}

export default function InterviewPrepPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedListingId = searchParams.get('listing');

  const [selectedListingId, setSelectedListingId] = useState(preselectedListingId ?? '');
  const [result, setResult] = useState<InterviewPrepResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: () => studentService.getProfile(user!.id),
    enabled: !!user,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['active-listings'],
    queryFn: () => listingService.getActive(),
  });

  const { data: selectedListing } = useQuery({
    queryKey: ['listing', selectedListingId],
    queryFn: () => listingService.getById(selectedListingId),
    enabled: !!selectedListingId,
  });

  const handleGenerate = async () => {
    if (!profile || !selectedListing) return;
    const allowed = await aiUsageService.checkAndIncrement(user!.id, 'resume', 3);
    if (!allowed) { setError('Daily AI limit reached. Try again tomorrow.'); return; }
    setLoading(true);
    setError('');
    try {
      const prep = await generateInterviewPrep(profile, selectedListing);
      setResult(prep);
    } catch (e) {
      setError('Failed to generate prep. Check your OpenAI key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Interview Prep AI</h1>
        <p className="text-gray-500 text-sm">Get tailored interview questions and sample answers for any role</p>
      </div>

      <div className="card mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select an internship</label>
            <select
              className="input-base"
              value={selectedListingId}
              onChange={(e) => setSelectedListingId(e.target.value)}
            >
              <option value="">Choose a listing…</option>
              {(listings as Listing[]).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} — {l.company?.name ?? 'Company'}
                </option>
              ))}
            </select>
          </div>

          {selectedListing && (
            <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 text-sm">
              <p className="font-semibold text-primary-800">{selectedListing.title}</p>
              <p className="text-primary-600 text-xs mt-0.5">
                Skills: {selectedListing.required_skills.slice(0, 5).join(', ')}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!selectedListingId || loading || !profile}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Generating prep…' : 'Generate Interview Prep'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Questions */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-primary-500" />
              <h2 className="font-bold text-gray-900">Interview Questions ({result.questions.length})</h2>
            </div>
            <div className="space-y-3">
              {result.questions.map((q, i) => <QuestionCard key={i} q={q} />)}
            </div>
          </div>

          {/* Prep roadmap */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-5 h-5 text-secondary-500" />
              <h2 className="font-bold text-gray-900">Preparation Roadmap</h2>
            </div>
            <ol className="space-y-3">
              {result.preparation_roadmap.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Topics to revise */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-accent-600" />
              <h2 className="font-bold text-gray-900">Topics to Revise</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.topics_to_revise.map((t, i) => (
                <span key={i} className="text-sm bg-accent-50 text-emerald-800 border border-accent-200 px-3 py-1.5 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
