# src/services/

The business logic layer — the actual "what the app does", independent of
HTTP and (ideally) independent of any single database implementation detail.

## What goes here

- Validation of business rules (not just input shape — e.g. "an office
  admin can't approve their own request").
- Orchestration across multiple models (e.g. creating a `Request` document
  *and* writing an `AuditLog` entry in the same operation).
- Calls to external services (email providers, third-party APIs) — often
  via a thin wrapper, so the service stays testable.

## Naming convention

One file per domain, matching its controller: `auth.service.js`,
`registry.service.js`. Exported functions describe the operation:
`login(credentials)`, `createRequest(payload, user)`.

## Why separate this from controllers?

- **Testability**: services can be unit-tested with plain function calls —
  no `req`/`res` mocking required.
- **Reusability**: the same "create request" logic might be triggered from
  an HTTP route today and a scheduled job or CLI script tomorrow. If it
  lives in a service, both can call it.
- **Framework independence**: if you ever move off Express, this layer
  doesn't change.

## Conventions

- Services can call other services and models, but should never import
  anything from `controllers/` or `routes/` (that would invert the
  dependency direction).
- Throw typed/known errors (e.g. `new ApiError(404, "Request not found")`)
  and let the error-handling middleware translate them to HTTP responses.
