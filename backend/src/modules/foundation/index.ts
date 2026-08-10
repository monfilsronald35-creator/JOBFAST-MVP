/**
 * Foundation Module
 * Owns: schema_migrations table, feature_status / audit_action_type /
 *       environment_type enums, email_dom / phone_dom domains,
 *       update_updated_at_column() / soft_delete_record() utility functions.
 * Migration: 001_foundation_part1 (run manually in Supabase SQL Editor)
 * Route: GET /api/v1/foundation/health — verifies 001_foundation_part1 is applied
 */
import { Router, type Express } from 'express';
import { foundationHealth } from './foundation.controller.js';

const router = Router();

router.get('/health', foundationHealth);

export function registerFoundationModule(app: Express): void {
  app.use('/api/v1/foundation', router);
}
