import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ======================================================
// 🧠 DATABASE (IN-MEMORY LAYER)
// ======================================================
const db = {
  users: [],
  jobs: [],
  businesses: [],
  notifications: [],
};

// FAST INDEX (O(1) LOOKUPS)
const index = {
  emails: new Set(),
  users: new Map(),
  tokens: new Map(),
};

// ======================================================
// 🌍 LANGUAGE
// ======================================================
const LANG = { HT: "ht", FR: "fr", ES: "es" };

// ======================================================
// 🧼 CORE HELPERS
// ======================================================
const id = () => crypto.randomUUID();

const hash = (v) =>
  crypto.createHash("sha256").update(v).digest("hex");

const normalize = (v) =>
  String(v ?? "").trim().toLowerCase();

const isEmpty = (v) =>
  v == null || String(v).trim().length === 0;

const createToken = () => crypto.randomUUID();

const ok = (res, data) =>
  res.json({ success: true, data });

// ======================================================
// 🔐 VALIDATION
// ======================================================
const isEmailValid = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isPasswordStrong = (p) =>
  String(p).length >= 6;

// ======================================================
// 🛡️ AUTH MIDDLEWARE
// ======================================================
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  const user = index.tokens.get(token);

  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = user;
  next();
};

// ======================================================
// 🚀 RATE LIMIT (PRO SIMPLE + SAFE)
// ======================================================
const rateMap = new Map();

app.use((req, res, next) => {
  const ip = (req.headers["x-forwarded-for"] || req.ip || "unknown")
    .toString()
    .split(",")[0];

  const now = Date.now();
  const data = rateMap.get(ip) || { count: 0, time: now };

  if (now - data.time < 10000) {
    if (data.count >= 120)
      return res.status(429).json({ message: "Too many requests" });

    data.count++;
  } else {
    data.count = 1;
    data.time = now;
  }

  rateMap.set(ip, data);
  next();
});

// ======================================================
// ❤️ HEALTH CHECK
// ======================================================
app.get("/", (req, res) => {
  ok(res, {
    app: "JOBFAST PRO MAX",
    users: db.users.length,
    jobs: db.jobs.length,
    businesses: db.businesses.length,
    notifications: db.notifications.length,
  });
});

// ======================================================
// 👤 REGISTER
// ======================================================
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role = "worker" } = req.body || {};

  const safeEmail = normalize(email);
  const safeName = normalize(name);

  if (isEmpty(safeEmail) || isEmpty(safeName) || isEmpty(password)) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (!isEmailValid(safeEmail)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).json({ message: "Weak password" });
  }

  if (index.emails.has(safeEmail)) {
    return res.status(409).json({ message: "Email exists" });
  }

  const user = {
    id: id(),
    name: safeName,
    email: safeEmail,
    password: hash(password),
    role,
    createdAt: new Date(),
  };

  const token = createToken();

  db.users.push(user);
  index.emails.add(safeEmail);
  index.users.set(user.id, user);
  index.tokens.set(token, user);

  ok(res, {
    token,
    user: { ...user, password: undefined },
  });
});

// ======================================================
// 🔑 LOGIN
// ======================================================
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  const safeEmail = normalize(email);
  const hashed = hash(password || "");

  const user = db.users.find(
    (u) => u.email === safeEmail && u.password === hashed
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = createToken();
  index.tokens.set(token, user);
  index.users.set(user.id, user);

  ok(res, {
    token,
    user: { ...user, password: undefined },
  });
});

// ======================================================
// 👥 USERS (SEARCH + PAGINATION)
// ======================================================
app.get("/api/users", auth, (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;

  page = Number(page);
  limit = Number(limit);

  let result = db.users;

  if (search) {
    const s = normalize(search);
    result = result.filter(
      (u) =>
        u.name.includes(s) ||
        u.email.includes(s)
    );
  }

  const start = (page - 1) * limit;

  ok(res, {
    total: result.length,
    page,
    data: result.slice(start, start + limit),
  });
});

// ======================================================
// 👤 USER PROFILE
// ======================================================
app.get("/api/users/:id", auth, (req, res) => {
  const user = index.users.get(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "Not found" });
  }

  ok(res, { ...user, password: undefined });
});

// ======================================================
// 🏢 BUSINESS
// ======================================================
app.post("/api/business", auth, (req, res) => {
  const { name, type = "company" } = req.body || {};

  const business = {
    id: id(),
    name: normalize(name),
    type,
    ownerId: req.user.id,
    createdAt: new Date(),
  };

  db.businesses.push(business);
  ok(res, business);
});

// ======================================================
// 📋 JOBS
// ======================================================
app.post("/api/jobs", auth, (req, res) => {
  const { title, type = "general" } = req.body || {};

  const job = {
    id: id(),
    title: normalize(title),
    type,
    status: "open",
    ownerId: req.user.id,
    createdAt: new Date(),
  };

  db.jobs.push(job);

  db.notifications.push({
    id: id(),
    message: `New job: ${job.title}`,
    createdAt: new Date(),
  });

  ok(res, job);
});

// ======================================================
// 📍 JOB LIST
// ======================================================
app.get("/api/jobs/near", auth, (req, res) => {
  const openJobs = db.jobs.filter((j) => j.status === "open");
  ok(res, openJobs);
});

// ======================================================
// 🔔 NOTIFICATIONS
// ======================================================
app.get("/api/notifications", auth, (req, res) => {
  ok(res, db.notifications.slice(-100));
});

// ======================================================
// 📊 STATS DASHBOARD
// ======================================================
app.get("/api/stats", auth, (req, res) => {
  ok(res, {
    users: db.users.length,
    jobs: db.jobs.length,
    businesses: db.businesses.length,
  });
});

// ======================================================
// ❌ 404
// ======================================================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ======================================================
// 💥 ERROR HANDLER
// ======================================================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

// ======================================================
// 🚀 START SERVER
// ======================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 JOBFAST PRO MAX CLEAN running on", PORT);
});