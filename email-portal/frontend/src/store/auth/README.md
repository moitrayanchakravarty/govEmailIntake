# src/store/auth/

The authentication state slice: current user, token, role, and the actions
that mutate that state (login, logout, token refresh).

## Typical files

- **`authReducer.js`** — a `useReducer`-style reducer: given the current
  auth state and an action (`LOGIN_SUCCESS`, `LOGOUT`, ...), returns the
  next state. Pure function, easy to unit test.
- **`authActions.js`** — action creators / functions that dispatch those
  actions, sometimes after calling the backend (e.g. `login(credentials)`
  calls the API, then dispatches `LOGIN_SUCCESS` with the result).
- **`authContextProvider.jsx`** — a React Context Provider component that
  holds the reducer's state via `useReducer` and exposes `{ state, dispatch }`
  (or higher-level functions) to the component tree. Wrapped around
  `<AppRoutes />` in `App.jsx`.

## Data flow

```
authContextProvider (holds state)
        ↑ read via
hooks/api/useAuth.js (convenience wrapper)
        ↑ used by
pages / components (Login page, Navbar showing user name, ProtectedRoute)
```
