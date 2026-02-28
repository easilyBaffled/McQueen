# Test Plan: mcq-35g.3 -- Restructure feature components into co-located directories

## Summary

- **Bead:** `mcq-35g.3`
- **Feature:** Migrate flat component files into co-located directories, split provider logic from UI in Toast and Onboarding, update barrel exports and all import paths
- **Total Test Cases:** 12
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Each feature component lives in its own directory

**Priority:** P0
**Type:** Functional

### Objective

Verify that every feature component resides in a co-located directory (`components/<Name>/`) containing at minimum the component file and its CSS module.

### Preconditions

- Repository is checked out at the branch containing the restructuring changes

### Steps

1. List the contents of `src/components/`.
   **Expected:** Only directories (one per component) and the barrel `index.js` exist at the top level. No loose `.jsx`, `.tsx`, or `.css` files remain directly under `src/components/`.

2. For each component directory (`AddEventModal`, `DailyMission`, `ErrorBoundary`, `Layout`, `LiveTicker`, `MiniLeaderboard`, `Onboarding`, `PlayerCard`, `PlayoffAnnouncementModal`, `ScenarioToggle`, `TimelineDebugger`, `Toast`), verify the directory contains `<Name>.tsx` (or `.jsx`) and `<Name>.module.css`.
   **Expected:** Every directory contains both its component file and its CSS file, named consistently with the directory name.

### Test Data

- Full list of expected component directories: AddEventModal, DailyMission, ErrorBoundary, Layout, LiveTicker, MiniLeaderboard, Onboarding, PlayerCard, PlayoffAnnouncementModal, ScenarioToggle, TimelineDebugger, Toast

### Edge Cases

- Verify no component files remain at the old flat location (e.g., `src/components/Toast.jsx` should not exist)
- Confirm `__tests__/` directory is allowed to coexist at the `components/` level without violating the structure

---

## TC-002: Toast UI component separated into its own file

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Toast directory contains a dedicated UI component file (`Toast.tsx` or `Toast.jsx`) that exports the presentational toast rendering logic, distinct from the provider.

### Preconditions

- The `src/components/Toast/` directory exists

### Steps

1. Open `src/components/Toast/Toast.tsx` (or `.jsx`).
   **Expected:** File exists and contains the Toast UI rendering logic (the animated toast notifications markup, dismiss button, icon rendering).

2. Verify the Toast UI file does NOT define `createContext`, `ToastContext`, or the state management for the toast queue.
   **Expected:** Context creation and state management are absent from the UI file; they live in the provider file.

### Test Data

- None

### Edge Cases

- Verify the UI file can be imported independently without side effects

---

## TC-003: ToastProvider separated into its own file

**Priority:** P0
**Type:** Functional

### Objective

Verify that `Toast/ToastProvider.tsx` (or `.jsx`) exists and contains the context, provider component, and `useToast` hook.

### Preconditions

- The `src/components/Toast/` directory exists

### Steps

1. Open `src/components/Toast/ToastProvider.tsx` (or `.jsx`).
   **Expected:** File exists and exports `ToastProvider` (the context provider component) and `useToast` (the consumer hook).

2. Verify `ToastProvider` creates a React context, manages toast state (add/remove), and renders its `children` wrapped in the context provider.
   **Expected:** The provider manages `toasts` state via `useState`, exposes `addToast` and `removeToast` via context, and wraps children in `<ToastContext.Provider>`.

3. Verify `useToast` throws a descriptive error when used outside of `ToastProvider`.
   **Expected:** Calling `useToast()` without a parent `ToastProvider` throws an error containing "useToast must be used within a ToastProvider" (or similar).

### Test Data

- None

### Edge Cases

- Verify ToastProvider renders its children even when no toasts are active
- Verify the file does not contain Toast UI markup (toast notification rendering belongs in the UI file)

---

## TC-004: Onboarding UI component separated into its own file

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Onboarding directory contains a dedicated UI component file with the onboarding modal/wizard rendering, separate from the provider.

### Preconditions

- The `src/components/Onboarding/` directory exists

### Steps

1. Open `src/components/Onboarding/Onboarding.tsx` (or `.jsx`).
   **Expected:** File exists and contains the Onboarding UI (step wizard modal, navigation buttons, step indicators, Tooltip component, resetOnboarding utility).

2. Verify the Onboarding UI file does NOT define `OnboardingContext`, `OnboardingProvider`, or the `useOnboarding` hook.
   **Expected:** Provider and context logic are absent; the file focuses on rendering.

### Test Data

- None

### Edge Cases

- Verify the Tooltip and resetOnboarding exports still exist and are accessible from this file

---

## TC-005: OnboardingProvider separated into its own file

**Priority:** P0
**Type:** Functional

