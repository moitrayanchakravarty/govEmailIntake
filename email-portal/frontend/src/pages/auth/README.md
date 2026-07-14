# src/pages/auth/

Screens reachable before/without role-specific context — primarily
authentication flows shared by every user type.

## Typical contents

- `Login.jsx` — the shared login screen for all account types.
- Optionally: `ForgotPassword.jsx`, `ResetPassword.jsx`, `Unauthorized.jsx`
  (shown when a logged-in user hits a route their role can't access).

These are the only pages that should be reachable **without** passing
through `routes/protectedRoutes.jsx`'s guard.
