# Test Plan: mcq-35g -- UI Components: Restructure, Error Boundaries, and Code Splitting

## Summary

- **Bead:** `mcq-35g`
- **Feature:** Restructure component/page directories, add ErrorBoundary, implement route-based code splitting, migrate CSS to CSS Modules, and convert all JSX to TypeScript
- **Total Test Cases:** 32
- **Test Types:** Functional, Integration, Regression, UI/Visual

---

## TC-001: Shared components relocated to src/shared/ directories

**Priority:** P0
**Type:** Functional

### Objective

Verify that the five designated presentational components (EventMarkerPopup, InfoTooltip, SkeletonLoader, FirstTradeGuide, Glossary) exist in co-located directories under `src/shared/`.

### Preconditions

- mcq-35g.2 work is complete
- Project builds successfully

### Steps

1. Check that `src/shared/EventMarkerPopup/EventMarkerPopup.jsx` (or `.tsx`) exists
   **Expected:** File exists with the component's source code

2. Check that `src/shared/InfoTooltip/InfoTooltip.jsx` (or `.tsx`) exists
   **Expected:** File exists with the component's source code

3. Check that `src/shared/SkeletonLoader/SkeletonLoader.jsx` (or `.tsx`) exists
   **Expected:** File exists with the component's source code

4. Check that `src/shared/FirstTradeGuide/FirstTradeGuide.jsx` (or `.tsx`) exists
   **Expected:** File exists with the component's source code

5. Check that `src/shared/Glossary/Glossary.jsx` (or `.tsx`) exists
   **Expected:** File exists with the component's source code

6. Check that each directory contains its co-located CSS file (e.g., `EventMarkerPopup.css` or `.module.css`)
   **Expected:** Each component directory contains both the component file and its CSS file

### Test Data

- File listing of `src/shared/` and its subdirectories

### Edge Cases

- Original files in `src/components/` should no longer exist (no duplicates)
- No other components should have been moved to `shared/` beyond the five specified

---

## TC-002: Shared components have zero context/service/data imports

**Priority:** P0
**Type:** Functional

### Objective

Verify that no shared component imports from `context/`, `services/`, or `data/` — they must be purely presentational.

### Preconditions

- Shared components relocated to `src/shared/`

### Steps

1. Search all files under `src/shared/` for import statements containing `context/`, `services/`, or `data/`
   **Expected:** Zero matches found — no shared component imports from these directories

2. Run `vite build`
   **Expected:** Build succeeds with no unresolved imports

### Test Data

- `rg "from.*/(context|services|data)/" src/shared/`

### Edge Cases

- Shared components may import from other shared components, `utils/`, or `types/` — this is allowed
- Dynamic imports should also be checked, not just static `import` statements

---

## TC-003: Barrel file src/shared/index.js re-exports all shared components

**Priority:** P1
**Type:** Functional

### Objective

Verify that `src/shared/index.js` (or `index.ts`) exists and re-exports all five shared components plus their named exports.

### Preconditions

- All shared components moved to `src/shared/`

### Steps

1. Open `src/shared/index.js` (or `index.ts`)
   **Expected:** File exists and contains re-exports for EventMarkerPopup, InfoTooltip, SkeletonLoader, FirstTradeGuide, Glossary

2. Import each component from `shared` in a test file (e.g., `import { InfoTooltip } from '../shared'`)
   **Expected:** All imports resolve correctly without errors

3. Verify named exports are preserved (e.g., `getEventConfig` from EventMarkerPopup, skeleton variants from SkeletonLoader)
   **Expected:** Named exports accessible via the barrel file

### Test Data

- N/A

### Edge Cases

- Verify that components previously exported from `src/components/index.js` are no longer duplicated there

---

## TC-004: All import paths updated after shared component move

**Priority:** P0
**Type:** Integration

### Objective

Verify that every file in the codebase that previously imported a shared component from `components/` now imports from `shared/`.

### Preconditions

- Shared components relocated to `src/shared/`
- Barrel file updated

### Steps

1. Search entire `src/` for old import paths referencing the five moved components from `components/`
   **Expected:** Zero matches — no stale import paths remain

2. Run `vite build`
   **Expected:** Build succeeds with zero broken import warnings or errors

3. Run `vitest run`
   **Expected:** All existing unit tests pass

