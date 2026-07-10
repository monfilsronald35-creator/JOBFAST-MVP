// ================================================================
// professionData.js — JOBFAST Complete Profession Hierarchy
// ================================================================
// Structure:
//   SUBCATEGORIES[categoryId] = [{ id, label }]
//   PROFESSIONS[categoryId][subcategoryId] = [{ id, label }]
//   PROFESSIONS[categoryId]                = [{ id, label }]  (no subcategory)
// ================================================================

// ================================================================
// PART 1 — SUBCATEGORIES for Construction + Services
// ================================================================

export const SUBCATEGORIES = {
  construction: [
    { id: 'general',         label: 'General'          },
    { id: 'masonry',         label: 'Masonry'          },
    { id: 'carpentry',       label: 'Carpentry'        },
    { id: 'electrical',      label: 'Electrical'       },
    { id: 'plumbing',        label: 'Plumbing'         },
    { id: 'painting',        label: 'Painting'         },
    { id: 'flooring',        label: 'Flooring'         },
    { id: 'welding_metal',   label: 'Welding & Metal'  },
    { id: 'heavy_equipment', label: 'Heavy Equipment'  },
    { id: 'engineering',     label: 'Engineering'      },
    { id: 'cleaning',        label: 'Cleaning'         },
    { id: 'landscaping',     label: 'Landscaping'      },
  ],
  services: [
    { id: 'hospitality',    label: 'Hospitality'    },
    { id: 'restaurant',     label: 'Restaurant'     },
    { id: 'office',         label: 'Office'         },
    { id: 'retail',         label: 'Retail'         },
    { id: 'transportation', label: 'Transportation' },
    { id: 'security',       label: 'Security'       },
    { id: 'domestic',       label: 'Domestic'       },
  ],
};

// ================================================================
// PART 1 — PROFESSIONS: Construction + Services
// ================================================================

