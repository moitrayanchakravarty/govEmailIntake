# src/api/

The HTTP client configuration — a single, shared place that knows how to
talk to the backend, so the rest of the app doesn't configure `axios`
(or `fetch`) itself.

## Typical files

- **`axiosInstance.js`** — creates and exports a configured `axios`
  instance: `baseURL` (from an env var like `VITE_API_URL`), default
  headers, and interceptors (e.g. attaching the JWT from auth state to
  every request, or redirecting to `/login` on a 401 response).

## Conventions

- All outgoing API calls go through this instance — no component or hook
  should construct its own `axios`/`fetch` call with a hardcoded URL.
- If the app grows to call multiple distinct backends/services, this folder
  can hold one client per service (`authApi.js`, `paymentsApi.js`, etc.).