### Test Data

- Search patterns: `from.*components/(EventMarkerPopup|InfoTooltip|SkeletonLoader|FirstTradeGuide|Glossary)`

### Edge Cases

- Check test files (`__tests__/`) as well — they also need updated imports
- Check `components/index.js` barrel — removed components should no longer appear there

---

## TC-005: Feature components restructured into co-located directories

**Priority:** P0
**Type:** Functional

### Objective

Verify that each feature component in `src/components/` is in its own directory with co-located CSS.

### Preconditions

- mcq-35g.3 work is complete

### Steps

1. Verify directory structure for each feature component (Layout, ScenarioToggle, PlayerCard, DailyMission, TimelineDebugger, Onboarding, AddEventModal, PlayoffAnnouncementModal, MiniLeaderboard, Toast, LiveTicker, ErrorBoundary)
   **Expected:** Each exists as `components/<Name>/<Name>.jsx` with co-located `<Name>.css`

2. Verify no flat `.jsx`/`.css` files remain directly in `src/components/` (except `index.js`)
   **Expected:** Only `index.js` (barrel) at the `components/` root level

### Test Data

- Directory listing of `src/components/`

### Edge Cases

- Components with multiple exports (e.g., SkeletonLoader variants) should all be in the same directory
- Test files in `__tests__/` may remain at their current location or move — verify consistency

---

## TC-006: Toast split into UI component and provider

**Priority:** P1
**Type:** Functional

### Objective

Verify that Toast is split into a presentational UI component and a separate context provider.

### Preconditions

- Feature component restructuring complete

### Steps

1. Check that `components/Toast/Toast.jsx` exists and contains only the UI rendering logic
   **Expected:** File contains the Toast display component without `createContext` or provider logic

2. Check that `components/Toast/ToastProvider.jsx` exists and contains the context provider
   **Expected:** File exports `ToastProvider` and `useToast` hook

3. Import `ToastProvider` and `useToast` from the barrel and verify they work
   **Expected:** Provider wraps children, `useToast` returns toast functions

4. Run the app and trigger a toast notification (e.g., execute a trade)
   **Expected:** Toast appears and disappears correctly

### Test Data

- N/A

### Edge Cases

- Verify `components/index.js` barrel re-exports both `ToastProvider` and `useToast` from the new path
- Verify App.jsx still wraps with `<ToastProvider>` correctly

---

## TC-007: Onboarding split into UI component and provider

**Priority:** P1
**Type:** Functional

### Objective

Verify that Onboarding is split into a presentational UI component and a separate context provider.

### Preconditions

- Feature component restructuring complete

### Steps

1. Check that `components/Onboarding/Onboarding.jsx` exists and contains only the UI/tooltip rendering
   **Expected:** File contains the Onboarding display component

2. Check that `components/Onboarding/OnboardingProvider.jsx` exists and contains the context provider
   **Expected:** File exports `OnboardingProvider`, `useOnboarding`, `resetOnboarding`, and `Tooltip`

3. Import all named exports from the barrel and verify they resolve
   **Expected:** All Onboarding-related exports accessible

4. Run the app as a new user (clear localStorage)
   **Expected:** Onboarding flow starts correctly

### Test Data

- Clear `localStorage` to trigger first-time onboarding

### Edge Cases

- `resetOnboarding` function should still work to re-trigger the flow
- Tooltip component should still position correctly relative to target elements

---

## TC-008: Updated components/index.js barrel after restructuring

**Priority:** P1
**Type:** Integration

### Objective

Verify that the barrel file at `components/index.js` correctly re-exports all feature components from their new co-located directory paths.

### Preconditions

- Feature components restructured into co-located directories

### Steps

1. Open `components/index.js` and verify all exports point to new subdirectory paths
   **Expected:** Imports reference `./Toast/Toast`, `./Onboarding/Onboarding`, etc.

2. Verify that previously shared components (EventMarkerPopup, etc.) are NOT re-exported from this barrel
   **Expected:** Only feature components appear in `components/index.js`

3. Run `vite build`
   **Expected:** Build succeeds with no broken imports

### Test Data

- N/A

### Edge Cases

- Circular dependency check: barrel re-exports should not create circular imports

---

## TC-009: Pages restructured into co-located directories

**Priority:** P0
**Type:** Functional

