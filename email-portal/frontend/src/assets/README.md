# src/assets/

Images, icons, and other static files that are **imported directly into
components** (as opposed to `public/`, which is served as-is at a fixed
URL). Vite processes these at build time — hashing filenames for cache
busting and optimizing where applicable.

```jsx
import logo from "../assets/logo.svg";
<img src={logo} alt="Logo" />
```

## Rule of thumb

- Imported into JS/JSX → `src/assets/`
- Referenced by a stable, predictable URL (favicon, fonts, `robots.txt`) →
  `public/`
