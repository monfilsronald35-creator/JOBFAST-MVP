/**
 * userService.js — MongoDB-backed user management.
 *
 * Supports the userController and admin operations.
 * All queries hit the User mongoose model.
 * Passwords are never returned (select: false in schema).
 */

import User from '../models/user.model.js';
import { ACCOUNT_STATUS } from '../config/constants.js';

/**
 * Find a user by ID. Throws if not found.
 */
async function getById(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

/**
 * Update profile fields for the requesting user.
 * Only allows safe fields — never allows role/status changes via this method.
 */
async function updateProfile(userId, body) {
  const ALLOWED = [
    'name', 'firstName', 'lastName', 'phone', 'bio',
    'profession', 'services', 'serviceIntent', 'profilePhoto',
    'location', 'profileMetadata', 'profileCompleteness',
    'isAvailable', 'status',
  ];

  const update = {};
  for (const key of ALLOWED) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * Admin: paginated list of users with optional filters.
 */
async function getUsers({ page = 1, limit = 20, search = '', role = null, status = null } = {}) {
  const skip = (page - 1) * limit;

  const filter = {};
  if (role)   filter.role = role;
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
}

/**
 * Admin: update a user's account status.
 */
async function updateStatus(userId, status) {
  if (!Object.values(ACCOUNT_STATUS).includes(status)) {
    const err = new Error(`Invalid status: ${status}`);
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { accountStatus: status } },
    { new: true }
  ).lean();

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * Admin: soft-delete a user (mark as deleted, don't destroy the document).
 */
async function deleteUser(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { accountStatus: ACCOUNT_STATUS.DELETED } },
    { new: true }
  ).lean();

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * Admin: aggregate user statistics.
 */
async function getStats() {
  const [total, byRole, byStatus] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$accountStatus', count: { $sum: 1 } } }]),
  ]);

  return {
    total,
    byRole:   Object.fromEntries(byRole.map(r => [r._id ?? 'unknown', r.count])),
    byStatus: Object.fromEntries(byStatus.map(s => [s._id ?? 'unknown', s.count])),
  };
}

export default { getById, updateProfile, getUsers, updateStatus, deleteUser, getStats };