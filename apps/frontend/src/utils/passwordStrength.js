// Returns 0 (empty) → 4 (very strong)
export function passwordStrengthScore(password = '') {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

export function passwordStrengthLabel(score) {
  return ['', 'Fèb', 'Mwayen', 'Bon', 'Trè Fò'][score] || '';
}

export function passwordStrengthColor(score) {
  return ['', '#ef4444', '#f59e0b', '#22c55e', '#10b981'][score] || '';
}
