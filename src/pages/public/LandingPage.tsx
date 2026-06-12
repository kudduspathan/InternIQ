import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Star, Shield, Brain, ArrowRight, CheckCircle2, TrendingUp, Users, Building2 } from 'lucide-react';

const STATS = [
  { label: 'Active Listings', value: '2,400+', icon: TrendingUp },
  { label: 'Students Placed', value: '18,000+', icon: Users },
  { label: 'Verified Companies', value: '340+', icon: Building2 },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Match Score',
    desc: 'Every listing gets a personalised match score based on your skills, projects, and profile — not just keywords.',
    color: 'bg-primary-50 text-primary-600',
  },
  {
    icon: Shield,
    title: 'Verified Companies',
    desc: 'Every recruiter goes through document verification. No fake listings, no ghost companies.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Star,
    title: 'AI Resume Review',
    desc: 'Get actionable feedback on your resume, missing sections, and keyword gaps before you apply.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Zap,
    title: 'One-Click Apply',
    desc: 'Your profile pre-fills every application. Apply to 10 internships in the time it used to take for one.',
    color: 'bg-accent-50 text-emerald-600',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Build your profile', desc: 'Add skills, projects, and upload your resume. Our AI scores it instantly.' },
  { step: '02', title: 'Get matched', desc: 'Our engine scans all active listings and ranks them by how well they fit you.' },
  { step: '03', title: 'Apply in one click', desc: 'Your profile auto-fills the application. Track your status in real time.' },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-purple-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary-100 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-1.5 text-sm font-medium text-primary-700 mb-8">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Internship Matching
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-[1.08] mb-6">
              From{' '}
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Learning
              </span>
              <br />to{' '}
              <span className="bg-gradient-to-r from-accent-600 to-green-500 bg-clip-text text-transparent">
                Earning
              </span>
            </h1>

            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              InternIQ connects students and fresh graduates with verified internships using AI match scores,
              resume analysis, and one-click applications.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-primary-200 text-base"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-all text-base"
              >
                Sign in
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400">
              {['Free for students', 'No credit card needed', '2-min onboarding'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {STATS.map(({ label, value, icon: Icon }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
              <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for students. Trusted by recruiters.</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Every feature is designed to reduce friction and increase your chances of landing the right internship.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Three steps. Zero hassle.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl font-black text-primary-100 mb-4">{step}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Your next internship is waiting.</h2>
            <p className="text-primary-100 text-lg mb-8">
              Join thousands of students who found their first opportunity through InternIQ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register?role=student"
                className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-all"
              >
                I'm a student
              </Link>
              <Link
                to="/register?role=recruiter"
                className="bg-primary-600 border border-primary-400 text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-700 transition-all"
              >
                I'm a recruiter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Zap className="w-4 h-4" />
            <span>© 2026 InternIQ · Intellobyte</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Terms</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
