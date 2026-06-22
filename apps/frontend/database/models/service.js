
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * 🌍 GEO SCHEMA (GPS ENGINE SAFE)
 */
const GeoSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
      validate: {
        validator: function (v) {
          return (
            Array.isArray(v) &&
            v.length === 2 &&
            v[0] >= -180 &&
            v[0] <= 180 &&
            v[1] >= -90 &&
            v[1] <= 90
          );
        },
        message: "Invalid GeoJSON coordinates [lng, lat]",
      },
    },
  },
  { _id: false }
);

/**
 * 🌍 SERVICE MODEL (GLOBAL MARKETPLACE CORE)
 */
const ServiceSchema = new Schema(
  {
    // 👤 BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    bio: {
      type: String,
      default: "",
    },

    avatar: {
      type: String,
      default: null,
    },

    coverImage: {
      type: String,
      default: null,
    },

    // 🏢 ENTITY TYPE
    entityType: {
      type: String,
      enum: [
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
        "individual",
      ],
      required: true,
      index: true,
    },

    // 🔧 SERVICE CATEGORY
    category: {
      type: String,
      enum: [
        "construction",
        "on_demand",
        "health",
        "transport",
        "delivery",
        "cleaning",
        "creative",
        "tech",
        "education",
        "other",
      ],
      required: true,
      index: true,
    },

    // 🛠 SPECIALIZATION
    serviceType: {
      type: String,
      enum: [
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
        "mason",
        "architect",
        "engineer",
        "lawyer",
        "tour_guide",
        "security",
        "driver",
        "carpenter",
        "other",
      ],
      default: "other",
      index: true,
    },

    // 🏗 CONSTRUCTION SYSTEM
    constructionRole: {
      type: String,
      enum: [
        "boss",
        "assistant",
        "worker",
        "engineer",
        "architect",
        "foreman",
        "electrician",
        "plumber",
        "mason",
        "site_manager",
        "supervisor",
        "none",
      ],
      default: "none",
      index: true,
    },

    // 🧠 SKILLS
    skills: {
      type: [String],
      default: [],
      set: (arr) =>
        [...new Set(arr.map((t) => String(t).toLowerCase().trim()))],
      index: true,
    },

    // 📍 LOCATION ENGINE
    location: {
      type: GeoSchema,
      required: true,
    },

    addressText: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      index: true,
    },

    state: {
      type: String,
      index: true,
    },

    country: {
      type: String,
      index: true,
    },

    // 📊 AVAILABILITY SYSTEM
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
      index: true,
    },

    // 🔴 ONLINE SYSTEM (REAL TIME)
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // 📏 SERVICE RANGE
    serviceRadiusKm: {
      type: Number,
      default: 10,
      min: 1,
      max: 500,
    },

    // ⭐ RATING SYSTEM
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // 📲 CONTACT
    phone: {
      type: String,
      default: null,
    },

    whatsapp: {
      type: String,
      default: null,
    },

    email: {
      type: String,
      default: null,
    },

    // 🧠 TAGS
    tags: {
      type: [String],
      default: [],
      set: (arr) =>
        [...new Set(arr.map((t) => String(t).toLowerCase().trim()))],
      index: true,
    },

    // 🔔 NOTIFICATIONS
    notifyEnabled: {
      type: Boolean,
      default: true,
    },

    // 🛡 VERIFICATION SYSTEM (NEW IMPORTANT)
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    // 💼 WORK STATUS (FOR JOB SEARCH)
    isAvailableForWork: {
      type: Boolean,
      default: true,
      index: true,
    },

    // 📡 PUSH TOKEN READY
    pushToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 🚀 INDEXES (FULL SYSTEM PERFORMANCE)
 */
ServiceSchema.index({ location: "2dsphere" });
ServiceSchema.index({ entityType: 1, category: 1 });
ServiceSchema.index({ serviceType: 1 });
ServiceSchema.index({ city: 1, country: 1 });
ServiceSchema.index({ availabilityStatus: 1 });
ServiceSchema.index({ isOnline: 1 });
ServiceSchema.index({ isVerified: 1 });
ServiceSchema.index({ isAvailableForWork: 1 });

// 🔥 FULL TEXT SEARCH ENGINE (POWERFUL SEARCH)
ServiceSchema.index({
  name: "text",
  bio: "text",
  tags: "text",
  skills: "text",
  addressText: "text",
  city: "text",
  country: "text",
});

export default mongoose.model("Service", ServiceSchema);