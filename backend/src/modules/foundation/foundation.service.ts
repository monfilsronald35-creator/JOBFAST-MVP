import { supabaseAdmin } from '../../config/supabase.js';
import type { SchemaMigration } from './foundation.types.js';

export class FoundationService {

  async getAppliedMigrations(): Promise<SchemaMigration[]> {
    const { data, error } = await supabaseAdmin
      .from('schema_migrations')
      .select('version, executed_at, description')
      .order('version', { ascending: true });

    if (error) {
      throw new Error(`[Foundation] Failed to read schema_migrations: ${error.message}`);
    }

    return (data ?? []) as SchemaMigration[];
  }

  async getMigration(version: string): Promise<SchemaMigration | null> {
    const { data, error } = await supabaseAdmin
      .from('schema_migrations')
      .select('version, executed_at, description')
      .eq('version', version)
      .maybeSingle();

    if (error) {
      throw new Error(`[Foundation] Failed to read migration ${version}: ${error.message}`);
    }

    return data as SchemaMigration | null;
  }

  async isFoundationPart1Applied(): Promise<boolean> {
    const migration = await this.getMigration('001_foundation_part1');
    return Boolean(migration);
  }
}

export const foundationService = new FoundationService();
