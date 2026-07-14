# src/pages/portalManager/

Screens scoped to the "Portal Manager" role — only reachable when
`routes/protectedRoutes.jsx` confirms the logged-in user has that role.

## Typical contents (example, adapt to your domain)

- Higher-privilege screens: master registry management, review queues,
  admin-of-admins management, reporting dashboards.

Same conventions as `pages/officeAdmin/` — compose, don't reimplement,
reusable pieces from `components/`.
