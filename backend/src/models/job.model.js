
import mongoose from 'mongoose';

// ================= LOCATION ENGINE =================
const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },

    coordinates: {
      type: [Number], // [lng, lat]
      default: null,
      validate: {
        validator: (v) => !v || v.length === 2,
        message: 'Coordinates must be [lng, lat]',
      },
    },

    address: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    country: { type: String, default: '', index: true },
  },
  { _id: false }
);

// ================= JOB / SERVICE CORE =================
const jobSchema = new mongoose.Schema(
  {
    // 👤 OWNER
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // 🏷️ BASIC INFO
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    // ================= MARKETPLACE TYPES =================
    type: {
      type: String,
      enum: ['job', 'service', 'business', 'construction'],
      default: 'service',
      index: true,
    },

    // ================= BUSINESS CATEGORY =================
    businessType: {
      type: String,
      enum: [
        'company',
        'restaurant',
        'hospital',
        'clinic',
        'hotel',
        'office',
        'lawyer',
        'mechanic',
        'tour_guide',
        'organization',
        'none',
      ],
      default: 'none',
      index: true,
    },

    // ================= SERVICE CATEGORY =================
    serviceCategory: {
      type: String,
      enum: [
        'chef_lakay',
        'plonbye',
        'doctor',
        'nurse',
        'taxi',
        'delivery',
        'cleaning',
        'videographer',
        'designer',
        'none',
      ],
      default: 'none',
      index: true,
    },

    // ================= CONSTRUCTION ROLE =================
    constructionRole: {
      type: String,
      enum: [
        'boss',
        'assistant',
        'worker',
        'electrician',
        'plumber',
        'mason',
        'carpenter',
        'welder',
        'foreman',
        'architect',
        'none',
      ],
      default: 'none',
      index: true,
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ['active', 'paused', 'closed'],
      default: 'active',
      index: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ================= LOCATION =================
    location: locationSchema,

    radiusKm: {
      type: Number,
      default: 10,
      min: 1,
      max: 500,
    },

    // ================= PAYMENT =================
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
    },

    isNegotiable: {
      type: Boolean,
      default: true,
    },

    // ================= SOCIAL / ENGAGEMENT =================
    views: { type: Number, default: 0 },
    applications: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },

    // ================= TAGS =================
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // ================= URGENCY =================
    isUrgent: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ================= BOOST SYSTEM =================
    boosted: {
      type: Boolean,
      default: false,
      index: true,
    },

    boostExpiresAt: {
      type: Date,
      default: null,
    },

    // ================= MATCHING ENGINE =================
    requiredSkills: {
      type: [String],
      default: [],
      index: true,
    },

    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'any'],
      default: 'any',
      index: true,
    },

    // ================= 🔥 REAL MATCHING BOOST (NEW) =================
    preferredGender: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any',
    },

    minRatingRequired: {
      type: Number,
      default: 0,
    },

    // ================= NOTIFICATIONS =================
    notifyRadiusKm: {
      type: Number,
      default: 15,
      min: 1,
      max: 500,
    },

    sentNotifications: {
      type: Number,
      default: 0,
    },

    // ================= RATING =================
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    // ================= MODERATION =================
    isVerified: {
      type: Boolean,
      default: false,
    },

    isReported: {
      type: Boolean,
      default: false,
    },

    reportCount: {
      type: Number,
      default: 0,
    },

    // ================= LIFECYCLE =================
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ================= INDEXES =================
jobSchema.index({ title: 'text', description: 'text', tags: 'text' });
jobSchema.index({ location: '2dsphere' });

jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ businessType: 1 });
jobSchema.index({ serviceCategory: 1 });
jobSchema.index({ constructionRole: 1 });

jobSchema.index({ boosted: 1, createdAt: -1 });
jobSchema.index({ userId: 1, createdAt: -1 });

jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ experienceLevel: 1 });

// ================= EXPORT =================
export default mongoose.model('Job', jobSchema);