# src/

Application source, following a layered (MVC + service layer) architecture:

```
src/
├── app.js          # Express app assembly (middleware + routes), no side effects
├── server.js       # Entry point: connects DB, starts the HTTP server
├── config/         # Environment & connection setup
├── routes/         # URL → controller mapping
├── controllers/    # HTTP request/response handling
├── services/       # Business logic
├── models/         # Database schemas
├── middleware/      # Cross-cutting request handling (auth, errors, uploads)
└── utils/          # Generic, stateless helpers
```

Request flow: `routes/ → controllers/ → services/ → models/`. Each layer
only talks to the one directly below it — see that folder's own
`README.md` for what specifically belongs there.
