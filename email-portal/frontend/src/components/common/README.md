# src/components/common/

Generic UI shared across the *entire* app, regardless of feature or role —
the opposite of `forms/`, `registry/`, `review/`, which are feature-scoped.

## Typical contents

- `Navbar.jsx`, `Sidebar.jsx` — app-wide layout chrome.
- `Loader.jsx` — a loading spinner/skeleton used anywhere data is fetching.
- `StatusBadge.jsx` — a small, reusable presentational element (e.g. a
  colored pill for "pending"/"approved"/"rejected") used across many
  feature tables.
- `ProtectedRoute.jsx` — the route-guard component consumed by
  `routes/protectedRoutes.jsx` (kept here since it's a *component*, even
  though it's routing-related).

## Rule of thumb

If you're about to copy-paste a component into a second feature folder,
that's the signal to move it here instead.
