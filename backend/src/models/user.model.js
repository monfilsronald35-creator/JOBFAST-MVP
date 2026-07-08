
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ================= LOCATION =================
const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },

    // ================= COORDINATES (FIXED & SAFE) =================
    coordinates: {
      type: [Number], // [lng, lat]
      validate: {
        validator: (v) =>
          !v || (Array.isArray(v) && v.length === 2),
        message: 'Coordinates must be [lng, lat]',
      },
      default: null,
    },

    city: { type: String, default: '', index: true },
    country: { type: String, default: '', index: true },
  },
  { _id: false }
);

// ================= USER =================
const userSchema = new mongoose.Schema(
  {
    // ================= BASIC =================
    name: { type: String, trim: true, maxlength: 120 },

    firstName: { type: String, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80 },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    phone: { type: String, default: null },
    bio: { type: String, default: '' },

    // ================= ROLE =================
    role: {
      type: String,
      default: 'user',
      index: true,
    },

    // ================= CATEGORY SYSTEM =================
    category: {
      type: String,
      default: null,
      index: true,
    },

    profession: {
      type: String,
      default: null,
    },

    profileMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    profileCompleteness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    categoryDetails: [
      {
        category: String,
        profession: String,
        metadata: mongoose.Schema.Types.Mixed,
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // ================= BUSINESS =================
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
      ],
      default: null,
    },

    // ================= CONSTRUCTION =================
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
      ],
      default: null,
    },

    // ================= SERVICES =================
    services: {
      type: [String],
      default: [],
      index: true,
    },

    serviceIntent: {
      type: String,
      enum: ['looking_job', 'offering_service', 'hiring', 'none'],
      default: 'none',
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ['available', 'busy', 'working', 'offline'],
      default: 'available',
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ================= LOCATION =================
    location: {
      type: locationSchema,
      default: null,
    },

    // ================= SECURITY =================
    loginAttempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ================= INDEXES =================

// ✅ UNIQUE EMAIL (CORRECT WAY)
userSchema.index({ email: 1 }, { unique: true });

// 🔍 FILTER INDEXES
userSchema.index({ role: 1 });
userSchema.index({ category: 1 });
userSchema.index({ profession: 1 });
userSchema.index({ businessType: 1 });
userSchema.index({ constructionRole: 1 });
userSchema.index({ status: 1 });
userSchema.index({ serviceIntent: 1 });
userSchema.index({ profileCompleteness: 1 });

// 🔥 FAST SEARCH INDEXES
userSchema.index({ services: 1, isAvailable: 1 });
userSchema.index({ profession: 1, isAvailable: 1 });

// 🌍 GEO INDEX (ULTRA SAFE + NO CRASH)
userSchema.index(
  { location: '2dsphere' },
  {
    partialFilterExpression: {
      location: { $ne: null },
      'location.coordinates.0': { $exists: true },
    },
  }
);

// ================= AUTO NAME =================
userSchema.pre('save', function (next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
  next();
});

// ================= PASSWORD HASH =================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ================= PASSWORD UPDATE =================
userSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();

    const password =
      update?.$set?.password || update?.password;

    if (password) {
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(password, salt);

      if (update.$set) {
        update.$set.password = hashed;
      } else {
        update.password = hashed;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ================= SAFE OUTPUT =================
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// ================= METHOD =================
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// ================= EXPORT =================
export default mongoose.model('User', userSchema);