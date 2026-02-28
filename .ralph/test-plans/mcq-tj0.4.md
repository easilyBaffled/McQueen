# Test Plan: mcq-tj0.4 -- Convert scenario data loading to dynamic import()

## Summary

- **Bead:** `mcq-tj0.4`
- **Feature:** Scenario JSON files are loaded via dynamic `import()` instead of static imports, producing separate Vite chunks and reducing initial bundle size
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: No static import of scenario JSON in GameContext

**Priority:** P0
**Type:** Functional

### Objective

Verify that `GameContext.jsx` (or its successor) contains zero top-level `import ... from '../data/<scenario>.json'` statements. This is the core deliverable of the bead.

### Preconditions

- Source code is available in the repository

### Steps

1. Search all files under `src/` for static import statements referencing any of the six data JSON files (`midweek.json`, `live.json`, `playoffs.json`, `superbowl.json`, `espnPlayers.json`, `leagueMembers.json`).
   **Expected:** Zero matches for static `import` statements. Only dynamic `import()` call expressions should reference these files.

2. Inspect the `scenarioLoaders` map (or equivalent) in GameContext.
   **Expected:** Every entry uses arrow-function-wrapped `import()` calls (e.g., `() => import('../data/midweek.json')`), not direct identifiers from top-level imports.

### Test Data

- Files to scan: `src/context/GameContext.jsx`, any new context files, any barrel/index files
- JSON files: `midweek.json`, `live.json`, `playoffs.json`, `superbowl.json`, `espnPlayers.json`, `leagueMembers.json`

### Edge Cases

- Verify that no other source file (components, services, pages) has introduced a new static import of any scenario JSON as a workaround
- Verify that test files and mocks are excluded from this check (test files may legitimately import JSON statically for fixtures)

---

## TC-002: No static import of scenario JSON across the entire src tree

**Priority:** P0
**Type:** Functional

### Objective

AC-1 says "any source file." Confirm the prohibition extends beyond GameContext to the entire `src/` directory (excluding test files).

### Preconditions

- Full source tree is available

### Steps

1. Run a project-wide grep for `import .* from ['"].*/(midweek|live|playoffs|superbowl|espnPlayers)\.json['"]` across `src/`, excluding `__tests__` and `*.test.*` files.
   **Expected:** Zero matches.

2. Run a project-wide grep for `require(.*/(midweek|live|playoffs|superbowl|espnPlayers)\.json.*)` across `src/`.
   **Expected:** Zero matches.

### Test Data

- N/A

### Edge Cases

- Check for `require()` calls as well as `import` statements, in case CJS style was used

---

## TC-003: Vite build produces separate chunk for midweek.json

**Priority:** P0
**Type:** Integration

### Objective

Verify that `vite build` emits a distinct chunk file containing the midweek scenario data, confirming Vite's code-splitting recognized the dynamic import boundary.

### Preconditions

- Project dependencies installed (`npm ci`)
- Clean build (`rm -rf dist/`)

### Steps

1. Run `npx vite build` and capture output.
   **Expected:** Build completes without errors.

2. List all files in `dist/assets/`.
   **Expected:** A chunk file exists whose name contains `midweek` (e.g., `midweek-AbC123.js`).

3. Inspect the contents of that chunk.
   **Expected:** It contains the midweek scenario player data (player names, priceHistory entries).

### Test Data

- N/A

### Edge Cases

- If Vite merges small chunks, the chunk may not be named `midweek` explicitly; verify via build output or `--report` that it is at least a separate chunk from the main entry

---

## TC-004: Vite build produces separate chunks for all scenario JSON files

**Priority:** P0
**Type:** Integration

### Objective

AC-2 requires separate chunks for *each* scenario JSON. Verify all five scenario files and the league data file are split.

### Preconditions

- Clean `vite build` output available

### Steps

1. Run `npx vite build` and list chunk files in `dist/assets/`.
   **Expected:** Distinct chunk files exist for each of: `midweek`, `live`, `playoffs`, `superbowl`, `espnPlayers`, and `leagueMembers`.

2. Verify the main entry bundle (`index-*.js`) does NOT contain raw player data from any scenario.
   **Expected:** Searching the main bundle for a known player name unique to a single scenario (e.g., a player only in `superbowl.json`) yields zero matches.

### Test Data

- Pick a distinctive string from each scenario JSON to search for in the main bundle

### Edge Cases

- Verify `leagueMembers.json` is also dynamically loaded and chunked (it uses its own `leagueLoader` function)
- If Vite's `manualChunks` in the existing config interferes, confirm scenario chunks are not accidentally merged into a vendor chunk

---

## TC-005: Selecting a scenario triggers an async fetch of its data

**Priority:** P0
**Type:** Functional

### Objective

AC-3 requires scenario data to be loaded asynchronously upon user selection. Verify the dynamic import is invoked when `setScenario` is called.

### Preconditions

- App is running (dev or preview mode)
- Browser DevTools Network tab open, filtered to JS requests

