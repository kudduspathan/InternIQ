-- ============================================================
-- InternIQ MVP — Supabase PostgreSQL Migration v1.0
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ── ENUMS ────────────────────────────────────────────────────
CREATE TYPE user_role   AS ENUM ('student', 'recruiter', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE company_status AS ENUM ('active', 'suspended');
CREATE TYPE team_size AS ENUM ('1-10', '11-50', '51-200', '200+');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'active', 'closed', 'removed');
CREATE TYPE stipend_period AS ENUM ('monthly', 'total', 'unpaid');
CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'rejected', 'hired', 'withdrawn');
CREATE TYPE match_tier AS ENUM ('Strong Match', 'Good Fit', 'Partial Match', 'Explore Role');
CREATE TYPE notification_type AS ENUM (
  'application_received', 'shortlisted', 'rejected', 'new_match',
  'listing_approved', 'listing_flagged', 'company_verified'
);
CREATE TYPE admin_action AS ENUM (
  'verify_company', 'reject_company', 'remove_listing',
  'suspend_user', 'ban_user', 'restore_user', 'approve_listing', 'reject_listing'
);
CREATE TYPE target_type AS ENUM ('user', 'company', 'listing');
CREATE TYPE flag_reason AS ENUM ('fake', 'misleading', 'spam', 'inappropriate', 'other');
CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'dismissed');

-- ── TABLES ───────────────────────────────────────────────────

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  role            user_role NOT NULL DEFAULT 'student',
  status          user_status NOT NULL DEFAULT 'active',
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role_status ON profiles(role, status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- 2. STUDENT PROFILES
CREATE TABLE IF NOT EXISTS student_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL DEFAULT '',
  phone                 TEXT,
  city                  TEXT,
  bio                   TEXT CHECK (char_length(bio) <= 300),
  skills                TEXT[] NOT NULL DEFAULT '{}',
  preferred_categories  TEXT[] DEFAULT '{}',
  resume_url            TEXT,
  resume_text           TEXT,
  portfolio_url         TEXT,
  github_url            TEXT,
  linkedin_url          TEXT,
  profile_score         INTEGER NOT NULL DEFAULT 0 CHECK (profile_score BETWEEN 0 AND 100),
  profile_complete      BOOLEAN NOT NULL DEFAULT false,
  education             JSONB DEFAULT '[]',
  projects              JSONB DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_city ON student_profiles(city);
CREATE INDEX idx_student_profiles_score ON student_profiles(profile_score DESC);
CREATE INDEX idx_student_profiles_skills ON student_profiles USING GIN(skills);

-- 3. COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  display_name        TEXT,
  logo_url            TEXT,
  website             TEXT,
  description         TEXT CHECK (char_length(description) <= 500),
  industry            TEXT,
  team_size           team_size,
  city                TEXT,
  gstin               TEXT,
  pan                 TEXT,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verification_docs   TEXT[] DEFAULT '{}',
  verified_at         TIMESTAMPTZ,
  verified_by         UUID REFERENCES profiles(id),
  rejection_reason    TEXT,
  status              company_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_recruiter_id ON companies(recruiter_id);
CREATE INDEX idx_companies_verification_status ON companies(verification_status);
CREATE INDEX idx_companies_status ON companies(status, verification_status);

-- 4. LISTINGS
CREATE TABLE IF NOT EXISTS listings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recruiter_id        UUID NOT NULL REFERENCES profiles(id),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  category            TEXT NOT NULL,
  required_skills     TEXT[] NOT NULL DEFAULT '{}',
  nice_to_have_skills TEXT[] DEFAULT '{}',
  location            TEXT,
  remote              BOOLEAN NOT NULL DEFAULT false,
  stipend_amount      NUMERIC,
  stipend_currency    TEXT DEFAULT 'INR',
  stipend_period      stipend_period,
  duration            TEXT,
  openings            INTEGER DEFAULT 1,
  start_date          TIMESTAMPTZ,
  apply_deadline      TIMESTAMPTZ,
  status              listing_status NOT NULL DEFAULT 'draft',
  featured            BOOLEAN NOT NULL DEFAULT false,
  flag_count          INTEGER NOT NULL DEFAULT 0,
  view_count          INTEGER NOT NULL DEFAULT 0,
  application_count   INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX idx_listings_company_status ON listings(company_id, status);
CREATE INDEX idx_listings_recruiter ON listings(recruiter_id);
CREATE INDEX idx_listings_category ON listings(category, status);
CREATE INDEX idx_listings_skills ON listings USING GIN(required_skills);
CREATE INDEX idx_listings_featured ON listings(featured, status, created_at DESC);
CREATE INDEX idx_listings_search ON listings USING GIN(to_tsvector('english', title || ' ' || description));

-- 5. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id),
  recruiter_id      UUID NOT NULL REFERENCES profiles(id),
  status            application_status NOT NULL DEFAULT 'applied',
  match_score       INTEGER CHECK (match_score BETWEEN 0 AND 100),
  cover_note        TEXT CHECK (char_length(cover_note) <= 300),
  recruiter_note    TEXT,
  email_revealed    BOOLEAN NOT NULL DEFAULT false,
  applied_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, listing_id)
);

