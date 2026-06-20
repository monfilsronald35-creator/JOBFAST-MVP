
// ======================================================
// 🌍 models/Job.js
// 🚀 GLOBAL JOB MODEL (CLEAN + SAFE)
// ======================================================

import mongoose from "mongoose";

mongoose.set("strictQuery", true);

// ======================================================
// 🌍 HELPERS
// ======================================================

const cleanArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(v => String(v).trim().toLowerCase()).filter(Boolean))];
};

const normalizeText = value => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const normalizePhone = phone => {
  if (!phone) return null;
  return String(phone).replace(/[^\d+]/g, "").trim();
};

// ======================================================
// 🏗 CONSTRUCTION ROLES
// ======================================================

const CONSTRUCTION_ROLES = [
  "boss","engineer","architect","foreman","mason","helper","laborer",
  "electrician","plumber","welder","painter","tiler","roofer","carpenter",
  "steel_fixer","machine_operator","surveyor","excavator_operator","truck_driver",
  "site_manager","finisher","block_layer","concrete_worker","interior_designer",
  "construction_company","terminador","ajoudan","feray","kapent","beton","marble_worker"
];

// ======================================================
// 🚀 SERVICES
// ======================================================

const SERVICE_TYPES = [
  "chef","plumber","doctor","nurse","taxi","delivery","cleaning",
  "videographer","designer","mechanic","electrician","welder",
  "teacher","developer","photographer"
];

// ======================================================
// 🌍 JOB TYPES
// ======================================================

const JOB_TYPES = [
  "construction","service","business","company","restaurant","hospital",
  "clinic","hotel","office","lawyer","mechanic","tour_guide","organization"
];

// ======================================================
// 📍 LOCATION SCHEMA
// ======================================================

const LocationSchema = new mongoose.Schema(
  {
    countryNormalized: { type: String, default: "", index: true },
    stateNormalized: { type: String, default: "", index: true },
    cityNormalized: { type: String, default: "", index: true },

    address: { type: String, default: "" },
    zipCode: { type: String, default: "" },

    locationCategory: { type: String, default: null, index: true },
    distanceKm: { type: Number, default: 0 },

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
          message: "Invalid longitude or latitude"
        },
        default: undefined
      }
    }
  },
  { _id: false }
);

// ======================================================
// 🌍 JOB SCHEMA
// ======================================================

const JobSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true
    },

    title: { type: String, required: true, trim: true, maxlength: 150, index: true },

    slug: { type: String, trim: true, lowercase: true, sparse: true, unique: true, index: true },

    description: { type: String, required: true, maxlength: 5000 },

    shortDescription: { type: String, maxlength: 500, default: "" },

    jobType: { type: String, enum: JOB_TYPES, required: true, index: true },

    constructionRole: { type: String, enum: [...CONSTRUCTION_ROLES, null], default: null, index: true },

    serviceType: { type: String, enum: [...SERVICE_TYPES, null], default: null, index: true },

    skills: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    keywords: { type: [String], default: [] },

    salaryMin: { type: Number, min: 0, default: 0 },
    salaryMax: { type: Number, min: 0, default: 0 },

    currency: { type: String, enum: ["USD","EUR","HTG","DOP"], default: "USD" },

    paymentType: {
      type: String,
      enum: ["hourly","daily","weekly","monthly","contract"],
      default: "daily",
      index: true
    },

    negotiableSalary: { type: Boolean, default: true },

    contactName: { type: String, default: "" },

    email: { type: String, trim: true, lowercase: true, default: null, index: true },

    phone: { type: String, default: null, index: true },

    whatsapp: { type: String, default: null },

    locationData: { type: LocationSchema, default: () => ({}) },

    remoteAllowed: { type: Boolean, default: false },

    active: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    urgentHiring: { type: Boolean, default: false, index: true },
    approved: { type: Boolean, default: true, index: true },

    totalApplications: { type: Number, min: 0, default: 0 },
    totalViews: { type: Number, min: 0, default: 0 },

    expiresAt: { type: Date, default: null, index: true },
    deletedAt: { type: Date, default: null, index: true }
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false
  }
);

// ======================================================
// 🚀 INDEXES
// ======================================================

JobSchema.index({ slug: 1 }, { unique: true, sparse: true });

JobSchema.index({ "locationData.location": "2dsphere" });

JobSchema.index({
  title: "text",
  description: "text",
  skills: "text",
  tags: "text",
  keywords: "text"
});

// ======================================================
// 🚀 AUTO CLEAN (FIXED)
// ======================================================

JobSchema.pre("save", function (next) {
  this.tags = cleanArray(this.tags);
  this.keywords = cleanArray(this.keywords);
  this.skills = cleanArray(this.skills);
  this.requirements = cleanArray(this.requirements);
  this.responsibilities = cleanArray(this.responsibilities);

  if (this.phone) {
    this.phone = normalizePhone(this.phone);
  }

  if (this.locationData) {
    this.locationData.countryNormalized = normalizeText(this.locationData.country);
    this.locationData.stateNormalized = normalizeText(this.locationData.state);
    this.locationData.cityNormalized = normalizeText(this.locationData.city);
  }

  next();
});

// ======================================================
// 🚀 EXPORT
// ======================================================

const Job =
  mongoose.models.Job || mongoose.model("Job", JobSchema);

export default Job;