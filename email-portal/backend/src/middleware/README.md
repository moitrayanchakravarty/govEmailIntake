# src/middleware/

Cross-cutting request handling — code that runs *around* routes rather than
being tied to one resource. Middleware functions have the standard Express
signature `(req, res, next)` (or `(err, req, res, next)` for error handlers).

## Typical files

- **`auth.middleware.js`** — verifies a JWT/session and attaches the
  authenticated user to `req.user`. Used on any route that requires login.
- **`role.middleware.js`** — authorization *after* authentication; checks
  `req.user.role` against what a route requires (e.g.
  `requireRole("portalManager")`).
- **`errorHandler.middleware.js`** — the single, centralized place that
  turns thrown/`next(err)`-ed errors into consistent JSON error responses.
  Registered **last**, after all routes, via `app.use(errorHandler)`.
- **`upload.middleware.js`** — file upload handling (e.g. `multer` config)
  shared by any route that accepts file uploads.
- Others as needed: `validate.middleware.js` (schema validation of
  `req.body`), `rateLimiter.middleware.js`, `requestLogger.middleware.js`.

## Conventions

- Middleware should be small, composable, and reusable across many routes —
  if something only ever applies to one route, it likely belongs inline in
  that route file instead.
- Order matters: body parsers → request logging → auth → role checks →
  route handlers → 404 handler → error handler, in that order in `app.js`.
- Always call `next()` (or `next(err)`) — a middleware that doesn't call
  `next()` or send a response will hang the request.