CREATE INDEX idx_applications_student ON applications(student_id, applied_at DESC);
CREATE INDEX idx_applications_listing_status ON applications(listing_id, status);
CREATE INDEX idx_applications_listing_score ON applications(listing_id, match_score DESC);
CREATE INDEX idx_applications_recruiter ON applications(recruiter_id, status);
CREATE INDEX idx_applications_company ON applications(company_id, applied_at DESC);

-- 6. AI MATCHES (cached)
CREATE TABLE IF NOT EXISTS ai_matches (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id          UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  tier                match_tier NOT NULL,
  explanation         TEXT NOT NULL,
  top_matching_skills TEXT[] NOT NULL DEFAULT '{}',
  model_version       TEXT NOT NULL DEFAULT 'gpt-4o',
  prompt_version      TEXT NOT NULL DEFAULT 'v1',
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  UNIQUE(student_id, listing_id)
);

CREATE INDEX idx_ai_matches_student_score ON ai_matches(student_id, score DESC);
CREATE INDEX idx_ai_matches_listing_score ON ai_matches(listing_id, score DESC);
CREATE INDEX idx_ai_matches_expires ON ai_matches(expires_at);

-- 7. AI RESUME REVIEWS
CREATE TABLE IF NOT EXISTS ai_resume_reviews (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_score     INTEGER NOT NULL CHECK (profile_score BETWEEN 0 AND 100),
  missing_sections  TEXT[] DEFAULT '{}',
  suggested_skills  TEXT[] DEFAULT '{}',
  tone_suggestions  TEXT[] DEFAULT '{}',
  strengths         TEXT[] DEFAULT '{}',
  weaknesses        TEXT[] DEFAULT '{}',
  improvement_checklist TEXT[] DEFAULT '{}',
  raw_feedback      TEXT,
  model_version     TEXT NOT NULL DEFAULT 'gpt-4o',
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_resume_reviews_student ON ai_resume_reviews(student_id, generated_at DESC);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type                  notification_type NOT NULL,
  title                 TEXT NOT NULL,
  body                  TEXT NOT NULL,
  related_listing_id    UUID REFERENCES listings(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  read                  BOOLEAN NOT NULL DEFAULT false,
  email_sent            BOOLEAN NOT NULL DEFAULT false,
  email_sent_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);

-- 9. ADMIN LOGS
CREATE TABLE IF NOT EXISTS admin_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID NOT NULL REFERENCES profiles(id),
  action          admin_action NOT NULL,
  target_type     target_type NOT NULL,
  target_id       UUID NOT NULL,
  previous_value  JSONB,
  new_value       JSONB,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id, created_at DESC);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- 10. FLAGS
CREATE TABLE IF NOT EXISTS flags (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reason       flag_reason NOT NULL,
  details      TEXT,
  status       flag_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reporter_id, listing_id)
);

CREATE INDEX idx_flags_listing ON flags(listing_id, status);
CREATE INDEX idx_flags_status ON flags(status, created_at DESC);

-- 11. AI USAGE LIMITS
CREATE TABLE IF NOT EXISTS ai_usage (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  match_calls      INTEGER NOT NULL DEFAULT 0,
  resume_calls     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, date);

-- ── AUTO-UPDATE TIMESTAMPS ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at        BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_companies_updated_at        BEFORE UPDATE ON companies        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_listings_updated_at         BEFORE UPDATE ON listings         FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── APPLICATION STATUS TIMESTAMP ──────────────────────────────
CREATE OR REPLACE FUNCTION update_application_status_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_status BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_application_status_at();

-- ── CREATE PROFILE ON AUTH SIGNUP ─────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── INCREMENT APPLICATION COUNT ON LISTING ────────────────────
CREATE OR REPLACE FUNCTION increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings SET application_count = application_count + 1 WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_count
AFTER INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION increment_application_count();

