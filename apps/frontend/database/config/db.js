import mongoose from "mongoose";

// ======================================================
// 🔒 SAFE ENV
// ======================================================

const MONGO_URI =
  typeof process.env.MONGODB_URI === "string"
    ? process.env.MONGODB_URI.trim()
    : "";

// ======================================================
// 🔒 VALIDATE URI
// ======================================================

function validateMongoUri(uri) {

  if (!uri) {
    throw new Error(
      "❌ MONGODB_URI missing in .env"
    );
  }

  if (typeof uri !== "string") {
    throw new Error(
      "❌ Invalid Mongo URI type"
    );
  }

  if (
    !uri.startsWith("mongodb://") &&
    !uri.startsWith("mongodb+srv://")
  ) {
    throw new Error(
      "❌ Invalid Mongo URI format"
    );
  }

  return uri;
}

// ======================================================
// 🌍 MONGOOSE SETTINGS
// ======================================================

mongoose.set("strictQuery", true);

mongoose.set("autoIndex", false);

// ======================================================
// 🌍 CONNECTION CACHE
// ======================================================

let cachedConnection = null;

let connectingPromise = null;

let listenersReady = false;

// ======================================================
// 🌍 REGISTER EVENTS
// ======================================================

function registerConnectionEvents() {

  if (listenersReady) return;

  mongoose.connection.on(
    "connected",
    () => {
      console.log(
        "✅ MongoDB connected"
      );
    }
  );

  mongoose.connection.on(
    "disconnected",
    () => {

      cachedConnection = null;

      console.log(
        "❌ MongoDB disconnected"
      );
    }
  );

  mongoose.connection.on(
    "error",
    (err) => {

      console.error(
        "❌ MongoDB error:",
        err.message
      );
    }
  );

  listenersReady = true;
}

// ======================================================
// 🚀 CONNECT DATABASE
// ======================================================

export async function connectDatabase() {

  try {

    if (
      cachedConnection &&
      mongoose.connection.readyState === 1
    ) {
      return cachedConnection;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    const uri =
      validateMongoUri(
        MONGO_URI
      );

    registerConnectionEvents();

    connectingPromise =
      mongoose.connect(uri, {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4
      });

    cachedConnection =
      await connectingPromise;

    return cachedConnection;

  } catch (error) {

    cachedConnection = null;

    console.error(
      "❌ Database connection failed"
    );

    console.error(
      error.message
    );

    throw error;

  } finally {

    connectingPromise = null;
  }
}

// ======================================================
// 🔒 CLOSE DATABASE
// ======================================================

export async function closeDatabase() {

  try {

    if (
      mongoose.connection.readyState === 0
    ) {
      return;
    }

    await mongoose.connection.close();

    cachedConnection = null;

    connectingPromise = null;

    console.log(
      "🔒 MongoDB connection closed"
    );

  } catch (error) {

    console.error(
      "❌ Close DB error:",
      error.message
    );
  }
}

// ======================================================
// 🌍 DATABASE STATUS
// ======================================================

export function getDatabaseStatus() {

  return {
    connected:
      mongoose.connection.readyState === 1,

    readyState:
      mongoose.connection.readyState
  };
}

// ======================================================
// 🛑 GRACEFUL SHUTDOWN
// ======================================================

async function gracefulShutdown() {

  try {

    await closeDatabase();

  } finally {

    process.exit(0);
  }
}

if (
  process.listenerCount("SIGINT") === 0
) {
  process.on(
    "SIGINT",
    gracefulShutdown
  );
}

if (
  process.listenerCount("SIGTERM") === 0
) {
  process.on(
    "SIGTERM",
    gracefulShutdown
  );
}

// ======================================================
// 🚀 EXPORT DEFAULT
// ======================================================

export default connectDatabase;