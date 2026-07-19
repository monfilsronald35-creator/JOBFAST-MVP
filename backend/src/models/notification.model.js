import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // ================= BASIC =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['job_match', 'new_opportunity', 'inquiry', 'message', 'system', 'alert', 'profile_view'],
      default: 'system',
      index: true,
    },

    category: {
      type: String,
      enum: [
        'business_directory',
        'marketplace',
        'services_on_demand',
        'tourism',
        'creator_economy',
        'impact_ngo',
      ],
      default: null,
      index: true,
    },

    // ================= CONTENT =================
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    // ================= DATA =================
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // ================= STATUS =================
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    actionUrl: {
      type: String,
      default: null,
    },

    // ================= EXPIRATION =================
    expiresAt: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 2592000 },
    },

    // ================= METADATA =================
    sourceUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    relatedJobId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ================= INDEXES =================
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, category: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// ================= SAFE OUTPUT =================
notificationSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// ================= EXPORT =================
export default mongoose.model('Notification', notificationSchema);
