# Test Plan: mcq-35g.2 -- Move shared components to src/shared/

## Summary

- **Bead:** `mcq-35g.2`
- **Feature:** Relocate five context-free presentational components (EventMarkerPopup, InfoTooltip, SkeletonLoader, FirstTradeGuide, Glossary) from components/ to src/shared/ with co-located directory structure and updated import paths
- **Total Test Cases:** 12
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Components exist in src/shared/ with co-located structure

**Priority:** P0
**Type:** Functional

### Objective

Verify that each of the five components has been moved into its own directory under `src/shared/`, with its `.tsx` source and `.module.css` stylesheet co-located in the same directory.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. List the contents of `src/shared/EventMarkerPopup/`
   **Expected:** Contains `EventMarkerPopup.tsx` and `EventMarkerPopup.module.css`

2. List the contents of `src/shared/InfoTooltip/`
   **Expected:** Contains `InfoTooltip.tsx` and `InfoTooltip.module.css`

3. List the contents of `src/shared/SkeletonLoader/`
   **Expected:** Contains `SkeletonLoader.tsx` and `SkeletonLoader.module.css`

4. List the contents of `src/shared/FirstTradeGuide/`
   **Expected:** Contains `FirstTradeGuide.tsx` and `FirstTradeGuide.module.css`

5. List the contents of `src/shared/Glossary/`
   **Expected:** Contains `Glossary.tsx` and `Glossary.module.css`

### Test Data

- None

### Edge Cases

- Verify no stray files (e.g., test snapshots, index files) were left behind or duplicated

---

## TC-002: Old component files removed from src/components/

**Priority:** P0
**Type:** Functional

### Objective

Confirm that the original component directories no longer exist under `src/components/`, ensuring no duplicate source files.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Check for `src/components/EventMarkerPopup/`
   **Expected:** Directory does not exist

2. Check for `src/components/InfoTooltip/`
   **Expected:** Directory does not exist

3. Check for `src/components/SkeletonLoader/`
   **Expected:** Directory does not exist

4. Check for `src/components/FirstTradeGuide/`
   **Expected:** Directory does not exist

5. Check for `src/components/Glossary/`
   **Expected:** Directory does not exist

### Test Data

- None

### Edge Cases

- Verify there are no leftover references to deleted paths in `src/components/index.js` (the barrel file should not re-export the moved components)

---

