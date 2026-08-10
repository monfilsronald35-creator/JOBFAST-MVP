import type { Request, Response } from 'express';
import { foundationService } from './foundation.service.js';

export async function foundationHealth(_req: Request, res: Response): Promise<void> {
  try {
    const applied    = await foundationService.isFoundationPart1Applied();
    const migrations = await foundationService.getAppliedMigrations();

    res.status(applied ? 200 : 503).json({
      success:   applied,
      service:   'foundation',
      database:  'supabase',
      migration: '001_foundation_part1',
      applied,
      migrations,
    });
  } catch (error) {
    console.error('[Foundation] Health check failed:', error);

    res.status(503).json({
      success:   false,
      service:   'foundation',
      database:  'supabase',
      migration: '001_foundation_part1',
      applied:   false,
      message:   'Foundation database check failed',
    });
  }
}
