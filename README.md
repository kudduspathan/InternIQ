# InternIQ — From Learning to Earning

AI-powered internship and fresher hiring platform.  
**Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase + OpenAI + Vercel

---

## ✅ Features

### Student
- AI match score for every listing (GPT-4o)
- Resume/profile AI review with checklist
- One-click apply with cover note
- Application tracker with status updates
- Interview Prep AI (questions, answers, roadmap)
- Notifications
- Profile wizard with score (skills, education, projects, links)

### Recruiter
- Company profile + logo upload
- Company verification workflow
- Post / edit / pause / close internships
- Applicant dashboard sorted by AI match score
- Shortlist / reject / hire candidates
- Contact reveal on shortlist
- Dashboard analytics

### Admin
- Platform analytics dashboard
- Company verification queue (approve/reject)
- Listing moderation (review queue + remove)
- User management (suspend / ban / restore)
- Full audit log of all admin actions

---

## 🚀 Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/interniq.git
cd interniq
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-your-openai-key
```

### 3. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New query**
3. Paste and run `supabase/migrations/001_initial_schema.sql`
4. Enable **Google OAuth** (optional):
   - Settings → Auth → Providers → Google
   - Add your Google OAuth credentials
   - Set redirect URL: `https://your-domain.com/auth/callback`

### 4. Create admin user

1. Register on the app with your admin email
2. Go to Supabase → SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### 5. Run locally

```bash
npm run dev
```

App runs at: http://localhost:5173

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn-style base components
│   ├── common/       # shared across roles
│   ├── student/
│   ├── recruiter/
│   └── admin/
├── pages/
│   ├── public/       # Landing, Login, Register, etc.
│   ├── student/      # Dashboard, Profile, Browse, etc.
│   ├── recruiter/    # Dashboard, Company, Post, etc.
│   └── admin/        # Dashboard, Users, Companies, etc.
├── layouts/          # StudentLayout, RecruiterLayout, AdminLayout
├── services/         # Supabase DB operations (index.ts)
├── services/ai.ts    # OpenAI integration
├── integrations/
│   └── auth.tsx      # Supabase Auth context
├── types/index.ts    # All TypeScript types
├── constants/        # Skills, categories, cities
└── lib/
    ├── supabase.ts   # Supabase client
    └── utils.ts      # cn() utility
supabase/
├── migrations/
│   └── 001_initial_schema.sql  # Full schema + RLS + triggers + storage
└── seed.sql
```

---

## 🗺️ Routes

| Path | Role | Description |
|------|------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Email + Google login |
| `/register` | Public | Role-based registration |
| `/forgot-password` | Public | Password reset request |
| `/reset-password` | Public | Set new password |
| `/dashboard` | Student | AI match feed + quick actions |
| `/profile` | Student | Profile wizard + AI resume review |
| `/browse` | Student | Browse + filter listings |
| `/internships/:id` | Student | Detail + apply + match score |
| `/applications` | Student | Application tracker |
| `/interview-prep` | Student | AI interview questions |
| `/notifications` | Student | Notification centre |
| `/recruiter` | Recruiter | Dashboard + analytics |
| `/recruiter/company` | Recruiter | Company profile + verification |
| `/recruiter/post` | Recruiter | Post new internship |
| `/recruiter/listings` | Recruiter | Manage listings |
| `/recruiter/applicants` | Recruiter | All applicants (sorted by AI score) |
| `/recruiter/applicants/:id` | Recruiter | Applicant detail + actions |
| `/admin` | Admin | Platform stats |
| `/admin/users` | Admin | User management |
| `/admin/companies` | Admin | Verification queue |
| `/admin/listings` | Admin | Moderation queue |
| `/admin/logs` | Admin | Audit trail |

---

## 🤖 AI Services

All AI calls go through `src/services/ai.ts`.

| Service | Input | Output | Rate Limit |
|---------|-------|--------|------------|
| Resume Analyzer | Student profile | Score, strengths, gaps, checklist | 3/day |
| Match Score Engine | Profile + listing | 0-100 score, tier, explanation | 20/day |
| Interview Prep | Profile + listing | 8 questions, roadmap, topics | 3/day |

**⚠️ Security Note:** The OpenAI key is currently used client-side via Vite env vars. For production, move AI calls to a Supabase Edge Function or a backend proxy to keep your key server-side.

---

## 🔐 Database Security

- **Row Level Security (RLS)** enabled on all tables
- Students can only read/write their own data
- Recruiters can only manage their own companies/listings
- Recruiter can read applicant profiles only for their listings
- Contact details revealed only when application is shortlisted
- Admins have full access via `auth_role()` helper function
- Storage policies enforce file ownership

---

## 🚢 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables when prompted, or via Vercel dashboard.

### Option B: GitHub integration

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add env vars in **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_OPENAI_API_KEY`
4. Deploy

**Build settings** (auto-detected):
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

---

## 🔧 Post-Deployment Checklist

- [ ] Supabase migration SQL executed
- [ ] Admin user role updated via SQL
- [ ] Google OAuth redirect URL updated to production domain
- [ ] Supabase Auth → URL Configuration → Site URL set to production domain
- [ ] OpenAI key has billing enabled and sufficient credits
- [ ] Storage buckets created (auto-created by migration SQL)
- [ ] Test student registration flow end-to-end
- [ ] Test recruiter company + listing flow
- [ ] Test admin verification flow

---

## 🧪 Local Development Tips

```bash
# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Converting Firebase → Supabase (done)

| Firebase | Supabase |
|----------|----------|
| Firestore collections | PostgreSQL tables |
| Firebase Auth | Supabase Auth |
| Firebase Storage | Supabase Storage |
| Cloud Functions | Supabase Edge Functions / DB Triggers |
| Security Rules | Row Level Security (RLS) |
| `onAuthStateChange` | `supabase.auth.onAuthStateChange` |

---

*InternIQ v1.0 MVP · Built by Intellobyte*