### Objective

Verify that each page is in its own directory with co-located CSS under `src/pages/`.

### Preconditions

- mcq-35g.4 work is complete

### Steps

1. Verify directory structure for each page: Timeline, Market, Portfolio, Watchlist, Leaderboard, Mission, PlayerDetail, ScenarioInspector
   **Expected:** Each exists as `pages/<Name>/<Name>.jsx` with co-located `<Name>.css`

2. Verify no flat `.jsx`/`.css` files remain directly in `src/pages/`
   **Expected:** Only subdirectories exist at the `pages/` root level

3. Verify App.jsx import paths updated to reference new page locations
   **Expected:** Imports use `./pages/Timeline/Timeline` pattern (or barrel if applicable)

### Test Data

- Directory listing of `src/pages/`

### Edge Cases

- Page test files in `pages/__tests__/` should also be relocated or updated
- Dynamic import paths (if used for code splitting) must also reference new locations

---

## TC-010: All route imports updated after page restructuring

**Priority:** P0
**Type:** Integration

### Objective

Verify that App.jsx route configuration works correctly with restructured page paths.

### Preconditions

- Pages restructured into co-located directories

### Steps

1. Run `vite build`
   **Expected:** Build succeeds with no broken imports

2. Navigate to each route in the browser: `/`, `/market`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`, `/player/1`, `/inspector`
   **Expected:** Each page renders correctly without errors

3. Run `vitest run`
   **Expected:** All existing tests pass

### Test Data

- Valid player ID for `/player/:playerId` route (e.g., `1`)

### Edge Cases

- Browser back/forward navigation should work correctly after restructuring
- Deep linking directly to any route should load the correct page

---

## TC-011: ErrorBoundary component exists and catches render errors

**Priority:** P0
**Type:** Functional

### Objective

Verify the ErrorBoundary component catches errors in its child component tree and renders a fallback UI.

### Preconditions

- ErrorBoundary component exists (mcq-35g.1, already closed)

### Steps

1. Wrap a component that throws a render error with `<ErrorBoundary>`
   **Expected:** Error is caught; fallback UI is displayed instead of a white screen

2. Verify the fallback UI displays: warning icon, "Something went wrong" title, descriptive message, and "Try Again" button
   **Expected:** All four elements visible in the fallback

3. Click the "Try Again" button
   **Expected:** ErrorBoundary resets and attempts to re-render children

### Test Data

- A test component that throws: `const Broken = () => { throw new Error('test'); }`

### Edge Cases

- Errors thrown in event handlers are NOT caught by ErrorBoundary (React limitation) — verify this is documented
- Nested ErrorBoundary components: inner boundary should catch before outer

---

## TC-012: ErrorBoundary accepts custom fallback prop

**Priority:** P1
**Type:** Functional

### Objective

Verify the ErrorBoundary renders a custom fallback when the `fallback` prop is provided.

### Preconditions

- ErrorBoundary component exists

### Steps

1. Render `<ErrorBoundary fallback={<div>Custom error</div>}>` around a throwing component
   **Expected:** Custom fallback `<div>Custom error</div>` is rendered instead of the default UI

2. Render `<ErrorBoundary fallback={null}>` around a throwing component
   **Expected:** Nothing is rendered (null fallback)

3. Render `<ErrorBoundary>` (no fallback prop) around a throwing component
   **Expected:** Default fallback UI is rendered

### Test Data

- Various fallback values: JSX element, `null`, `undefined`, string

### Edge Cases

- `fallback={undefined}` should trigger the default fallback
- `fallback={null}` should render nothing (explicit null)

---

## TC-013: ErrorBoundary logs errors in development mode

**Priority:** P2
**Type:** Functional

### Objective

Verify that ErrorBoundary logs errors to the console in development mode.

### Preconditions

- ErrorBoundary component exists
- Running in `DEV` mode (Vite dev server)

### Steps

1. Trigger an error inside an ErrorBoundary-wrapped component in dev mode
   **Expected:** Console shows `[ErrorBoundary]` prefix followed by error and component stack

2. Verify production build does NOT log errors to console
   **Expected:** No `[ErrorBoundary]` console output in production

### Test Data

- Component that throws a specific error message (e.g., `throw new Error('TC-013 test error')`)

### Edge Cases

- Multiple consecutive errors should each be logged separately
- Error info (component stack) should be included in the log

---

## TC-014: Route-based code splitting with React.lazy

**Priority:** P0
**Type:** Functional

### Objective

Verify all page imports in App.tsx use `React.lazy()` for dynamic imports.

### Preconditions

- mcq-35g.5 work is complete
- Pages restructured (mcq-35g.4 prerequisite met)

### Steps

1. Open `App.tsx` and verify all page imports use `React.lazy(() => import(...))`
   **Expected:** Timeline, Market, Portfolio, Watchlist, Leaderboard, Mission, PlayerDetail, ScenarioInspector all use lazy imports

2. Verify no static `import Page from './pages/...'` statements remain for page components
   **Expected:** Only non-page imports (Layout, providers, etc.) use static imports

### Test Data

- Contents of `App.tsx`

### Edge Cases

- Non-page components (Layout, Onboarding, PlayoffAnnouncementModal) should remain statically imported — they are needed at app startup

---

## TC-015: Suspense boundaries with SkeletonLoader fallback

**Priority:** P0
**Type:** Functional

### Objective

Verify each lazy-loaded route is wrapped in a `<Suspense>` boundary with a `SkeletonLoader` fallback.

### Preconditions

- Route-based code splitting implemented

### Steps

1. Open `App.tsx` and verify each `<Route element={...}>` wraps its page element with `<Suspense fallback={<SkeletonLoader />}>`
   **Expected:** Every lazy-loaded page route has a Suspense wrapper with SkeletonLoader

2. Throttle network to Slow 3G in DevTools, then navigate to `/market`
   **Expected:** SkeletonLoader fallback displays while the Market chunk loads

3. Navigate to all routes sequentially with throttled network
   **Expected:** Each page shows skeleton loader before content appears

### Test Data

- Chrome DevTools network throttling: Slow 3G profile

### Edge Cases

- Revisiting an already-loaded page should NOT show the skeleton again (chunk is cached)
- The `/inspector` route (outside main layout) should also have its own Suspense boundary

---

## TC-016: ErrorBoundary wraps each lazy-loaded route

**Priority:** P0
**Type:** Integration

### Objective

Verify each route is wrapped with an `<ErrorBoundary>` so a failing page doesn't crash the entire app.

### Preconditions

- Route-based code splitting and ErrorBoundary both implemented

### Steps

1. Open `App.tsx` and verify each route element is wrapped: `<ErrorBoundary><Suspense ...><Page /></Suspense></ErrorBoundary>`
   **Expected:** Every route has both ErrorBoundary and Suspense wrappers

2. Simulate a page component that throws during render
   **Expected:** ErrorBoundary fallback renders; other routes remain navigable

3. Click "Try Again" on the error fallback
   **Expected:** Page attempts to re-render; if the error is resolved, the page loads

### Test Data

- Temporarily break a page component to simulate render error

### Edge Cases

- Navigation away from a failed route and back should re-attempt loading
- If the chunk itself fails to load (network error), ErrorBoundary should catch the lazy-load rejection

---

## TC-017: Vite build produces separate chunks per page

**Priority:** P0
**Type:** Functional

### Objective

Verify that `vite build` generates individual JavaScript chunks for each lazy-loaded page.

### Preconditions

- Route-based code splitting implemented

### Steps

1. Run `vite build` and inspect the `dist/assets/` output
   **Expected:** Separate `.js` chunk files for each page (e.g., `Timeline-[hash].js`, `Market-[hash].js`, etc.)

2. Count the page chunks vs. the main bundle
   **Expected:** At least 8 separate page chunks (one per page)

3. Verify the main entry bundle does NOT contain page component code
   **Expected:** Main bundle contains only the app shell (providers, router, layout)

### Test Data

- Output of `vite build` with file sizes

### Edge Cases

- Vendor chunks (from `vendorChunks` config) should remain separate
- Shared dependencies between pages should be extracted into common chunks by Vite

---

## TC-018: Initial bundle size reduced after code splitting

**Priority:** P1
**Type:** Regression

### Objective

Verify that the initial JavaScript bundle loaded on first page visit is smaller than before code splitting.

### Preconditions

- Route-based code splitting implemented
- Baseline bundle size recorded before the change

### Steps

1. Run `vite build` and record total size of entry chunk(s)
   **Expected:** Entry chunk is smaller than the pre-splitting monolithic bundle

2. Open the app in a browser with DevTools Network tab, navigate to `/`
   **Expected:** Only the main bundle + Timeline chunk are loaded (not all pages)

3. Navigate to `/market`
   **Expected:** A new chunk is fetched on demand for the Market page

### Test Data

- Before/after `vite build` output comparison

### Edge Cases

- CSS chunks should also be split if pages have co-located styles
- Preloading hints may cause some chunks to load early — verify this doesn't negate the benefit

---

## TC-019: Pages load correctly on navigation (no blank flash)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that navigating between pages shows either the page content or a skeleton loader — never a blank white screen.

### Preconditions

- Code splitting with Suspense fallbacks implemented

### Steps

1. Load the app at `/`
   **Expected:** Timeline page renders (or skeleton then content)

2. Click each navigation link: Market, Portfolio, Watchlist, Mission, Leaderboard
   **Expected:** Each page loads with either instant render (if cached) or skeleton → content transition

3. Use browser URL bar to directly navigate to `/player/1`
   **Expected:** Page loads with skeleton fallback, then player detail renders

### Test Data

- Valid player ID for direct navigation

### Edge Cases

- Rapid navigation between pages (clicking multiple nav links quickly) should not cause stale renders
- Browser refresh on a lazy-loaded route should load correctly

---

## TC-020: CSS Modules migration — every component uses .module.css

**Priority:** P0
**Type:** Functional

### Objective

Verify that every component and page uses a co-located `.module.css` file instead of global CSS.

### Preconditions

- mcq-35g.7 work is complete

### Steps

1. Search for all `.css` files under `src/components/` and `src/pages/` (and `src/shared/` if applicable)
   **Expected:** All CSS files are named `<Name>.module.css`

2. Search for any non-module `.css` imports in component/page files
   **Expected:** Zero matches — all imports use `import styles from './<Name>.module.css'`

3. Verify `src/index.css` still exists
   **Expected:** `index.css` contains only global reset, CSS custom properties, and font imports

### Test Data

- File listing and import pattern search

### Edge Cases

- `App.css` should also be migrated to `App.module.css` or removed if styles are distributed to components
- No `*.css` files (non-module) should remain in component/page directories

---

## TC-021: CSS Modules — className attributes use styles.foo pattern

**Priority:** P0
**Type:** Functional

### Objective

Verify that all `className` attributes reference CSS Module scoped names via the `styles` object.

### Preconditions

- CSS Modules migration complete

### Steps

1. Search all component/page files for `className=` usage
   **Expected:** All className values use `styles.foo` or template literals with `styles.foo` — no raw string class names like `className="my-class"`

2. Run `vite build`
   **Expected:** Build succeeds — all CSS module references resolve

3. Inspect rendered DOM in browser DevTools
   **Expected:** Class names are scoped/hashed (e.g., `_playerCard_1a2b3` instead of `player-card`)

### Test Data

- Search pattern: `className="` (should return zero matches in component files)

