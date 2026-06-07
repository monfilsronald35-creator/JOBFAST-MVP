/**
 * 🛡️ JOBFAST ENTERPRISE VALIDATION ENGINE
 * Lojik validation pou fòm enskripsyon, koneksyon, ak kreyasyon pòs.
 */

/**
 * Valide si yon nimewo telefòn korèk (RD: 809/829/849, HT: +509, ak entènasyonal)
 * @param {string|number} phone 
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Netwaye karaktè yo pou nou teste sèlman chif yo ak ti siy plis la
  const cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
  
  // RegEx sa a aksepte:
  // - Fòma lokal 10 chif (egz: 8095550199)
  // - Fòma RD/US ak kòd peyi (egz: +18095550199)
  // - Fòma Ayiti ak kòd支部 (egz: +50937001122 oswa nimewo 8 chif dirèk)
  const phoneRegex = /^(\+?1)?\d{10}$|^(\+?509)?\d{8}$/;
  
  return phoneRegex.test(cleaned);
};

/**
 * Valide si yon imèl gen yon fòma ki korèk
 * @param {string} email 
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  
  // .trim() elimine ti spas envizib otokoreksyon klavye mobil yo konn ajoute
  const cleanEmail = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(cleanEmail);
};

/**
 * Valide si yon modpas gen nivo sekirite nesesè
 * (Omwen 8 karaktè, 1 majiskil, 1 nimewo)
 * @param {string} password 
 */
export const isPasswordStrong = (password) => {
  if (!password || typeof password !== "string") return false;
  
  // Sekirite strik: Omwen 8 karaktè, 1 majiskil, 1 chif
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  
  return passwordRegex.test(password);
};

/**
 * Valide si yon jaden tèks pa vid (Titre, Kategori, Deskripsyon, elatriye)
 * @param {any} value 
 */
export const isNotEmpty = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
};
