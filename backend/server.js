import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();

const PORT = process.env.PORT || 5000;

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
  })
);

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
  const { password, ...safe } =
    user;

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
// 🕒 REQUEST LOGGER
// ======================================================

app.use((req, res, next) => {

  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url}`
  );

  next();
});

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

    if (
      String(password).length < 6
    ) {
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

    db.notifications.push({
      id: id(),
      type: "register",
      message: `${fullname} joined JOBFAST`,
      createdAt:
        new Date().toISOString(),
    });

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
// 👤 PROFILE
// ======================================================

app.get(
  "/api/profile",
  auth,
  (req, res) => {

    res.json({
      success: true,
      user: safeUser(req.user),
    });
  }
);

// ======================================================
// 👷 CONSTRUCTION ROLES
// ======================================================

app.get(
  "/api/construction/roles",
  (req, res) => {

    res.json({
      success: true,
      data: constructionRoles,
    });
  }
);

// ======================================================
// 📍 UPDATE AVAILABILITY
// ======================================================

app.patch(
  "/api/users/availability",
  auth,
  (req, res) => {

    const {
      availability,
    } = req.body || {};

    req.user.availability =
      availability ||
      "available";

    res.json({
      success: true,
      user: safeUser(req.user),
    });
  }
);

// ======================================================
// 🏢 CREATE BUSINESS
// ======================================================

app.post(
  "/api/business",
  auth,
  (req, res) => {

    const {
      name,
      type,
      description,
      city,
      state,
      country,
    } = req.body || {};

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message:
          "Missing business fields",
      });
    }

    const business = {
      id: id(),

      ownerId: req.user.id,

      name,

      type,

      description:
        description || "",

      location: {
        city: city || "",
        state: state || "",
        country: country || "",
      },

      createdAt:
        new Date().toISOString(),
    };

    db.businesses.push(
      business
    );

    res.status(201).json({
      success: true,
      business,
    });
  }
);

// ======================================================
// 📋 GET BUSINESSES
// ======================================================

app.get(
  "/api/business",
  (req, res) => {

    res.json({
      success: true,
      total:
        db.businesses.length,
      data: db.businesses,
    });
  }
);

// ======================================================
// 📋 CREATE JOB
// ======================================================

app.post(
  "/api/jobs",
  auth,
  (req, res) => {

    const {
      title,
      description,
      salary,
      city,
      state,
      country,
    } = req.body || {};

    if (!title) {
      return res.status(400).json({
        success: false,
        message:
          "Job title required",
      });
    }

    const job = {
      id: id(),

      userId: req.user.id,

      title,

      description:
        description || "",

      salary: salary || "",

      location: {
        city: city || "",
        state: state || "",
        country: country || "",
      },

      createdAt:
        new Date().toISOString(),
    };

    db.jobs.push(job);

    res.status(201).json({
      success: true,
      job,
    });
  }
);

// ======================================================
// 📋 GET JOBS
// ======================================================

app.get("/api/jobs", (req, res) => {

  res.json({
    success: true,
    total: db.jobs.length,
    data: db.jobs,
  });
});

// ======================================================
// 📦 CREATE SERVICE
// ======================================================

app.post(
  "/api/services",
  auth,
  (req, res) => {

    const {
      title,
      category,
      description,
      price,
    } = req.body || {};

    if (!title) {
      return res.status(400).json({
        success: false,
        message:
          "Service title required",
      });
    }

    const service = {
      id: id(),

      userId: req.user.id,

      title,

      category:
        category || "general",

      description:
        description || "",

      price: price || "",

      createdAt:
        new Date().toISOString(),
    };

    db.services.push(service);

    res.status(201).json({
      success: true,
      service,
    });
  }
);

// ======================================================
// 📦 GET SERVICES
// ======================================================

app.get(
  "/api/services",
  (req, res) => {

    res.json({
      success: true,
      total:
        db.services.length,
      data: db.services,
    });
  }
);

// ======================================================
// 🔔 NOTIFICATIONS
// ======================================================

app.get(
  "/api/notifications",
  auth,
  (req, res) => {

    res.json({
      success: true,
      total:
        db.notifications.length,
      data: db.notifications,
    });
  }
);

// ======================================================
// 🌍 SEARCH USERS
// ======================================================

app.get(
  "/api/users",
  (req, res) => {

    const {
      category,
      city,
      availability,
    } = req.query;

    let users = [...db.users];

    if (category) {
      users = users.filter(
        (u) =>
          normalize(
            u.category
          ) ===
          normalize(category)
      );
    }

    if (city) {
      users = users.filter(
        (u) =>
          normalize(
            u.location.city
          ) === normalize(city)
      );
    }

    if (availability) {
      users = users.filter(
        (u) =>
          normalize(
            u.availability
          ) ===
          normalize(
            availability
          )
      );
    }

    res.json({
      success: true,
      total: users.length,
      data: users.map(safeUser),
    });
  }
);

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
// 💥 ERROR HANDLER
// ======================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
);

// ======================================================
// 💥 GLOBAL ERROR PROTECTION
// ======================================================

process.on(
  "unhandledRejection",
  (err) => {

    console.error(
      "UNHANDLED REJECTION:",
      err
    );
  }
);

process.on(
  "uncaughtException",
  (err) => {

    console.error(
      "UNCAUGHT EXCEPTION:",
      err
    );
  }
);

// ======================================================
// 🚀 START SERVER
// ======================================================

app.listen(PORT, () => {

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