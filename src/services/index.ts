import { supabase } from '@/lib/supabase';
import type {
  StudentProfile, StudentProfileForm, Company, CompanyForm,
  Listing, ListingForm, Application, ApplicationStatus,
  Notification, AiMatch, AiResumeReview, ListingFilters,
  AdminAction, TargetType,
} from '@/types';

// ── STUDENT PROFILE ───────────────────────────────────────────

export const studentService = {
  async getProfile(userId: string): Promise<StudentProfile | null> {
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return data;
  },

  async upsertProfile(userId: string, form: Partial<StudentProfileForm>): Promise<StudentProfile> {
    const score = calculateProfileScore(form);
    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({
        user_id: userId,
        ...form,
        profile_score: score,
        profile_complete: score >= 60,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadResume(userId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${userId}/resume-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('resumes').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path);
    return publicUrl;
  },
};

function calculateProfileScore(profile: Partial<StudentProfileForm>): number {
  let score = 0;
  if (profile.name) score += 10;
  if (profile.bio) score += 10;
  if (profile.city) score += 5;
  if (profile.skills && profile.skills.length > 0) score += 20;
  if (profile.skills && profile.skills.length >= 5) score += 10;
  if (profile.github_url) score += 10;
  if (profile.linkedin_url) score += 10;
  if (profile.portfolio_url) score += 5;
  if (profile.education && profile.education.length > 0) score += 10;
  if (profile.projects && profile.projects.length > 0) score += 10;
  return Math.min(score, 100);
}

// ── COMPANY ───────────────────────────────────────────────────

export const companyService = {
  async getByRecruiter(recruiterId: string): Promise<Company | null> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .single();
    return data;
  },

  async getById(id: string): Promise<Company | null> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  },

  async create(recruiterId: string, form: CompanyForm): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert({ recruiter_id: recruiterId, ...form })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, form: Partial<CompanyForm>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async uploadLogo(companyId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `${companyId}/logo.${ext}`;
    const { error } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
    return publicUrl;
  },

  async getAll(): Promise<Company[]> {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    return data ?? [];
  },

  async updateVerification(
    id: string,
    status: 'verified' | 'rejected',
    adminId: string,
    reason?: string
  ): Promise<void> {
    const { error } = await supabase.from('companies').update({
      verification_status: status,
      verified_by: adminId,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      rejection_reason: reason ?? null,
    }).eq('id', id);
    if (error) throw error;
  },
};

// ── LISTINGS ─────────────────────────────────────────────────

export const listingService = {
  async getActive(filters?: ListingFilters): Promise<Listing[]> {
    let query = supabase
      .from('listings')
      .select('*, company:companies(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.remote !== undefined) query = query.eq('remote', filters.remote);
    if (filters?.location) query = query.ilike('location', `%${filters.location}%`);
    if (filters?.query) query = query.textSearch('title', filters.query, { type: 'websearch' });

    const { data } = await query;
    return data ?? [];
  },

  async getById(id: string): Promise<Listing | null> {
    const { data } = await supabase
      .from('listings')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();
    // Increment view count
    if (data) supabase.from('listings').update({ view_count: data.view_count + 1 }).eq('id', id);
    return data;
  },

  async getByRecruiter(recruiterId: string): Promise<Listing[]> {
    const { data } = await supabase
      .from('listings')
      .select('*, company:companies(*)')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });
    return data ?? [];
  },

  async create(recruiterId: string, companyId: string, form: ListingForm): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .insert({
        recruiter_id: recruiterId,
        company_id: companyId,
        ...form,
        status: 'pending_review',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<ListingForm & { status: string }>): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPendingReview(): Promise<Listing[]> {
    const { data } = await supabase
      .from('listings')
      .select('*, company:companies(*)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false });
    return data ?? [];
  },
};

// ── APPLICATIONS ─────────────────────────────────────────────

export const applicationService = {
  async apply(
    studentId: string, listingId: string, companyId: string,
    recruiterId: string, matchScore?: number, coverNote?: string
  ): Promise<Application> {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        student_id: studentId,
        listing_id: listingId,
        company_id: companyId,
        recruiter_id: recruiterId,
        match_score: matchScore,
        cover_note: coverNote,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByStudent(studentId: string): Promise<Application[]> {
    const { data } = await supabase
      .from('applications')
      .select('*, listing:listings(*, company:companies(*))')
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false });
    return data ?? [];
  },

  async getByListing(listingId: string): Promise<Application[]> {
    const { data } = await supabase
      .from('applications')
      .select('*, student_profile:student_profiles(*), profile:profiles(email)')
      .eq('listing_id', listingId)
      .order('match_score', { ascending: false });
    return data ?? [];
  },

  async getByRecruiter(recruiterId: string): Promise<Application[]> {
    const { data } = await supabase
      .from('applications')
      .select('*, listing:listings(*), student_profile:student_profiles(*), profile:profiles(email)')
      .eq('recruiter_id', recruiterId)
      .order('applied_at', { ascending: false });
    return data ?? [];
  },

  async updateStatus(id: string, status: ApplicationStatus, note?: string): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (note) updates.recruiter_note = note;
    if (status === 'shortlisted') updates.email_revealed = true;
    const { error } = await supabase.from('applications').update(updates).eq('id', id);
    if (error) throw error;
    // Create notification
    const { data: app } = await supabase.from('applications').select('student_id').eq('id', id).single();
    if (app) {
      await notificationService.create(app.student_id, status === 'shortlisted' ? 'shortlisted' : 'rejected',
        status === 'shortlisted' ? '🎉 You\'ve been shortlisted!' : 'Application update',
        status === 'shortlisted' ? 'A recruiter has shortlisted your application.' : 'Your application status has been updated.',
        undefined, id
      );
    }
  },

  async hasApplied(studentId: string, listingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('listing_id', listingId)
      .single();
    return !!data;
  },
};

