/**
 * AI — Fraud Detection
 * Rule-based risk scoring for transactions and user activity
 * Returns riskScore (0–100) and flags array
 */
import { supabase } from '../config/supabaseClient.js';

const RISK = {
  LOW:    { min: 0,  max: 29,  label: 'low',    action: 'allow' },
  MEDIUM: { min: 30, max: 59,  label: 'medium',  action: 'review' },
  HIGH:   { min: 60, max: 79,  label: 'high',    action: 'flag' },
  BLOCK:  { min: 80, max: 100, label: 'critical', action: 'block' },
};

function getLevel(score) {
  return Object.values(RISK).find(r => score >= r.min && score <= r.max) || RISK.LOW;
}

// Assess risk for a financial transaction
export async function assessTransactionRisk(txn) {
  const flags = [];
  let score   = 0;

  const { userId, amount, recipientId, type } = txn;

  // Rule 1: Large transaction
  if (amount > 50_000) { score += 20; flags.push('large_transaction'); }
  else if (amount > 10_000) { score += 10; flags.push('elevated_amount'); }

  // Rule 2: New account sending large amounts
  try {
    const { data: user } = await supabase
      .from('profiles')
      .select('created_at, stats')
      .eq('id', userId)
      .single();

    if (user) {
      const ageDays = (Date.now() - new Date(user.created_at)) / 86400_000;
      if (ageDays < 7 && amount > 5_000)  { score += 25; flags.push('new_account_large_tx'); }
      else if (ageDays < 30 && amount > 10_000) { score += 15; flags.push('young_account_high_value'); }
    }
  } catch { /* non-fatal */ }

  // Rule 3: Velocity — too many transactions in 1 hour
  try {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase
      .from('ledger_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since);

    if (count > 20) { score += 30; flags.push('high_velocity'); }
    else if (count > 10) { score += 10; flags.push('elevated_velocity'); }
  } catch { /* non-fatal */ }

  // Rule 4: Same sender/receiver cycling
  if (userId === recipientId) { score += 40; flags.push('self_transfer'); }

  const level = getLevel(Math.min(score, 100));
  return { riskScore: Math.min(score, 100), level: level.label, action: level.action, flags };
}

// Assess risk for a user action (login, registration, etc.)
export async function assessUserRisk(userId, action, meta = {}) {
  const flags = [];
  let score   = 0;

  if (action === 'login') {
    if (meta.failedAttempts > 3)  { score += 20; flags.push('multiple_failed_logins'); }
    if (meta.newDevice)           { score += 10; flags.push('new_device'); }
    if (meta.newCountry)          { score += 15; flags.push('new_country'); }
    if (meta.vpnDetected)         { score += 15; flags.push('vpn_detected'); }
  }

  if (action === 'register') {
    if (meta.disposableEmail)     { score += 30; flags.push('disposable_email'); }
    if (meta.duplicateDevice)     { score += 25; flags.push('duplicate_device'); }
  }

  const level = getLevel(Math.min(score, 100));
  return { riskScore: Math.min(score, 100), level: level.label, action: level.action, flags };
}

export default { assessTransactionRisk, assessUserRisk, RISK };
