// ── Database Types ────────────────────────────────────────────

export type UserRole = 'student' | 'recruiter' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type CompanyStatus = 'active' | 'suspended';
export type TeamSize = '1-10' | '11-50' | '51-200' | '200+';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'closed' | 'removed';
export type StipendPeriod = 'monthly' | 'total' | 'unpaid';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
export type MatchTier = 'Strong Match' | 'Good Fit' | 'Partial Match' | 'Explore Role';
export type NotificationType =
  | 'application_received'
  | 'shortlisted'
  | 'rejected'
  | 'new_match'
  | 'listing_approved'
  | 'listing_flagged'
  | 'company_verified';
export type AdminAction =
  | 'verify_company'
  | 'reject_company'
  | 'remove_listing'
  | 'suspend_user'
  | 'ban_user'
  | 'restore_user'
  | 'approve_listing'
  | 'reject_listing';
export type TargetType = 'user' | 'company' | 'listing';
export type FlagReason = 'fake' | 'misleading' | 'spam' | 'inappropriate' | 'other';
export type FlagStatus = 'pending' | 'reviewed' | 'dismissed';

// ── Sub-schemas ───────────────────────────────────────────────

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduation_year: number;
  cgpa?: number;
}

export interface Project {
  title: string;
  description: string;
  url?: string;
  skills: string[];
}

// ── Database Row Types ────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  city: string | null;
  bio: string | null;
  skills: string[];
  preferred_categories: string[];
  resume_url: string | null;
  resume_text: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  profile_score: number;
  profile_complete: boolean;
  education: Education[];
  projects: Project[];
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  recruiter_id: string;
  name: string;
  display_name: string | null;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  industry: string | null;
  team_size: TeamSize | null;
  city: string | null;
  gstin: string | null;
  pan: string | null;
  verification_status: VerificationStatus;
  verification_docs: string[];
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  company_id: string;
  recruiter_id: string;
  title: string;
  description: string;
  category: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  location: string | null;
  remote: boolean;
  stipend_amount: number | null;
  stipend_currency: string;
  stipend_period: StipendPeriod | null;
  duration: string | null;
  openings: number;
  start_date: string | null;
  apply_deadline: string | null;
  status: ListingStatus;
  featured: boolean;
  flag_count: number;
  view_count: number;
  application_count: number;
  created_at: string;
  updated_at: string;
  // joined
  company?: Company;
}

export interface Application {
  id: string;
  student_id: string;
  listing_id: string;
  company_id: string;
  recruiter_id: string;
  status: ApplicationStatus;
  match_score: number | null;
  cover_note: string | null;
  recruiter_note: string | null;
  email_revealed: boolean;
  applied_at: string;
  status_updated_at: string;
  // joined
  listing?: Listing;
  student_profile?: StudentProfile;
  profile?: Profile;
}

export interface AiMatch {
  id: string;
  student_id: string;
  listing_id: string;
  score: number;
  tier: MatchTier;
  explanation: string;
  top_matching_skills: string[];
  model_version: string;
  prompt_version: string;
  generated_at: string;
  expires_at: string;
  listing?: Listing;
}

export interface AiResumeReview {
  id: string;
  student_id: string;
  profile_score: number;
  missing_sections: string[];
  suggested_skills: string[];
  tone_suggestions: string[];
  strengths: string[];
  weaknesses: string[];
  improvement_checklist: string[];
  raw_feedback: string | null;
  model_version: string;
  generated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string;
  related_listing_id: string | null;
  related_application_id: string | null;
  read: boolean;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: AdminAction;
  target_type: TargetType;
  target_id: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

// ── Form Types ────────────────────────────────────────────────

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}

export interface StudentProfileForm {
  name: string;
  phone?: string;
  city?: string;
  bio?: string;
  skills: string[];
  preferred_categories: string[];
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  education: Education[];
  projects: Project[];
}

export interface CompanyForm {
  name: string;
  display_name?: string;
  website?: string;
  description?: string;
  industry?: string;
  team_size?: TeamSize;
  city?: string;
  gstin?: string;
  pan?: string;
}

export interface ListingForm {
  title: string;
  description: string;
  category: string;
  required_skills: string[];
  nice_to_have_skills: string[];
  location?: string;
  remote: boolean;
  stipend_amount?: number;
  stipend_period?: StipendPeriod;
  duration?: string;
  openings?: number;
  start_date?: string;
  apply_deadline?: string;
}

// ── AI Types ─────────────────────────────────────────────────

export interface ResumeReviewResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missing_sections: string[];
  suggested_keywords: string[];
  improvement_checklist: string[];
  tone_suggestions: string[];
}

export interface MatchScoreResult {
  score: number;
  tier: MatchTier;
  explanation: string;
  top_matching_skills: string[];
}

export interface InterviewPrepResult {
  questions: { question: string; sample_answer: string; category: string }[];
  preparation_roadmap: string[];
  topics_to_revise: string[];
}

// ── Filters ───────────────────────────────────────────────────

export interface ListingFilters {
  query?: string;
  category?: string;
  location?: string;
  remote?: boolean;
  min_stipend?: number;
  duration?: string;
  skills?: string[];
}

// ── Auth Context ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}