### Objective

Verify that `Onboarding/OnboardingProvider.tsx` (or `.jsx`) exists and contains the onboarding context, provider component, and `useOnboarding` hook.

### Preconditions

- The `src/components/Onboarding/` directory exists

### Steps

1. Open `src/components/Onboarding/OnboardingProvider.tsx` (or `.jsx`).
   **Expected:** File exists and exports `OnboardingProvider` and `useOnboarding`.

2. Verify `OnboardingProvider` manages onboarding state: `hasCompletedOnboarding`, `showFirstTradeGuide`, `isNewUser`, `dismissFirstTradeGuide`, and `markOnboardingComplete`.
   **Expected:** All state fields and methods are present in the context value.

3. Verify `OnboardingProvider` reads from and writes to `localStorage` keys (`mcqueen-onboarded`, `mcqueen-first-trade-seen`, `mcqueen-onboarding-just-completed`).
   **Expected:** localStorage interactions are preserved identically to the pre-refactor behavior.

### Test Data

- localStorage keys: `mcqueen-onboarded`, `mcqueen-first-trade-seen`, `mcqueen-onboarding-just-completed`

### Edge Cases

- Verify the provider file does not contain any UI markup or rendering beyond wrapping children in the context provider
- Verify `useOnboarding` returns sensible defaults when localStorage is empty (new user scenario)

---