### Steps

1. Load the app. Note which JS chunks are fetched on initial page load.
   **Expected:** Only the default scenario's chunk (midweek) is fetched. Chunks for `live`, `playoffs`, `superbowl`, `espnPlayers` are NOT fetched.

2. Click the "Live Game" scenario tab.
   **Expected:** A new JS chunk request appears in the Network tab for the `live` scenario data. The scenario loads and players are displayed.

3. Click the "Playoffs" scenario tab.
   **Expected:** A new JS chunk request appears for the `playoffs` scenario data.

4. Click back to "Midweek."
   **Expected:** Either the chunk is served from cache or re-fetched; the scenario displays correctly.

### Test Data

- N/A

### Edge Cases

- Rapidly switch between scenarios; verify no race conditions cause stale data to display (the existing `cancelled` flag in the useEffect cleanup should handle this)

---

## TC-006: Only the active scenario chunk is fetched on initial load

**Priority:** P1
**Type:** Functional

### Objective

Confirm the "only the active scenario is fetched" guarantee. On a cold load, only one scenario chunk is downloaded.

### Preconditions

- Hard refresh / cleared browser cache
- Default scenario is `midweek` (from localStorage default)

### Steps

1. Open the app with cleared cache and monitor all network requests.
   **Expected:** Exactly one scenario data chunk is fetched (midweek). No other scenario chunks appear in the network log.

2. Change localStorage `mcqueen_scenario` to `playoffs` and hard-refresh.
   **Expected:** Only the `playoffs` chunk is fetched on load; `midweek` is NOT fetched.

### Test Data

- localStorage key: value per `STORAGE_KEYS.scenario`

### Edge Cases

- If localStorage contains an invalid scenario ID, verify the app falls back gracefully (see TC-012)

---

## TC-007: Loading state is displayed while scenario data is being fetched

**Priority:** P0
**Type:** Functional

### Objective

AC-4 requires a visible loading state during the async fetch. Verify the user sees feedback between scenario selection and data rendering.

### Preconditions

- App running in dev mode
- Network throttling available (e.g., Chrome DevTools "Slow 3G")

### Steps

1. Enable "Slow 3G" network throttling in DevTools.
   **Expected:** Network is throttled.

2. Click a scenario tab (e.g., "Super Bowl").
   **Expected:** A loading indicator (spinner, skeleton, or "Loading..." text) appears immediately after clicking.

3. Wait for the chunk to finish loading.
   **Expected:** The loading indicator disappears and the scenario's player data is rendered.

### Test Data

- N/A

### Edge Cases

- Verify `scenarioLoading` state is `true` during fetch and `false` after (unit test level)
- Verify loading state does not flash when data loads instantly (no throttle); a very brief flash is acceptable, but the UI should not flicker

---

## TC-008: Loading state is shown on initial app load

**Priority:** P1
**Type:** Functional

### Objective

The initial scenario load on mount is also asynchronous now. Verify a loading state is shown before the first scenario's data arrives.

### Preconditions

- Hard refresh with network throttling enabled

### Steps

1. Hard-refresh the app with "Slow 3G" throttling.
   **Expected:** Before any player data appears, a loading indicator is visible for the default scenario.

2. Wait for the chunk to load.
   **Expected:** Loading indicator disappears, player cards / market data render.

### Test Data

- N/A

### Edge Cases

- Verify that downstream components (Market, Portfolio, Ticker) handle the `null` / empty `currentData` gracefully while loading

---

## TC-009: scenarioLoading state transitions correctly in unit tests

**Priority:** P1
**Type:** Functional

### Objective

Verify the `scenarioLoading` boolean exposed by `useGame()` transitions from `true` to `false` during scenario loads, and resets to `true` when switching.

### Preconditions

- Vitest test environment configured
- `GameContext.test.jsx` updated for async loading

### Steps

1. Render `useGame()` hook via `renderHook` inside `GameProvider`.
   **Expected:** `result.current.scenarioLoading` is initially `true`.

2. Wait for scenario load to complete (`waitFor`).
   **Expected:** `scenarioLoading` becomes `false` and `currentData` is non-null.

3. Call `setScenario('live')`.
   **Expected:** `scenarioLoading` transitions back to `true`.

4. Wait for the live scenario to load.
   **Expected:** `scenarioLoading` becomes `false`, `currentData` contains live scenario data.

### Test Data

- N/A

### Edge Cases

- Verify that calling `setScenario` with the same scenario ID still triggers a reload (or is a no-op, depending on implementation)

---

## TC-010: Initial bundle size reduced by ~400KB

**Priority:** P1
**Type:** Integration

### Objective

AC-5 requires a ~400KB reduction in the initial bundle. Compare build output before and after the change.

### Preconditions

- Baseline build output from the commit immediately before this change (main branch or parent commit)
- Current build output from this branch

### Steps

1. Run `npx vite build` on the baseline commit. Record the size of `dist/assets/index-*.js` (the main entry chunk).
   **Expected:** Note the file size (gzipped and raw).

