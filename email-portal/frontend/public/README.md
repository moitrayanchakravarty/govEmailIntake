# public/

Static assets served **as-is**, unprocessed by Vite's build pipeline, at the
site root. Reference them with an absolute path, e.g. `/favicon.ico`, not an
import.

## What goes here

- `favicon.ico`, `robots.txt`, `manifest.json`
- Fonts that need to be linked via `@font-face` with a stable, predictable
  URL (see `fonts/`)
- Anything that must retain its exact filename (some SEO/verification files
  require this)

## What does *not* belong here

- Images/icons used *inside* React components — put those in `src/assets/`
  instead, so Vite can hash/optimize them at build time.
