export const isValidPhone = (phone = "") => {
  if (!phone) return false;
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  return /^(?:\+509\d{8}|\+1\d{10}|\d{8}|\d{10}|\+\d{7,15})$/.test(cleaned);
};

export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isPasswordStrong = (password) => {
  if (!password || typeof password !== "string") return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};

export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
};