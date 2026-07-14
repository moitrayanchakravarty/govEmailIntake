# src/hooks/api/

Data-fetching hooks that wrap the `api/axiosInstance.js` client, so
components never call `axios`/`fetch` directly.

## Typical files

- **`useApi.js`** — a generic hook for GET requests with loading/error/data
  state (or a thin wrapper around a library like `@tanstack/react-query` if
  you adopt one — recommended once the app has more than a few endpoints,
  for caching, retries, and request deduplication for free).
- **`useAuth.js`** — exposes the current authenticated user, login/logout
  functions, and auth status, typically by reading from `store/auth/` and
  adding request-triggering behavior on top.

## Why hooks wrap the store/api layer instead of components using them directly

Components call `useAuth()` and get back `{ user, login, logout }` without
knowing whether that data comes from Context, Redux, or an API call under
the hood — the implementation can change without touching every component
that needs auth state.