2. Run `npx vite build` on the current branch. Record the size of `dist/assets/index-*.js`.
   **Expected:** The main entry chunk is at least ~400KB smaller (raw size). The total of all chunks may be similar, but the *initial* chunk is significantly reduced.

3. Compare the `vite build` summary output (total sizes, chunk listing).
   **Expected:** The build output shows scenario JSON data spread across separate chunks rather than inlined into the main bundle.

### Test Data

- Baseline commit SHA for comparison
- Acceptable tolerance: 350KB-500KB reduction (the ~400KB figure is approximate)

### Edge Cases

- If other changes have been merged, isolate the delta to this change specifically
- Verify gzipped size also decreased (JSON compresses well, so the gzipped delta may be smaller than raw)

---

## TC-011: Cypress E2E tests pass — scenarios load correctly

**Priority:** P0
**Type:** Regression

### Objective

AC-6 requires existing Cypress E2E tests to continue passing. The async loading should be transparent to end-to-end user flows.

### Preconditions

- Cypress test suite exists and passes on the baseline commit
- App built or running in preview mode

### Steps

1. Run the full Cypress E2E suite: `npx cypress run`.
   **Expected:** All tests pass with zero failures.

2. Review any scenario-switching tests specifically.
   **Expected:** Tests that switch scenarios (if any) still work. Cypress naturally waits for DOM updates, so the async loading should be handled.

3. Verify the Cypress tests exercise at least two different scenarios.
   **Expected:** Player data renders correctly for each scenario tested.

### Test Data

- Existing Cypress test fixtures and configuration

### Edge Cases

- If Cypress tests relied on synchronous data availability (e.g., asserting player data immediately after page load without waiting), they may need `cy.wait()` or assertion retries
- Verify no test times out due to the additional async step

---

## TC-012: Selecting an invalid/unknown scenario ID

**Priority:** P1
**Type:** Functional

### Objective

Verify graceful handling when the scenario loader map has no entry for a given ID (defensive edge case).

### Preconditions

- App running or unit test environment

### Steps

1. Programmatically call `setScenario('nonexistent')` via the `useGame` hook in a unit test.
   **Expected:** `scenarioLoading` transitions to `true` and then back to `false`. No unhandled exception is thrown.

2. Inspect `currentData` after the load attempt.
   **Expected:** `currentData` is `null` or remains at the previous value. The app does not crash.

3. Observe the UI (if in the running app).
   **Expected:** The app shows an empty state or remains on the previous scenario, not a white screen / error boundary.

### Test Data

- Scenario ID: `'nonexistent'`, `''`, `null`, `undefined`

### Edge Cases

- Verify that `localStorage` storing an invalid scenario ID (from a previous app version or manual tampering) does not crash the app on load (see the `scenarioLoaders[scenario]` guard at line 289)

---

## TC-013: Rapid scenario switching does not cause race conditions

**Priority:** P1
**Type:** Functional

### Objective

When a user rapidly clicks through multiple scenarios before any finishes loading, only the last-selected scenario's data should be applied. The existing `cancelled` flag pattern must still work with dynamic imports.

### Preconditions

- App running with network throttling ("Slow 3G") or unit test with delayed mock imports

### Steps

1. Click "Live Game," then immediately click "Playoffs" before Live finishes loading.
   **Expected:** Playoffs data is rendered, NOT Live data. No flash of Live data.

2. Click "Midweek," then "Super Bowl," then "ESPN Live" in rapid succession.
   **Expected:** Only ESPN Live data is rendered after all loads settle.

3. Verify via unit test: call `setScenario` three times in quick succession.
   **Expected:** After all promises resolve, `currentData` matches the last scenario set. `scenarioLoading` is `false`.

### Test Data

- N/A

### Edge Cases

- Verify that the `useEffect` cleanup function's `cancelled = true` assignment actually prevents stale `.then()` callbacks from updating state

---

## TC-014: Dynamic import failure is handled gracefully

**Priority:** P2
**Type:** Functional

### Objective

If a dynamic `import()` fails (e.g., network error, corrupted chunk, 404), the app should handle it gracefully rather than showing an unhandled promise rejection.

### Preconditions

- App running with ability to simulate network failure (DevTools offline mode or service worker)

### Steps

1. Set the network to offline mode in DevTools.
   **Expected:** Network is offline.

2. Switch to a scenario that has not been cached (e.g., "Playoffs").
   **Expected:** The dynamic `import()` call rejects. The app either shows an error message, stays on the loading state, or falls back to the previous scenario. No unhandled promise rejection in the console.

3. Restore network connectivity and retry the scenario selection.
   **Expected:** The scenario loads successfully.

### Test Data

- N/A

### Edge Cases

- Verify the `scenarioLoading` state does not get stuck at `true` if the import fails (there should be a `.catch()` or error boundary)
- Verify that the error does not propagate to an uncaught rejection that breaks the entire app
