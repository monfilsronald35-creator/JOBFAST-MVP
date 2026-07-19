// =========================================================================
// JOBFAST — AUTH SERVICE (Supabase)
// =========================================================================
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userRepo from '../repositories/user.repository.js';
import { env } from '../config/env.js';

const JWT_SECRET       = env.JWT_SECRET;
const JWT_EXPIRES_IN   = '7d';
const REFRESH_EXPIRES  = '30d';

// ── Helpers ────────────────────────────────────────────────────────────────

const generateToken = (userId, email = null, role = 'user') =>
  jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const generateRefreshToken = (userId, email = null, role = 'user') =>
  jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

// ── Login ──────────────────────────────────────────────────────────────────

const login = async ({ emailOrPhone, password }) => {
  const user = await userRepo.findByIdentifierWithPassword(emailOrPhone);
  if (!user) throw new Error('Invalid credentials');

  const valid = user.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false;
  if (!valid) throw new Error('Invalid credentials');

  const token        = generateToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken(user.id, user.email, user.role);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token, refreshToken };
};

// ── Register ───────────────────────────────────────────────────────────────

const register = async ({ fullName, emailOrPhone, password, accountType }) => {
  const isEmail = emailOrPhone.includes('@');
  const existing = isEmail
    ? await userRepo.findByEmail(emailOrPhone)
    : await userRepo.findOne({ phone: emailOrPhone });

  if (existing) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await userRepo.insert({
    name:          fullName,
    email:         isEmail ? emailOrPhone.toLowerCase().trim() : null,
    phone:         isEmail ? null : emailOrPhone,
    passwordHash,
    role:          (accountType || 'user').toLowerCase(),
    accountStatus: 'active',
    isAvailable:   true,
  });

  const token        = generateToken(newUser.id, newUser.email, newUser.role);
  const refreshToken = generateRefreshToken(newUser.id, newUser.email, newUser.role);
  const { passwordHash: _, ...safeUser } = newUser;
  return { user: safeUser, token, refreshToken };
};

// ── Refresh token ──────────────────────────────────────────────────────────

const refreshToken = async ({ refreshToken: rt }) => {
  let decoded;
  try { decoded = jwt.verify(rt, JWT_SECRET); }
  catch { throw new Error('Invalid refresh token'); }

  const userId = decoded.id ?? decoded.sub;
  const user   = await userRepo.getById(userId);
  const token        = generateToken(user.id, user.email, user.role);
  const newRefresh   = generateRefreshToken(user.id, user.email, user.role);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token, refreshToken: newRefresh };
};

// ── Logout (stateless JWT — no-op) ─────────────────────────────────────────

const logout = async () => ({ success: true, message: 'Logged out successfully' });

const logoutAllDevices = async () => ({ success: true, message: 'Logged out from all devices' });

// ── Get me ─────────────────────────────────────────────────────────────────

const getMe = async ({ userId }) => {
  const user = await userRepo.getById(userId);
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

// ── Email verification (MVP stub) ──────────────────────────────────────────

const verifyEmail = async () => ({ success: true, message: 'Email verified successfully' });

// ── Forgot / reset password (MVP stub) ────────────────────────────────────

const forgotPassword = async ({ emailOrPhone }) => {
  const user = await userRepo.findByIdentifierWithPassword(emailOrPhone);
  if (!user) throw new Error('User not found');
  return { success: true, message: 'Password reset link sent' };
};

const resetPassword = async () => ({ success: true, message: 'Password reset successfully' });

// ── Change password ────────────────────────────────────────────────────────

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found');

  // Re-fetch with password for comparison
  const userWithPw = await userRepo.findByEmailWithPassword(user.email);
  const valid = userWithPw?.passwordHash
    ? await bcrypt.compare(currentPassword, userWithPw.passwordHash)
    : false;
  if (!valid) throw new Error('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 12);
  await userRepo.update(userId, { passwordHash: newHash });
  return { success: true, message: 'Password changed successfully' };
};

// ── Verify access token ────────────────────────────────────────────────────

const verifyAccessToken = async ({ token }) => {
  let decoded;
  try { decoded = jwt.verify(token, JWT_SECRET); }
  catch { throw new Error('Invalid token'); }

  const userId = decoded.id ?? decoded.sub;
  return getMe({ userId });
};

// ── Health check ───────────────────────────────────────────────────────────

const authHealthCheck = async () => {
  const { total } = await userRepo.getStats().catch(() => ({ total: 0 }));
  return { status: 'healthy', timestamp: new Date().toISOString(), usersCount: total };
};

// ── Exports ────────────────────────────────────────────────────────────────

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