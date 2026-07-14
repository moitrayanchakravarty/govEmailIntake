# src/controllers/

The HTTP layer. A controller's only responsibilities are:

1. Pull what it needs off `req` (params, query, body, authenticated user).
2. Call into `services/` to perform the actual work.
3. Shape and send the HTTP response (status code + JSON body), or pass
   errors to the error-handling middleware via `next(err)`.

Controllers should **not** contain business logic, validation rules, or
direct database calls — that belongs in `services/` and `models/`
respectively. A good test: could this function's body work unchanged if you
swapped Express for a CLI or a message queue consumer? If not, there's
business logic leaking in that should move to a service.

## Naming convention

One file per resource/domain, matching its route file:
`auth.controller.js`, `registry.controller.js`, etc. Exported functions are
typically named after the action: `login`, `getAll`, `getById`, `create`,
`update`, `remove`.

## Typical shape

```js
import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.status(200).json({ success: true, data: { token, user } });
});
```

Wrapping handlers in an `asyncHandler` (see `utils/`) avoids repetitive
`try/catch` blocks for async errors.
