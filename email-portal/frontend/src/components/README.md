# src/components/

Reusable, focused UI pieces — the building blocks that `pages/` compose
together. Subdivided by domain/feature so the folder stays navigable as the
app grows.

```
components/
├── common/       # Generic, app-wide UI (Navbar, Sidebar, Loader, badges)
├── forms/        # Feature-specific form components
├── registry/      # Components specific to the "registry" feature
└── review/        # Components specific to the "review" feature
```

## Conventions

- **Prefer "dumb"/presentational components**: pass data and callbacks in
  via props rather than fetching data inside the component. This makes them
  reusable and easy to test/storybook in isolation.
- A component that's only ever used by one page and holds page-specific
  layout logic can live directly in that page file instead of here — this
  folder is for things reused across ≥2 places, or that are conceptually
  a distinct, self-contained unit of UI.
- Name files after the component (PascalCase): `RegistryTable.jsx`.
- If a feature's components grow to include their own hooks/styles, it's a
  sign that folder could become its own "module" (component + hook + styles
  co-located) — a natural next step for a growing app.
