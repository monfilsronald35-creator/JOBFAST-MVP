import userService from "../services/userService.js";
import { HTTP_STATUS, ACCOUNT_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.user.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsers(req.query);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: users,
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
  });
});

export const verifyUser = asyncHandler(async (req, res) => {
  const user = await userService.updateStatus(req.params.id, ACCOUNT_STATUS.ACTIVE);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User verified successfully",
    data: user,
  });
});

export const banUser = asyncHandler(async (req, res) => {
  // ACCOUNT_STATUS has no BANNED — map to DELETED (permanent) per governance
  const user = await userService.updateStatus(req.params.id, ACCOUNT_STATUS.DELETED);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User banned successfully",
    data: user,
  });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await userService.updateStatus(req.params.id, ACCOUNT_STATUS.SUSPENDED);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User suspended successfully",
    data: user,
  });
});

export const activateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateStatus(req.params.id, ACCOUNT_STATUS.ACTIVE);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User activated successfully",
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "User deleted successfully",
  });
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getStats();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: stats,
  });
});