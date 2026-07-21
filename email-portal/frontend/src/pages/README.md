# src/pages/

One component per route/screen — the "top" of the component tree for a
given URL. A page's job is to **compose**: pull in the components,
hooks, and store data it needs, and arrange them into a full screen. Pages
generally shouldn't contain deeply reusable UI themselves — that belongs in
`components/`.

## Organization

Subfoldered by role/domain area rather than one flat folder, since this
app has distinct portals:

```
pages/
├── auth/            # Login, password reset, etc. — shared entry points
├── user/              # Screens only a signed-up user can reach
└── portalManager/    # Screens only a Portal Manager can reach
```

This mirrors how routes are grouped in `routes/appRoutes.jsx` and how
authorization is checked in `routes/protectedRoutes.jsx` — the three should
stay in sync as you add new areas.

## Conventions

- Name page components after the screen, not the URL:
  `OfficeAdminDashboard.jsx`, not `Page1.jsx`.
- A page fetches data via `hooks/api/` and reads global state via `store/`
  — it shouldn't call `fetch`/`axios` directly.
