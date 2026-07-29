import {
  Home, Search, Briefcase, MessageSquare, User,
  Building2, Users, FileText, BarChart2, Calendar,
  ShoppingBag, Bed, Wrench, Activity, AlertCircle,
  Globe, Star, ClipboardList, Settings, Bell,
  UtensilsCrossed, Stethoscope, Map,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Suppress unused import warning for icons not referenced in nav yet
void Bell;

// ── Permission actions ────────────────────────────────────────

export const PERMISSIONS = {
  READ:     'read',
  CREATE:   'create',
  UPDATE:   'update',
  DELETE:   'delete',
  APPROVE:  'approve',
  REJECT:   'reject',
  MODERATE: 'moderate',
  SUSPEND:  'suspend',
} as const;
export type PermissionAction = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ── Role keys ─────────────────────────────────────────────────

export const ROLES = {
  USER:             'user',
  WORKER:           'worker',
  BUSINESS:         'business',
  COMPANY:          'company',
  ENTERPRISE:       'enterprise',
  RESTAURANT:       'restaurant',
  HOTEL:            'hotel',
  RENTAL:           'rental',
  OFFICE:           'office',
  HOSPITAL:         'hospital',
  CLINIC:           'clinic',
  TOURISM:          'tourism',
  SERVICE_PROVIDER: 'service_provider',
  ADMIN:            'admin',
  SUPER_ADMIN:      'super_admin',
} as const;
export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

// ── Type definitions ──────────────────────────────────────────

export interface NavItem {
  label: string;
  path:  string;
  icon:  LucideIcon;
  end?:  boolean;
}

export interface DashboardSection {
  id:       string;
  label:    string;
  icon:     string;
  priority: number;
}

export interface DashboardWidget {
  id:    string;
  label: string;
  type:  string;
}

export interface DashboardConfig {
  greeting: string;
  subtitle: string;
  sections: DashboardSection[];
  widgets:  DashboardWidget[];
}

export interface RolePermissions {
  read:     string[];
  create:   string[];
  update:   string[];
  delete:   string[];
  approve:  string[];
  reject:   string[];
  moderate: string[];
  suspend:  string[];
}

export interface RoleVisibility {
  widgets:         string[];
  navActions:      string[];
  filters:         string[];
  categories:      string[];
  profileSections: string[];
  reports:         string[];
  analytics:       string[];
}

export interface SearchBehavior {
  defaultType: string;
  placeholder: string;
  filters:     string[];
}

export interface RoleConfig {
  label:          string;
  description:    string;
  icon:           LucideIcon;
  color:          string;
  defaultPath:    string;
  nav:            NavItem[];
  dashboard:      DashboardConfig;
  permissions:    RolePermissions;
  visibility:     RoleVisibility;
  searchBehavior: SearchBehavior;
}

// ── Role configurations ───────────────────────────────────────

const ROLE_CONFIGS: Record<string, RoleConfig> = {

  worker: {
    label: 'Travayè', description: 'Chèche travay ak opòtinite', icon: Briefcase, color: 'amber', defaultPath: '/dashboard',
    nav: [
      { label: 'Akeyi',      path: '/dashboard', icon: Home,          end: true },
      { label: 'Travay',     path: '/search',    icon: Search },
      { label: 'Aplikasyon', path: '/my-jobs',   icon: Briefcase },
      { label: 'Mesaj',      path: '/messages',  icon: MessageSquare },
      { label: 'Profil',     path: '/profile',   icon: User },
    ],
    dashboard: {
      greeting: 'Byenveni 👋', subtitle: 'Men travay ki disponib bò kote w.',
      sections: [
        { id: 'nearby_jobs',     label: 'Travay Pre w',    icon: '💼', priority: 1 },
        { id: 'my_applications', label: 'Aplikasyon Mwen', icon: '📋', priority: 2 },
        { id: 'my_rating',       label: 'Rating Mwen',     icon: '⭐', priority: 3 },
      ],
      widgets: [
        { id: 'availability',    label: 'Disponibilite',   type: 'toggle'  },
        { id: 'jobs_nearby',     label: 'Travay Disponib', type: 'counter' },
        { id: 'unread_messages', label: 'Mesaj Non Li',    type: 'counter' },
      ],
    },
    permissions: {
      read: ['jobs', 'profiles', 'notifications', 'messages'], create: ['application', 'message', 'review'],
      update: ['own_profile', 'own_application'], delete: ['own_application'], approve: [], reject: [], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['availability', 'jobs_nearby', 'unread_messages'], navActions: ['search_jobs'],
      filters: ['location', 'distance', 'category', 'salary', 'availability'],
      categories: ['services_on_demand', 'tourism', 'business_directory'],
      profileSections: ['bio', 'skills', 'experience', 'portfolio', 'certifications'], reports: [], analytics: [],
    },
    searchBehavior: { defaultType: 'jobs', placeholder: 'Chèche travay...', filters: ['location', 'salary', 'jobType', 'distance'] },
  },

  company: {
    label: 'Konpayi', description: 'Jere anplwaye ak rekritman', icon: Building2, color: 'blue', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',     path: '/dashboard',  icon: Home,         end: true },
      { label: 'Anplwaye',  path: '/employees',  icon: Users },
      { label: 'Travay',    path: '/jobs',       icon: Briefcase },
      { label: 'Rekritman', path: '/recruitment',icon: ClipboardList },
      { label: 'Rapò',      path: '/reports',    icon: BarChart2 },
    ],
    dashboard: {
      greeting: 'Bonjou, Konpayi!', subtitle: 'Jere anplwaye ak opòtinite travay ou yo.',
      sections: [
        { id: 'open_jobs',         label: 'Travay Ouvè',   icon: '💼', priority: 1 },
        { id: 'employee_overview', label: 'Anplwaye',      icon: '👥', priority: 2 },
        { id: 'applications',      label: 'Aplikasyon',    icon: '📋', priority: 3 },
        { id: 'team_activity',     label: 'Aktivite Ekip', icon: '📊', priority: 4 },
      ],
      widgets: [
        { id: 'active_jobs',     label: 'Travay Aktif',        type: 'counter' },
        { id: 'total_employees', label: 'Total Anplwaye',      type: 'counter' },
        { id: 'pending_apps',    label: 'Aplikasyon Annatant', type: 'counter' },
      ],
    },
    permissions: {
      read: ['jobs', 'applications', 'employees', 'reports', 'profiles'], create: ['job', 'message', 'notification'],
      update: ['own_profile', 'own_jobs', 'employee_status'], delete: ['own_jobs'], approve: ['application'], reject: ['application'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['active_jobs', 'total_employees', 'pending_apps'], navActions: ['post_job', 'view_applications'],
      filters: ['location', 'role', 'experience', 'availability'], categories: ['business_directory'],
      profileSections: ['business_info', 'team', 'jobs_posted', 'reviews'],
      reports: ['hiring', 'employee_performance'], analytics: ['hiring_trends', 'cost_per_hire'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche travayè...', filters: ['role', 'experience', 'location', 'availability'] },
  },

  enterprise: {
    label: 'Antrepriz', description: 'Kontwòl konplè pou gwo antrepriz', icon: Globe, color: 'indigo', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',    path: '/dashboard', icon: Home,     end: true },
      { label: 'Branches', path: '/branches',  icon: Building2 },
      { label: 'Anplwaye', path: '/employees', icon: Users },
      { label: 'Kontra',   path: '/contracts', icon: FileText },
      { label: 'Rapò',     path: '/reports',   icon: BarChart2 },
    ],
    dashboard: {
      greeting: 'Bonjou, Antrepriz!', subtitle: 'Jere tout branch ak ekip ou yo.',
      sections: [
        { id: 'branches',          label: 'Branches',     icon: '🏛️', priority: 1 },
        { id: 'employee_overview', label: 'Anplwaye',     icon: '👥',  priority: 2 },
        { id: 'contracts',         label: 'Kontra Aktif', icon: '📄',  priority: 3 },
        { id: 'enterprise_stats',  label: 'Estatistik',   icon: '📊',  priority: 4 },
      ],
      widgets: [
        { id: 'total_branches',   label: 'Branches',       type: 'counter' },
        { id: 'total_employees',  label: 'Total Anplwaye', type: 'counter' },
        { id: 'active_contracts', label: 'Kontra Aktif',   type: 'counter' },
      ],
    },
    permissions: {
      read: ['jobs', 'employees', 'contracts', 'branches', 'reports', 'profiles'], create: ['job', 'contract', 'branch', 'message'],
      update: ['own_profile', 'own_jobs', 'employee_status', 'contracts'], delete: ['own_jobs', 'contracts'],
      approve: ['application', 'contract'], reject: ['application', 'contract'], moderate: ['employee'], suspend: [],
    },
    visibility: {
      widgets: ['total_branches', 'total_employees', 'active_contracts'], navActions: ['post_job', 'add_branch', 'create_contract'],
      filters: ['branch', 'department', 'role', 'location'], categories: ['business_directory'],
      profileSections: ['company_info', 'branches', 'team', 'reports'],
      reports: ['workforce', 'hiring', 'branch_performance', 'contracts'], analytics: ['headcount', 'hiring_trends', 'cost_analysis'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche travayè oswa branch...', filters: ['role', 'branch', 'experience', 'location'] },
  },

  restaurant: {
    label: 'Restoran', description: 'Meni, kòmand ak rezèvasyon', icon: UtensilsCrossed, color: 'orange', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',      path: '/dashboard',   icon: Home,            end: true },
      { label: 'Meni',       path: '/menu',        icon: UtensilsCrossed },
      { label: 'Kòmand',     path: '/orders',      icon: ShoppingBag },
      { label: 'Rezèvasyon', path: '/reservations',icon: Calendar },
      { label: 'Kliyan',     path: '/customers',   icon: Users },
    ],
    dashboard: {
      greeting: 'Bonjou, Restoran!', subtitle: 'Jere meni, kòmand, ak rezèvasyon ou yo.',
      sections: [
        { id: 'todays_orders', label: 'Kòmand Jodi a', icon: '🛒',  priority: 1 },
        { id: 'reservations',  label: 'Rezèvasyon',    icon: '📅',  priority: 2 },
        { id: 'menu_overview', label: 'Meni',          icon: '🍽️', priority: 3 },
        { id: 'top_customers', label: 'Kliyan Fidèl',  icon: '👥',  priority: 4 },
      ],
      widgets: [
        { id: 'todays_bookings', label: 'Rezèvasyon Jodi a', type: 'counter' },
        { id: 'pending_orders',  label: 'Kòmand Annatant',   type: 'counter' },
        { id: 'menu_items',      label: 'Plat nan Meni',     type: 'counter' },
      ],
    },
    permissions: {
      read: ['orders', 'reservations', 'menu', 'customers', 'reviews'], create: ['menu_item', 'reservation', 'message'],
      update: ['own_profile', 'menu_item', 'order_status', 'reservation'], delete: ['menu_item', 'reservation'],
      approve: ['reservation'], reject: ['reservation', 'order'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['todays_bookings', 'pending_orders', 'menu_items'], navActions: ['add_menu_item', 'manage_reservations'],
      filters: ['cuisine', 'price', 'rating', 'location'], categories: ['business_directory', 'tourism'],
      profileSections: ['restaurant_info', 'menu', 'reviews', 'hours'],
      reports: ['orders', 'reservations', 'revenue'], analytics: ['popular_items', 'peak_hours', 'customer_retention'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche chèf oswa anplwaye...', filters: ['role', 'cuisine_expertise', 'location', 'availability'] },
  },

  hotel: {
    label: 'Hotel', description: 'Chanm, rezèvasyon ak kliyan', icon: Bed, color: 'cyan', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',      path: '/dashboard',   icon: Home,     end: true },
      { label: 'Chanm',      path: '/rooms',       icon: Bed },
      { label: 'Rezèvasyon', path: '/reservations',icon: Calendar },
      { label: 'Mènaj',      path: '/housekeeping',icon: Wrench },
      { label: 'Kliyan',     path: '/guests',      icon: Users },
    ],
    dashboard: {
      greeting: 'Bonjou, Hotel!', subtitle: 'Jere chanm, rezèvasyon, ak kliyan ou yo.',
      sections: [
        { id: 'room_status',     label: 'Eta Chanm',       icon: '🛏️', priority: 1 },
        { id: 'todays_checkins', label: 'Check-in Jodi a', icon: '📅',  priority: 2 },
        { id: 'housekeeping',    label: 'Mènaj',           icon: '🧹',  priority: 3 },
        { id: 'guest_requests',  label: 'Demann Kliyan',   icon: '👥',  priority: 4 },
      ],
      widgets: [
        { id: 'occupied_rooms',   label: 'Chanm Okipe',    type: 'counter' },
        { id: 'checkins_today',   label: 'Check-in Jodi a',type: 'counter' },
        { id: 'pending_requests', label: 'Demann Annatant',type: 'counter' },
      ],
    },
    permissions: {
      read: ['rooms', 'reservations', 'guests', 'housekeeping', 'reviews'], create: ['reservation', 'housekeeping_task', 'message'],
      update: ['own_profile', 'room_status', 'reservation', 'housekeeping_task'], delete: ['reservation', 'housekeeping_task'],
      approve: ['reservation'], reject: ['reservation'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['occupied_rooms', 'checkins_today', 'pending_requests'], navActions: ['add_reservation', 'manage_rooms'],
      filters: ['room_type', 'price', 'amenities', 'availability'], categories: ['tourism', 'business_directory'],
      profileSections: ['hotel_info', 'rooms', 'amenities', 'reviews'],
      reports: ['occupancy', 'revenue', 'housekeeping'], analytics: ['occupancy_rate', 'revenue_per_room', 'peak_seasons'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche travayè pou hotel...', filters: ['role', 'experience', 'location', 'availability'] },
  },

  rental: {
    label: 'Lwaye', description: 'Pwopiete ak lokasyon', icon: Home, color: 'emerald', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',      path: '/dashboard', icon: Home,     end: true },
      { label: 'Pwopiete',   path: '/properties',icon: Building2 },
      { label: 'Rezèvasyon', path: '/bookings',  icon: Calendar },
      { label: 'Lokatè',     path: '/tenants',   icon: Users },
      { label: 'Kontra',     path: '/contracts', icon: FileText },
    ],
    dashboard: {
      greeting: 'Bonjou, Lwaye!', subtitle: 'Jere pwopiete ak lokatè ou yo.',
      sections: [
        { id: 'properties',    label: 'Pwopiete',    icon: '🏠', priority: 1 },
        { id: 'active_leases', label: 'Lwaye Aktif', icon: '📄', priority: 2 },
        { id: 'bookings',      label: 'Rezèvasyon',  icon: '📅', priority: 3 },
        { id: 'maintenance',   label: 'Antretyen',   icon: '🔧', priority: 4 },
      ],
      widgets: [
        { id: 'total_properties', label: 'Pwopiete',   type: 'counter' },
        { id: 'occupied',         label: 'Okipe',      type: 'counter' },
        { id: 'upcoming_leases',  label: 'Fen Kontra', type: 'counter' },
      ],
    },
    permissions: {
      read: ['properties', 'bookings', 'tenants', 'contracts', 'reviews'], create: ['property', 'booking', 'contract', 'message'],
      update: ['own_profile', 'property', 'booking', 'contract'], delete: ['property', 'booking', 'contract'],
      approve: ['booking', 'contract'], reject: ['booking'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['total_properties', 'occupied', 'upcoming_leases'], navActions: ['add_property', 'create_contract'],
      filters: ['property_type', 'price', 'location', 'availability'], categories: ['marketplace', 'business_directory'],
      profileSections: ['rental_info', 'properties', 'reviews', 'contracts'],
      reports: ['occupancy', 'revenue', 'maintenance'], analytics: ['occupancy_rate', 'rental_income', 'vacancy_trend'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche travayè pou pwopiete...', filters: ['role', 'experience', 'location', 'availability'] },
  },

  office: {
    label: 'Biwo', description: 'Jere pèsonèl ak sèvis biwo', icon: ClipboardList, color: 'slate', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',   path: '/dashboard', icon: Home,         end: true },
      { label: 'Pèsonèl', path: '/staff',     icon: Users },
      { label: 'Orè',     path: '/schedule',  icon: Calendar },
      { label: 'Sèvis',   path: '/services',  icon: Wrench },
      { label: 'Rapò',    path: '/reports',   icon: BarChart2 },
    ],
    dashboard: {
      greeting: 'Bonjou, Biwo!', subtitle: 'Jere pèsonèl ak sèvis ou yo.',
      sections: [
        { id: 'staff_overview',  label: 'Pèsonèl',       icon: '👥', priority: 1 },
        { id: 'schedule',        label: 'Orè Jodi a',    icon: '📅', priority: 2 },
        { id: 'services',        label: 'Sèvis',         icon: '🔧', priority: 3 },
        { id: 'office_stats',    label: 'Estatistik',    icon: '📊', priority: 4 },
      ],
      widgets: [
        { id: 'staff_count',      label: 'Pèsonèl',         type: 'counter' },
        { id: 'todays_tasks',     label: 'Tach Jodi a',     type: 'counter' },
        { id: 'pending_services', label: 'Sèvis Annatant',  type: 'counter' },
      ],
    },
    permissions: {
      read: ['staff', 'schedule', 'services', 'reports'], create: ['schedule_entry', 'service', 'message'],
      update: ['own_profile', 'staff_info', 'schedule', 'service'], delete: ['schedule_entry', 'service'],
      approve: ['service_request'], reject: ['service_request'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['staff_count', 'todays_tasks', 'pending_services'], navActions: ['add_staff', 'manage_schedule'],
      filters: ['department', 'role', 'availability'], categories: ['business_directory', 'services_on_demand'],
      profileSections: ['office_info', 'team', 'services', 'reviews'],
      reports: ['staff', 'productivity', 'service_volume'], analytics: ['staff_performance', 'service_trends'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche pèsonèl...', filters: ['role', 'department', 'location', 'availability'] },
  },

  hospital: {
    label: 'Lopital', description: 'Swen medikal ak dijans', icon: Activity, color: 'red', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',    path: '/dashboard',   icon: Home,          end: true },
      { label: 'Doktè',    path: '/doctors',     icon: Stethoscope },
      { label: 'Pasyan',   path: '/patients',    icon: Users },
      { label: 'Randevou', path: '/appointments',icon: Calendar },
      { label: 'Dijans',   path: '/emergency',   icon: AlertCircle },
    ],
    dashboard: {
      greeting: 'Bonjou, Lopital!', subtitle: 'Jere doktè, pasyan, ak sèvis medikal ou yo.',
      sections: [
        { id: 'emergency_status',    label: 'Dijans',            icon: '🚨',   priority: 1 },
        { id: 'todays_appointments', label: 'Randevou Jodi a',   icon: '📅',   priority: 2 },
        { id: 'doctors_on_duty',     label: 'Doktè sou Sèvis',  icon: '👨‍⚕️', priority: 3 },
        { id: 'patient_stats',       label: 'Estatistik Pasyan', icon: '📊',   priority: 4 },
      ],
      widgets: [
        { id: 'active_patients',     label: 'Pasyan Aktif',    type: 'counter' },
        { id: 'todays_appointments', label: 'Randevou Jodi a', type: 'counter' },
        { id: 'emergency_count',     label: 'Ka Dijans',       type: 'counter' },
      ],
    },
    permissions: {
      read: ['doctors', 'patients', 'appointments', 'emergency', 'reports'], create: ['appointment', 'patient_record', 'emergency_case', 'message'],
      update: ['own_profile', 'patient_record', 'appointment', 'doctor_schedule'], delete: ['appointment'],
      approve: ['appointment', 'admission'], reject: ['appointment'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['active_patients', 'todays_appointments', 'emergency_count'], navActions: ['add_appointment', 'emergency_intake'],
      filters: ['specialty', 'availability', 'location'], categories: ['services_on_demand', 'impact_ngo'],
      profileSections: ['hospital_info', 'departments', 'doctors', 'reviews'],
      reports: ['patient_volume', 'appointments', 'emergency'], analytics: ['patient_trends', 'appointment_wait_times'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche doktè oswa enfèmyè...', filters: ['specialty', 'experience', 'location', 'availability'] },
  },

  clinic: {
    label: 'Klinik', description: 'Doktè, randevou ak pasyan', icon: Stethoscope, color: 'teal', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',      path: '/dashboard',   icon: Home,          end: true },
      { label: 'Doktè',      path: '/doctors',     icon: Stethoscope },
      { label: 'Pasyan',     path: '/patients',    icon: Users },
      { label: 'Randevou',   path: '/appointments',icon: Calendar },
      { label: 'Evalyasyon', path: '/reviews',     icon: Star },
    ],
    dashboard: {
      greeting: 'Bonjou, Klinik!', subtitle: 'Jere doktè, pasyan, ak randevou ou yo.',
      sections: [
        { id: 'todays_appointments', label: 'Randevou Jodi a', icon: '📅',   priority: 1 },
        { id: 'patient_list',        label: 'Pasyan',          icon: '👥',   priority: 2 },
        { id: 'doctors',             label: 'Doktè',           icon: '👨‍⚕️', priority: 3 },
        { id: 'clinic_reviews',      label: 'Evalyasyon',      icon: '⭐',   priority: 4 },
      ],
      widgets: [
        { id: 'active_patients',     label: 'Pasyan Jodi a',  type: 'counter' },
        { id: 'todays_appointments', label: 'Randevou',       type: 'counter' },
        { id: 'avg_rating',          label: 'Rating Mwayen',  type: 'counter' },
      ],
    },
    permissions: {
      read: ['doctors', 'patients', 'appointments', 'reviews'], create: ['appointment', 'patient_record', 'message'],
      update: ['own_profile', 'patient_record', 'appointment'], delete: ['appointment'],
      approve: ['appointment'], reject: ['appointment'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['active_patients', 'todays_appointments', 'avg_rating'], navActions: ['add_appointment'],
      filters: ['specialty', 'availability', 'location'], categories: ['services_on_demand', 'impact_ngo'],
      profileSections: ['clinic_info', 'doctors', 'services', 'reviews'],
      reports: ['patient_volume', 'appointments', 'reviews'], analytics: ['patient_trends', 'wait_times', 'ratings'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche doktè oswa enfèmyè...', filters: ['specialty', 'experience', 'location', 'availability'] },
  },

  tourism: {
    label: 'Turizm', description: 'Tou, gid ak rezèvasyon touris', icon: Map, color: 'purple', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',      path: '/dashboard', icon: Home,     end: true },
      { label: 'Tou',        path: '/tours',     icon: Map },
      { label: 'Rezèvasyon', path: '/bookings',  icon: Calendar },
      { label: 'Touris',     path: '/tourists',  icon: Users },
      { label: 'Evalyasyon', path: '/reviews',   icon: Star },
    ],
    dashboard: {
      greeting: 'Bonjou, Turizm!', subtitle: 'Jere tou, rezèvasyon, ak touris ou yo.',
      sections: [
        { id: 'active_tours',    label: 'Tou Aktif',        icon: '🗺️', priority: 1 },
        { id: 'bookings',        label: 'Rezèvasyon',       icon: '📅',  priority: 2 },
        { id: 'tourists',        label: 'Touris',           icon: '✈️', priority: 3 },
        { id: 'reviews',         label: 'Evalyasyon',       icon: '⭐',  priority: 4 },
      ],
      widgets: [
        { id: 'active_tours',    label: 'Tou Aktif',        type: 'counter' },
        { id: 'todays_bookings', label: 'Rezèvasyon Jodi a',type: 'counter' },
        { id: 'avg_rating',      label: 'Rating Mwayen',    type: 'counter' },
      ],
    },
    permissions: {
      read: ['tours', 'bookings', 'tourists', 'reviews'], create: ['tour', 'booking', 'message'],
      update: ['own_profile', 'tour', 'booking'], delete: ['tour', 'booking'],
      approve: ['booking'], reject: ['booking'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['active_tours', 'todays_bookings', 'avg_rating'], navActions: ['add_tour', 'manage_bookings'],
      filters: ['tour_type', 'price', 'duration', 'location'], categories: ['tourism', 'business_directory'],
      profileSections: ['tourism_info', 'tours', 'reviews', 'certifications'],
      reports: ['tours', 'bookings', 'revenue', 'reviews'], analytics: ['booking_trends', 'popular_tours', 'tourist_origins'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche gid oswa travayè turizm...', filters: ['role', 'languages', 'location', 'availability'] },
  },

  service_provider: {
    label: 'Founisè Sèvis', description: 'Ofri sèvis pwofesyonèl', icon: Wrench, color: 'yellow', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',      path: '/dashboard', icon: Home,     end: true },
      { label: 'Sèvis',      path: '/services',  icon: Wrench },
      { label: 'Rezèvasyon', path: '/bookings',  icon: Calendar },
      { label: 'Kliyan',     path: '/clients',   icon: Users },
      { label: 'Profil',     path: '/profile',   icon: User },
    ],
    dashboard: {
      greeting: 'Bonjou, Founisè!', subtitle: 'Jere sèvis ak kliyan ou yo.',
      sections: [
        { id: 'my_services',   label: 'Sèvis Mwen',     icon: '🔧', priority: 1 },
        { id: 'upcoming_jobs', label: 'Travay Pwochèn', icon: '📅', priority: 2 },
        { id: 'clients',       label: 'Kliyan',         icon: '👥', priority: 3 },
        { id: 'my_rating',     label: 'Rating Mwen',    icon: '⭐', priority: 4 },
      ],
      widgets: [
        { id: 'active_services', label: 'Sèvis Aktif',    type: 'counter' },
        { id: 'upcoming_jobs',   label: 'Travay Pwochèn', type: 'counter' },
        { id: 'avg_rating',      label: 'Rating Mwayen',  type: 'counter' },
      ],
    },
    permissions: {
      read: ['services', 'bookings', 'clients', 'reviews', 'notifications'], create: ['service', 'message', 'review'],
      update: ['own_profile', 'own_service', 'booking_status'], delete: ['own_service'],
      approve: ['booking'], reject: ['booking'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['active_services', 'upcoming_jobs', 'avg_rating'], navActions: ['add_service', 'view_bookings'],
      filters: ['service_type', 'price', 'location', 'availability'], categories: ['services_on_demand', 'business_directory'],
      profileSections: ['bio', 'services', 'portfolio', 'reviews', 'certifications'],
      reports: ['services', 'revenue'], analytics: ['booking_trends', 'popular_services'],
    },
    searchBehavior: { defaultType: 'jobs', placeholder: 'Chèche travay oswa kliyan...', filters: ['service_type', 'location', 'price', 'availability'] },
  },

  marketplace: {
    label: 'Makèt', description: 'Vann pwodwi ak jere boutik anliy', icon: ShoppingBag, color: 'emerald', defaultPath: '/dashboard',
    nav: [
      { label: 'Tablo',   path: '/dashboard', icon: Home,         end: true },
      { label: 'Pwodwi',  path: '/products',  icon: ShoppingBag },
      { label: 'Kòmand',  path: '/orders',    icon: ClipboardList },
      { label: 'Kliyan',  path: '/customers', icon: Users },
      { label: 'Rapò',    path: '/reports',   icon: BarChart2 },
    ],
    dashboard: {
      greeting: 'Bonjou, Makèt!', subtitle: 'Jere pwodwi, kòmand, ak kliyan ou yo.',
      sections: [
        { id: 'products',   label: 'Pwodwi',      icon: '📦', priority: 1 },
        { id: 'orders',     label: 'Kòmand',      icon: '🛒', priority: 2 },
        { id: 'customers',  label: 'Kliyan',      icon: '👥', priority: 3 },
        { id: 'shipping',   label: 'Ekspedisyon', icon: '🚚', priority: 4 },
        { id: 'promotions', label: 'Pwomosyon',   icon: '📢', priority: 5 },
      ],
      widgets: [
        { id: 'total_products',  label: 'Pwodwi',          type: 'counter' },
        { id: 'pending_orders',  label: 'Kòmand Annatant', type: 'counter' },
        { id: 'total_customers', label: 'Kliyan',          type: 'counter' },
      ],
    },
    permissions: {
      read: ['products', 'orders', 'customers', 'reviews', 'reports'], create: ['product', 'promotion', 'message'],
      update: ['own_profile', 'product', 'order_status'], delete: ['product'],
      approve: ['order'], reject: ['order'], moderate: [], suspend: [],
    },
    visibility: {
      widgets: ['total_products', 'pending_orders', 'total_customers'], navActions: ['add_product', 'manage_orders'],
      filters: ['category', 'price', 'rating', 'availability'], categories: ['marketplace', 'business_directory'],
      profileSections: ['shop_info', 'products', 'reviews', 'policies'],
      reports: ['sales', 'orders', 'revenue'], analytics: ['sales_trends', 'top_products', 'customer_retention'],
    },
    searchBehavior: { defaultType: 'workers', placeholder: 'Chèche pwodwi, boutik, mak...', filters: ['category', 'price', 'rating', 'location'] },
  },

  admin: {
    label: 'Admin', description: 'Administrasyon platfòm', icon: Settings, color: 'rose', defaultPath: '/admin',
    nav: [
      { label: 'Tablo',     path: '/admin',          icon: Home,         end: true },
      { label: 'Itilizatè', path: '/admin/users',    icon: Users },
      { label: 'Travay',    path: '/admin/jobs',     icon: Briefcase },
      { label: 'Sipò',      path: '/admin/support',  icon: MessageSquare },
      { label: 'Paramèt',   path: '/admin/settings', icon: Settings },
    ],
    dashboard: {
      greeting: 'Admin Dashboard', subtitle: 'Aperçu konplè platfòm nan.',
      sections: [
        { id: 'platform_stats', label: 'Estatistik Platform', icon: '📊', priority: 1 },
        { id: 'recent_users',   label: 'Itilizatè Resan',     icon: '👥', priority: 2 },
        { id: 'open_reports',   label: 'Rapò Ouvè',           icon: '🚩', priority: 3 },
        { id: 'system_health',  label: 'Sante Sistèm',        icon: '🟢', priority: 4 },
      ],
      widgets: [
        { id: 'total_users',  label: 'Total Itilizatè', type: 'counter' },
        { id: 'active_jobs',  label: 'Travay Aktif',    type: 'counter' },
        { id: 'open_reports', label: 'Rapò Ouvè',      type: 'counter' },
      ],
    },
    permissions: { read: ['*'], create: ['*'], update: ['*'], delete: ['*'], approve: ['*'], reject: ['*'], moderate: ['*'], suspend: ['*'] },
    visibility: { widgets: ['*'], navActions: ['*'], filters: ['*'], categories: ['*'], profileSections: ['*'], reports: ['*'], analytics: ['*'] },
    searchBehavior: { defaultType: 'users', placeholder: 'Chèche itilizatè, travay...', filters: ['role', 'status', 'date', 'location'] },
  },

  super_admin: {
    label: 'Super Admin', description: 'Kontwòl total sistèm nan', icon: Star, color: 'rose', defaultPath: '/admin',
    nav: [
      { label: 'Tablo',     path: '/admin',          icon: Home,         end: true },
      { label: 'Itilizatè', path: '/admin/users',    icon: Users },
      { label: 'Travay',    path: '/admin/jobs',     icon: Briefcase },
      { label: 'Sipò',      path: '/admin/support',  icon: MessageSquare },
      { label: 'Paramèt',   path: '/admin/settings', icon: Settings },
    ],
    dashboard: {
      greeting: 'Super Admin Dashboard', subtitle: 'Kontwòl konplè sistèm nan.',
      sections: [
        { id: 'platform_stats', label: 'Estatistik Platform', icon: '📊', priority: 1 },
        { id: 'recent_users',   label: 'Itilizatè Resan',     icon: '👥', priority: 2 },
        { id: 'open_reports',   label: 'Rapò Ouvè',           icon: '🚩', priority: 3 },
        { id: 'system_health',  label: 'Sante Sistèm',        icon: '🟢', priority: 4 },
      ],
      widgets: [
        { id: 'total_users',  label: 'Total Itilizatè', type: 'counter' },
        { id: 'active_jobs',  label: 'Travay Aktif',    type: 'counter' },
        { id: 'open_reports', label: 'Rapò Ouvè',      type: 'counter' },
      ],
    },
    permissions: { read: ['*'], create: ['*'], update: ['*'], delete: ['*'], approve: ['*'], reject: ['*'], moderate: ['*'], suspend: ['*'] },
    visibility: { widgets: ['*'], navActions: ['*'], filters: ['*'], categories: ['*'], profileSections: ['*'], reports: ['*'], analytics: ['*'] },
    searchBehavior: { defaultType: 'users', placeholder: 'Chèche itilizatè, travay...', filters: ['role', 'status', 'date', 'location'] },
  },
};

// ── Backward-compat aliases ───────────────────────────────────
ROLE_CONFIGS['user']     = ROLE_CONFIGS['worker']!;
ROLE_CONFIGS['business'] = ROLE_CONFIGS['company']!;

// ── Public API ────────────────────────────────────────────────

export function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIGS[role] ?? ROLE_CONFIGS['worker']!;
}

export const getRoleNav            = (role: string) => getRoleConfig(role).nav;
export const getRoleDashboard      = (role: string) => getRoleConfig(role).dashboard;
export const getRolePermissions    = (role: string) => getRoleConfig(role).permissions;
export const getRoleVisibility     = (role: string) => getRoleConfig(role).visibility;
export const getRoleSearchBehavior = (role: string) => getRoleConfig(role).searchBehavior;
export const getRoleDefaultPath    = (role: string) => getRoleConfig(role).defaultPath;

export function hasPermission(role: string, action: string, resource: string): boolean {
  const perms = getRolePermissions(role);
  const list: string[] = (perms as unknown as Record<string, string[]>)[action] ?? [];
  return list.includes('*') || list.includes(resource);
}

export function isWidgetVisible(role: string, widgetId: string): boolean {
  const vis = getRoleVisibility(role);
  return vis.widgets.includes('*') || vis.widgets.includes(widgetId);
}

export function isCategoryVisible(role: string, categoryId: string): boolean {
  const vis = getRoleVisibility(role);
  return vis.categories.includes('*') || vis.categories.includes(categoryId);
}

export function isEmployerRole(role: string): boolean {
  const workerTypes = new Set(['worker', 'user', 'service_provider']);
  return !workerTypes.has(role ?? 'worker');
}

// ── Profession → Role mapping ─────────────────────────────────

export const PROFESSION_ROLE_MAP: Record<string, string> = {
  company: ROLES.COMPANY, restaurant: ROLES.RESTAURANT, hospital: ROLES.HOSPITAL,
  clinic: ROLES.CLINIC, hotel: ROLES.HOTEL, office: ROLES.OFFICE,
  lawyer: ROLES.SERVICE_PROVIDER, mechanic: ROLES.SERVICE_PROVIDER,
  tour_guide: ROLES.TOURISM, organization: ROLES.COMPANY,
  seller: ROLES.SERVICE_PROVIDER, property: ROLES.RENTAL,
  vehicle: ROLES.SERVICE_PROVIDER, goods: ROLES.SERVICE_PROVIDER, services: ROLES.SERVICE_PROVIDER,
  chef: ROLES.SERVICE_PROVIDER, plumber: ROLES.SERVICE_PROVIDER, doctor: ROLES.SERVICE_PROVIDER,
  nurse: ROLES.SERVICE_PROVIDER, taxi: ROLES.SERVICE_PROVIDER, delivery: ROLES.SERVICE_PROVIDER,
  cleaning: ROLES.SERVICE_PROVIDER, videographer: ROLES.SERVICE_PROVIDER,
  designer: ROLES.SERVICE_PROVIDER, construction: ROLES.WORKER,
  tourism_hotel: ROLES.HOTEL, resort: ROLES.HOTEL, guide: ROLES.TOURISM,
  tourism_restaurant: ROLES.RESTAURANT, transport: ROLES.SERVICE_PROVIDER, activity: ROLES.TOURISM,
  musician: ROLES.SERVICE_PROVIDER, artist: ROLES.SERVICE_PROVIDER,
  creator_designer: ROLES.SERVICE_PROVIDER, content_creator: ROLES.SERVICE_PROVIDER,
  photographer: ROLES.SERVICE_PROVIDER, writer: ROLES.SERVICE_PROVIDER,
  ngo: ROLES.COMPANY, charity: ROLES.COMPANY, health_organization: ROLES.HOSPITAL,
  education: ROLES.COMPANY, social_support: ROLES.COMPANY,
} as const;

export function getRoleFromProfession(profession: string): string {
  return PROFESSION_ROLE_MAP[profession] ?? ROLES.WORKER;
}

export function getProfessionsByRole(role: string): string[] {
  return Object.entries(PROFESSION_ROLE_MAP)
    .filter(([, r]) => r === role)
    .map(([profession]) => profession);
}