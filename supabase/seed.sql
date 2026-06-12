-- ============================================================
-- InternIQ Seed Data
-- Run AFTER the migration script
-- Replace placeholder UUIDs with real auth.users IDs
-- ============================================================

-- To create an admin user:
-- 1. Register normally via the app with any email
-- 2. Find the user's UUID in Supabase Auth → Users
-- 3. Run this UPDATE:

-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';

-- ── SAMPLE SKILL TAGS (reference) ────────────────────────────
-- These are stored in the app constants file, not in a DB table.
-- The schema uses text arrays for skills.

-- ── SAMPLE CATEGORIES for listings ───────────────────────────
-- 'Engineering', 'Design', 'Marketing', 'Data Science',
-- 'Product Management', 'Finance', 'Operations', 'Content', 'Sales'

-- ── NOTES ────────────────────────────────────────────────────
-- 1. All tables have RLS enabled. Service role key bypasses RLS.
-- 2. The handle_new_user() trigger auto-creates profiles on signup.
-- 3. AI matches expire after 7 days (expires_at column).
-- 4. Flag count >= 3 auto-moves listing to pending_review.
-- 5. Application count is auto-incremented by trigger.
