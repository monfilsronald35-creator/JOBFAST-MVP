
// ======================================================
// 🌍 models/Business.js
// 🚀 ULTRA PRODUCTION READY BUSINESS MODEL
// ======================================================

import mongoose from "mongoose";

mongoose.set("strictQuery", true);

// ======================================================
// 🌍 HELPERS
// ======================================================

const cleanArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];

  return [
    ...new Set(
      arr
        .map(v =>
          String(v)
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )
  ];
};

const normalizeText = (value) => {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase();
};

const normalizePhone = (phone) => {
  if (!phone) return null;

  return String(phone)
    .replace(/[^\d+]/g, "")
    .trim();
};

// ======================================================
// 🏗 CONSTRUCTION ROLES
// ======================================================

const CONSTRUCTION_ROLES = [
  "boss",
  "engineer",
  "architect",
  "foreman",
  "mason",
  "helper",
  "laborer",
  "electrician",
  "plumber",
  "welder",
  "painter",
  "tiler",
  "roofer",
  "carpenter",
  "steel_fixer",
  "machine_operator",
  "surveyor",
  "excavator_operator",
  "truck_driver",
  "site_manager",
  "finisher",
  "block_layer",
  "concrete_worker",
  "interior_designer",
  "construction_company",
  "terminador",
  "ajoudan",
  "feray",
  "kapent",
  "beton",
  "marble_worker"
];

// ======================================================
// 🚀 SERVICES
// ======================================================

const SERVICE_TYPES = [
  "chef",
  "plumber",
  "doctor",
  "nurse",
  "taxi",
  "delivery",
  "cleaning",
  "videographer",
  "designer",
  "mechanic",
  "electrician",
  "welder",
  "teacher",
  "developer",
  "photographer"
];

// ======================================================
// 🌍 BUSINESS TYPES
// ======================================================

const BUSINESS_TYPES = [
  "company",
  "restaurant",
  "hospital",
  "clinic",
  "hotel",
  "office",
  "lawyer",
  "mechanic",
  "tour_guide",
  "organization",
  "construction",
  "services"
];

// ======================================================
// 🖼 SOCIAL LINKS
// ======================================================

const SocialSchema = new mongoose.Schema(
  {
    facebook: String,
    instagram: String,
    whatsapp: String,
    linkedin: String,
    tiktok: String,
    youtube: String
  },

  {
    _id: false
  }
);

// ======================================================
// 📍 LOCATION
// ======================================================

const LocationSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      default: "",
      index: true
    },

    state: {
      type: String,
      default: "",
      index: true
    },

    city: {
      type: String,
      default: "",
      index: true
    },

    address: {
      type: String,
      default: ""
    },

    zipCode: {
      type: String,
      default: ""
    },

    locationCategory: {
      type: String,
      default: null,
      index: true
    },

    distanceKm: {
      type: Number,
      default: 0
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },

      coordinates: {
        type: [Number],

        validate: {
          validator(value) {

            if (!value) return true;

            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },

          message:
            "Invalid longitude or latitude"
        },

        default: undefined
      }
    }
  },

  {
    _id: false
  }
);

// ======================================================
// 🌍 BUSINESS SCHEMA
// ======================================================

const BusinessSchema = new mongoose.Schema(
  {
    // ======================================================
    // 👤 OWNER
    // ======================================================

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // ======================================================
    // 🏢 BUSINESS INFO
    // ======================================================

    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true
    },

    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true
    },

    businessType: {
      type: String,
      enum: BUSINESS_TYPES,
      required: true,
      index: true
    },

    businessCategory: {
      type: String,
      default: null,
      index: true
    },

    description: {
      type: String,
      maxlength: 3000,
      default: ""
    },

    bio: {
      type: String,
      maxlength: 1000,
      default: ""
    },

    logo: {
      type: String,
      default: null
    },

    coverImage: {
      type: String,
      default: null
    },

    gallery: {
      type: [String],
      default: []
    },

    tags: {
      type: [String],
      default: []
    },

    keywords: {
      type: [String],
      default: []
    },

    // ======================================================
    // 👷 CONSTRUCTION + SERVICES
    // ======================================================

    constructionRole: {
      type: String,

      enum: [
        ...CONSTRUCTION_ROLES,
        null
      ],

      default: null,
      index: true
    },

    serviceType: {
      type: String,

      enum: [
        ...SERVICE_TYPES,
        null
      ],

      default: null,
      index: true
    },

    skills: {
      type: [String],
      default: []
    },

    experienceLevel: {
      type: String,

      enum: [
        "beginner",
        "intermediate",
        "expert"
      ],

      default: "beginner",
      index: true
    },

    yearsExperience: {
      type: Number,
      min: 0,
      max: 80,
      default: 0
    },

    availabilityStatus: {
      type: String,

      enum: [
        "available",
        "busy",
        "offline"
      ],

      default: "available",
      index: true
    },

    searchingJob: {
      type: Boolean,
      default: true,
      index: true
    },

    currentJobTitle: {
      type: String,
      default: null
    },

    // ======================================================
    // 📞 CONTACT
    // ======================================================

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true
    },

    phone: {
      type: String,
      default: null,
      index: true
    },

    whatsapp: {
      type: String,
      default: null
    },

    website: {
      type: String,
      default: null
    },

    socialLinks: {
      type: SocialSchema,
      default: () => ({})
    },

    // ======================================================
    // 📍 LOCATION
    // ======================================================

    locationData: {
      type: LocationSchema,
      default: () => ({})
    },

    serviceRadiusKm: {
      type: Number,
      min: 0,
      max: 500,
      default: 10
    },

    locationEnabled: {
      type: Boolean,
      default: true
    },

    // ======================================================
    // 🔔 NOTIFICATIONS
    // ======================================================

    notificationsEnabled: {
      type: Boolean,
      default: true
    },

    pushNotifications: {
      type: Boolean,
      default: true
    },

    pushToken: {
      type: String,
      default: null
    },

    // ======================================================
    // ⭐ REVIEWS + STATS
    // ======================================================

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      index: true
    },

    totalReviews: {
      type: Number,
      min: 0,
      default: 0
    },

    totalViews: {
      type: Number,
      min: 0,
      default: 0
    },

    totalClicks: {
      type: Number,
      min: 0,
      default: 0
    },

    totalFollowers: {
      type: Number,
      min: 0,
      default: 0
    },

    // ======================================================
    // 🔐 STATUS
    // ======================================================

    verified: {
      type: Boolean,
      default: false,
      index: true
    },

    featured: {
      type: Boolean,
      default: false,
      index: true
    },

    sponsored: {
      type: Boolean,
      default: false,
      index: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    suspended: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true
    },

    // ======================================================
    // 📡 ONLINE
    // ======================================================

    isOnline: {
      type: Boolean,
      default: false,
      index: true
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },

  {
    timestamps: true,
    versionKey: false,
    minimize: false
  }
);