// ── NOTIFICATIONS ─────────────────────────────────────────────

export const notificationService = {
  async getByUser(userId: string): Promise<Notification[]> {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return data ?? [];
  },

  async markRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  async markAllRead(userId: string): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId);
  },

  async create(
    recipientId: string,
    type: Notification['type'],
    title: string,
    body: string,
    listingId?: string,
    applicationId?: string,
  ): Promise<void> {
    await supabase.from('notifications').insert({
      recipient_id: recipientId,
      type,
      title,
      body,
      related_listing_id: listingId,
      related_application_id: applicationId,
    });
  },
};

// ── AI MATCHES ────────────────────────────────────────────────

export const aiMatchService = {
  async getByStudent(studentId: string): Promise<AiMatch[]> {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('ai_matches')
      .select('*, listing:listings(*, company:companies(*))')
      .eq('student_id', studentId)
      .gt('expires_at', now)
      .order('score', { ascending: false })
      .limit(20);
    return data ?? [];
  },

  async upsert(match: Omit<AiMatch, 'id' | 'generated_at' | 'expires_at'>): Promise<void> {
    const { error } = await supabase.from('ai_matches').upsert({
      ...match,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'student_id,listing_id' });
    if (error) throw error;
  },
};

// ── AI RESUME REVIEWS ─────────────────────────────────────────

export const aiResumeService = {
  async getLatest(studentId: string): Promise<AiResumeReview | null> {
    const { data } = await supabase
      .from('ai_resume_reviews')
      .select('*')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  },

  async save(review: Omit<AiResumeReview, 'id' | 'generated_at'>): Promise<void> {
    await supabase.from('ai_resume_reviews').insert({
      ...review,
      generated_at: new Date().toISOString(),
    });
  },
};

// ── AI USAGE ──────────────────────────────────────────────────

export const aiUsageService = {
  async checkAndIncrement(userId: string, type: 'match' | 'resume', limit: number): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const field = type === 'match' ? 'match_calls' : 'resume_calls';

    // Upsert today's row
    await supabase.from('ai_usage').upsert(
      { user_id: userId, date: today },
      { onConflict: 'user_id,date', ignoreDuplicates: true }
    );

    const { data } = await supabase
      .from('ai_usage')
      .select(field)
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const current = data ? (data as Record<string, number>)[field] : 0;
    if (current >= limit) return false;

    await supabase.from('ai_usage')
      .update({ [field]: current + 1 })
      .eq('user_id', userId)
      .eq('date', today);

    return true;
  },
};

// ── ADMIN ─────────────────────────────────────────────────────

export const adminService = {
  async getStats(): Promise<{
    totalUsers: number; students: number; recruiters: number;
    activeListings: number; totalApplications: number; verifiedCompanies: number;
  }> {
    const [users, listings, apps, companies] = await Promise.all([
      supabase.from('profiles').select('role', { count: 'exact' }),
      supabase.from('listings').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('applications').select('id', { count: 'exact' }),
      supabase.from('companies').select('id', { count: 'exact' }).eq('verification_status', 'verified'),
    ]);
    const usersData = users.data ?? [];
    return {
      totalUsers: users.count ?? 0,
      students: usersData.filter((u) => u.role === 'student').length,
      recruiters: usersData.filter((u) => u.role === 'recruiter').length,
      activeListings: listings.count ?? 0,
      totalApplications: apps.count ?? 0,
      verifiedCompanies: companies.count ?? 0,
    };
  },

  async getAllUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    return data ?? [];
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<void> {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
    if (error) throw error;
  },

  async logAction(
    adminId: string,
    action: AdminAction,
    targetType: TargetType,
    targetId: string,
    previousValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    reason?: string,
  ): Promise<void> {
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      previous_value: previousValue,
      new_value: newValue,
      reason,
    });
  },

  async getLogs() {
    const { data } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    return data ?? [];
  },
};
