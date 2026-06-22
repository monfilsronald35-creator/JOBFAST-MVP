import express from "express";

const router = express.Router();

/* ===============================
   👤 MOCK STORAGE (MVP ONLY)
   ⚠️ WARNING: resets on restart
   =============================== */
const users = [];

/* ===============================
   🧠 VALIDATION SYSTEM
   =============================== */
const validRoles = [
  "admin",
  "boss",
  "worker",
  "apprentice",
  "driver",
  "engineer",
  "provider",
  "user"
];

const validAvailability = [
  "available",
  "busy",
  "working",
  "unavailable"
];

/* ===============================
   🧾 REGISTER USER
   =============================== */
router.post("/register", (req, res) => {
  const {
    name,
    email,
    password,
    role,
    businessType,
    serviceType,
    location,
    bio
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  const exists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (exists) {
    return res.status(409).json({
      message: "Email already exists"
    });
  }

  const user = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    password, // MVP ONLY (later upgrade → bcrypt + JWT)

    role: validRoles.includes(role) ? role : "user",

    /* ===============================
       🏗️ BUSINESS + SERVICES
       =============================== */
    businessType: businessType || null,
    serviceType: serviceType || null,

    /* ===============================
       📍 LOCATION ENGINE
       =============================== */
    location: location || {
      city: "",
      state: "",
      country: "",
      lat: null,
      lng: null
    },

    bio: bio || "",

    /* ===============================
       🚧 CONSTRUCTION CORE SYSTEM
       =============================== */
    availability: {
      status: "available",
      isSearchingJob: true
    },

    createdAt: new Date()
  };

  users.push(user);

  return res.status(201).json({
    message: "User registered successfully",
    user
  });
});

/* ===============================
   🔐 LOGIN USER
   =============================== */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  return res.json({
    message: "Login successful",
    user
  });
});

/* ===============================
   👥 GET ALL USERS
   =============================== */
router.get("/users", (req, res) => {
  return res.json(users);
});

/* ===============================
   🔍 SEARCH ENGINE (CORE FEATURE)
   =============================== */
router.get("/search", (req, res) => {
  const { role, serviceType, businessType, city } = req.query;

  let result = [...users];

  if (role) {
    result = result.filter((u) => u.role === role);
  }

  // ⚡ OPTIMIZATION: Ignore case-sensitivity pou rechèch yo ka pi fleksib
  if (serviceType) {
    result = result.filter(
      (u) => u.serviceType && u.serviceType.toLowerCase() === serviceType.toLowerCase()
    );
  }

  if (businessType) {
    result = result.filter(
      (u) => u.businessType && u.businessType.toLowerCase() === businessType.toLowerCase()
    );
  }

  if (city) {
    result = result.filter(
      (u) => u.location?.city && u.location.city.toLowerCase() === city.toLowerCase()
    );
  }

  return res.json(result);
});

/* ===============================
   📡 UPDATE AVAILABILITY
   =============================== */
router.patch("/availability/:id", (req, res) => {
  const { id } = req.params;
  const { status, isSearchingJob } = req.body;

  const user = users.find((u) => u.id === id);

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  if (status && validAvailability.includes(status)) {
    user.availability.status = status;
  }

  if (typeof isSearchingJob === "boolean") {
    user.availability.isSearchingJob = isSearchingJob;
  }

  return res.json({
    message: "Availability updated",
    user
  });
});

export default router;