### Edge Cases

- Conditional classNames: `className={condition ? styles.active : styles.inactive}` should work
- Multiple classes: `className={`${styles.card} ${styles.highlighted}`}` pattern should be used
- Third-party component classNames may still use strings — these are acceptable exceptions

---

## TC-022: No visual regressions after CSS Modules migration

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the app looks identical before and after the CSS Modules migration.

### Preconditions

- CSS Modules migration complete
- Reference screenshots or visual baseline available

### Steps

1. Load each page and visually compare to pre-migration appearance: Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard, PlayerDetail, ScenarioInspector
   **Expected:** Each page looks identical to pre-migration version

2. Check component-specific styling: PlayerCard, Toast notifications, Onboarding tooltips, SkeletonLoader, ErrorBoundary fallback
   **Expected:** All components render with correct styling

3. Check responsive behavior at mobile (375px), tablet (768px), and desktop (1280px) widths
   **Expected:** Responsive breakpoints work identically to before

### Test Data

- Pre-migration screenshots for comparison (or Cypress visual regression tests)

### Edge Cases

- Dark mode or theme variations (if any) should also be checked
- Animations and transitions (framer-motion) should not be affected
- Hover/focus/active states should retain correct styling

---

## TC-023: index.css contains only global reset and custom properties

**Priority:** P1
**Type:** Functional

