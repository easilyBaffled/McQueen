# Test Plan: mcq-35g.4 -- Restructure pages into co-located directories

## Summary

- **Bead:** `mcq-35g.4`
- **Feature:** Verify that moving page files from flat `pages/Foo.jsx` into co-located `pages/Foo/Foo.jsx` directories preserves all routing, lazy-loading, and styling without regressions
- **Total Test Cases:** 12
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Build completes without errors after restructure

**Priority:** P0
**Type:** Functional

### Objective

Verify that `vite build` succeeds with zero errors, confirming all import paths in App.tsx and within page modules resolve correctly after the directory restructure.

### Preconditions

- All page files have been moved into their co-located directories (e.g., `pages/Market/Market.tsx`, `pages/Market/Market.module.css`)
- All import paths in `App.tsx` have been updated to the new locations

### Steps

1. Run `npm run build` from the project root.
   **Expected:** Build completes with exit code 0 and produces output in the `dist/` directory. No "module not found" or path-resolution errors appear.

2. Inspect the build output for the expected number of JS chunks (one per lazy-loaded page).
   **Expected:** Each lazy-loaded page (Timeline, Market, Portfolio, Watchlist, Leaderboard, Mission, PlayerDetail, ScenarioInspector) produces a separate chunk file.

### Test Data

- None required.

### Edge Cases

- Run `npm run build` twice in succession to ensure no stale cache issues from the old file paths.

---

## TC-002: Dev server starts and serves the app after restructure

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Vite dev server starts without import-resolution errors and serves the application at `localhost`.

### Preconditions

- Restructure is complete; all pages are in co-located directories.

### Steps

1. Run `npm run dev` and wait for the "ready" message.
   **Expected:** Server starts without errors. No warnings about missing modules or unresolved imports appear in the terminal.

2. Open `http://localhost:5173/` in a browser.
   **Expected:** The Timeline page (index route) renders correctly.

### Test Data

- None required.

### Edge Cases

- Cold-start the dev server after clearing the Vite cache (`node_modules/.vite`).

---

## TC-003: Lint passes with no unresolved import errors

**Priority:** P0
**Type:** Functional

### Objective

Verify that ESLint finds no import/resolution errors after paths are updated, ensuring no broken references remain.

### Preconditions

- Restructure is complete.

### Steps

1. Run `npm run lint` from the project root.
   **Expected:** Linting completes with zero errors related to import paths (e.g., no `import/no-unresolved` violations).

### Test Data

- None required.

### Edge Cases

- None.

---

## TC-004: All existing unit and component tests pass

**Priority:** P0
**Type:** Regression

### Objective

Verify that all existing Vitest tests still pass after the restructure, confirming no test imports or module mocks are broken by the path changes.

### Preconditions

- Restructure is complete.
- Test files in `src/pages/__tests__/` have their imports updated if they reference page modules directly.

### Steps

1. Run `npm run test:run` from the project root.
   **Expected:** All tests pass. No failures due to "Cannot find module" or similar import errors.

2. Check test count matches the pre-restructure baseline.
   **Expected:** Same number of test suites and test cases run as before the restructure (no tests silently dropped).

### Test Data

- None required.

### Edge Cases

- If any test file imports a page component directly (e.g., `import Timeline from '../Timeline'`), verify the import path has been updated to `../Timeline/Timeline`.

---

## TC-005: All Cypress E2E tests pass

**Priority:** P0
**Type:** Regression

### Objective

Verify that the full Cypress E2E suite passes, confirming all routes render real page content and navigation works end-to-end.

### Preconditions

- Restructure is complete. A production build can be served via `npm run preview`.

### Steps

1. Run `npm run cy:run` from the project root.
   **Expected:** All Cypress specs pass (smoke, navigation, market, portfolio, watchlist, leaderboard, mission, player-detail, timeline, toasts, onboarding).

### Test Data

- None required.

