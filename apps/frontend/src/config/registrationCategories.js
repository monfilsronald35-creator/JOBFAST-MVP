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

  // ── Part 2: Healthcare + Company + Hotel + Restaurant ─────────
  {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    color: 'red',
    hasSubcategories: false,
  },
  {
    id: 'company',
    label: 'Company',
    icon: '🏢',
    color: 'slate',
    hasSubcategories: false,
  },
  {
    id: 'hotel',
    label: 'Hotel',
    icon: '🏨',
    color: 'purple',
    hasSubcategories: false,
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    icon: '🍽',
    color: 'orange',
    hasSubcategories: false,
  },

  // ── Part 3: Hospital + Clinic + Tourism + Supplier + Enterprise
  {
    id: 'hospital',
    label: 'Hospital',
    icon: '🏥',
    color: 'rose',
    hasSubcategories: false,
  },
  {
    id: 'clinic',
    label: 'Clinic',
    icon: '🩺',
    color: 'teal',
    hasSubcategories: false,
  },
  {
    id: 'tourism',
    label: 'Tourism',
    icon: '✈️',
    color: 'sky',
    hasSubcategories: false,
  },
  {
    id: 'supplier',
    label: 'Supplier',
    icon: '🚚',
    color: 'yellow',
    hasSubcategories: false,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    icon: '🏭',
    color: 'indigo',
    hasSubcategories: false,
  },

  // ── Part 4: IT, Finance, Legal, Agriculture + more ───────────
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
    id: 'real_estate',
    label: 'Real Estate',
    icon: '🏠',
    color: 'orange',
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
  {
    id: 'marketplace_sellers',
    label: 'Marketplace Sellers',
    icon: '🛍',
    color: 'amber',
    hasSubcategories: false,
  },
  {
    id: 'government',
    label: 'Government',
    icon: '🏛',
    color: 'blue',
    hasSubcategories: false,
  },
  {
    id: 'ngo',
    label: 'NGO & Organizations',
    icon: '🌍',
    color: 'green',
    hasSubcategories: false,
  },
];

export const getCategoryById = (id) =>
  REGISTRATION_CATEGORIES.find((c) => c.id === id) || null;
