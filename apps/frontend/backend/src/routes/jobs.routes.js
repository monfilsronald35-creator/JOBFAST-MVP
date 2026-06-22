
import express from "express";

const router = express.Router();

/* ===============================
   🧠 MOCK STORAGE (MVP ONLY)
   =============================== */
const jobs = [];
const applications = [];

/* ===============================
   🏗️ JOB STATUS SYSTEM
   =============================== */
const JOB_STATUS = {
  OPEN: "open",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

/* ===============================
   🧾 CREATE JOB
   =============================== */
router.post("/create", (req, res) => {
  const {
    title,
    description,
    type,
    category,
    location,
    budget,
    createdBy
  } = req.body;

  if (!title || !type || !createdBy) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  const job = {
    id: Date.now().toString(),
    title,
    description: description || "",
    type,
    category: category || null,

    location: {
      city: location?.city || "",
      state: location?.state || "",
      country: location?.country || "",
      lat: location?.lat ?? null,
      lng: location?.lng ?? null
    },

    budget: budget || 0,

    status: JOB_STATUS.OPEN,

    createdBy,
    createdAt: new Date()
  };

  jobs.push(job);

  return res.status(201).json({
    message: "Job created successfully",
    job
  });
});

/* ===============================
   🔍 GET ALL JOBS
   =============================== */
router.get("/", (req, res) => {
  const { type, category, city, status } = req.query;

  let result = [...jobs];

  if (type) result = result.filter(j => j.type === type);
  if (category) result = result.filter(j => j.category === category);
  if (city) result = result.filter(j => j.location?.city === city);
  if (status) result = result.filter(j => j.status === status);

  return res.json(result);
});

/* ===============================
   📌 GET APPLICATIONS (STATIC ROUTE FIRST)
   =============================== */
router.get("/applications/:jobId", (req, res) => {
  const { jobId } = req.params;

  const result = applications.filter(a => a.jobId === jobId);

  return res.json(result);
});

/* ===============================
   📌 GET SINGLE JOB
   =============================== */
router.get("/:id", (req, res) => {
  const job = jobs.find(j => j.id === req.params.id);

  if (!job) {
    return res.status(404).json({
      message: "Job not found"
    });
  }

  return res.json(job);
});

/* ===============================
   🧑 APPLY FOR JOB
   =============================== */
router.post("/apply/:jobId", (req, res) => {
  const { jobId } = req.params;
  const { userId, message } = req.body;

  const job = jobs.find(j => j.id === jobId);

  if (!job) {
    return res.status(404).json({
      message: "Job not found"
    });
  }

  const application = {
    id: Date.now().toString(),
    jobId,
    userId,
    message: message || "",
    status: "pending",
    createdAt: new Date()
  };

  applications.push(application);

  return res.status(201).json({
    message: "Application sent",
    application
  });
});

/* ===============================
   🚧 UPDATE JOB STATUS (SAFE VALIDATION)
   =============================== */
router.patch("/status/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const job = jobs.find(j => j.id === id);

  if (!job) {
    return res.status(404).json({
      message: "Job not found"
    });
  }

  const valid = Object.values(JOB_STATUS);

  if (status && valid.includes(status)) {
    job.status = status;
  }

  return res.json({
    message: "Job updated successfully",
    job
  });
});

export default router;