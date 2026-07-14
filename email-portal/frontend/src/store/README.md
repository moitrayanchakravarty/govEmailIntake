# src/store/

Global application state — anything more than one page/component needs to
read or write, that shouldn't be re-fetched or re-derived independently in
each place it's needed.

```
store/
└── auth/    # Authenticated user, token, role — read app-wide
```

## Approach used here: React Context

This skeleton assumes Context + `useReducer` (see `store/auth/`) as the
state mechanism, which is sufficient for small-to-medium apps. If the app's
shared state grows complex (many independent slices, frequent cross-cutting
updates, need for middleware/dev-tools), consider migrating to a dedicated
state library (Redux Toolkit, Zustand, Jotai) — the folder structure below
(one subfolder per "slice" of state) transfers directly to that approach.

## Conventions

- One subfolder per logical slice of state (`auth/`, later maybe `theme/`,
  `notifications/`), not one giant global store file.
- Components should read state via a hook (e.g. `hooks/api/useAuth.js`)
  rather than importing the context/reducer directly — keeps the storage
  mechanism swappable.
