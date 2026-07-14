# src/components/forms/

Form components, one per distinct form in the app. Kept separate from
generic `common/` components because forms tend to carry feature-specific
validation, field sets, and submit logic.

## Conventions

- Name after what the form does: `NewEmailForm.jsx`, `DeletionForm.jsx`,
  `ModificationForm.jsx`.
- A form component typically: renders fields, handles local input state
  and validation, and calls a prop callback (e.g. `onSubmit`) or a
  `hooks/api/` hook to actually send data — it shouldn't own the API call
  logic itself if that logic is reused elsewhere.
- Consider a form library (`react-hook-form`, `formik`) once you have more
  than a couple of non-trivial forms, to avoid re-deriving validation
  boilerplate each time.
