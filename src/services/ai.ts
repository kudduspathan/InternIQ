import type {
  StudentProfile, Listing, ResumeReviewResult,
  MatchScoreResult, MatchTier, InterviewPrepResult,
} from '@/types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

async function callGroq(prompt: string, maxTokens = 1500): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Always respond with valid JSON only. No markdown, no explanation, no backticks.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Groq API error');
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ── Resume Analyzer ───────────────────────────────────────────

export async function analyzeResume(
  profile: StudentProfile
): Promise<ResumeReviewResult> {
  const prompt = `Analyze this student profile and return a JSON object only.

Student Profile:
- Name: ${profile.name}
- Skills: ${profile.skills.join(', ')}
- Bio: ${profile.bio ?? 'Not provided'}
- GitHub: ${profile.github_url ?? 'Not provided'}
- LinkedIn: ${profile.linkedin_url ?? 'Not provided'}
- Portfolio: ${profile.portfolio_url ?? 'Not provided'}
- Education: ${JSON.stringify(profile.education)}
- Projects: ${JSON.stringify(profile.projects)}
- Resume Text: ${profile.resume_text?.slice(0, 1500) ?? 'Not uploaded'}

Return exactly this JSON structure:
{
  "score": <number between 0 and 100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "missing_sections": ["missing1", "missing2"],
  "suggested_keywords": ["keyword1", "keyword2", "keyword3"],
  "improvement_checklist": ["action1", "action2", "action3"],
  "tone_suggestions": ["suggestion1", "suggestion2"]
}`;

  const raw = await callGroq(prompt, 1000);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as ResumeReviewResult;
}

// ── Match Score Engine ────────────────────────────────────────

export async function generateMatchScore(
  profile: StudentProfile,
  listing: Listing
): Promise<MatchScoreResult> {
  const prompt = `Score how well this student matches this internship. Return JSON only.

Student:
- Skills: ${profile.skills.join(', ')}
- Bio: ${profile.bio ?? 'Not provided'}
- Projects: ${profile.projects.map((p) => p.title).join(', ')}

Internship:
- Title: ${listing.title}
- Required Skills: ${listing.required_skills.join(', ')}
- Nice to Have: ${listing.nice_to_have_skills.join(', ')}
- Description: ${listing.description.slice(0, 400)}

Return exactly this JSON:
{
  "score": <number 0-100>,
  "tier": "<one of: Strong Match, Good Fit, Partial Match, Explore Role>",
  "explanation": "<one sentence under 30 words>",
  "top_matching_skills": ["skill1", "skill2", "skill3"]
}`;

  const raw = await callGroq(prompt, 400);
  const clean = raw.replace(/```json|```/g, '').trim();
  const result = JSON.parse(clean);

  const validTiers: MatchTier[] = [
    'Strong Match', 'Good Fit', 'Partial Match', 'Explore Role',
  ];
  if (!validTiers.includes(result.tier)) {
    result.tier = 'Explore Role';
  }

  return result as MatchScoreResult;
}

// ── Interview Prep AI ─────────────────────────────────────────

export async function generateInterviewPrep(
  profile: StudentProfile,
  listing: Listing
): Promise<InterviewPrepResult> {
  const prompt = `Generate interview preparation material for this student applying for this role. Return JSON only.

Role: ${listing.title}
Required Skills: ${listing.required_skills.join(', ')}
Student Skills: ${profile.skills.join(', ')}
Student Projects: ${profile.projects
    .map((p) => `${p.title}: ${p.description}`)
    .join(' | ')}

Return exactly this JSON:
{
  "questions": [
    { "question": "...", "sample_answer": "...", "category": "Technical" },
    { "question": "...", "sample_answer": "...", "category": "Technical" },
    { "question": "...", "sample_answer": "...", "category": "Technical" },
    { "question": "...", "sample_answer": "...", "category": "Technical" },
    { "question": "...", "sample_answer": "...", "category": "Behavioral" },
    { "question": "...", "sample_answer": "...", "category": "Behavioral" },
    { "question": "...", "sample_answer": "...", "category": "HR" },
    { "question": "...", "sample_answer": "...", "category": "HR" }
  ],
  "preparation_roadmap": [
    "step 1...",
    "step 2...",
    "step 3...",
    "step 4..."
  ],
  "topics_to_revise": [
    "topic1",
    "topic2",
    "topic3",
    "topic4",
    "topic5"
  ]
}`;

  const raw = await callGroq(prompt, 1500);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as InterviewPrepResult;
}