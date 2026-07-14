# src/

Application source. Organized by **layer first, feature second** — e.g. all
pages live under `pages/`, subdivided by domain (`pages/auth/`,
`pages/officeAdmin/`), rather than one giant folder per feature containing
mixed page/component/hook files. Both approaches are valid architectures;
this skeleton uses layer-first because it keeps each concern (routing,
screens, reusable UI, state) easy to scan independently. If the app grows
much larger, consider migrating to a feature-first ("module") structure
where each feature owns its own components/hooks/pages together.

See the `README.md` in each subfolder for what belongs there.
