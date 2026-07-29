export const ROUTES = {
  home:        '/',
  onboarding:  '/onboarding',

  auth: {
    login:    '/login',
    register: '/register',
    forgot:   '/forgot-password',
    verify:   '/verify-login',
    twoFA:    '/2fa',
  },

  dashboard:     '/dashboard',
  jobs:          '/jobs',
  jobDetail:     (id: string | number): string => `/jobs/${id}`,
  market:        '/market',
  marketplace:   '/marketplace',
  chat:          '/chat',
  chatThread:    (id: string | number): string => `/chat/${id}`,
  wallet:        '/wallet',
  booking:       '/booking',
  notifications: '/notifications',
  profile:       '/profile',
  editProfile:   '/edit-profile',
  settings:      '/settings',
  search:        '/search',
  map:           '/map',
  stories:       '/stories',
  createPost:    '/create-post',

  hotels:      '/hotels',
  restaurants: '/restaurants',
  transport:   '/transport',
  hospitals:   '/hospitals',
  tourism:     '/tourism',
  education:   '/education',
  events:      '/events',
  insurance:   '/insurance',
  banking:     '/banking',
  aiAssistant: '/ai-assistant',

  workerDashboard:   '/worker-dashboard',
  companyDashboard:  '/company-dashboard',
  providerDashboard: '/provider-dashboard',
  enterprise:        '/enterprise-dashboard',

  userProfile: (id: string | number): string => `/u/${id}`,

  admin: {
    root:       '/admin',
    users:      '/admin/users',
    jobs:       '/admin/jobs',
    support:    '/admin/support',
    settings:   '/admin/settings',
    governance: '/admin/governance',
  },

  notFound: '*',
} as const;

export default ROUTES;