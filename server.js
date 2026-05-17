import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ======================================================
// 🌍 TRUST PROXY
// ======================================================

app.set("trust proxy", 1);

// ======================================================
// 🌍 MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// 🧠 DATABASE
// ======================================================

const db = {
  users: [],
  jobs: [],
  businesses: [],
  notifications: [],
};

const index = {
  emails: new Set(),
  tokens: new Map(),
};

// ======================================================
// 🧼 HELPERS
// ======================================================

const id = () => crypto.randomUUID();

const hash = (v) =>
  crypto
    .createHash("sha256")
    .update(v)
    .digest("hex");

const normalize = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

const createToken = () =>
  crypto.randomUUID();

const ok = (res, data) =>
  res.json({
    success: true,
    data,
  });

// ======================================================
// 🔐 VALIDATION
// ======================================================

const isEmailValid = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isPasswordStrong = (password) =>
  String(password).length >= 6;

// ======================================================
// 🚀 RATE LIMIT
// ======================================================

const rateMap = new Map();

app.use((req, res, next) => {
  const ip =
    (
      req.headers["x-forwarded-for"] ||
      req.ip ||
      "unknown"
    )
      .toString()
      .split(",")[0]
      .trim();

  const now = Date.now();

  const data = rateMap.get(ip) || {
    count: 0,
    time: now,
  };

  if (now - data.time < 10000) {
    if (data.count >= 100) {
      return res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    }

    data.count++;
  } else {
    data.count = 1;
    data.time = now;
  }

  rateMap.set(ip, data);

  next();
});

// ======================================================
// 🛡️ AUTH
// ======================================================

function auth(req, res, next) {
  const token =
    req.headers.authorization?.replace(
      "Bearer ",
      ""
    );

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token",
    });
  }

  const user = index.tokens.get(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  req.user = user;

  next();
}

// ======================================================
// ❤️ HEALTH
// ======================================================

app.get("/", (req, res) => {
  ok(res, {
    app: "JOBFAST MVP",
    status: "running",
    version: "1.0.0",
  });
});

// ======================================================
// 👤 REGISTER
// ======================================================

app.post("/api/auth/register", (req, res) => {
  const {
    name,
    email,
    password,
  } = req.body || {};

  const safeEmail = normalize(email);

  if (!name || !safeEmail || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing fields",
    });
  }

  if (!isEmailValid(safeEmail)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email",
    });
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      success: false,
      message: "Weak password",
    });
  }

  if (index.emails.has(safeEmail)) {
    return res.status(409).json({
      success: false,
      message: "Email exists",
    });
  }

  const user = {
    id: id(),
    name,
    email: safeEmail,
    password: hash(password),
    createdAt: new Date(),
  };

  const token = createToken();

  db.users.push(user);

  index.emails.add(safeEmail);
  index.tokens.set(token, user);

  ok(res, {
    token,
    user: {
      ...user,
      password: undefined,
    },
  });
});

// ======================================================
// 🔑 LOGIN
// ======================================================

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};

  const safeEmail = normalize(email);

  const user = db.users.find(
    (u) =>
      u.email === safeEmail &&
      u.password === hash(password || "")
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = createToken();

  index.tokens.set(token, user);

  ok(res, {
    token,
  });
});

// ======================================================
// 📋 JOBS
// ======================================================

app.get("/api/jobs", auth, (req, res) => {
  ok(res, db.jobs);
});

// ======================================================
// ❌ 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ======================================================
// 💥 ERROR
// ======================================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Server error",
  });
});

// ======================================================
// 🚀 START SERVER
// ======================================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 JOBFAST running on ${PORT}`);
  console.log(
    `🌍 MODE: ${
      process.env.NODE_ENV ||
      "development"
    }`
  );
  console.log("=================================");
});