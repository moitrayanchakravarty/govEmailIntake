# src/utils/

Small, generic, stateless helpers with no business meaning — the kind of
code that would look identical in any Express project, not just this one.

## Typical files

- **`asyncHandler.js`** — wraps an async Express handler so thrown errors
  are automatically forwarded to `next(err)` instead of needing a
  `try/catch` in every controller:
  ```js
  export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
  ```
- **`apiResponse.js`** — a small helper/class for shaping consistent
  success/error JSON payloads (`{ success, data, message }`) so every
  endpoint responds in the same envelope.
- **`logger.js`** — a configured logger (wrapping `console`, `winston`,
  `pino`, etc.) so log format/level is controlled in one place instead of
  scattered `console.log` calls.

## What does *not* belong here

- Anything domain-specific (e.g. "calculate request approval deadline")
  should live in `services/`, not `utils/` — a good test is whether the
  function would make sense copy-pasted into a completely different project.
