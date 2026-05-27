// ======================================================
// 🌍 server.js
// 🚀 JOBFAST GLOBAL SERVER
// ======================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ======================================================
// 🌍 LOAD ENV
// ======================================================

dotenv.config();

// ======================================================
// 🌍 DATABASE
// ======================================================

import connectDB from "./config/db.js";

// ======================================================
// 🌍 MODELS
// ======================================================

import Job from "./models/Job.js";
import Business from "./models/Business.js";

// ======================================================
// 🌍 APP
// ======================================================

const app = express();

const PORT = process.env.PORT || 5000;

// ======================================================
// 🚀 CONNECT DATABASE
// ======================================================

connectDB();

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
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ======================================================
// 🕒 LOGGER
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
    app: "JOBFAST GLOBAL API",
    version: "1.0.0",
    status: "running",
  });
});

// ======================================================
// ❤️ HEALTH CHECK
// ======================================================

app.get("/health", async (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    mongodb: "connected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// 🏗 CONSTRUCTION ROLES
// ======================================================

const constructionRoles = [
  "boss",
  "engineer",
  "architect",
  "foreman",
  "mason",
  "helper",
  "laborer",
  "electrician",
  "plumber",
  "welder",
  "painter",
  "tiler",
  "roofer",
  "carpenter",
  "steel_fixer",
  "machine_operator",
  "surveyor",
  "excavator_operator",
  "truck_driver",
  "site_manager",
  "finisher",
  "block_layer",
  "concrete_worker",
  "interior_designer",
  "construction_company",
  "terminador",
  "ajoudan",
  "feray",
  "kapent",
  "beton",
  "marble_worker"
];

// ======================================================
// 🚀 GET CONSTRUCTION ROLES
// ======================================================

app.get(
  "/api/construction/roles",
  (req, res) => {

    res.json({
      success: true,
      total: constructionRoles.length,
      data: constructionRoles,
    });
  }
);

// ======================================================
// 🏢 CREATE BUSINESS
// ======================================================

app.post(
  "/api/business",
  async (req, res) => {

    try {

      const business =
        await Business.create(req.body);

      res.status(201).json({
        success: true,
        data: business,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// 📋 GET BUSINESSES
// ======================================================

app.get(
  "/api/business",
  async (req, res) => {

    try {

      const businesses =
        await Business.find()
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        total: businesses.length,
        data: businesses,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// 💼 CREATE JOB
// ======================================================

app.post(
  "/api/jobs",
  async (req, res) => {

    try {

      const job =
        await Job.create(req.body);

      res.status(201).json({
        success: true,
        data: job,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// 📋 GET JOBS
// ======================================================

app.get(
  "/api/jobs",
  async (req, res) => {

    try {

      const jobs =
        await Job.find()
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        total: jobs.length,
        data: jobs,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// 🔍 SEARCH JOBS
// ======================================================

app.get(
  "/api/jobs/search",
  async (req, res) => {

    try {

      const {
        role,
        city,
        serviceType,
      } = req.query;

      const filter = {};

      if (role) {
        filter.constructionRole = role;
      }

      if (serviceType) {
        filter.serviceType =
          serviceType;
      }

      if (city) {
        filter[
          "locationData.cityNormalized"
        ] =
          String(city)
            .trim()
            .toLowerCase();
      }

      const jobs =
        await Job.find(filter)
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        total: jobs.length,
        data: jobs,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
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
  (err, req, res, next) => {

    console.error(err);

    res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
);

// ======================================================
// 💥 GLOBAL ERRORS
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
    `🚀 JOBFAST RUNNING ON ${PORT}`
  );

  console.log(
    "🌍 MongoDB Connected"
  );

  console.log(
    "================================="
  );
});