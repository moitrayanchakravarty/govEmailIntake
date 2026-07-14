# src/config/

Centralised, environment-driven configuration. Nothing here should contain
business logic — just setup and connection wiring.

## Typical files

- **`env.js`** — reads and validates `process.env` (ideally with a schema
  validator like `zod`/`joi` or `envalid`) and exports a single typed config
  object (`env.PORT`, `env.MONGO_URI`, `env.JWT_SECRET`, ...). Every other
  file imports from here instead of touching `process.env` directly —
  that way there's one place to see every environment variable the app uses.
- **`db.js`** — exports `connectDB()`, which opens the Mongoose/DB connection
  using values from `env.js`. Called once, from `server.js`.
- Additional integrations as needed: `redis.js`, `s3.js`, `mailer.js`, etc.
  — one file per external service/connection.

## Conventions

- Fail fast: if a required env var is missing, throw on startup rather than
  letting the app run in a broken state.
- Never read `process.env` outside this folder — makes it trivial to find
  every config dependency the app has.
