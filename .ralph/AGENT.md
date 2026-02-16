# McQueen Project Conventions

This file is the authoritative reference for any AI agent working on McQueen.
Read it fully before writing any code.

---

## What McQueen Is

An **NFL Stock Market** web app where fans trade player stocks whose prices move
based on performance, news, and trading activity. Currently a front-end POC
deployed on Vercel.

## Tech Stack

| Layer       | Tool / Version                       |
|-------------|--------------------------------------|
| Framework   | React 19 (functional components only)|
| Build       | Vite 5                               |
| Routing     | React Router DOM 7                   |
| Animations  | Framer Motion 12                     |
| Charts      | Recharts 3                           |
| Linting     | ESLint 9 (flat config)               |
| Deployment  | Vercel                               |
| Node        | 20.x                                 |

## Folder Structure

```
src/
  assets/          Static images and SVGs
  components/      Reusable UI components (PascalCase .jsx + co-located .css)
  context/         React Context providers (GameContext.jsx is the main one)
  data/            Static JSON scenario files (midweek, live, playoffs, superbowl)
  hooks/           Custom React hooks (camelCase, useXxx.js)
  pages/           Route-level page components (PascalCase .jsx + co-located .css)
  services/        Business logic modules (camelCase .js)
  utils/           Pure helper functions (camelCase .js)
```

## Naming Conventions

| What                  | Pattern                          | Example                     |
|-----------------------|----------------------------------|-----------------------------|
| Component file        | `PascalCase.jsx`                 | `PlayerCard.jsx`            |
| Component CSS         | `PascalCase.css` (co-located)    | `PlayerCard.css`            |
| Service / util file   | `camelCase.js`                   | `priceCalculator.js`        |
| Custom hook file      | `camelCase.js` (use-prefix)      | `usePortfolio.js`           |
| Data file             | `lowercase.json`                 | `midweek.json`              |
| CSS class names       | `kebab-case`                     | `.player-card-header`       |
| JS variables/funcs    | `camelCase`                      | `calculateNewPrice`         |
| React components      | `PascalCase`                     | `<PlayerCard />`            |
| Constants             | `UPPER_SNAKE_CASE`               | `INITIAL_CASH`              |

## Barrel Exports

**Components** are re-exported from `src/components/index.js`.
When you create a new component, you **must** add an export line there:

```js
export { default as MyNewComponent } from './MyNewComponent';
```

**Services** are re-exported from `src/services/index.js`.

## State Management

- All shared state lives in `src/context/GameContext.jsx` via React Context + `useContext`.
- **Do not** introduce Redux, Zustand, Jotai, or any other state library.
- Local component state uses `useState` / `useReducer`.
- Side effects use `useEffect`; memoization via `useMemo` / `useCallback`.

## Styling Rules

- **CSS Variables** for theming (ESPN-inspired palette). Defined in `src/index.css`.
- **No CSS-in-JS** (no styled-components, no emotion, no Tailwind).
- Every component gets a co-located `.css` file imported at the top of the `.jsx`.
- Use `kebab-case` class names. Scope classes with a component-level prefix
  (e.g., `.player-card-*`).

## Code Style

- **ES6 modules** (`import` / `export`). The project uses `"type": "module"`.
- **Functional components only**. No class components.
- **Hooks only** for lifecycle and state.
- **Default exports** for components. Named exports for utilities/hooks.
- Keep files under ~300 lines. Extract helpers into `utils/` or `services/`.

## Scenario Data

The files in `src/data/` (`midweek.json`, `live.json`, `playoffs.json`,
`superbowl.json`) are large, curated demo datasets. **Do not modify them**
unless the bead description explicitly requires it.

## Git / Commit Conventions

- Always include the bead ID at the end of the commit message:
  ```
  Add portfolio analytics chart (mcq-a1b2)
  ```
- One logical change per commit. Do not bundle unrelated work.
- Run `npm run lint` before committing.

## Dependencies

- Do **not** add new npm packages unless the bead explicitly authorizes it.
- If a bead says to add a dependency, install it with `npm install <pkg>` (latest).

## Build & Dev Commands

| Command            | Purpose                        |
|--------------------|--------------------------------|
| `npm run dev`      | Start Vite dev server          |
| `npm run build`    | Production build to `dist/`    |
| `npm run lint`     | ESLint check                   |
| `npm run preview`  | Preview production build       |

## Proxy / API

- In development, ESPN API requests are proxied via Vite (`/espn-api` -> `site.api.espn.com`).
- In production, Vercel rewrites handle the same proxy (see `vercel.json`).
- Do not hard-code ESPN URLs; use the helpers in `src/utils/espnUrls.js`.
