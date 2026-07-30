/**
 * PluginSDK — Helpers for building new plugins without touching core.
 * Import this in your plugin file, implement the Plugin interface, register.
 */

import type { Plugin, PluginManifest, PluginCategory, PluginCapability } from '../types';
import { PluginRegistry } from './PluginRegistry';

export type { Plugin, PluginManifest };
export { PluginRegistry };

export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

export function createPlugin(
  id:        string,
  name:      string,
  version:   string,
  category:  PluginCategory,
  capabilities: PluginCapability[],
  handler:   (capability: string, params: unknown) => Promise<unknown>,
  options?: {
    description?:    string;
    author?:         string;
    homepage?:       string;
    configure?:      (config: Record<string, unknown>) => Promise<void>;
    health?:         () => Promise<{ ok: boolean; message?: string }>;
    teardown?:       () => Promise<void>;
    permissions?:    string[];
    dependencies?:   string[];
    minPlatformVersion?: string;
  },
): Plugin {
  const manifest: PluginManifest = {
    id, name, version, category,
    capabilities,
    description:        options?.description        ?? '',
    author:             options?.author             ?? '',
    homepage:           options?.homepage,
    permissions:        options?.permissions        ?? [],
    dependencies:       options?.dependencies       ?? [],
    configSchema:       [],
    minPlatformVersion: options?.minPlatformVersion ?? '1.0.0',
  };
  const plugin: Plugin = {
    manifest,
    execute:    handler,
    configure:  options?.configure  ?? (() => Promise.resolve()),
    health:     options?.health,
    teardown:   options?.teardown,
  };
  return plugin;
}

export function installPlugin(plugin: Plugin): void {
  PluginRegistry.register(plugin);
}

export async function enablePlugin(id: string, config?: Record<string, unknown>): Promise<void> {
  return PluginRegistry.enable(id, config);
}