### Edge Cases

- None; the E2E suite covers the critical user paths.

---

## TC-006: Each route lazy-loads its page component correctly

**Priority:** P0
**Type:** Functional

### Objective

Verify that every route defined in `App.tsx` still lazy-loads the correct page component from the new directory structure.

### Preconditions

- App is running (dev or preview mode).
- Browser DevTools Network tab is open.

### Steps

1. Navigate to `/` (Timeline).
   **Expected:** A JS chunk for Timeline loads on demand. The Timeline page renders.

2. Navigate to `/market`.
   **Expected:** A JS chunk for Market loads on demand. The Market page renders.

3. Navigate to `/portfolio`.
   **Expected:** A JS chunk for Portfolio loads on demand. The Portfolio page renders.

4. Navigate to `/watchlist`.
   **Expected:** A JS chunk for Watchlist loads on demand. The Watchlist page renders.

5. Navigate to `/mission`.
   **Expected:** A JS chunk for Mission loads on demand. The Mission page renders.

6. Navigate to `/leaderboard`.
   **Expected:** A JS chunk for Leaderboard loads on demand. The Leaderboard page renders.

7. Navigate to `/player/:playerId` (e.g., `/player/pat-mahomes`).
   **Expected:** A JS chunk for PlayerDetail loads on demand. The PlayerDetail page renders.

8. Navigate to `/inspector`.
   **Expected:** A JS chunk for ScenarioInspector loads on demand. The ScenarioInspector page renders.

### Test Data

- A valid `playerId` that exists in the app's data set.

### Edge Cases

- Refresh the browser on each route to confirm lazy-loading works on direct URL access, not just client-side navigation.

---

## TC-007: CSS module styles are correctly applied after restructure

**Priority:** P1
**Type:** Regression

### Objective

Verify that each page's CSS module (`*.module.css`) is still correctly imported and applied after being moved into the co-located directory.

### Preconditions

- App is running.

### Steps

1. Navigate to each page (Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard, PlayerDetail, ScenarioInspector).
   **Expected:** Each page's layout, colors, spacing, and typography match the pre-restructure appearance. No unstyled content or missing class names.

2. Inspect a styled element on each page using DevTools.
   **Expected:** CSS module class names (e.g., `_market_xxxx`) are present in the DOM, confirming the module CSS was loaded.

### Test Data

- Screenshots or visual baseline from before the restructure for comparison.

### Edge Cases

- Verify that CSS from one page does not leak into another (module scoping still works).

---

## TC-008: No stale flat-file references remain in the codebase

**Priority:** P1
**Type:** Functional

### Objective

Verify that no import statements or references to the old flat-file paths (e.g., `./pages/Market` without the nested directory) exist anywhere in the codebase.

### Preconditions

- Restructure is complete.

### Steps

1. Run a project-wide search for import paths matching the old flat pattern: `from './pages/Foo'` or `from '../pages/Foo'` where `Foo` is a page name without a repeated directory segment.
   **Expected:** Zero matches. All imports use the co-located pattern (e.g., `./pages/Market/Market`).

2. Run a project-wide search for any leftover flat page files (e.g., `src/pages/Market.tsx` at the top level of `pages/`).
   **Expected:** No page `.tsx` or `.css` files exist directly under `src/pages/`; all are nested in subdirectories.

### Test Data

- Page names to search for: Timeline, Market, Portfolio, Watchlist, Leaderboard, Mission, PlayerDetail, ScenarioInspector.

### Edge Cases

- Check that `__tests__/` directory imports are also updated if they reference pages directly.

---

## TC-009: Old flat page files are removed

**Priority:** P1
**Type:** Functional

### Objective

Verify that the original flat page files (e.g., `src/pages/Market.tsx`, `src/pages/Market.css`) have been deleted and do not coexist with the new directory structure.

### Preconditions

- Restructure is complete.

### Steps

