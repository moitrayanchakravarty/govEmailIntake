# src/hooks/

Custom React hooks — reusable stateful logic extracted out of components so
it isn't duplicated across pages/components.

```
hooks/
└── api/    # Data-fetching hooks (wrap the api/ client + React Query-style caching)
```

## Conventions

- Name hooks starting with `use`: `useApi.js`, `useAuth.js`.
- A hook should do one thing (fetch a resource, subscribe to a value,
  manage a piece of local UI state) and be composable — pages/components
  call several small hooks rather than one giant one.
- If a hook's logic grows complex enough to need its own tests, that's a
  sign it's doing real work and deserves to live here rather than inline in
  a component.