## TC-003: Barrel export file exists and re-exports all moved components

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/shared/index.js` exists and correctly re-exports every moved component and its named exports, so consumers can import from `../../shared` or `./shared`.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Open `src/shared/index.js`
   **Expected:** File exists

2. Verify EventMarkerPopup exports
   **Expected:** Default export `EventMarkerPopup` and named export `getEventConfig` are both re-exported

3. Verify InfoTooltip exports
   **Expected:** Default export `InfoTooltip` is re-exported

4. Verify SkeletonLoader exports
   **Expected:** Default export `SkeletonLoader` and named exports `PlayerCardSkeleton`, `MarketSkeleton`, `LeaderboardSkeleton`, `MissionSkeleton`, `TextSkeleton` are all re-exported

5. Verify FirstTradeGuide exports
   **Expected:** Default export `FirstTradeGuide` is re-exported

6. Verify Glossary exports
   **Expected:** Default export `Glossary` and named export `useTermTooltip` are re-exported

### Test Data

- None

### Edge Cases

- Verify no circular dependencies introduced by the barrel file
- Verify the barrel file does not accidentally re-export components that remain in `src/components/`

---

## TC-004: components/index.js no longer exports moved components

**Priority:** P0
**Type:** Functional

### Objective

Confirm the `src/components/index.js` barrel file has been cleaned of any references to the five moved components, preventing stale re-exports.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Open `src/components/index.js`
   **Expected:** File exists and contains only re-exports for components that remain in `src/components/` (e.g., Layout, ScenarioToggle, PlayerCard, etc.)

2. Search `src/components/index.js` for "EventMarkerPopup", "InfoTooltip", "SkeletonLoader", "FirstTradeGuide", "Glossary"
   **Expected:** None of these strings appear in the file

### Test Data

- None

### Edge Cases

- Verify no commented-out references to the old components remain

---

## TC-005: All consumer import paths updated — pages

**Priority:** P0
**Type:** Integration

### Objective

Verify that every page-level file that imports one of the moved components now uses a path resolving to `src/shared/` (e.g., `../../shared` or `@/shared`), not `../../components/`.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Open `src/pages/PlayerDetail/PlayerDetail.tsx` and inspect EventMarkerPopup/getEventConfig import
   **Expected:** Import path is `../../shared` (not `../../components` or `../../components/EventMarkerPopup/...`)

2. Open `src/pages/Portfolio/Portfolio.tsx` and inspect InfoTooltip import
   **Expected:** Import path is `../../shared`

3. Open `src/pages/Market/Market.tsx` and inspect MarketSkeleton, LeaderboardSkeleton, and FirstTradeGuide imports
   **Expected:** Import paths are `../../shared`

4. Search the entire `src/pages/` directory for any import referencing `components/EventMarkerPopup`, `components/InfoTooltip`, `components/SkeletonLoader`, `components/FirstTradeGuide`, or `components/Glossary`
   **Expected:** Zero matches found

### Test Data

- None

### Edge Cases

- Verify no dynamic imports or lazy-loaded references use old paths
- Check for any `require()` calls referencing old paths

---

## TC-006: All consumer import paths updated — components and App

**Priority:** P0
**Type:** Integration

### Objective

Verify that internal component files and the root App file that import the moved components now point to `src/shared/`.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Open `src/components/Layout/Layout.tsx` and inspect Glossary import
   **Expected:** Import path is `../../shared`

2. Open `src/components/Onboarding/Onboarding.tsx` and inspect any imports of the moved components
   **Expected:** Any import of moved components references `../../shared`, not a relative `../` path within components

3. Open `src/App.tsx` and inspect MarketSkeleton import
   **Expected:** Import path is `./shared`

4. Search the entire `src/` directory for any import from a path matching `components/(EventMarkerPopup|InfoTooltip|SkeletonLoader|FirstTradeGuide|Glossary)`
   **Expected:** Zero matches found

### Test Data

- None

### Edge Cases

- Verify test files (`__tests__/`) also use updated paths (covered explicitly in TC-007)

---

## TC-007: Test file import paths updated

**Priority:** P0
**Type:** Integration

### Objective

Verify that existing test files that reference the moved components have had their import paths updated to `src/shared/`.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Open `src/components/__tests__/Accessibility.test.tsx` and inspect imports of Glossary, EventMarkerPopup, and FirstTradeGuide
   **Expected:** Import path is `../../shared` (currently line 10: `from '../../shared'`)

2. Open `src/pages/__tests__/PlayerDetail.keyboard.test.tsx` and inspect any imports of moved components
   **Expected:** Any references use paths resolving to `src/shared/`, not `src/components/`

3. Search all `**/*.test.*` and `**/*.spec.*` files for imports from `components/(EventMarkerPopup|InfoTooltip|SkeletonLoader|FirstTradeGuide|Glossary)`
   **Expected:** Zero matches found

### Test Data

- None

### Edge Cases

- Verify mock paths in `vi.mock()` calls do not reference old component locations

---

## TC-008: TypeScript compilation succeeds with no errors

**Priority:** P0
**Type:** Regression

### Objective

Ensure the entire project compiles without TypeScript errors after the file moves and import path updates.

### Preconditions

- All dependencies installed (`npm install` or equivalent)

### Steps

1. Run `npx tsc --noEmit` from the project root
   **Expected:** Exit code 0, no type errors reported

2. Inspect output for any "Cannot find module" errors referencing the old component paths
   **Expected:** None present

### Test Data

- None

### Edge Cases

- Verify `tsconfig.json` path aliases (if any) do not need updating for the new location
- Check that CSS module type declarations still resolve for `.module.css` files in the new location

---

## TC-009: Build completes successfully

**Priority:** P0
**Type:** Regression

### Objective

Verify the production build succeeds end-to-end, confirming bundler resolution of all moved files.

### Preconditions

- All dependencies installed

### Steps

1. Run the project build command (e.g., `npm run build` or `vite build`)
   **Expected:** Build completes with exit code 0 and produces output in the dist/ directory

2. Inspect build output for any warnings about missing modules or unresolved imports
   **Expected:** No warnings referencing EventMarkerPopup, InfoTooltip, SkeletonLoader, FirstTradeGuide, or Glossary

### Test Data

- None

### Edge Cases

- Verify tree-shaking still works (unused named exports from shared/index.js should not inflate bundle size)

---

## TC-010: Existing test suite passes without failures

**Priority:** P0
**Type:** Regression

### Objective

Confirm that the full existing test suite (including Accessibility tests that import moved components) passes after the refactor.

### Preconditions

- All dependencies installed
- Test runner configured (Vitest)

### Steps

1. Run `npm test` or `npx vitest run` from the project root
   **Expected:** All tests pass, exit code 0

2. Specifically verify the Accessibility test suite (`src/components/__tests__/Accessibility.test.tsx`) passes
   **Expected:** All tests in "ARIA attributes", "Keyboard navigation", and "Secondary indicators" describe blocks pass

3. Specifically verify `src/pages/__tests__/PlayerDetail.keyboard.test.tsx` passes
   **Expected:** All tests pass

### Test Data

- None

### Edge Cases

- Check for snapshot test failures that may reference old file paths in component names or source locations

---

## TC-011: Each moved component renders correctly at runtime

**Priority:** P1
**Type:** Regression

### Objective

Verify that each of the five moved components still renders and behaves correctly in the running application, confirming no breakage from the move.

### Preconditions

- Application running locally in development mode
- Test user can navigate to pages that use each component

### Steps

1. Navigate to the Market page
   **Expected:** MarketSkeleton appears briefly during load, then MarketSkeleton disappears. FirstTradeGuide appears if onboarding was just completed and no first trade has been made. LeaderboardSkeleton appears in the mini-leaderboard area during load.

2. Navigate to a Player Detail page (e.g., click on any player card)
   **Expected:** EventMarkerPopup appears when clicking/hovering on a chart event marker. Popup displays event type, headline, source, and price. Close button dismisses the popup.

3. Navigate to the Portfolio page
   **Expected:** InfoTooltip renders next to relevant portfolio metrics. Hovering or tapping the tooltip icon shows explanatory text.

4. Open the Glossary (via Layout nav or keyboard shortcut)
   **Expected:** Glossary modal opens with search input, list of terms, close button. All terms render. Search filters terms. Escape key closes the modal.

5. Verify SkeletonLoader variants render during loading states across the app
   **Expected:** PlayerCardSkeleton, MarketSkeleton, LeaderboardSkeleton, MissionSkeleton, TextSkeleton all show animated placeholder content while data loads

### Test Data

- Any valid player for Player Detail navigation
- First-time user state for FirstTradeGuide (clear `mcqueen-first-trade-seen` from localStorage)

### Edge Cases

- Verify CSS module styles are correctly applied (no unstyled/broken layouts)
- Verify no flash of unstyled content during component load

---

## TC-012: No stale references anywhere in the codebase

**Priority:** P1
**Type:** Functional

### Objective

Perform a comprehensive codebase-wide search to confirm zero remaining references to the old component locations.

### Preconditions

- Repository checked out at the branch containing the move

### Steps

1. Run a global search across the entire repository for the string `components/EventMarkerPopup`
   **Expected:** Zero matches (excluding git history)

2. Run a global search for `components/InfoTooltip`
   **Expected:** Zero matches

3. Run a global search for `components/SkeletonLoader`
   **Expected:** Zero matches

4. Run a global search for `components/FirstTradeGuide`
   **Expected:** Zero matches

5. Run a global search for `components/Glossary`
   **Expected:** Zero matches

6. Search for any remaining `from '../../components'` or `from '../components'` imports that reference moved component names
   **Expected:** Zero matches referencing the five moved components

### Test Data

- None

### Edge Cases

- Check non-source files: README, documentation, storybook configs, CI pipeline configs
- Check for path references in string literals (e.g., dynamic imports, error messages)
