/**
 * Production build — esbuild bundles TypeScript + resolves @shared-* aliases
 * via tsconfig.json paths. node_modules stay external (not bundled).
 */
import { build } from 'esbuild';

await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node20'],
  outfile: 'dist/server.js',
  packages: 'external',
  sourcemap: true,
  tsconfig: 'tsconfig.json',
  logLevel: 'info',
});

console.log('✅ Build complete → dist/server.js');
