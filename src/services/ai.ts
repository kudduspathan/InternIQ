import type {
  StudentProfile, Listing, ResumeReviewResult,
  MatchScoreResult, MatchTier, InterviewPrepResult,
} from '@/types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const MODEL = 'gpt-4o';

async function callOpenAI(messages: { role: string; content: string }[], maxTokens = 1000): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'OpenAI API error');
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ── Resume Analyzer ───────────────────────────────────────────

export async function analyzeResume(profile: StudentProfile): Promise<ResumeReviewResult> {
  const prompt = `You are an expert recruiter and career coach. Analyze this student's profile and return a JSON response only (no markdown).

Profile:
- Name: ${profile.name}
- Skills: ${profile.skills.join(', ')}
- Bio: ${profile.bio ?? 'Not provided'}
- GitHub: ${profile.github_url ?? 'Not provided'}
- LinkedIn: ${profile.linkedin_url ?? 'Not provided'}
- Portfolio: ${profile.portfolio_url ?? 'Not provided'}
- Education: ${JSON.stringify(profile.education)}
- Projects: ${JSON.stringify(profile.projects)}
- Resume Text: ${profile.resume_text?.slice(0, 2000) ?? 'Not uploaded'}

Return a JSON object:
{
  "score": <number 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "missing_sections": [<string>, ...],
  "suggested_keywords": [<string>, ...],
  "improvement_checklist": [<string>, ...],
  "tone_suggestions": [<string>, ...]
}`;

  const raw = await callOpenAI([{ role: 'user', content: prompt }], 800);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as ResumeReviewResult;
}

// ── Match Score Engine ────────────────────────────────────────

export async function generateMatchScore(
  profile: StudentProfile,
  listing: Listing
): Promise<MatchScoreResult> {
  const prompt = `You are an AI hiring assistant. Score how well this student matches this internship. Return JSON only.

Student:
- Skills: ${profile.skills.join(', ')}
- Bio: ${profile.bio ?? ''}
- Projects: ${profile.projects.map((p) => p.title).join(', ')}

Listing:
- Title: ${listing.title}
- Required Skills: ${listing.required_skills.join(', ')}
- Nice to Have: ${listing.nice_to_have_skills.join(', ')}
- Description: ${listing.description.slice(0, 500)}

Return JSON:
{
  "score": <0-100>,
  "tier": "<Strong Match|Good Fit|Partial Match|Explore Role>",
  "explanation": "<under 30 words>",
  "top_matching_skills": [<string>, ...]
}`;

  const raw = await callOpenAI([{ role: 'user', content: prompt }], 300);
  const clean = raw.replace(/```json|```/g, '').trim();
  const result = JSON.parse(clean);

  const tierMap: Record<string, MatchTier> = {
    'Strong Match': 'Strong Match',
    'Good Fit': 'Good Fit',
    'Partial Match': 'Partial Match',
    'Explore Role': 'Explore Role',
  };
  result.tier = tierMap[result.tier] ?? 'Explore Role';
  return result as MatchScoreResult;
}

// ── Interview Prep AI ─────────────────────────────────────────

export async function generateInterviewPrep(
  profile: StudentProfile,
  listing: Listing
): Promise<InterviewPrepResult> {
  const prompt = `You are an expert interview coach. Generate interview preparation material for this student. Return JSON only.

Role: ${listing.title}
Required Skills: ${listing.required_skills.join(', ')}
Student Skills: ${profile.skills.join(', ')}
Student Projects: ${profile.projects.map((p) => `${p.title}: ${p.description}`).join('\n')}

Return JSON:
{
  "questions": [
    { "question": "<string>", "sample_answer": "<string>", "category": "<Technical|Behavioral|HR>" },
    ...
  ],
  "preparation_roadmap": [<string>, ...],
  "topics_to_revise": [<string>, ...]
}

Generate 8 questions (4 technical, 2 behavioral, 2 HR).`;

  const raw = await callOpenAI([{ role: 'user', content: prompt }], 1200);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as InterviewPrepResult;
}