-- ── INCREMENT FLAG COUNT ──────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_flag_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE listings SET flag_count = flag_count + 1 WHERE id = NEW.listing_id;
  -- Auto-escalate if flag_count reaches 3
  UPDATE listings SET status = 'pending_review'
  WHERE id = NEW.listing_id AND flag_count >= 3 AND status = 'active';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_count
AFTER INSERT ON flags
FOR EACH ROW EXECUTE FUNCTION increment_flag_count();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_resume_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage         ENABLE ROW LEVEL SECURITY;

-- Helper: check role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- PROFILES POLICIES
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admin full access to profiles"
  ON profiles FOR ALL USING (auth_role() = 'admin');

-- STUDENT PROFILES POLICIES
CREATE POLICY "Student can read/write own profile"
  ON student_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Recruiters can read student profiles"
  ON student_profiles FOR SELECT USING (auth_role() = 'recruiter');
CREATE POLICY "Admin can read all student profiles"
  ON student_profiles FOR ALL USING (auth_role() = 'admin');

-- COMPANIES POLICIES
CREATE POLICY "Recruiter can manage own company"
  ON companies FOR ALL USING (recruiter_id = auth.uid());
CREATE POLICY "Authenticated can read verified companies"
  ON companies FOR SELECT
  USING (auth.uid() IS NOT NULL AND verification_status = 'verified' AND status = 'active');
CREATE POLICY "Admin full access to companies"
  ON companies FOR ALL USING (auth_role() = 'admin');

-- LISTINGS POLICIES
CREATE POLICY "Recruiter can manage own listings"
  ON listings FOR ALL USING (recruiter_id = auth.uid());
CREATE POLICY "Authenticated can read active listings"
  ON listings FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');
CREATE POLICY "Admin full access to listings"
  ON listings FOR ALL USING (auth_role() = 'admin');

-- APPLICATIONS POLICIES
CREATE POLICY "Student can create applications"
  ON applications FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Student can read own applications"
  ON applications FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Recruiter can read applications for own listings"
  ON applications FOR SELECT USING (recruiter_id = auth.uid());
CREATE POLICY "Recruiter can update application status"
  ON applications FOR UPDATE USING (recruiter_id = auth.uid());
CREATE POLICY "Admin can read all applications"
  ON applications FOR ALL USING (auth_role() = 'admin');

-- AI MATCHES POLICIES
CREATE POLICY "Student can read own matches"
  ON ai_matches FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "System can write matches"
  ON ai_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update matches"
  ON ai_matches FOR UPDATE USING (true);

-- AI RESUME REVIEWS POLICIES
CREATE POLICY "Student can read own reviews"
  ON ai_resume_reviews FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "System can write reviews"
  ON ai_resume_reviews FOR INSERT WITH CHECK (true);

-- NOTIFICATIONS POLICIES
CREATE POLICY "User can read own notifications"
  ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "User can update own notifications"
  ON notifications FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);

-- ADMIN LOGS POLICIES
CREATE POLICY "Admin can read logs"
  ON admin_logs FOR SELECT USING (auth_role() = 'admin');
CREATE POLICY "Admin can write logs"
  ON admin_logs FOR INSERT WITH CHECK (auth_role() = 'admin');

-- FLAGS POLICIES
CREATE POLICY "Authenticated can create flags"
  ON flags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND reporter_id = auth.uid());
CREATE POLICY "Admin can read and update flags"
  ON flags FOR ALL USING (auth_role() = 'admin');

-- AI USAGE POLICIES
CREATE POLICY "User can read own usage"
  ON ai_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage ai usage"
  ON ai_usage FOR ALL WITH CHECK (true);

-- ── STORAGE BUCKETS ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resumes',            'resumes',            false),
  ('company-logos',      'company-logos',      true),
  ('verification-docs',  'verification-docs',  false)
ON CONFLICT (id) DO NOTHING;

-- Resumes: only owner can upload; recruiters can read if they have an application
CREATE POLICY "Student can upload own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Student can read own resume"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Recruiter can read resume if application exists"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    auth_role() = 'recruiter' AND
    EXISTS (
      SELECT 1 FROM applications a
      WHERE a.recruiter_id = auth.uid()
        AND a.student_id::text = (storage.foldername(name))[1]
        AND a.email_revealed = true
    )
  );

-- Company logos: public read, recruiter write
CREATE POLICY "Recruiter can upload company logo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth_role() = 'recruiter');

CREATE POLICY "Public can read company logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- Verification docs: only owner upload, admin read
CREATE POLICY "Recruiter can upload verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs' AND auth_role() = 'recruiter');

CREATE POLICY "Admin can read verification docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs' AND auth_role() = 'admin');
