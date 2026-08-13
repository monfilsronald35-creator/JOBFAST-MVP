Place your raster or SVG master here.

Expected filenames:
 - jobfast-logo-source.png  (raster master)
 - jobfast-logo.svg         (vector master)

After placing the master, run the script at the repo root:

  cd apps/frontend
  npm ci
  cd ../..
  node scripts/generate-icons.js

The script will generate /apps/frontend/public/icons and /apps/frontend/public/splash