### Objective

Verify that `src/index.css` contains only global styles (reset, CSS custom properties, font imports) and no component-specific styles.

### Preconditions

- CSS Modules migration complete

### Steps

1. Open `src/index.css` and review contents
   **Expected:** Contains only: CSS reset/normalize, CSS custom properties (e.g., `--color-primary`), font `@import` or `@font-face` declarations, and base element styles (`body`, `html`, `*`)

2. Search for any class names in `index.css` that match component-specific classes
   **Expected:** No component-specific class names (e.g., `.player-card`, `.toast`, `.error-boundary`)

### Test Data

- Contents of `src/index.css`

### Edge Cases

- Utility classes (if any) may remain in `index.css` — verify they are intentional global utilities
- `App.css` should be removed or merged into `index.css` if it contained only global styles

---

## TC-024: TypeScript conversion — zero .jsx files remain

**Priority:** P0
**Type:** Functional

### Objective

Verify that all `.jsx` files in `src/` have been converted to `.tsx`.

### Preconditions

- mcq-35g.8 work is complete

### Steps

1. Search `src/` for any remaining `.jsx` files
   **Expected:** Zero `.jsx` files found anywhere in `src/`

2. Verify all component, page, context, and app files use `.tsx` extension
   **Expected:** `App.tsx`, `main.tsx`, all components, all pages, all contexts are `.tsx`

