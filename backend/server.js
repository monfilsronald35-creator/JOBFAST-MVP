// ======================================================
// 🌍 ENV INITIALIZATION (DWE ANWO NÈT)
// ======================================================
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import crypto from "crypto";
import mongoose from "mongoose";

const app = express();

// ======================================================
// 🌍 CONFIG & MONGODB CONNECTION
// ======================================================
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI; 

if (!MONGO_URI) {
  console.error("❌ ERÈ: MONGO_URI manke nan anviwònman (.env / Render)!");
  process.exit(1); // Bloke sèvè a si pa gen URI koneksyon
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("🍃 MongoDB Atlas konekte ak siksè!"))
    .catch((err) => {
      console.error("❌ Erè koneksyon MongoDB:", err);
      process.exit(1); // Evite sèvè a kouri si DB a echwe
    });
}

// ======================================================
// 🌍 TRUST PROXY & SECURITY
// ======================================================
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ======================================================
// 🌍 MIDDLEWARES
// ======================================================
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb", strict: true })); // Strict parsing pou sekirite input
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ======================================================
// 🚦 SIMPLE RATE LIMIT (OPTIMIZED)
// ======================================================
const rateMap = new Map();
app.use((req, res, next) => {
  const ip = (req.headers["x-forwarded-for"] || req.ip || "unknown")
    .toString()
    .split(",")[0]
    .trim();

  const now = Date.now();
  
  if (!rateMap.has(ip)) {
    rateMap.set(ip, { count: 1, time: now });
  } else {
    const data = rateMap.get(ip);
    
    if (now - data.time < 10000) {
      if (data.count >= 100) {
        return res.status(429).json({ success: false, message: "Too many requests" });
      }
      data.count++;
    } else {
      data.count = 1;
      data.time = now;
    }
    rateMap.set(ip, data);
  }
  next();
});

const rateCleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateMap.entries()) {
    if (now - data.time > 60000) rateMap.delete(ip);
  }
}, 60000);
rateCleanup.unref();

// ======================================================
// 🗄️ MONGOOSE USER SCHEMA & MODEL
// ======================================================
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    category: { type: String, default: "general" },
    role: { type: String, default: "worker" },
    availability: { type: String, default: "available" },
    verified: { type: Boolean, default: false },
    location: {
      country: { type: String, default: "" },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  {
    timestamps: true, 
  }
);

const User = mongoose.model("User", userSchema);

// ======================================================
// 🧼 HELPERS
// ======================================================
const normalize = (v) => String(v || "").trim().toLowerCase();
const token = () => crypto.randomUUID();
const hash = (v) => crypto.createHash("sha256").update(v).digest("hex");
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const safeUser = (userObj) => {
  const safe = userObj.toObject ? userObj.toObject() : { ...userObj };
  delete safe.password;
  return safe;
};

// Map sesyon token tanporè pou MVP
const authTokens = new Map();

// ======================================================
// 🛡️ MIDDLEWARE: AUTH (Pou lòt paj pwoteje yo)
// ======================================================
async function authMiddleware(req, res, next) {
  const bearer = req.headers.authorization || "";
  const accessToken = bearer.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const userId = authTokens.get(accessToken);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Auth internal error" });
  }
}

// ======================================================
// ❤️ ROUTES: ROOT & HEALTH
// ======================================================
app.get("/", (req, res) => {
  res.json({ success: true, app: "JOBFAST GLOBAL API", status: "running", version: "1.0.0" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ======================================================
// 👤 ROUTE: REGISTER
// ======================================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      bio,
      category,
      role,
      country,
      state,
      city,
      latitude,
      longitude,
    } = req.body || {};

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: Nom, Prénom, email, password are required",
      });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email style" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password too short (min 6 characters)" });
    }

    const normalizedEmail = normalize(email);
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(409).json({ success: false, message: "Email already exists in system" });
    }

    const fName = firstName.trim();
    const lName = lastName.trim();
    const full = `${fName} ${lName}`.trim();

    const newUser = new User({
      firstName: fName,
      lastName: lName,
      fullName: full,
      email: normalizedEmail,
      password: hash(password),
      phone: phone || "",
      bio: bio || "",
      category: category || "general",
      role: role || "worker",
      availability: "available",
      verified: false,
      location: {
        country: country || "",
        state: state || "",
        city: city || "",
        latitude: latitude || null,
        longitude: longitude || null,
      }
    });

    await newUser.save();

    const accessToken = token();
    authTokens.set(accessToken, newUser._id.toString());

    res.status(201).json({
      success: true,
      token: accessToken,
      user: safeUser(newUser),
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
});

// ======================================================
// 🔑 ROUTE: LOGIN (FLEXIBLE & REFACTORIZED)
// ======================================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // 1. Chache itilizatè a sèlman pa email
    const user = await User.findOne({ email: normalize(email) });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 2. Verifye hash modpas la separeman pou fleksibilite algorithm nan pita
    const isValid = user.password === hash(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = token();
    authTokens.set(accessToken, user._id.toString());

    res.json({
      success: true,
      token: accessToken,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});

// ======================================================
// 👤 ROUTE: PROFILE
// ======================================================
app.get("/api/auth/profile", authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: safeUser(req.user),
  });
});

// ======================================================
// 🚀 START SERVER
// ======================================================
const server = app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 JOBFAST BACKEND LIVE ON PORT: ${PORT}`);
  console.log("🌍 PRODUCTION-READY ARCHITECTURE");
  console.log("=================================");
});

// ======================================================
// 🛑 GRACEFUL SHUTDOWN
// ======================================================
const shutdown = (signal) => {
  console.log(`⚠️ ${signal} received. Stopping gracefully...`);
  clearInterval(rateCleanup);
  
  server.close(() => {
    mongoose.connection.close(false).then(() => {
      console.log("🛑 Server and MongoDB connections completely stopped.");
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.log("❌ Force shutdown executed.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
