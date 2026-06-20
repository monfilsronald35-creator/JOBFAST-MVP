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
        .map(v => String(v).trim())
        .filter(Boolean)
    )
  ];
};

const normalizePhone = (phone) => {
  if (!phone) return null;

  return String(phone)
    .replace(/[^\d+]/g, "")
    .trim();
};

// ======================================================
// 📱 DEVICE SCHEMA
// ======================================================

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      trim: true
    },

    deviceName: {
      type: String,
      default: "Unknown Device"
    },

    ip: {
      type: String,
      default: null
    },

    userAgent: {
      type: String,
      default: null
    },

    platform: {
      type: String,
      default: null
    },

    refreshTokenHash: {
      type: String,
      select: false,
      default: null
    },

    lastActiveAt: {
      type: Date,
      default: Date.now
    }
  },

  {
    _id: false
  }
);

// ======================================================
// 🌍 USER SCHEMA
// ======================================================

const UserSchema = new mongoose.Schema(
  {
    // ======================================================
    // 👤 BASIC INFO
    // ======================================================

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,

      match: [
        /^[a-z0-9_.]+$/,
        "Invalid username"
      ],

      sparse: true,
      unique: true,
      index: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,

      match: [
        /^\S+@\S+\.\S+$/,
        "Invalid email address"
      ],

      sparse: true,
      unique: true,
      index: true
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,

      sparse: true,
      unique: true,
      index: true,

      default: null
    },

    password: {
      type: String,
      minlength: 6,
      maxlength: 200,
      required: true,
      select: false
    },

    profileImage: {
      type: String,
      default: null
    },

    coverImage: {
      type: String,
      default: null
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },

    website: {
      type: String,
      trim: true,
      default: null
    },

    birthDate: {
      type: Date,
      default: null
    },

    gender: {
      type: String,

      enum: [
        "male",
        "female",
        "other",
        null
      ],

      default: null
    },

    // ======================================================
    // 🔐 AUTH + SECURITY
    // ======================================================

    passwordChangedAt: Date,

    passwordResetToken: {
      type: String,
      select: false
    },

    passwordResetExpires: {
      type: Date,
      select: false
    },

    emailVerificationToken: {
      type: String,
      select: false
    },

    emailVerificationExpires: {
      type: Date,
      select: false
    },

    phoneVerificationCode: {
      type: String,
      select: false
    },

    phoneVerificationExpires: {
      type: Date,
      select: false
    },

    otpCode: {
      type: String,
      select: false
    },

    otpExpires: {
      type: Date,
      select: false
    },

    loginAttempts: {
      type: Number,
      default: 0
    },

    blockedUntil: {
      type: Date,
      default: null
    },

    refreshTokenVersion: {
      type: Number,
      default: 0,
      select: false
    },

    securityStamp: {
      type: String,
      default: null,
      select: false
    },

    devices: {
      type: [DeviceSchema],
      default: []
    },

    // ======================================================
    // 🌍 ACCOUNT
    // ======================================================

    accountType: {
      type: String,

      enum: [
        "user",
        "business",
        "organization"
      ],

      default: "user",
      index: true
    },

    role: {
      type: String,

      enum: [
        "user",
        "admin",
        "moderator"
      ],

      default: "user",
      index: true
    },

    accountStatus: {
      type: String,

      enum: [
        "active",
        "suspended",
        "deleted"
      ],

      default: "active",
      index: true
    },

    verified: {
      type: Boolean,
      default: false,
      index: true
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    phoneVerified: {
      type: Boolean,
      default: false
    },

    kycVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    featuredAccount: {
      type: Boolean,
      default: false,
      index: true
    },

    premiumAccount: {
      type: Boolean,
      default: false,
      index: true
    },

    banned: {
      type: Boolean,
      default: false,
      index: true
    },

    banReason: {
      type: String,
      default: null
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true
    },

    // ======================================================
    // 🔐 OAUTH
    // ======================================================

    googleId: {
      type: String,
      sparse: true,
      index: true
    },

    facebookId: {
      type: String,
      sparse: true,
      index: true
    },

    appleId: {
      type: String,
      sparse: true,
      index: true
    },

    loginProvider: {
      type: String,

      enum: [
        "local",
        "google",
        "facebook",
        "apple"
      ],

      default: "local"
    },

    // ======================================================
    // 👷 PROFESSIONAL
    // ======================================================

    constructionRole: {
      type: String,
      default: null,
      index: true
    },

    serviceType: {
      type: String,
      default: null,
      index: true
    },

    businessCategory: {
      type: String,
      default: null,
      index: true
    },

    skills: {
      type: [String],
      default: []
    },

    languages: {
      type: [String],
      default: []
    },

    certificates: {
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

    hourlyRate: {
      type: Number,
      min: 0,
      default: 0
    },

    // ======================================================
    // 💰 WALLET
    // ======================================================

    walletBalance: {
      type: Number,
      min: 0,
      default: 0
    },

    currency: {
      type: String,
      uppercase: true,
      default: "USD"
    },

    walletLocked: {
      type: Boolean,
      default: false
    },

    // ======================================================
    // 📍 LOCATION
    // ======================================================

    country: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    state: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    city: {
      type: String,
      trim: true,
      default: "",
      index: true
    },

    address: {
      type: String,
      trim: true,
      default: ""
    },

    zipCode: {
      type: String,
      trim: true,
      default: ""
    },

    locationEnabled: {
      type: Boolean,
      default: false
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
    },

    // ======================================================
    // 🔔 NOTIFICATIONS
    // ======================================================

    notificationsEnabled: {
      type: Boolean,
      default: true
    },

    emailNotifications: {
      type: Boolean,
      default: true
    },

    smsNotifications: {
      type: Boolean,
      default: false
    },

    pushToken: {
      type: String,
      default: null
    },

    // ======================================================
    // 🔒 PRIVACY
    // ======================================================

    profileVisibility: {
      type: String,

      enum: [
        "public",
        "private"
      ],

      default: "public"
    },

    showEmail: {
      type: Boolean,
      default: false
    },

    showPhone: {
      type: Boolean,
      default: false
    },

    // ======================================================
    // ⭐ STATS
    // ======================================================

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },

    totalReviews: {
      type: Number,
      min: 0,
      default: 0
    },

    totalJobsCompleted: {
      type: Number,
      min: 0,
      default: 0
    },

    followersCount: {
      type: Number,
      min: 0,
      default: 0
    },

    followingCount: {
      type: Number,
      min: 0,
      default: 0
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
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },

  {
    timestamps: true,
    versionKey: false,
    minimize: false
  }
);

// ======================================================
// 🌍 INDEXES
// ======================================================

UserSchema.index({
  location: "2dsphere"
});

UserSchema.index(
  {
    fullName: "text",
    bio: "text",
    city: "text",
    skills: "text"
  },

  {
    weights: {
      fullName: 10,
      skills: 8,
      city: 5,
      bio: 3
    }
  }
);

UserSchema.index({
  accountType: 1,
  city: 1
});

UserSchema.index({
  verified: 1,
  banned: 1
});

UserSchema.index({
  featuredAccount: 1,
  rating: -1
});

UserSchema.index({
  country: 1,
  state: 1,
  city: 1
});

UserSchema.index({
  availabilityStatus: 1,
  experienceLevel: 1
});

UserSchema.index({
  createdAt: -1
});

UserSchema.index({
  deletedAt: 1,
  accountStatus: 1
});

// ======================================================
// 🚀 VIRTUALS
// ======================================================

UserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

UserSchema.virtual("isLocked").get(function () {
  return !!(
    this.blockedUntil &&
    this.blockedUntil > Date.now()
  );
});

// ======================================================
// ⚡ AUTO CLEAN DATA
// ======================================================

UserSchema.pre("save", function (next) {

  this.lastSeenAt = new Date();

  if (this.email) {
    this.email =
      this.email.trim().toLowerCase();
  }

  if (this.username) {
    this.username =
      this.username.trim().toLowerCase();
  }

  if (this.phone) {
    this.phone =
      normalizePhone(this.phone);
  }

  this.skills =
    cleanArray(this.skills);

  this.languages =
    cleanArray(this.languages);

  this.certificates =
    cleanArray(this.certificates);

  this.profileCompleted = Boolean(
    this.fullName &&
    (this.email || this.phone) &&
    (
      this.skills.length ||
      this.serviceType ||
      this.constructionRole
    )
  );

  next();
});

// ======================================================
// 🚀 SAFE JSON
// ======================================================

const transform = (doc, ret) => {

  delete ret.password;
  delete ret.passwordResetToken;
  delete ret.passwordResetExpires;
  delete ret.emailVerificationToken;
  delete ret.emailVerificationExpires;
  delete ret.phoneVerificationCode;
  delete ret.phoneVerificationExpires;
  delete ret.otpCode;
  delete ret.otpExpires;
  delete ret.refreshTokenVersion;
  delete ret.securityStamp;
  delete ret.__v;

  return ret;
};

UserSchema.set("toJSON", {
  virtuals: true,
  transform
});

UserSchema.set("toObject", {
  virtuals: true,
  transform
});

// ======================================================
// 🚀 SOFT DELETE FILTER
// ======================================================

UserSchema.pre(/^find/, function (next) {

  if (!this.getQuery().includeDeleted) {
    this.where({
      deletedAt: null
    });
  }

  next();
});

// ======================================================
// 🚀 EXPORT
// ======================================================

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    UserSchema
  );

export default User;