### Test Data

- `find src/ -name "*.jsx"` should return empty

### Edge Cases

- Test files (`*.test.jsx`) should also be converted to `.test.tsx`
- `src/build/` directory files should also be converted if they contain JSX
- `jsconfig.json` may need to be removed or replaced by `tsconfig.json` settings

---

## TC-025: Every component has TypeScript props interface

**Priority:** P0
**Type:** Functional

### Objective

Verify that every component defines a TypeScript `Props` interface (or type) for its props — no implicit `any`.

### Preconditions

- TypeScript conversion complete

### Steps

1. For each component file, check that it defines a props type (e.g., `interface PlayerCardProps { ... }`)
   **Expected:** Every component that accepts props has an explicit interface or type

2. Search for `(props)` or `(props:` patterns and verify typed
   **Expected:** All props parameters are typed (e.g., `(props: PlayerCardProps)` or destructured with type)

3. Search for components using `any` in their props
   **Expected:** Zero occurrences of `any` in component props types

### Test Data

- Listing of all `.tsx` component files

### Edge Cases

- Components with no props should use `() =>` or `React.FC` with no generic — no `any`
- Children prop should be typed as `React.ReactNode`
- Event handler props should use proper React event types (e.g., `React.MouseEvent`)

---

## TC-026: No `any` types in component files

**Priority:** P1
**Type:** Functional

### Objective

Verify that converted component files contain no `any` type annotations — all types are explicit.

### Preconditions

- TypeScript conversion complete

### Steps

1. Search all `.tsx` files for `: any`, `as any`, `<any>` patterns
   **Expected:** Zero matches in component/page files

2. Run `tsc --noEmit --strict` (or equivalent via `vite build`)
   **Expected:** No type errors reported

### Test Data

- Search pattern: `\bany\b` in `.tsx` files

### Edge Cases

- Third-party library types may use `any` internally — this is outside scope
- `unknown` is an acceptable alternative to `any` for truly dynamic data
- Type assertions (`as SomeType`) are acceptable if justified, but `as any` is not

---

## TC-027: App.tsx and main.tsx converted as final step

**Priority:** P0
**Type:** Functional

### Objective

Verify that `App.tsx` and `main.tsx` are valid TypeScript with no type errors.

### Preconditions

- All components and pages already converted to TypeScript

### Steps

1. Open `src/App.tsx` and verify it uses TypeScript syntax with typed imports
   **Expected:** File is valid `.tsx` with all imports resolving to `.tsx` files

2. Open `src/main.tsx` and verify it uses TypeScript
   **Expected:** File is valid `.tsx`, creates root and renders `<App />`

3. Run `vite build`
   **Expected:** Build succeeds with no TypeScript errors

### Test Data

- N/A

### Edge Cases

- `index.html` must reference `main.tsx` instead of `main.jsx` in its script tag
- Vite config may remain as `.js` — it runs in Node, not the browser bundle