1. List all files directly under `src/pages/` (non-recursively).
   **Expected:** No `.tsx`, `.jsx`, `.css`, or `.module.css` files exist at the `src/pages/` root level. Only subdirectories (Market/, Timeline/, etc.) and the `__tests__/` directory should be present.

2. Verify via `git status` or `git diff --name-status` that the old flat files show as deleted.
   **Expected:** Each old flat file appears as "D" (deleted) in the diff.

### Test Data

- None required.

### Edge Cases

- Verify no orphaned `.css` files remain if the component file was moved but its stylesheet was forgotten.

---

## TC-010: Directory structure follows the co-location convention

**Priority:** P1
**Type:** Functional

### Objective

Verify that each page directory contains its component file and its stylesheet, following the naming convention `pages/Foo/Foo.tsx` + `pages/Foo/Foo.module.css`.

### Preconditions

- Restructure is complete.

### Steps

1. For each page (Timeline, Market, Portfolio, Watchlist, Leaderboard, Mission, PlayerDetail, ScenarioInspector), verify the directory exists under `src/pages/`.
   **Expected:** Eight directories exist: `Timeline/`, `Market/`, `Portfolio/`, `Watchlist/`, `Leaderboard/`, `Mission/`, `PlayerDetail/`, `ScenarioInspector/`.

2. For each directory, verify it contains a `.tsx` component file matching the directory name.
   **Expected:** e.g., `Market/Market.tsx` exists and is a valid React component with a default export.

3. For each directory, verify it contains a `.module.css` file matching the directory name.
   **Expected:** e.g., `Market/Market.module.css` exists and contains styles.

### Test Data

- None required.

### Edge Cases

- Verify consistent casing between directory name and file name (e.g., `PlayerDetail/PlayerDetail.tsx`, not `PlayerDetail/playerDetail.tsx`).

---

## TC-011: App.tsx lazy imports use correct updated paths

**Priority:** P1
**Type:** Functional

### Objective

Verify that every `lazy(() => import(...))` call in `App.tsx` references the new co-located directory path.

### Preconditions

- Restructure is complete.

### Steps

1. Open `src/App.tsx` and inspect each lazy import statement.
   **Expected:** Each lazy import uses the pattern `./pages/PageName/PageName`, specifically:
   - `'./pages/Timeline/Timeline'`
   - `'./pages/Market/Market'`
   - `'./pages/Portfolio/Portfolio'`
   - `'./pages/Watchlist/Watchlist'`
   - `'./pages/Leaderboard/Leaderboard'`
   - `'./pages/Mission/Mission'`
   - `'./pages/PlayerDetail/PlayerDetail'`
   - `'./pages/ScenarioInspector/ScenarioInspector'`

2. Verify no other files import pages using old flat paths.
   **Expected:** A codebase-wide search for `from './pages/` or `from '../pages/` shows only the new co-located patterns.

### Test Data

- None required.

### Edge Cases

- Verify that the ScenarioInspector import (which spans multiple lines in the source) is also correctly updated.

---

## TC-012: Suspense fallback still renders during lazy-load

**Priority:** P2
**Type:** Regression

### Objective

Verify that the `<Suspense fallback={<PageFallback />}>` wrapper still functions correctly, showing the `MarketSkeleton` loading state while chunks load.

### Preconditions

- App is running.
- Browser DevTools Network tab allows throttling.

### Steps

1. Open DevTools and set network throttle to "Slow 3G".
2. Navigate to `/market`.
   **Expected:** The `MarketSkeleton` loading placeholder renders briefly while the Market chunk downloads, then the Market page appears.

3. Navigate to `/leaderboard`.
   **Expected:** The skeleton loading state appears again while the Leaderboard chunk loads.

### Test Data

- None required.

### Edge Cases

- If the chunk fails to load (simulate via DevTools by blocking the request), the `ErrorBoundary` should catch the error gracefully instead of showing a blank screen.
