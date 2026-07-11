// ======================================================
// 🚀 AUTH SERVICE
// src/services/authService.js
// ======================================================

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { usersDatabase } from "../controllers/register.controller.js";
import { HTTP_STATUS } from "../config/constants.js";
import { env } from "../config/env.js";

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

// ======================================================
// 🔐 HELPER FUNCTIONS
// ======================================================

// Payload uses `id` so authMiddleware.js (which checks decoded.id) can verify tokens
const generateToken = (userId, email = null, role = 'worker') => {
  return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = (userId, email = null, role = 'worker') => {
  return jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ======================================================
// 🔐 LOGIN
// ======================================================

const login = async ({ emailOrPhone, password, ipAddress, userAgent }) => {
  // Find user by email or phone
  const user = Array.from(usersDatabase.values()).find(
    (u) => u.email === emailOrPhone || u.phone === emailOrPhone
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  // Generate tokens
  const token = generateToken(user.id, user.email, user.accountType || 'worker');
  const refreshToken = generateRefreshToken(user.id, user.email, user.accountType || 'worker');

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

// ======================================================
// 📝 REGISTER
// ======================================================

const register = async ({ fullName, emailOrPhone, password, accountType, ipAddress, userAgent }) => {
  // Check if user already exists
  const existingUser = Array.from(usersDatabase.values()).find(
    (u) => u.email === emailOrPhone || u.phone === emailOrPhone
  );

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create new user
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newUser = {
    id: userId,
    fullName,
    email: emailOrPhone.includes("@") ? emailOrPhone : null,
    phone: emailOrPhone.includes("@") ? null : emailOrPhone,
    password: hashedPassword,
    accountType: accountType || "worker",
    tier: "free",
    availability: "disponib",
    stats: { jobsCompleted: 0, rating: 0 },
    createdAt: new Date().toISOString(),
    ipAddress,
    userAgent,
  };

  // Store user in database
  usersDatabase.set(userId, newUser);

  // Generate tokens
  const token = generateToken(userId, newUser.email, newUser.accountType || 'worker');
  const refreshToken = generateRefreshToken(userId, newUser.email, newUser.accountType || 'worker');

  // Return user data without password
  const { password: _, ...userWithoutPassword } = newUser;

  return {
    user: userWithoutPassword,
    token,
    refreshToken,
  };
};

// ======================================================
// 🔄 REFRESH TOKEN
// ======================================================

const refreshToken = async ({ refreshToken }) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = usersDatabase.get(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: newToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

// ======================================================
// 🚪 LOGOUT
// ======================================================

const logout = async ({ userId }) => {
  // In a real implementation, you would invalidate the token
  // For MVP with in-memory storage, we just return success
  return { success: true, message: "Logged out successfully" };
};

// ======================================================
// 👤 GET ME
// ======================================================

const getMe = async ({ userId }) => {
  // In-memory first
  let user = usersDatabase.get(userId);

  // MongoDB fallback (survives restarts)
  if (!user && mongoose.connection.readyState === 1) {
    try {
      const { default: User } = await import('../models/user.model.js');
      const mongoUser = await User.findById(userId).lean();
      if (mongoUser) {
        user = { ...mongoUser, id: mongoUser._id.toString(), _id: mongoUser._id.toString() };
      }
    } catch (_) {}
  }

  if (!user) {
    throw new Error("User not found");
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ======================================================
// ✅ VERIFY EMAIL
// ======================================================

const verifyEmail = async ({ token }) => {
  // MVP implementation - always return success
  return { success: true, message: "Email verified successfully" };
};

// ======================================================
// 🔑 FORGOT PASSWORD
// ======================================================

const forgotPassword = async ({ emailOrPhone }) => {
  // MVP implementation - check if user exists
  const user = Array.from(usersDatabase.values()).find(
    (u) => u.email === emailOrPhone || u.phone === emailOrPhone
  );

  if (!user) {
    throw new Error("User not found");
  }

  // In a real implementation, send email/SMS with reset token
  return { success: true, message: "Password reset link sent" };
};

// ======================================================
// 🔧 RESET PASSWORD
// ======================================================

const resetPassword = async ({ token, newPassword }) => {
  // MVP implementation - return success
  return { success: true, message: "Password reset successfully" };
};

// ======================================================
// 🚪 LOGOUT ALL DEVICES
// ======================================================

const logoutAllDevices = async ({ userId }) => {
  // MVP implementation - return success
  return { success: true, message: "Logged out from all devices" };
};

// ======================================================
// 🔒 CHANGE PASSWORD
// ======================================================

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = usersDatabase.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  usersDatabase.set(userId, user);

  return { success: true, message: "Password changed successfully" };
};

// ======================================================
// ✅ VERIFY ACCESS TOKEN
// ======================================================

const verifyAccessToken = async ({ token }) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = usersDatabase.get(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// ======================================================
// ❤️ AUTH HEALTH CHECK
// ======================================================

const authHealthCheck = async () => {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
    usersCount: usersDatabase.size,
  };
};

// ======================================================
// 📤 EXPORT
// ======================================================

export default {
  login,
  register,
  refreshToken,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logoutAllDevices,
  changePassword,
  verifyAccessToken,
  authHealthCheck,
};