---

## TC-028: Build succeeds with strict: true and no type errors

**Priority:** P0
**Type:** Integration

### Objective

Verify the entire project builds successfully with TypeScript strict mode enabled.

### Preconditions

- Full TypeScript conversion complete
- `tsconfig.json` has `strict: true`

### Steps

1. Verify `tsconfig.json` contains `"strict": true`
   **Expected:** Strict mode is enabled

2. Run `npx tsc --noEmit`
   **Expected:** Zero type errors

3. Run `vite build`
   **Expected:** Build succeeds, produces valid output in `dist/`

### Test Data

- N/A

### Edge Cases

- `strictNullChecks` (part of strict) may surface new issues — all should be fixed
- `noImplicitAny` (part of strict) ensures no untyped parameters remain

---

## TC-029: Leaderboard uses real league data from context

**Priority:** P0
**Type:** Functional

### Objective

Verify the Leaderboard page uses `getLeaderboardRankings()` from context instead of hardcoded fake data.

### Preconditions

- mcq-35g.6 work is complete
- SocialContext provides `getLeaderboardRankings()`

### Steps

1. Open the Leaderboard page source and verify it calls `getLeaderboardRankings()` from context
   **Expected:** No hardcoded/fake trader data arrays in the component

2. Navigate to `/leaderboard` in the browser
   **Expected:** Rankings display with real league member names and portfolio values from `leagueMembers.json`

3. Verify the current user's row is correctly positioned in the ranking
   **Expected:** User appears at the correct rank based on their portfolio value

4. Verify top 3 positions display medal icons
   **Expected:** Gold, silver, bronze medal icons for ranks 1, 2, 3

### Test Data

- `src/data/leagueMembers.json` for expected league member data

### Edge Cases

- Empty league data: if no league members exist, should show an empty state or message
- User is not in the league: should handle gracefully
- Tied portfolio values: verify consistent ordering

---

## TC-030: Cypress E2E tests pass after all changes

**Priority:** P0
**Type:** Regression

### Objective

Verify the full Cypress E2E suite passes after all restructuring, code splitting, CSS Modules migration, and TypeScript conversion.

### Preconditions

- All mcq-35g child tasks complete
- App builds successfully

### Steps

1. Run `npm run cy:run` (builds app and runs full Cypress suite)
   **Expected:** All E2E tests pass with zero failures

2. Review test output for any deprecation warnings related to import paths
   **Expected:** No warnings about changed paths or missing modules

### Test Data

- Full Cypress test suite

### Edge Cases

- Tests that rely on specific CSS class names (global) may fail after CSS Modules migration — these need updating
- Tests that import directly from component files need updated paths
- Lazy-loaded pages may need `cy.wait()` or intercepts for chunk loading

---

## TC-031: Vitest unit tests pass after all changes

**Priority:** P0
**Type:** Regression

### Objective

Verify all existing Vitest unit tests pass after the full restructuring.

### Preconditions

- All mcq-35g child tasks complete

### Steps

1. Run `vitest run`
   **Expected:** All unit tests pass (ErrorBoundary.test, PlayerCard.test, Accessibility.test, context tests, service tests, etc.)

2. Verify test files have correct import paths to restructured modules
   **Expected:** No import resolution failures

### Test Data

- Existing test suite

### Edge Cases

- Tests that mock CSS imports may need adjustment for CSS Modules
- Tests that import from barrel files need updated barrel paths
- Snapshot tests (if any) will need updated snapshots for scoped class names

---

## TC-032: No circular dependencies after restructuring

**Priority:** P1
**Type:** Integration

### Objective

Verify that the restructured directory layout and barrel files do not introduce circular import dependencies.

### Preconditions

- All restructuring tasks complete

### Steps

1. Run `vite build` and check for circular dependency warnings
   **Expected:** No circular dependency warnings in build output

2. Verify barrel files (`components/index.js`, `shared/index.js`) do not re-export modules that import from the barrel
   **Expected:** No component imports from its own barrel file

3. Verify the app loads without hanging or stack overflow errors
   **Expected:** App starts normally, all pages navigate correctly

### Test Data

- `vite build` output

### Edge Cases

- Context providers importing components that import from the same context could create cycles
- Shared components should never import from `components/` and vice versa
