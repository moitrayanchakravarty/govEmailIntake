# src/pages/officeAdmin/

Screens scoped to the "Office Admin" role — only reachable when
`routes/protectedRoutes.jsx` confirms the logged-in user has that role.

## Typical contents (example, adapt to your domain)

- A dashboard/landing screen for this role.
- Feature-specific screens (e.g. viewing a registry, viewing request
  history) that pull in components from `components/` and data via
  `hooks/api/`.

Keep one file per screen; if a screen grows complex, break its pieces out
into `components/<feature>/` rather than growing the page file itself.
