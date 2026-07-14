# src/routes/

Centralized route configuration — the single place that maps URL paths to
page components, instead of scattering `<Route>` definitions across the app.

## Typical files

- **`appRoutes.jsx`** — declares every route (usually with `react-router-dom`'s
  `<Routes>`/`<Route>`), grouped by area (public/auth routes, office-admin
  routes, portal-manager routes).
- **`protectedRoutes.jsx`** — a route-guard wrapper (or `<Outlet>`-based
  layout route) that checks auth/role state before rendering the nested
  route, redirecting to `/login` otherwise.

## Typical shape

```jsx
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute allow={["officeAdmin"]} />}>
        <Route path="/office-admin" element={<OfficeAdminDashboard />} />
      </Route>
    </Routes>
  );
}
```

## Conventions

- Keep this folder free of business logic — it only wires paths to pages
  and applies guards. Actual auth-check logic (is the token valid?) lives in
  `store/auth/` or `hooks/api/useAuth.js`, and this folder just consumes it.
