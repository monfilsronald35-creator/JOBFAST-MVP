/**
 * userService.js — Supabase-backed user management.
 *
 * Replaces the Mongoose User model with UserRepository (profiles table).
 * All exported function names and signatures are unchanged.
 */

import userRepo from '../repositories/user.repository.js';
import { ACCOUNT_STATUS } from '../config/constants.js';

/**
 * Find a user by ID. Throws 404 if not found.
 */
async function getById(userId) {
  return userRepo.getById(String(userId));
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

  const user = await userRepo.update(String(userId), update);
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
  return userRepo.getUsers({ page, limit, search, role, status });
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

  const user = await userRepo.update(String(userId), { accountStatus: status });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

/**
 * Admin: soft-delete a user.
 */
async function deleteUser(userId) {
  const user = await userRepo.update(String(userId), { accountStatus: ACCOUNT_STATUS.DELETED });
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
  return userRepo.getStats();
}

export default { getById, updateProfile, getUsers, updateStatus, deleteUser, getStats };