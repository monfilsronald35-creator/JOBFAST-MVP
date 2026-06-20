// ======================================================
// 🚀 AUTH CONTROLLER
// src/controllers/authController.js
// ======================================================

import authService from "../services/authService.js";
import { HTTP_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ======================================================
// 🔐 LOGIN
// ======================================================

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

// ======================================================
// 📝 REGISTER
// ======================================================

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Account created successfully",
    data: result,
  });
});

// ======================================================
// 🔄 REFRESH TOKEN
// ======================================================

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.body?.refreshToken ||
    req.cookies?.refreshToken;

  const result =
    await authService.refreshToken(refreshToken);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

// ======================================================
// 🚪 LOGOUT
// ======================================================

export const logout = asyncHandler(async (req, res) => {
  await authService.logout({
    userId: req.user.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.clearCookie("refreshToken");

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Logout successful",
  });
});

// ======================================================
// 👤 CURRENT USER
// ======================================================

export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
  });
});

// ======================================================
// ✅ VERIFY EMAIL
// ======================================================

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(
    req.params.token
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Email verified successfully",
    data: result,
  });
});

// ======================================================
// 📧 FORGOT PASSWORD
// ======================================================

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message:
      "Password reset instructions sent if email exists",
  });
});

// ======================================================
// 🔑 RESET PASSWORD
// ======================================================

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({
    token: req.params.token,
    password: req.body.password,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Password updated successfully",
  });
});

// ======================================================
// 🚫 LOGOUT ALL DEVICES
// ======================================================

export const logoutAllDevices = asyncHandler(
  async (req, res) => {
    await authService.logoutAllDevices(req.user.id);

    res.clearCookie("refreshToken");

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message:
        "Logged out from all devices successfully",
    });
  }
);

// ======================================================
// 🔒 CHANGE PASSWORD
// ======================================================

export const changePassword = asyncHandler(
  async (req, res) => {
    const result =
      await authService.changePassword({
        userId: req.user.id,
        currentPassword:
          req.body.currentPassword,
        newPassword:
          req.body.newPassword,
      });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password changed successfully",
      data: result,
    });
  }
);

// ======================================================
// 📱 VERIFY ACCESS TOKEN
// ======================================================

export const verifyAccessToken =
  asyncHandler(async (req, res) => {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      authenticated: true,
      user: req.user,
    });
  });

// ======================================================
// 🏥 HEALTH CHECK
// ======================================================

export const authHealthCheck =
  asyncHandler(async (req, res) => {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      service: "auth",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  });