
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * 🌍 GEO ENGINE (SAFE + STRICT)
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
 * 💬 MESSAGE MODEL (ULTRA SCALE SYSTEM)
 */
const MessageSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * 🧠 CONVERSATION ENGINE (🔥 NEW - VERY IMPORTANT)
     * Helps group messages without heavy queries
     */
    conversationId: {
      type: String,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "chat",
        "job_request",
        "service_request",
        "construction_request",
        "business_request",
        "system",
      ],
      default: "chat",
      index: true,
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
      default: "individual",
      index: true,
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
      default: "other",
      index: true,
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
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    data: {
      type: Schema.Types.Mixed,
      default: {},
    },

    location: {
      type: GeoSchema,
      default: undefined,
    },

    distanceKm: {
      type: Number,
      default: null,
      min: 0,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    isSeen: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    readAt: {
      type: Date,
      default: null,
    },

    seenAt: {
      type: Date,
      default: null,
    },

    isBroadcast: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * 🚀 INDEXES (ULTRA OPTIMIZED FINAL)
 */

/**
 * 1. Inbox (fast unread loading)
 */
MessageSchema.index({
  receiverId: 1,
  isRead: 1,
  createdAt: -1,
});

/**
 * 2. Chat history (ONE WAY ONLY - optimized with conversationId)
 */
MessageSchema.index({
  conversationId: 1,
  createdAt: -1,
});

/**
 * 3. Type filter
 */
MessageSchema.index({ type: 1, createdAt: -1 });

/**
 * 4. Marketplace filter
 */
MessageSchema.index({
  contextType: 1,
  category: 1,
  serviceType: 1,
});

/**
 * 5. Construction filter
 */
MessageSchema.index({
  constructionRole: 1,
  contextType: 1,
});

/**
 * 6. Broadcast messages
 */
MessageSchema.index({
  isBroadcast: 1,
  createdAt: -1,
});

/**
 * 7. Geo search (SAFE)
 */
MessageSchema.index({ location: "2dsphere" });

export default mongoose.model("Message", MessageSchema);