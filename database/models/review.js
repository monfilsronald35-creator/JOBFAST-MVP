
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * 🌍 GEO ENGINE
 */
const GeoSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      validate: {
        validator: (v) => {
          if (!v) return true;
          return (
            Array.isArray(v) &&
            v.length === 2 &&
            v.every((n) => Number.isFinite(n)) &&
            v[0] >= -180 &&
            v[0] <= 180 &&
            v[1] >= -90 &&
            v[1] <= 90
          );
        },
        message: "Invalid coordinates [lng, lat]",
      },
    },
  },
  { _id: false }
);

/**
 * ⭐ REVIEW MODEL
 */
const ReviewSchema = new Schema(
  {
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    targetModel: {
      type: String,
      enum: ["User", "Service", "Business"],
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },

    sentiment: {
      type: String,
      enum: ["negative", "neutral", "positive"],
      default: "neutral",
      index: true,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    contextType: {
      type: String,
      enum: ["construction", "service", "on_demand", "business", "nearby"],
      default: "service",
      index: true,
    },

    category: {
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
    },

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
        "other",
      ],
    },

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
    },

    location: {
      type: GeoSchema,
      default: null,
    },

    distanceKm: {
      type: Number,
      min: 0,
      default: null,
    },

    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },

    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

/**
 * 🚀 INDEXES
 */

// anti-spam
ReviewSchema.index(
  { reviewerId: 1, targetId: 1, targetModel: 1 },
  { unique: true }
);

// main feed
ReviewSchema.index({ targetId: 1, targetModel: 1, createdAt: -1 });

// rating
ReviewSchema.index({ targetId: 1, rating: -1 });

// history
ReviewSchema.index({ reviewerId: 1, createdAt: -1 });

// ranking
ReviewSchema.index({ targetId: 1, score: -1 });

// filters
ReviewSchema.index({
  contextType: 1,
  category: 1,
  serviceType: 1,
});

// geo SAFE (no sparse)
ReviewSchema.index({ location: "2dsphere" });

export default mongoose.model("Review", ReviewSchema);