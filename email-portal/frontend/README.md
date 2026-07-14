# frontend/

React SPA built with Vite.

## Expected top-level files (not present in this skeleton)

- `package.json` — dependencies & scripts (`dev`, `build`, `preview`, `lint`).
- `vite.config.js` — build tool config (plugins, dev server, aliases).
- `index.html` — Vite's entry HTML; `src/main.jsx` mounts into a `<div id="root">` here.
- `eslint.config.js` — linting rules.
- `.env` / `.env.example` — Vite env vars (must be prefixed `VITE_` to be exposed to the client).
- `.gitignore` — at minimum: `node_modules/`, `dist/`, `.env`.

## Structure

```
public/            # Static files served as-is (favicon, robots.txt, fonts)
src/
├── main.jsx        # Entry point — renders <App /> into the DOM
├── App.jsx         # Root component — wraps providers + routes
├── routes/         # Centralized route definitions & guards
├── pages/          # One component per route/screen
├── components/     # Reusable UI, organized by feature/domain
├── hooks/          # Custom React hooks
├── store/          # Global state (context/redux/zustand)
├── api/            # HTTP client configuration
├── assets/         # Images/icons imported into components
├── App.css / index.css
```

## The layering rule (mirrors the backend)

```
routes/  →  pages/  →  components/  →  hooks/ + store/ + api/
(URL)       (screen)    (UI pieces)     (data & state)
```

Pages compose components and read from hooks/store; components stay
presentational where possible; hooks/api/store hold the actual data-fetching
and state logic so it isn't duplicated across screens.