## TC-006: Barrel file (`components/index.js`) re-exports all components correctly

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/components/index.js` is updated to re-export every component from its new co-located directory path, including the split provider exports.

### Preconditions

- All component directories exist with their restructured files

### Steps

1. Open `src/components/index.js`.
   **Expected:** The file contains named or default re-exports for all components: Layout, ScenarioToggle, PlayerCard, DailyMission, TimelineDebugger, Onboarding, Tooltip, resetOnboarding, OnboardingProvider, useOnboarding, AddEventModal, PlayoffAnnouncementModal, MiniLeaderboard, ToastProvider, useToast, LiveTicker, ErrorBoundary.

2. Verify each export path points to the new directory structure (e.g., `'./Toast/ToastProvider'` for ToastProvider, `'./Onboarding/OnboardingProvider'` for OnboardingProvider).
   **Expected:** No export path references a flat file (e.g., `'./Toast.jsx'`). All paths use the `<Name>/<Name>` pattern or the split provider paths.

3. Import from `'../../components'` (barrel) in a consumer file and verify all named exports resolve.
   **Expected:** All exported symbols are accessible via the barrel import without errors.

### Test Data

- Full list of expected exports: Layout, ScenarioToggle, PlayerCard, DailyMission, TimelineDebugger, Onboarding, Tooltip, resetOnboarding, OnboardingProvider, useOnboarding, AddEventModal, PlayoffAnnouncementModal, MiniLeaderboard, ToastProvider, useToast, LiveTicker, ErrorBoundary

### Edge Cases

- Verify no stale exports reference old flat-file paths that no longer exist
- Verify that importing a non-existent export from the barrel produces a clear module resolution error (not a silent undefined)

---

## TC-007: All import paths updated in App.tsx

**Priority:** P0
**Type:** Integration

### Objective

Verify that the application entry point (`App.tsx`) imports components from their new co-located directory paths or from the barrel, and that no imports reference old flat-file paths.

### Preconditions

- `src/App.tsx` exists

### Steps

1. Open `src/App.tsx` and inspect all import statements referencing components.
   **Expected:** Imports use paths like `'./components/Toast/ToastProvider'`, `'./components/Onboarding/OnboardingProvider'`, `'./components/Layout/Layout'`, etc. No import references a flat file like `'./components/Toast'` (without subdirectory).

2. Verify `ToastProvider` is imported from the provider file (not the UI file, if split).
   **Expected:** The import resolves to the file containing the context provider logic.

3. Verify `OnboardingProvider` is imported from the provider file (not the UI file, if split).
   **Expected:** The import resolves to the file containing the onboarding context provider.

### Test Data

- None

### Edge Cases

- Verify no unused/dead imports remain from the old structure

---

## TC-008: All import paths updated in page components

**Priority:** P0
**Type:** Integration

### Objective

Verify that every page-level component that consumes shared components has its import paths updated to the new directory structure.

### Preconditions

- All page components exist under `src/pages/`

### Steps

1. Search all files under `src/pages/` for import statements referencing `components`.
   **Expected:** Every import uses the new path pattern (e.g., `'../../components/PlayerCard/PlayerCard'`, `'../../components/Toast/Toast'`, or the barrel `'../../components'`). No import references a flat file that no longer exists.

2. Verify `src/pages/Watchlist/Watchlist.tsx` imports `useToast` and `PlayerCard` from valid paths.
   **Expected:** Imports resolve without error. `useToast` comes from either the barrel or `Toast/Toast` (or `Toast/ToastProvider` if split). `PlayerCard` comes from `PlayerCard/PlayerCard`.

3. Verify `src/pages/Market/Market.tsx` imports `PlayerCard` and `MiniLeaderboard` from valid paths.
   **Expected:** Both resolve to their respective co-located directory files.

4. Verify `src/pages/PlayerDetail/PlayerDetail.tsx` imports `useToast` from a valid path.
   **Expected:** Import resolves correctly, whether via barrel or direct path.

5. Verify `src/pages/ScenarioInspector/ScenarioInspector.tsx` imports `AddEventModal` from a valid path.
   **Expected:** Import resolves to `AddEventModal/AddEventModal`.

6. Verify `src/pages/Mission/Mission.tsx` imports `DailyMission` from a valid path.
   **Expected:** Import resolves to `DailyMission/DailyMission`.

7. Verify `src/pages/Timeline/Timeline.tsx` imports `useToast` from a valid path.
   **Expected:** Import resolves correctly.

### Test Data

- None

### Edge Cases

- Grep the entire `src/` tree for any import path matching a flat component file (e.g., `from '...components/Toast'` without a subdirectory segment) to catch stragglers

---

## TC-009: No stale flat files remain

**Priority:** P1
**Type:** Regression

### Objective

Verify that all old flat-file component sources have been removed and no orphaned files remain in `src/components/`.

### Preconditions

- Restructuring changes are applied

### Steps

1. List all files directly under `src/components/` (non-recursive).
   **Expected:** Only `index.js` (the barrel) exists as a file. All other entries are directories.

2. Verify that no `.jsx`, `.tsx`, `.css`, or `.module.css` files exist directly under `src/components/`.
   **Expected:** Zero files matching these extensions at the top level of `src/components/`.

### Test Data

- None

### Edge Cases

- Check for hidden files or backup files (e.g., `.Toast.jsx.bak`, `Toast.jsx.orig`) that might have been left behind

---

## TC-010: Build succeeds after restructuring

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Vite production build completes without errors after all file moves and import path updates.

### Preconditions

- All dependencies installed (`npm install` or equivalent)
- Node.js and Vite available

### Steps

1. Run `npm run build` (or the project's build command).
   **Expected:** Build completes with exit code 0. No module resolution errors, no missing file errors, no TypeScript/ESLint errors that block the build.

2. Inspect the build output for warnings about missing modules or unresolved imports.
   **Expected:** No warnings related to component imports or file resolution.

### Test Data

- None

### Edge Cases

- Verify the build output bundle size is comparable to pre-refactor (no accidental duplication from bad imports)
- Verify CSS modules are correctly included in the build output

---

## TC-011: Cypress E2E tests pass after restructuring

**Priority:** P0
**Type:** Regression

### Objective

Verify that the existing Cypress E2E test suite passes without failures, confirming that the restructuring did not break any user-facing behavior.

### Preconditions

- Application builds successfully (TC-010 passes)
- Cypress is installed and configured
- Dev server or built app is running

### Steps

1. Run the full Cypress E2E test suite (`npx cypress run` or the project's configured command).
   **Expected:** All existing tests pass. Zero new failures introduced by the restructuring.

2. If any tests reference component file paths directly (e.g., in custom commands or fixtures), verify those paths have been updated.
   **Expected:** No test failures due to stale file path references.

### Test Data

- Existing Cypress test suite and fixtures

### Edge Cases

- If tests import from `src/components` directly (e.g., for unit-like component tests in Cypress), verify those imports are updated
- Verify Cypress component tests (if any) still mount components correctly from the new paths

---

## TC-012: ESLint and TypeScript checks pass

**Priority:** P1
**Type:** Regression

### Objective

Verify that the codebase passes ESLint and TypeScript (if applicable) checks after restructuring, catching any import resolution or unused-import issues.

### Preconditions

- ESLint is configured (`eslint.config.js` exists)
- TypeScript config exists (`tsconfig.json`)

### Steps

1. Run `npx eslint src/` (or the project's lint command).
   **Expected:** No new errors introduced by the restructuring. Specifically, no `import/no-unresolved`, `import/named`, or `no-unused-vars` errors related to the moved components.

2. Run `npx tsc --noEmit` (if the project uses TypeScript checking).
   **Expected:** No type errors related to module resolution or missing exports from the restructured component paths.

### Test Data

- None

### Edge Cases

- Verify that path aliases (if configured in `jsconfig.json` / `tsconfig.json`) still resolve correctly after the restructuring
- Check that CSS module type declarations (`css-modules.d.ts`) still apply to the moved `.module.css` files
