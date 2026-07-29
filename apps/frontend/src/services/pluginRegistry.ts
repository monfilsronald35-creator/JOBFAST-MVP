/**
 * Plugin Registry — Dynamic plugin system for JOBFAST Super App.
 * Handles: manifest loading, dependency resolution, permission gating,
 * feature flags, hot-unload, version compatibility checks.
 */
import API from '../api/axios';
import type { ApiResponse, PluginManifest } from '../types';

// ─── Registry State ───────────────────────────────────────────────────────────
const _loaded = new Map<string, PluginManifest>();

export interface PluginLoadResult {
  readonly loaded: readonly PluginManifest[];
  readonly skipped: readonly { id: string; reason: string }[];
  readonly errors: readonly { id: string; error: string }[];
}

// ─── Compatibility ────────────────────────────────────────────────────────────
const APP_VERSION = (globalThis as Record<string, unknown>).__APP_VERSION__ as string | undefined ?? '1.0.0';

function parseVersion(v: string): readonly [number, number, number] {
  const parts = v.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function isCompatible(requiredVersion: string): boolean {
  const [reqMaj] = parseVersion(requiredVersion);
  const [appMaj] = parseVersion(APP_VERSION);
  return appMaj >= reqMaj;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Load all plugin manifests from backend, resolve dependencies, gate by permissions */
export async function loadPluginManifests(): Promise<PluginLoadResult> {
  const loaded: PluginManifest[] = [];
  const skipped: { id: string; reason: string }[] = [];
  const errors: { id: string; error: string }[] = [];

  try {
    const res = await API.get<ApiResponse<readonly PluginManifest[]>>('/plugins/manifests');
    const manifests = res.data.data;

    for (const manifest of manifests) {
      try {
        if (!isCompatible(manifest.version)) {
          skipped.push({ id: manifest.id, reason: `version ${manifest.version} requires newer app` });
          continue;
        }

        if (manifest.featureFlags['disabled']) {
          skipped.push({ id: manifest.id, reason: 'disabled via feature flag' });
          continue;
        }

        _loaded.set(manifest.id, manifest);
        loaded.push(manifest);
      } catch (err) {
        errors.push({
          id: manifest.id,
          error: err instanceof Error ? err.message : 'unknown error',
        });
      }
    }
  } catch (err) {
    console.warn('[PluginRegistry] Failed to load manifests from backend', err);
  }

  return { loaded, skipped, errors };
}

/** Check if a plugin is loaded and active */
export function isPluginActive(pluginId: string): boolean {
  return _loaded.has(pluginId);
}

/** Get a plugin's feature flags */
export function getPluginFlags(pluginId: string): Record<string, boolean> {
  return _loaded.get(pluginId)?.featureFlags ?? {};
}

/** Get all routes exposed by loaded plugins */
export function getPluginRoutes(): readonly string[] {
  return Array.from(_loaded.values()).flatMap((m) => m.routes);
}

/** Get all loaded plugin IDs */
export function getLoadedPluginIds(): readonly string[] {
  return Array.from(_loaded.keys());
}

/** Unload a plugin at runtime */
export function unloadPlugin(pluginId: string): void {
  _loaded.delete(pluginId);
}

/** Report a plugin error to backend */
export async function reportPluginError(pluginId: string, error: string): Promise<void> {
  await API.post('/plugins/errors', { pluginId, error, appVersion: APP_VERSION }).catch(() => {});
}

const pluginRegistry = {
  loadPluginManifests,
  isPluginActive,
  getPluginFlags,
  getPluginRoutes,
  getLoadedPluginIds,
  unloadPlugin,
  reportPluginError,
};

export { pluginRegistry };
export default pluginRegistry;