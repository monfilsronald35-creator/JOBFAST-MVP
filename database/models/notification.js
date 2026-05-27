import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * 🔔 NOTIFICATION MODEL (FINAL OPTIMIZED)
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
      type: [Number],
      default: undefined,
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

const NotificationSchema = new Schema(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "job",
        "service",
        "construction",
        "message",
        "system",
        "nearby",
        "availability",
        "promotion",
      ],
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: ["construction", "service", "job", "business", "nearby", "system"],
      default: "system",
      index: true,
    },

    targetType: {
      type: String,
      enum: ["job", "service", "user", "business", "system"],
      default: "system",
    },

    title: {
      type: String,
      required: true,
      trim: true,
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
      default: null,
    },

    distanceKm: {
      type: Number,
      default: null,
      min: 0,
    },

    referenceId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    referenceModel: {
      type: String,
      enum: ["Job", "Service", "Business", "User"],
      default: null,
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

    readAt: {
      type: Date,
      default: null,
    },

    seenAt: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    deliveryMethod: {
      type: String,
      enum: ["in_app", "push", "email", "sms"],
      default: "in_app",
    },

    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed"],
      default: "pending",
      index: true,
    },

    isGlobal: {
      type: Boolean,
      default: false,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (arr) =>
        [...new Set((arr || []).map((t) => String(t).toLowerCase().trim()))],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 🚀 INDEXES (OPTIMIZED)
 */

// feed (VERY IMPORTANT)
NotificationSchema.index({
  recipientId: 1,
  isRead: 1,
  createdAt: -1,
});

// filters
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ category: 1, createdAt: -1 });

// relations
NotificationSchema.index({ referenceId: 1, referenceModel: 1 });

// global feed
NotificationSchema.index({ isGlobal: 1, createdAt: -1 });

// geo (SAFE)
NotificationSchema.index({ location: "2dsphere" });

// TTL cleanup
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notification", NotificationSchema);