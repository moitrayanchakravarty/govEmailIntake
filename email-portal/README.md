# email-portal/

The actual application, split into two independently-run projects:

```
email-portal/
├── backend/   # REST API — Node.js, Express, MongoDB/Mongoose
└── frontend/  # SPA — React + Vite
```

They communicate over HTTP (the frontend's `src/api/` layer calls the
backend's routes). In development they run as two separate processes on
different ports; in production they can be deployed separately (e.g. backend
on a Node host, frontend as a static build behind a CDN) or together behind
a reverse proxy.

See `backend/README.md` and `frontend/README.md` for details on each.
