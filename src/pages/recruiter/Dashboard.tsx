import { useAuth } from '@/integrations/auth';
import { useQuery } from '@tanstack/react-query';
import { companyService, listingService, applicationService } from '@/services';
import { Link } from 'react-router-dom';
import {
  Building2, FileText, Users, TrendingUp, Plus, ChevronRight,
  Eye, Clock, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';

export default function RecruiterDashboard() {
  const { user } = useAuth();

  const { data: company } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: () => companyService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['recruiter-listings', user?.id],
    queryFn: () => listingService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['recruiter-applications', user?.id],
    queryFn: () => applicationService.getByRecruiter(user!.id),
    enabled: !!user,
  });

  const stats = {
    activeListings: listings.filter((l) => l.status === 'active').length,
    totalApplications: applications.length,
    shortlisted: applications.filter((a) => a.status === 'shortlisted').length,
    totalViews: listings.reduce((acc, l) => acc + l.view_count, 0),
  };

  const recentApplications = applications.slice(0, 5);

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Recruiter Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage listings and review candidates</p>
        </div>
        <Link to="/recruiter/post" className="btn-primary text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Internship
        </Link>
      </div>

      {/* Company verification banner */}
      {!company && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Set up your company profile first</p>
              <p className="text-xs text-yellow-600">You need a verified company to post internships.</p>
            </div>
          </div>
          <Link to="/recruiter/company" className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 flex items-center gap-1">
            Set up <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {company && company.verification_status === 'pending' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Verification in progress</p>
            <p className="text-xs text-blue-600">Your company is being reviewed. You can post internships — they'll go live once verified.</p>
          </div>
        </div>
      )}

      {company && company.verification_status === 'verified' && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            <span className="font-bold">{company.display_name ?? company.name}</span> is verified ✓
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Listings', value: stats.activeListings, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Applications', value: stats.totalApplications, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Shortlisted', value: stats.shortlisted, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total Views', value: stats.totalViews, icon: Eye, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-2xl font-black mb-0.5 ${color}`}>{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Listings</h2>
            <Link to="/recruiter/listings" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">No listings yet</p>
              <Link to="/recruiter/post" className="btn-primary text-xs px-4 py-2">Post first internship</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-500">{l.application_count} applicants · {l.view_count} views</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-3 ${
                    l.status === 'active' ? 'bg-green-50 text-green-700' :
                    l.status === 'pending_review' ? 'bg-yellow-50 text-yellow-700' :
                    l.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {l.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Applications</h2>
            <Link to="/recruiter/applicants" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No applications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/recruiter/applicants/${app.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {app.profile?.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {app.student_profile?.name ?? app.profile?.email ?? 'Student'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{app.listing?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {app.match_score != null && (
                      <span className="text-xs font-bold text-primary-600">{app.match_score}%</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
