/**
 * Valide si yon nimewo telefòn (fòma repiblik dominikèn/entènasyonal) korèk
 */
export const isValidPhone = (phone) => {
  // Aksepte fòma tankou 809-555-5555 oswa 8295555555
  const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Valide si yon imèl korèk
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide si yon modpas gen nivo sekirite nesesè
 * (Omwen 8 karaktè, 1 majiskil, 1 nimewo)
 */
export const isPasswordStrong = (password) => {
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Valide si yon tit travay oswa kategori pa vid
 */
export const isNotEmpty = (value) => {
  return value && value.trim().length > 0;
};
