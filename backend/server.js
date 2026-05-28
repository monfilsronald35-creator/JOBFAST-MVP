import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

// ======================================================
// 🌍 CONFIG
// ======================================================

const PORT =
  Number(process.env.PORT) || 5000;

// ======================================================
// 🌍 TRUST PROXY
// ======================================================

app.set("trust proxy", 1);

// ======================================================
// 🌍 SECURITY HEADERS
// ======================================================

app.disable("x-powered-by");

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
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// ======================================================
// 🚦 SIMPLE RATE LIMIT
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
// 🧹 CLEAN RATE MAP
// ======================================================

const rateCleanup = setInterval(() => {

  const now = Date.now();

  for (const [ip, data] of rateMap.entries()) {

    if (now - data.time > 60000) {
      rateMap.delete(ip);
    }
  }

}, 60000);

// ======================================================
// 🧹 TIMER SAFE
// ======================================================

// Evite timer kenbe process la viv
rateCleanup.unref();

// ======================================================
// 🧠 MEMORY DATABASE (MVP)
// ======================================================

const db = {
  users: [],
  businesses: [],
  jobs: [],
  services: [],
  notifications: [],
};

// ======================================================
// 🧼 HELPERS
// ======================================================

const id = () => crypto.randomUUID();

const normalize = (v) =>
  String(v || "")
    .trim()
    .toLowerCase();

const token = () =>
  crypto.randomUUID();

const hash = (v) =>
  crypto
    .createHash("sha256")
    .update(v)
    .digest("hex");

const isEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const safeUser = (user) => {

  const { password, ...safe } = user;

  return safe;
};

// ======================================================
// 🔐 AUTH MEMORY
// ======================================================

const authTokens = new Map();

// ======================================================
// 🏗️ CONSTRUCTION CATEGORIES
// ======================================================

const constructionRoles = [
  "boss",
  "engineer",
  "architect",
  "foreman",
  "mason",
  "welder",
  "electrician",
  "plumber",
  "painter",
  "ajoudan",
  "worker",
  "tile installer",
  "carpenter",
  "machine operator",
];

// ======================================================
// ❤️ ROOT
// ======================================================

app.get("/", (req, res) => {

  res.json({
    success: true,
    app: "JOBFAST GLOBAL MVP",
    status: "running",
    version: "1.0.0",
  });
});

// ======================================================
// ❤️ HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {

  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp:
      new Date().toISOString(),
  });
});

// ======================================================
// 👤 REGISTER
// ======================================================

app.post(
  "/api/auth/register",
  (req, res) => {

    const {
      fullname,
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

    if (
      !fullname ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields",
      });
    }

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password too short",
      });
    }

    const exists = db.users.find(
      (u) =>
        u.email ===
        normalize(email)
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message:
          "Email already exists",
      });
    }

    const user = {
      id: id(),

      fullname,

      email: normalize(email),

      password: hash(password),

      phone: phone || "",

      bio: bio || "",

      category:
        category || "general",

      role: role || "worker",

      availability: "available",

      verified: false,

      location: {
        country: country || "",
        state: state || "",
        city: city || "",
        latitude:
          latitude || null,
        longitude:
          longitude || null,
      },

      createdAt:
        new Date().toISOString(),
    };

    db.users.push(user);

    const accessToken = token();

    authTokens.set(
      accessToken,
      user.id
    );

    res.status(201).json({
      success: true,
      token: accessToken,
      user: safeUser(user),
    });
  }
);

// ======================================================
// 🔑 LOGIN
// ======================================================

app.post(
  "/api/auth/login",
  (req, res) => {

    const {
      email,
      password,
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password required",
      });
    }

    const user = db.users.find(
      (u) =>
        u.email ===
          normalize(email) &&
        u.password ===
          hash(password)
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid credentials",
      });
    }

    const accessToken = token();

    authTokens.set(
      accessToken,
      user.id
    );

    res.json({
      success: true,
      token: accessToken,
      user: safeUser(user),
    });
  }
);

// ======================================================
// 🛡️ AUTH
// ======================================================

function auth(req, res, next) {

  const bearer =
    req.headers.authorization ||
    "";

  const accessToken =
    bearer.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({
      success: false,
      message: "No token",
    });
  }

  const userId =
    authTokens.get(accessToken);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  const user = db.users.find(
    (u) => u.id === userId
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User not found",
    });
  }

  req.user = user;

  next();
}

// ======================================================
// 🚀 START SERVER
// ======================================================

const server = app.listen(PORT, () => {

  console.log(
    "================================="
  );

  console.log(
    `🚀 JOBFAST running on ${PORT}`
  );

  console.log(
    "🌍 MVP API READY"
  );

  console.log(
    "================================="
  );
});

// ======================================================
// 🛑 GRACEFUL SHUTDOWN
// ======================================================

const shutdown = (signal) => {

  console.log(
    `⚠️ ${signal} received`
  );

  clearInterval(rateCleanup);

  server.close(() => {

    console.log(
      "🛑 Server stopped"
    );

    process.exit(0);
  });

  setTimeout(() => {

    console.log(
      "❌ Force shutdown"
    );

    process.exit(1);

  }, 10000);
};

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);