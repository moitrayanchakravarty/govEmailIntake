# src/routes/

Express `Router()` definitions. This layer is deliberately "dumb" — it only
maps HTTP verb + path combinations to controller functions (and attaches
route-level middleware like auth guards or validators). No logic lives here.

## Naming convention

One file per resource/domain: `auth.routes.js`, `request.routes.js`,
`registry.routes.js`, etc. Each exports an `express.Router()` instance.

## Typical shape

```js
import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { verifyAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", verifyAuth, authController.logout);

export default router;
```

## Mounting

All route files get imported and mounted onto the Express `app` in
`app.js`, each under its own path prefix:

```js
app.use("/api/auth", authRoutes);
app.use("/api/registry", registryRoutes);
```

## Conventions

- Version your API early if you expect breaking changes (`/api/v1/...`)
  rather than retrofitting it later.
- Keep route files free of `try/catch` and response-shaping — that's the
  controller's job.
