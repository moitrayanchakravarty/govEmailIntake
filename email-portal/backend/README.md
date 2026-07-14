# backend/

Node.js + Express REST API, using MongoDB via Mongoose.

## Expected top-level files (not present in this skeleton)

- `package.json` — dependencies & npm scripts (`dev`, `start`, `test`, `lint`).
- `.env` / `.env.example` — environment variables (DB URI, JWT secret, port).
  Never commit `.env`; commit `.env.example` with keys only.
- `.gitignore` — at minimum: `node_modules/`, `.env`, logs, build output.

## Structure

```
src/
├── app.js          # Express app assembly: middleware + routes (no server.listen here)
├── server.js       # Entry point: connects DB, then starts the HTTP server
├── config/         # Environment & connection setup
├── routes/         # Express routers — map URLs to controllers
├── controllers/    # HTTP layer — request/response handling only
├── services/       # Business logic — framework-agnostic, reusable
├── models/         # Mongoose schemas — the data layer
├── middleware/      # Cross-cutting request handling (auth, errors, uploads)
└── utils/          # Generic, stateless helpers
```

## Why split `app.js` and `server.js`?

`app.js` builds and exports the Express app with no side effects (no DB
connection, no `.listen()`). This makes it importable in tests (e.g. with
`supertest`) without spinning up a real server or DB connection.
`server.js` is the only file that actually starts things up.

## Request flow (the layering rule)

```
routes/  →  controllers/  →  services/  →  models/
 (URL)      (HTTP req/res)   (business logic)  (DB)
```

Each layer should only know about the layer directly below it. Controllers
never touch Mongoose directly; services never touch `req`/`res`. This keeps
business logic testable independent of Express, and keeps controllers thin
and swappable if you ever change frameworks.
