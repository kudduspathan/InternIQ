export const SKILL_CATEGORIES = {
  Frontend: ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Figma'],
  Backend: ['Node.js', 'Python', 'Django', 'FastAPI', 'Express', 'Java', 'Spring Boot', 'Go', 'PHP', 'Laravel'],
  Mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS'],
  Data: ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Power BI', 'Tableau'],
  Design: ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'Canva', 'Sketch', 'UI/UX'],
  DevOps: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Linux', 'Terraform'],
  Marketing: ['SEO', 'SEM', 'Google Ads', 'Meta Ads', 'Content Writing', 'Email Marketing', 'Analytics'],
  Other: ['Git', 'GitHub', 'Agile', 'Scrum', 'Communication', 'Leadership', 'Problem Solving'],
};

export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

export const CATEGORIES = [
  'Engineering',
  'Design',
  'Marketing',
  'Data Science',
  'Product Management',
  'Finance',
  'Operations',
  'Content',
  'Sales',
  'HR',
  'Legal',
  'Research',
  'Others',
];

export const INDUSTRIES = [
  'SaaS', 'EdTech', 'FinTech', 'HealthTech', 'E-commerce',
  'Media', 'Gaming', 'Logistics', 'AgriTech', 'GovTech',
  'Retail', 'Consulting', 'Manufacturing', 'Real Estate', 'Others',
];

export const CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Indore',
  'Noida', 'Gurgaon', 'Remote',
];

export const DURATION_OPTIONS = [
  '1 month', '2 months', '3 months', '4 months', '6 months', '12 months',
];

export const PROFILE_SCORE_THRESHOLD = 60;

export const AI_RATE_LIMITS = {
  matchCallsPerDay: 20,
  resumeCallsPerDay: 3,
};