// ======================================================
// 🌍 UNIQUE INDEX
// ======================================================

BusinessSchema.index(
  { slug: 1 },

  {
    unique: true,

    partialFilterExpression: {
      slug: {
        $type: "string"
      }
    }
  }
);

// ======================================================
// 🌍 GEO INDEX
// ======================================================

BusinessSchema.index({
  "locationData.location": "2dsphere"
});

// ======================================================
// 🔍 SEARCH INDEX
// ======================================================

BusinessSchema.index(
  {
    businessName: "text",
    description: "text",
    bio: "text",
    tags: "text",
    keywords: "text",
    businessCategory: "text",
    constructionRole: "text",
    serviceType: "text",
    skills: "text"
  },

  {
    weights: {
      businessName: 10,
      businessCategory: 8,
      constructionRole: 8,
      serviceType: 8,
      skills: 7,
      tags: 6,
      keywords: 6,
      description: 5,
      bio: 3
    }
  }
);

// ======================================================
// ⚡ PERFORMANCE INDEXES
// ======================================================

BusinessSchema.index({
  businessType: 1,
  verified: 1
});

BusinessSchema.index({
  constructionRole: 1,
  availabilityStatus: 1
});

BusinessSchema.index({
  serviceType: 1,
  availabilityStatus: 1
});

BusinessSchema.index({
  featured: 1,
  rating: -1
});

BusinessSchema.index({
  active: 1,
  suspended: 1
});

BusinessSchema.index({
  createdAt: -1
});

BusinessSchema.index({
  isOnline: 1,
  lastSeenAt: -1
});

BusinessSchema.index({
  "locationData.country": 1,
  "locationData.state": 1,
  "locationData.city": 1
});

// ======================================================
// 🚀 AUTO CLEAN
// ======================================================

BusinessSchema.pre("save", function (next) {

  this.lastSeenAt = new Date();

  this.tags =
    cleanArray(this.tags);

  this.keywords =
    cleanArray(this.keywords);

  this.skills =
    cleanArray(this.skills);

  if (this.phone) {
    this.phone =
      normalizePhone(this.phone);
  }

  if (this.businessName) {

    this.businessName =
      this.businessName.trim();
  }

  if (this.locationData?.country) {

    this.locationData.country =
      normalizeText(
        this.locationData.country
      );
  }

  if (this.locationData?.state) {

    this.locationData.state =
      normalizeText(
        this.locationData.state
      );
  }

  if (this.locationData?.city) {

    this.locationData.city =
      normalizeText(
        this.locationData.city
      );
  }

  next();
});

// ======================================================
// 🚀 SAFE JSON
// ======================================================

const transform = (doc, ret) => {

  ret.id = ret._id;

  delete ret._id;

  return ret;
};

BusinessSchema.set("toJSON", {
  virtuals: true,
  transform
});

BusinessSchema.set("toObject", {
  virtuals: true,
  transform
});

// ======================================================
// 🚀 SOFT DELETE
// ======================================================

BusinessSchema.pre(
  /^find/,
  function (next) {

    const query =
      this.getQuery();

    if (!query.includeDeleted) {

      this.where({
        deletedAt: null
      });
    }

    delete query.includeDeleted;

    next();
  }
);

// ======================================================
// 🚀 EXPORT
// ======================================================

const Business =
  mongoose.models.Business ||
  mongoose.model(
    "Business",
    BusinessSchema
  );

export default Business;