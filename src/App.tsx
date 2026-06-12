import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './integrations/auth';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import RecruiterLayout from './layouts/RecruiterLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import AuthCallbackPage from './pages/public/AuthCallbackPage';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import BrowsePage from './pages/student/Browse';
import InternshipDetail from './pages/student/InternshipDetail';
import ApplicationsPage from './pages/student/Applications';
import InterviewPrepPage from './pages/student/InterviewPrep';
import NotificationsPage from './pages/student/Notifications';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/Dashboard';
import CompanyPage from './pages/recruiter/Company';
import PostListingPage from './pages/recruiter/PostListing';
import RecruiterListings from './pages/recruiter/Listings';
import ApplicantsPage from './pages/recruiter/Applicants';
import ApplicantDetailPage from './pages/recruiter/ApplicantDetail';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCompanies from './pages/admin/Companies';
import AdminListings from './pages/admin/Listings';
import AdminLogs from './pages/admin/Logs';

function RouteGuard({ role, children }: { role: 'student' | 'recruiter' | 'admin'; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status !== 'active') return <Navigate to="/login" replace />;
  if (user.role !== role) {
    const redirects = { student: '/dashboard', recruiter: '/recruiter', admin: '/admin' };
    return <Navigate to={redirects[user.role]} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>

      {/* Student */}
      <Route element={<RouteGuard role="student"><StudentLayout /></RouteGuard>}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/internships/:id" element={<InternshipDetail />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/interview-prep" element={<InterviewPrepPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Recruiter */}
      <Route element={<RouteGuard role="recruiter"><RecruiterLayout /></RouteGuard>}>
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/recruiter/company" element={<CompanyPage />} />
        <Route path="/recruiter/post" element={<PostListingPage />} />
        <Route path="/recruiter/listings" element={<RecruiterListings />} />
        <Route path="/recruiter/applicants" element={<ApplicantsPage />} />
        <Route path="/recruiter/applicants/:id" element={<ApplicantDetailPage />} />
      </Route>

      {/* Admin */}
      <Route element={<RouteGuard role="admin"><AdminLayout /></RouteGuard>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/companies" element={<AdminCompanies />} />
        <Route path="/admin/listings" element={<AdminListings />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
