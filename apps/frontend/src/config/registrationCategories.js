// ================================================================
// registrationCategories.js — JOBFAST Registration Top-Level Categories
// ================================================================

export const REGISTRATION_CATEGORIES = [
  // ── Part 1: Construction + Services ──────────────────────────
  {
    id: 'construction',
    label: 'Construction',
    icon: '🏗',
    color: 'amber',
    hasSubcategories: true,
  },
  {
    id: 'services',
    label: 'Services',
    icon: '🛎',
    color: 'blue',
    hasSubcategories: true,
  },

  // ── Part 2: Healthcare (individual professionals only) ────────
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    color: 'red',
    hasSubcategories: false,
  },

  // ── Part 3: IT, Finance, Legal, Agriculture + more ───────────
  {
    id: 'it_software',
    label: 'IT & Software',
    icon: '💻',
    color: 'cyan',
    hasSubcategories: false,
  },
  {
    id: 'design_creative',
    label: 'Design & Creative',
    icon: '🎨',
    color: 'pink',
    hasSubcategories: false,
  },
  {
    id: 'marketing_sales',
    label: 'Marketing & Sales',
    icon: '📢',
    color: 'green',
    hasSubcategories: false,
  },
  {
    id: 'education',
    label: 'Education',
    icon: '📚',
    color: 'blue',
    hasSubcategories: false,
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖️',
    color: 'slate',
    hasSubcategories: false,
  },
  {
    id: 'finance_banking',
    label: 'Finance & Banking',
    icon: '💰',
    color: 'emerald',
    hasSubcategories: false,
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    icon: '🚜',
    color: 'lime',
    hasSubcategories: false,
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: '🏭',
    color: 'gray',
    hasSubcategories: false,
  },
  {
    id: 'logistics',
    label: 'Logistics',
    icon: '📦',
    color: 'amber',
    hasSubcategories: false,
  },
  {
    id: 'automotive',
    label: 'Automotive',
    icon: '🚗',
    color: 'slate',
    hasSubcategories: false,
  },
  {
    id: 'pet_services',
    label: 'Pet Services',
    icon: '🐕',
    color: 'yellow',
    hasSubcategories: false,
  },
  {
    id: 'beauty_spa',
    label: 'Beauty & Spa',
    icon: '💄',
    color: 'pink',
    hasSubcategories: false,
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: '🎭',
    color: 'purple',
    hasSubcategories: false,
  },
  {
    id: 'music',
    label: 'Music',
    icon: '🎵',
    color: 'violet',
    hasSubcategories: false,
  },
  {
    id: 'photography',
    label: 'Photography',
    icon: '📸',
    color: 'gray',
    hasSubcategories: false,
  },
  {
    id: 'video_production',
    label: 'Video Production',
    icon: '🎥',
    color: 'red',
    hasSubcategories: false,
  },
];

export const getCategoryById = (id) =>
  REGISTRATION_CATEGORIES.find((c) => c.id === id) || null;
