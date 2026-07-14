# src/models/

The data layer — Mongoose schemas and models (or your ORM's equivalent).

## Naming convention

One file per collection/entity, singular, suffixed `.model.js`:
`user.model.js`, `request.model.js`, `auditLog.model.js`. The exported
model name (`mongoose.model("User", schema)`) should match the file's
subject and is what Mongoose uses to name the MongoDB collection
(pluralized/lowercased automatically).

## What belongs in a model file

- Schema field definitions, types, and validation (`required`, `enum`,
  `min`/`max`, custom validators).
- Indexes (`schema.index(...)`) for fields you'll query/filter/sort by often.
- Schema-level concerns: virtuals, instance/static methods, hooks
  (`pre('save')`, `post('remove')`) that are intrinsic to the data itself.
- Relationships via `ref` (e.g. `office: { type: Schema.Types.ObjectId, ref: "Office" }`).

## What does *not* belong here

- Business rules that span multiple models (that's a service's job).
- Anything HTTP-related.

## Conventions

- Keep this folder's contents in sync with `docs/database-schema.md` — the
  docs describe intent, the model files are the enforced reality.
- Always set `{ timestamps: true }` unless you have a specific reason not
  to — `createdAt`/`updatedAt` are cheap and frequently useful for audits.