export const PROFESSIONS = {

  // ── 🏗 CONSTRUCTION ──────────────────────────────────────────
  construction: {
    general: [
      { id: 'helper_assistant', label: 'Helper / Assistant' },
      { id: 'laborer',          label: 'Laborer'            },
      { id: 'foreman',          label: 'Foreman'            },
      { id: 'boss_contractor',  label: 'Boss / Contractor'  },
    ],
    masonry: [
      { id: 'block_mason',      label: 'Block Mason'      },
      { id: 'brick_mason',      label: 'Brick Mason'      },
      { id: 'concrete_worker',  label: 'Concrete Worker'  },
      { id: 'finisher',         label: 'Finisher'         },
    ],
    carpentry: [
      { id: 'carpenter',         label: 'Carpenter'         },
      { id: 'cabinet_maker',     label: 'Cabinet Maker'     },
      { id: 'roofing_carpenter', label: 'Roofing Carpenter' },
    ],
    electrical: [
      { id: 'electrician',             label: 'Electrician'             },
      { id: 'industrial_electrician',  label: 'Industrial Electrician'  },
      { id: 'solar_technician',        label: 'Solar Technician'        },
    ],
    plumbing: [
      { id: 'plumber',        label: 'Plumber'        },
      { id: 'pipe_installer', label: 'Pipe Installer' },
    ],
    painting: [
      { id: 'painter',        label: 'Painter'        },
      { id: 'spray_painter',  label: 'Spray Painter'  },
    ],
    flooring: [
      { id: 'tile_installer',     label: 'Tile Installer'     },
      { id: 'ceramic_installer',  label: 'Ceramic Installer'  },
      { id: 'marble_installer',   label: 'Marble Installer'   },
    ],
    welding_metal: [
      { id: 'welder',       label: 'Welder'       },
      { id: 'iron_worker',  label: 'Iron Worker'  },
      { id: 'steel_fixer',  label: 'Steel Fixer'  },
    ],
    heavy_equipment: [
      { id: 'excavator_operator',  label: 'Excavator Operator'  },
      { id: 'bulldozer_operator',  label: 'Bulldozer Operator'  },
      { id: 'crane_operator',      label: 'Crane Operator'      },
    ],
    engineering: [
      { id: 'civil_engineer',      label: 'Civil Engineer'      },
      { id: 'structural_engineer', label: 'Structural Engineer' },
      { id: 'architect',           label: 'Architect'           },
      { id: 'surveyor',            label: 'Surveyor'            },
      { id: 'quantity_surveyor',   label: 'Quantity Surveyor'   },
    ],
    cleaning: [
      { id: 'construction_cleaner', label: 'Construction Cleaner' },
    ],
    landscaping: [
      { id: 'gardener',     label: 'Gardener'     },
      { id: 'pool_cleaner', label: 'Pool Cleaner' },
    ],
  },

  // ── 🛎 SERVICES ───────────────────────────────────────────────
  services: {
    hospitality: [
      { id: 'hotel_worker',  label: 'Hotel Worker'  },
      { id: 'motel_worker',  label: 'Motel Worker'  },
      { id: 'resort_worker', label: 'Resort Worker' },
      { id: 'receptionist',  label: 'Receptionist'  },
      { id: 'concierge',     label: 'Concierge'     },
      { id: 'housekeeping',  label: 'Housekeeping'  },
    ],
    restaurant: [
      { id: 'cook',       label: 'Cook'       },
      { id: 'chef',       label: 'Chef'       },
      { id: 'waiter',     label: 'Waiter'     },
      { id: 'bartender',  label: 'Bartender'  },
      { id: 'dishwasher', label: 'Dishwasher' },
    ],
    office: [
      { id: 'secretary',       label: 'Secretary'       },
      { id: 'receptionist',    label: 'Receptionist'    },
      { id: 'office_assistant',label: 'Office Assistant'},
    ],
    retail: [
      { id: 'shop_owner',   label: 'Shop Owner'   },
      { id: 'boutique',     label: 'Boutique'     },
      { id: 'cashier',      label: 'Cashier'      },
      { id: 'salesperson',  label: 'Salesperson'  },
    ],
    transportation: [
      { id: 'taxi_driver',      label: 'Taxi Driver'      },
      { id: 'uber_driver',      label: 'Uber Driver'      },
      { id: 'moto_taxi',        label: 'Moto Taxi'        },
      { id: 'delivery_driver',  label: 'Delivery Driver'  },
      { id: 'truck_driver',     label: 'Truck Driver'     },
    ],
    security: [
      { id: 'security_guard', label: 'Security Guard' },
    ],
    domestic: [
      { id: 'housekeeper', label: 'Housekeeper' },
      { id: 'cleaner',     label: 'Cleaner'     },
      { id: 'babysitter',  label: 'Babysitter'  },
      { id: 'caregiver',   label: 'Caregiver'   },
    ],
  },

  // ================================================================
  // PART 2 — Healthcare + Company + Hotel + Restaurant
  // ================================================================

  // ── 🏥 HEALTHCARE ────────────────────────────────────────────
  healthcare: [
    { id: 'doctor',                label: 'Doctor'                },
    { id: 'nurse',                 label: 'Nurse'                 },
    { id: 'surgeon',               label: 'Surgeon'               },
    { id: 'dentist',               label: 'Dentist'               },
    { id: 'pediatrician',          label: 'Pediatrician'          },
    { id: 'gynecologist',          label: 'Gynecologist'          },
    { id: 'cardiologist',          label: 'Cardiologist'          },
    { id: 'dermatologist',         label: 'Dermatologist'         },
    { id: 'radiologist',           label: 'Radiologist'           },
    { id: 'laboratory_technician', label: 'Laboratory Technician' },
    { id: 'pharmacist',            label: 'Pharmacist'            },
    { id: 'ambulance_driver',      label: 'Ambulance Driver'      },
    { id: 'medical_secretary',     label: 'Medical Secretary'     },
    { id: 'physiotherapist',       label: 'Physiotherapist'       },
    { id: 'psychologist',          label: 'Psychologist'          },
    { id: 'nutritionist',          label: 'Nutritionist'          },
    { id: 'home_care_nurse',       label: 'Home Care Nurse'       },
  ],

  // ── 🏢 COMPANY ───────────────────────────────────────────────
  company: [
    { id: 'hr',              label: 'HR'              },
    { id: 'recruiter',       label: 'Recruiter'       },
    { id: 'company_admin',   label: 'Company Admin'   },
    { id: 'branch_manager',  label: 'Branch Manager'  },
    { id: 'business_owner',  label: 'Business Owner'  },
  ],

  // ── 🏨 HOTEL ─────────────────────────────────────────────────
  hotel: [
    { id: 'hotel_owner',    label: 'Hotel Owner'    },
    { id: 'hotel_manager',  label: 'Hotel Manager'  },
    { id: 'reception',      label: 'Reception'      },
    { id: 'housekeeping',   label: 'Housekeeping'   },
    { id: 'concierge',      label: 'Concierge'      },
    { id: 'laundry',        label: 'Laundry'        },
    { id: 'bell_boy',       label: 'Bell Boy'       },
  ],

  // ── 🍽 RESTAURANT ─────────────────────────────────────────────
  restaurant: [
    { id: 'owner',      label: 'Owner'      },
    { id: 'manager',    label: 'Manager'    },
    { id: 'chef',       label: 'Chef'       },
    { id: 'cook',       label: 'Cook'       },
    { id: 'waiter',     label: 'Waiter'     },
    { id: 'cashier',    label: 'Cashier'    },
    { id: 'dishwasher', label: 'Dishwasher' },
  ],

  // ================================================================
  // PART 3 — Hospital + Clinic + Tourism + Supplier + Enterprise
  // ================================================================

  // ── 🏥 HOSPITAL ──────────────────────────────────────────────
  hospital: [
    { id: 'hospital_administrator', label: 'Hospital Administrator' },
    { id: 'doctor',                 label: 'Doctor'                 },
    { id: 'nurse',                  label: 'Nurse'                  },
    { id: 'surgeon',                label: 'Surgeon'                },
    { id: 'ambulance_driver',       label: 'Ambulance Driver'       },
  ],

  // ── 🩺 CLINIC ─────────────────────────────────────────────────
  clinic: [
    { id: 'doctor',                label: 'Doctor'                },
    { id: 'nurse',                 label: 'Nurse'                 },
    { id: 'dentist',               label: 'Dentist'               },
    { id: 'laboratory_technician', label: 'Laboratory Technician' },
    { id: 'receptionist',          label: 'Receptionist'          },
  ],

  // ── ✈️ TOURISM ────────────────────────────────────────────────
  tourism: [
    { id: 'tour_guide',          label: 'Tour Guide'          },
    { id: 'travel_agency',       label: 'Travel Agency'       },
    { id: 'excursion_operator',  label: 'Excursion Operator'  },
    { id: 'boat_captain',        label: 'Boat Captain'        },
    { id: 'diving_instructor',   label: 'Diving Instructor'   },
    { id: 'driver',              label: 'Driver'              },
    { id: 'hotel_partner',       label: 'Hotel Partner'       },
  ],

  // ── 🚚 SUPPLIER ───────────────────────────────────────────────
  supplier: [
    { id: 'building_materials', label: 'Building Materials' },
    { id: 'food_supplier',      label: 'Food Supplier'      },
    { id: 'medical_supplier',   label: 'Medical Supplier'   },
    { id: 'hotel_supplier',     label: 'Hotel Supplier'     },
    { id: 'restaurant_supplier',label: 'Restaurant Supplier'},
    { id: 'equipment_rental',   label: 'Equipment Rental'   },
  ],

  // ── 🏭 ENTERPRISE ─────────────────────────────────────────────
  enterprise: [
    { id: 'ceo',                label: 'CEO'                },
    { id: 'director',           label: 'Director'           },
    { id: 'hr_manager',         label: 'HR Manager'         },
    { id: 'procurement_officer',label: 'Procurement Officer'},
    { id: 'finance_manager',    label: 'Finance Manager'    },
    { id: 'operations_manager', label: 'Operations Manager' },
  ],

  // ================================================================
  // PART 4 — IT, Design, Marketing, Education, Legal, Finance,
  //          Agriculture, Manufacturing, Logistics, Real Estate,
  //          Automotive, Pet Services, Beauty & Spa, Entertainment,
  //          Music, Photography, Video Production,
  //          Marketplace Sellers, Government, NGO
  // ================================================================

  // ── 💻 IT & SOFTWARE ─────────────────────────────────────────
  it_software: [
    { id: 'software_developer',    label: 'Software Developer'    },
    { id: 'frontend_developer',    label: 'Frontend Developer'    },
    { id: 'backend_developer',     label: 'Backend Developer'     },
    { id: 'fullstack_developer',   label: 'Full Stack Developer'  },
    { id: 'mobile_developer',      label: 'Mobile Developer'      },
    { id: 'devops_engineer',       label: 'DevOps Engineer'       },
    { id: 'data_scientist',        label: 'Data Scientist'        },
    { id: 'data_analyst',          label: 'Data Analyst'          },
    { id: 'system_administrator',  label: 'System Administrator'  },
    { id: 'network_engineer',      label: 'Network Engineer'      },
    { id: 'cybersecurity',         label: 'Cybersecurity Specialist'},
    { id: 'ui_ux_designer',        label: 'UI/UX Designer'        },
    { id: 'qa_engineer',           label: 'QA Engineer'           },
    { id: 'product_manager',       label: 'Product Manager'       },
    { id: 'it_support',            label: 'IT Support'            },
    { id: 'database_admin',        label: 'Database Administrator'},
    { id: 'cloud_engineer',        label: 'Cloud Engineer'        },
    { id: 'ai_ml_engineer',        label: 'AI / ML Engineer'      },
  ],

  // ── 🎨 DESIGN & CREATIVE ─────────────────────────────────────
  design_creative: [
    { id: 'graphic_designer',   label: 'Graphic Designer'   },
    { id: 'web_designer',       label: 'Web Designer'       },
    { id: 'ui_ux_designer',     label: 'UI/UX Designer'     },
    { id: 'brand_designer',     label: 'Brand Designer'     },
    { id: 'illustrator',        label: 'Illustrator'        },
    { id: 'animator',           label: 'Animator'           },
    { id: 'video_editor',       label: 'Video Editor'       },
    { id: 'motion_designer',    label: 'Motion Designer'    },
    { id: 'interior_designer',  label: 'Interior Designer'  },
    { id: 'fashion_designer',   label: 'Fashion Designer'   },
    { id: 'product_designer',   label: 'Product Designer'   },
  ],

  // ── 📢 MARKETING & SALES ─────────────────────────────────────
  marketing_sales: [
    { id: 'digital_marketer',    label: 'Digital Marketer'    },
    { id: 'social_media_manager',label: 'Social Media Manager'},
    { id: 'content_creator',     label: 'Content Creator'     },
    { id: 'seo_specialist',      label: 'SEO Specialist'      },
    { id: 'email_marketer',      label: 'Email Marketer'      },
    { id: 'sales_representative',label: 'Sales Representative'},
    { id: 'account_manager',     label: 'Account Manager'     },
    { id: 'brand_manager',       label: 'Brand Manager'       },
    { id: 'market_analyst',      label: 'Market Analyst'      },
    { id: 'copywriter',          label: 'Copywriter'          },
    { id: 'advertising_specialist',label:'Advertising Specialist'},
  ],

  // ── 📚 EDUCATION ─────────────────────────────────────────────
  education: [
    { id: 'teacher',               label: 'Teacher'               },
    { id: 'professor',             label: 'Professor'             },
    { id: 'tutor',                 label: 'Tutor'                 },
    { id: 'school_principal',      label: 'School Principal'      },
    { id: 'administrator',         label: 'Administrator'         },
    { id: 'special_ed_teacher',    label: 'Special Education Teacher'},
    { id: 'language_teacher',      label: 'Language Teacher'      },
    { id: 'online_instructor',     label: 'Online Instructor'     },
    { id: 'school_counselor',      label: 'School Counselor'      },
    { id: 'librarian',             label: 'Librarian'             },
    { id: 'academic_coordinator',  label: 'Academic Coordinator'  },
  ],

  // ── ⚖️ LEGAL ─────────────────────────────────────────────────
  legal: [
    { id: 'lawyer',               label: 'Lawyer'               },
    { id: 'attorney',             label: 'Attorney'             },
    { id: 'paralegal',            label: 'Paralegal'            },
    { id: 'legal_secretary',      label: 'Legal Secretary'      },
    { id: 'judge',                label: 'Judge'                },
    { id: 'notary',               label: 'Notary'               },
    { id: 'legal_consultant',     label: 'Legal Consultant'     },
    { id: 'contract_specialist',  label: 'Contract Specialist'  },
    { id: 'compliance_officer',   label: 'Compliance Officer'   },
  ],

  // ── 💰 FINANCE & BANKING ─────────────────────────────────────
  finance_banking: [
    { id: 'accountant',          label: 'Accountant'          },
    { id: 'financial_analyst',   label: 'Financial Analyst'   },
    { id: 'bank_teller',         label: 'Bank Teller'         },
    { id: 'loan_officer',        label: 'Loan Officer'        },
    { id: 'investment_advisor',  label: 'Investment Advisor'  },
    { id: 'tax_consultant',      label: 'Tax Consultant'      },
    { id: 'auditor',             label: 'Auditor'             },
    { id: 'financial_controller',label: 'Financial Controller'},
    { id: 'cfo',                 label: 'CFO'                 },
    { id: 'insurance_agent',     label: 'Insurance Agent'     },
    { id: 'actuary',             label: 'Actuary'             },
  ],

  // ── 🚜 AGRICULTURE ───────────────────────────────────────────
  agriculture: [
    { id: 'farmer',                  label: 'Farmer'                  },
    { id: 'agricultural_engineer',   label: 'Agricultural Engineer'   },
    { id: 'crop_specialist',         label: 'Crop Specialist'         },
    { id: 'livestock_manager',       label: 'Livestock Manager'       },
    { id: 'agronomist',              label: 'Agronomist'              },
    { id: 'farm_worker',             label: 'Farm Worker'             },
    { id: 'irrigation_specialist',   label: 'Irrigation Specialist'   },
    { id: 'agricultural_technician', label: 'Agricultural Technician' },
    { id: 'pest_control_specialist', label: 'Pest Control Specialist' },
    { id: 'greenhouse_manager',      label: 'Greenhouse Manager'      },
  ],

  // ── 🏭 MANUFACTURING ─────────────────────────────────────────
  manufacturing: [
    { id: 'factory_worker',        label: 'Factory Worker'        },
    { id: 'production_manager',    label: 'Production Manager'    },
    { id: 'quality_control',       label: 'Quality Control Inspector'},
    { id: 'machine_operator',      label: 'Machine Operator'      },
    { id: 'maintenance_technician',label: 'Maintenance Technician'},
    { id: 'safety_officer',        label: 'Safety Officer'        },
    { id: 'plant_manager',         label: 'Plant Manager'         },
    { id: 'assembly_worker',       label: 'Assembly Worker'       },
    { id: 'packaging_specialist',  label: 'Packaging Specialist'  },
  ],

  // ── 📦 LOGISTICS ─────────────────────────────────────────────
  logistics: [
    { id: 'logistics_manager',   label: 'Logistics Manager'   },
    { id: 'warehouse_manager',   label: 'Warehouse Manager'   },
    { id: 'delivery_driver',     label: 'Delivery Driver'     },
    { id: 'freight_coordinator', label: 'Freight Coordinator' },
    { id: 'supply_chain_analyst',label: 'Supply Chain Analyst'},
    { id: 'customs_agent',       label: 'Customs Agent'       },
    { id: 'forklift_operator',   label: 'Forklift Operator'   },
    { id: 'inventory_specialist',label: 'Inventory Specialist'},
    { id: 'shipping_agent',      label: 'Shipping Agent'      },
  ],

  // ── 🏠 REAL ESTATE ───────────────────────────────────────────
  real_estate: [
    { id: 'real_estate_agent',    label: 'Real Estate Agent'    },
    { id: 'property_manager',     label: 'Property Manager'     },
    { id: 'real_estate_broker',   label: 'Real Estate Broker'   },
    { id: 'appraiser',            label: 'Appraiser'            },
    { id: 'property_developer',   label: 'Property Developer'   },
    { id: 'leasing_agent',        label: 'Leasing Agent'        },
    { id: 'real_estate_admin',    label: 'Real Estate Administrator'},
  ],

  // ── 🚗 AUTOMOTIVE ────────────────────────────────────────────
  automotive: [
    { id: 'mechanic',           label: 'Mechanic'           },
    { id: 'auto_electrician',   label: 'Auto Electrician'   },
    { id: 'body_shop_technician',label:'Body Shop Technician'},
    { id: 'car_painter',        label: 'Car Painter'        },
    { id: 'tire_specialist',    label: 'Tire Specialist'    },
    { id: 'auto_parts_sales',   label: 'Auto Parts Salesperson'},
    { id: 'car_dealer',         label: 'Car Dealer'         },
    { id: 'tow_truck_driver',   label: 'Tow Truck Driver'   },
    { id: 'car_inspector',      label: 'Car Inspector'      },
    { id: 'lube_technician',    label: 'Lubricant Technician'},
  ],

  // ── 🐕 PET SERVICES ──────────────────────────────────────────
  pet_services: [
    { id: 'veterinarian',        label: 'Veterinarian'        },
    { id: 'vet_technician',      label: 'Vet Technician'      },
    { id: 'dog_groomer',         label: 'Dog Groomer'         },
    { id: 'pet_sitter',          label: 'Pet Sitter'          },
    { id: 'pet_trainer',         label: 'Pet Trainer'         },
    { id: 'shelter_worker',      label: 'Animal Shelter Worker'},
    { id: 'pet_shop_owner',      label: 'Pet Shop Owner'      },
  ],

  // ── 💄 BEAUTY & SPA ──────────────────────────────────────────
  beauty_spa: [
    { id: 'hair_stylist',      label: 'Hair Stylist'      },
    { id: 'barber',            label: 'Barber'            },
    { id: 'nail_technician',   label: 'Nail Technician'   },
    { id: 'esthetician',       label: 'Esthetician'       },
    { id: 'makeup_artist',     label: 'Makeup Artist'     },
    { id: 'massage_therapist', label: 'Massage Therapist' },
    { id: 'spa_manager',       label: 'Spa Manager'       },
    { id: 'beauty_consultant', label: 'Beauty Consultant' },
    { id: 'lash_technician',   label: 'Lash Technician'   },
  ],

  // ── 🎭 ENTERTAINMENT ─────────────────────────────────────────
  entertainment: [
    { id: 'actor',                  label: 'Actor'                  },
    { id: 'event_planner',          label: 'Event Planner'          },
    { id: 'dj',                     label: 'DJ'                     },
    { id: 'host_mc',                label: 'Host / MC'              },
    { id: 'comedian',               label: 'Comedian'               },
    { id: 'performer',              label: 'Performer'              },
    { id: 'event_coordinator',      label: 'Event Coordinator'      },
    { id: 'entertainment_manager',  label: 'Entertainment Manager'  },
    { id: 'venue_manager',          label: 'Venue Manager'          },
  ],

  // ── 🎵 MUSIC ─────────────────────────────────────────────────
  music: [
    { id: 'musician',         label: 'Musician'         },
    { id: 'singer',           label: 'Singer'           },
    { id: 'music_producer',   label: 'Music Producer'   },
    { id: 'sound_engineer',   label: 'Sound Engineer'   },
    { id: 'dj',               label: 'DJ'               },
    { id: 'music_teacher',    label: 'Music Teacher'    },
    { id: 'composer',         label: 'Composer'         },
    { id: 'studio_technician',label: 'Studio Technician'},
  ],

  // ── 📸 PHOTOGRAPHY ───────────────────────────────────────────
  photography: [
    { id: 'photographer',          label: 'Photographer'          },
    { id: 'photo_editor',          label: 'Photo Editor'          },
    { id: 'studio_manager',        label: 'Studio Manager'        },
    { id: 'videographer',          label: 'Videographer'          },
    { id: 'studio_assistant',      label: 'Photo Studio Assistant'},
    { id: 'wedding_photographer',  label: 'Wedding Photographer'  },
    { id: 'commercial_photographer',label:'Commercial Photographer'},
  ],

  // ── 🎥 VIDEO PRODUCTION ──────────────────────────────────────
  video_production: [
    { id: 'videographer',           label: 'Videographer'           },
    { id: 'video_editor',           label: 'Video Editor'           },
    { id: 'camera_operator',        label: 'Camera Operator'        },
    { id: 'director',               label: 'Director'               },
    { id: 'producer',               label: 'Producer'               },
    { id: 'lighting_technician',    label: 'Lighting Technician'    },
    { id: 'script_writer',          label: 'Script Writer'          },
    { id: 'post_production',        label: 'Post-Production Specialist'},
  ],

  // ── 🛍 MARKETPLACE SELLERS ────────────────────────────────────
  marketplace_sellers: [
    { id: 'online_seller',      label: 'Online Seller'      },
    { id: 'wholesaler',         label: 'Wholesaler'         },
    { id: 'retailer',           label: 'Retailer'           },
    { id: 'dropshipper',        label: 'Dropshipper'        },
    { id: 'marketplace_vendor', label: 'Marketplace Vendor' },
    { id: 'product_lister',     label: 'Product Lister'     },
    { id: 'ecommerce_manager',  label: 'E-commerce Manager' },
  ],

  // ── 🏛 GOVERNMENT ────────────────────────────────────────────
  government: [
    { id: 'government_official',  label: 'Government Official'  },
    { id: 'public_servant',       label: 'Public Servant'       },
    { id: 'administrator',        label: 'Administrator'        },
    { id: 'inspector',            label: 'Inspector'            },
    { id: 'customs_officer',      label: 'Customs Officer'      },
    { id: 'public_health_officer',label: 'Public Health Officer'},
    { id: 'city_planner',         label: 'City Planner'         },
    { id: 'police_officer',       label: 'Police Officer'       },
    { id: 'firefighter',          label: 'Firefighter'          },
    { id: 'immigration_officer',  label: 'Immigration Officer'  },
  ],

  // ── 🌍 NGO & ORGANIZATIONS ───────────────────────────────────
  ngo: [
    { id: 'ngo_director',        label: 'NGO Director'        },
    { id: 'program_manager',     label: 'Program Manager'     },
    { id: 'field_coordinator',   label: 'Field Coordinator'   },
    { id: 'fundraiser',          label: 'Fundraiser'          },
    { id: 'community_organizer', label: 'Community Organizer' },
    { id: 'volunteer_coordinator',label:'Volunteer Coordinator'},
    { id: 'grant_writer',        label: 'Grant Writer'        },
    { id: 'mne_officer',         label: 'M&E Officer'         },
    { id: 'communications_officer',label:'Communications Officer'},
  ],
};

// ── Helpers ───────────────────────────────────────────────────────

export const getSubcategories = (categoryId) =>
  SUBCATEGORIES[categoryId] || [];

export const getProfessions = (categoryId, subcategoryId = null) => {
  const cat = PROFESSIONS[categoryId];
  if (!cat) return [];
  if (subcategoryId && cat[subcategoryId]) return cat[subcategoryId];
  if (Array.isArray(cat)) return cat;
  return [];
};
