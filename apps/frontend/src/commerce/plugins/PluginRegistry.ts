/**
 * PluginRegistry — Plugin lifecycle: register, enable, disable, execute.
 * Zero coupling to core — plugins extend the platform without modifying it.
 */

import type { Plugin, PluginManifest, PluginInstance } from '../types';

class PluginRegistryImpl {
  private readonly _plugins: Map<string, Plugin> = new Map();

  // ─── Registration ──────────────────────────────────────────────────────────

  register(plugin: Plugin): void {
    if (this._plugins.has(plugin.manifest.id)) {
      console.warn(`[PluginRegistry] Overwriting plugin ${plugin.manifest.id}`);
    }
    const inst: PluginInstance = {
      id:         plugin.manifest.id,
      manifestId: plugin.manifest.id,
      status:     'inactive',
      config:     {},
      usageCount: 0,
      metadata:   {},
    };
    this._plugins.set(plugin.manifest.id, { ...plugin, instance: inst });
  }

  unregister(id: string): void {
    const p = this._plugins.get(id);
    if (!p) return;
    if (p.instance?.status === 'active') void this.disable(id);
    this._plugins.delete(id);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async enable(id: string, config?: Record<string, unknown>): Promise<void> {
    const p = this._plugins.get(id);
    if (!p) throw new Error(`Plugin ${id} not found`);
    if (p.instance?.status === 'active') return;
    if (config) {
      await p.configure(config);
      if (p.instance) p.instance.config = config;
    }
    if (p.instance) {
      p.instance.status    = 'active';
      p.instance.enabledAt = Date.now();
    }
    console.info(`[PluginRegistry] Plugin ${id} enabled`);
  }

  async disable(id: string): Promise<void> {
    const p = this._plugins.get(id);
    if (!p || p.instance?.status !== 'active') return;
    if (p.teardown) await p.teardown();
    if (p.instance) p.instance.status = 'inactive';
    console.info(`[PluginRegistry] Plugin ${id} disabled`);
  }

  // ─── Execution ─────────────────────────────────────────────────────────────

  async execute<TOut = unknown>(id: string, capability: string, params: unknown): Promise<TOut | null> {
    const p = this._plugins.get(id);
    if (!p || p.instance?.status !== 'active') return null;
    if (p.instance) p.instance.usageCount++;
    if (p.instance) p.instance.lastUsedAt = Date.now();
    return p.execute(capability, params) as Promise<TOut | null>;
  }

  async executeAll(capability: string, params: unknown): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    await Promise.all(
      Array.from(this._plugins.values())
        .filter(p => p.instance?.status === 'active' && p.manifest.capabilities.some(c => c.method === capability))
        .map(async p => {
          const r = await p.execute(capability, params).catch(err => {
            console.error(`[PluginRegistry] Plugin ${p.manifest.id} failed on ${capability}:`, err);
            return null;
          });
          results.set(p.manifest.id, r);
        }),
    );
    return results;
  }

  // ─── Health ────────────────────────────────────────────────────────────────

  async healthCheck(id: string): Promise<{ ok: boolean; message?: string }> {
    const p = this._plugins.get(id);
    if (!p) return { ok: false, message: 'Not found' };
    if (!p.health) return { ok: true };
    return p.health();
  }

  async healthCheckAll(): Promise<Map<string, { ok: boolean; message?: string }>> {
    const results = new Map<string, { ok: boolean; message?: string }>();
    await Promise.all(
      Array.from(this._plugins.values()).map(async p => {
        const r = p.health
          ? await p.health().catch(() => ({ ok: false as const, message: 'Health check threw' }))
          : { ok: true as const };
        results.set(p.manifest.id, r);
      }),
    );
    return results;
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  getManifest(id: string): PluginManifest | null {
    return this._plugins.get(id)?.manifest ?? null;
  }

  getInstance(id: string): PluginInstance | null {
    return this._plugins.get(id)?.instance ?? null;
  }

  getAll(): PluginInstance[] {
    return Array.from(this._plugins.values())
      .map(p => p.instance)
      .filter((i): i is PluginInstance => i != null);
  }

  getActive(): PluginInstance[] {
    return this.getAll().filter(p => p.status === 'active');
  }

  isActive(id: string): boolean {
    return this._plugins.get(id)?.instance?.status === 'active';
  }

  getByCategory(cat: string): PluginInstance[] {
    return this.getAll().filter(p => this._plugins.get(p.id)?.manifest.category === cat);
  }
}

export const PluginRegistry = new PluginRegistryImpl();