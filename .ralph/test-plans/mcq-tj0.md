# Test Plan: mcq-tj0 -- Data Layer: Types, Storage, and Dynamic Loading

## Summary

- **Bead:** `mcq-tj0`
- **Feature:** TypeScript type definitions, versioned storage service, and dynamic scenario data loading for the NFL Stock Market app
- **Total Test Cases:** 28
- **Test Types:** Functional, Integration, Regression

---

## TC-001: ScenarioData type covers all scenario JSON fields

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/types/scenario.ts` defines a `ScenarioData` interface whose fields match the top-level shape of every scenario JSON file (scenario, timestamp, headline, startingPortfolio, players).

### Preconditions

- `src/types/scenario.ts` exists
- Scenario JSON files (`live.json`, `midweek.json`, `playoffs.json`, `superbowl.json`) are available for reference

### Steps

1. Open `src/types/scenario.ts` and inspect the `ScenarioData` interface.
   **Expected:** Interface has fields `scenario: string`, `timestamp: string`, `headline: string`, `startingPortfolio: Record<string, Holding>`, `players: Player[]`.

2. Attempt to assign the raw JSON from `live.json` to a variable typed as `ScenarioData`.
   **Expected:** TypeScript compiler accepts the assignment with no errors.

3. Repeat step 2 for `midweek.json`, `playoffs.json`, and `superbowl.json`.
   **Expected:** All assignments compile without errors.

### Test Data

- All four scenario JSON files in `src/data/`

### Edge Cases

- `superbowl.json` players may include extra fields like `isBuyback`; type should accommodate optional fields without error.
- `espn-live` mode has no `timestamp` or `headline`; type should allow these as optional or a union type should handle it.

---

## TC-002: Player type matches player objects in scenario data

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `Player` interface in `src/types/scenario.ts` accurately models every field present on player objects across all scenario JSON files.

### Preconditions

- `src/types/scenario.ts` exists with a `Player` interface

### Steps

1. Inspect the `Player` interface.
   **Expected:** Contains `id: string`, `name: string`, `team: string`, `position: string`, `basePrice: number`, `totalSharesAvailable: number`, `isActive: boolean`, `priceHistory: PriceHistoryEntry[]`.

2. Verify that optional fields from specific scenarios (e.g., `isBuyback` from playoffs, `searchTerms` from espnPlayers) are declared as optional.
   **Expected:** Fields like `isBuyback?: boolean` and `searchTerms?: string[]` compile cleanly.

3. Assign a player object from `live.json` to a `Player`-typed variable.
   **Expected:** No type errors.

### Test Data

- Player objects from `live.json`, `playoffs.json`, `espnPlayers.json`

### Edge Cases

- A player with no `priceHistory` (ESPN Live base players) should still satisfy the type (field should be optional or default to `[]`).

---

## TC-003: PriceHistoryEntry and PriceReason types match data

**Priority:** P0
**Type:** Functional

### Objective

Verify that `PriceHistoryEntry` and `PriceReason` interfaces accurately model the nested price history objects in scenario JSON.

### Preconditions

- `src/types/scenario.ts` exists

### Steps

1. Inspect `PriceHistoryEntry`.
   **Expected:** Contains `timestamp: string`, `price: number`, `reason: PriceReason`, and optional `content: ContentItem[]`.

2. Inspect `PriceReason`.
   **Expected:** Contains `type: string` (or a union of `'news' | 'game_event' | 'league_trade' | ...`), `headline: string`, `source: string`, and optional fields like `eventType`, `url`, `memberId`, `action`, `shares`.

3. Assign a raw price history entry from `live.json` to a `PriceHistoryEntry`-typed variable.
   **Expected:** No type errors.

### Test Data

- Price history entries from `live.json` covering `news`, `game_event`, and `league_trade` reason types

### Edge Cases

- Entries with no `content` array should compile (field is optional).
- Entries where `reason` has extra scenario-specific fields should not cause errors.

---

## TC-004: ContentItem type covers content tile shapes

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `ContentItem` interface models the content tiles nested inside `PriceHistoryEntry.content[]`.

### Preconditions

- `src/types/scenario.ts` exists

### Steps

1. Inspect the `ContentItem` interface.
   **Expected:** Includes fields like `type`, `headline`, `source`, `url`, and any other fields present in scenario content arrays.

2. Assign a content item from a scenario JSON's price history entry to a `ContentItem`-typed variable.
   **Expected:** No type errors.

### Test Data

- Content arrays from scenario JSON price history entries

### Edge Cases

- Content items with minimal fields (only `type` and `headline`) should still satisfy the type.

---

## TC-005: Portfolio and Holding types in trading module

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/types/trading.ts` defines `Portfolio` and `Holding` types matching the portfolio data shape used in `GameContext`.

### Preconditions

- `src/types/trading.ts` exists

### Steps

1. Inspect `Holding` interface.
   **Expected:** Contains `shares: number`, `avgCost: number`.

2. Inspect `Portfolio` type.
   **Expected:** Defined as `Record<string, Holding>` or an equivalent mapped type.

3. Assign the `startingPortfolio` from `live.json` to a `Portfolio`-typed variable.
   **Expected:** No type errors.

### Test Data

- `startingPortfolio` from `live.json`: `{ "mahomes": { "shares": 3, "avgCost": 142.5 }, ... }`

### Edge Cases

- Empty portfolio `{}` should satisfy the `Portfolio` type.
- A holding with zero shares (`{ shares: 0, avgCost: 0 }`) should be valid.

---

## TC-006: Simulation types (TimelineEntry, HistoryEntry, SimulationMode)

**Priority:** P1
**Type:** Functional

### Objective

Verify that `src/types/simulation.ts` defines types matching the timeline and history data structures built by `GameContext`.

### Preconditions

- `src/types/simulation.ts` exists

### Steps

1. Inspect `TimelineEntry` interface.
   **Expected:** Contains `playerId`, `playerName`, `entryIndex`, `timestamp`, `price`, `reason`, `content`.

2. Inspect `HistoryEntry` interface.
   **Expected:** Contains `tick`, `prices`, `action`, and optional `playerId`, `playerName`, `sentiment`, `changePercent`.

3. Inspect `SimulationMode` type.
   **Expected:** Union type of valid scenario strings (e.g., `'midweek' | 'live' | 'playoffs' | 'superbowl' | 'espn-live'`).

4. Assign an object matching `buildUnifiedTimeline` output to a `TimelineEntry[]` variable.
   **Expected:** No type errors.

### Test Data

- Output shape of `buildUnifiedTimeline()` and `history` state from `GameContext`

### Edge Cases

- History entry with only `tick`, `prices`, and `action` (no optional fields) should be valid.

---

## TC-007: Social types (MissionPicks, LeaderboardEntry, LeagueHolding)

**Priority:** P1
**Type:** Functional

### Objective

Verify that `src/types/social.ts` defines types matching mission, leaderboard, and league data shapes.

### Preconditions

- `src/types/social.ts` exists

### Steps

1. Inspect `MissionPicks` interface.
   **Expected:** Contains `risers: string[]`, `fallers: string[]`.

2. Inspect `MissionScore` interface.
   **Expected:** Contains `correct: number`, `total: number`, `percentile: number`.

3. Inspect `LeaderboardEntry` interface.
   **Expected:** Contains `memberId`, `name`, `avatar`, `isUser`, `cash`, `holdingsValue`, `totalValue`, `rank`, `gapToNext`, and optional `gain`, `gainPercent`, `traderAhead`.

4. Inspect `LeagueHolding` type.
   **Expected:** Contains `memberId`, `shares`, `avgCost`.

5. Assign league members data from `leagueMembers.json` to appropriately typed variables.
   **Expected:** No type errors.

### Test Data

- `leagueMembers.json` members and holdings arrays

### Edge Cases

- User member has `isUser: true` but no `avatar` — type should allow optional avatar.

---

## TC-008: ESPN types (Article, GameEvent, SentimentResult)

**Priority:** P1
**Type:** Functional

### Objective

Verify that `src/types/espn.ts` defines types matching the ESPN service data shapes.

### Preconditions

- `src/types/espn.ts` exists
- `src/services/espnService.js` and `src/services/sentimentEngine.js` exist for reference

### Steps

1. Inspect `Article` interface.
   **Expected:** Contains `id`, `headline`, `description`, and other fields returned by `fetchNFLNews`.

2. Inspect `SentimentResult` interface.
   **Expected:** Contains `sentiment` and related scoring fields used by `analyzeSentiment`.

3. Verify that ESPN price history entries created in `GameContext` (lines 259-266) conform to the defined types.
   **Expected:** The `createPriceHistoryEntry` return value plus `sentimentDescription` field should satisfy the type.

### Test Data

- ESPN service return shapes from `espnService.js` and `sentimentEngine.js`

### Edge Cases

- Article with empty `description` should be valid.
- Sentiment result with neutral/zero score should be valid.

---

## TC-009: Index barrel re-exports all types

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/types/index.ts` re-exports every type from all sub-modules so consumers can import from a single path.

### Preconditions

- All type files (`scenario.ts`, `trading.ts`, `simulation.ts`, `social.ts`, `espn.ts`) exist
- `src/types/index.ts` exists

### Steps

1. Open `src/types/index.ts`.
   **Expected:** Contains `export * from './scenario'`, `export * from './trading'`, `export * from './simulation'`, `export * from './social'`, `export * from './espn'` (or equivalent).

2. In a test file, write `import { Player, Portfolio, TimelineEntry, MissionPicks, Article } from '../types'`.
   **Expected:** All imports resolve without errors.

3. Verify no type name collisions exist across sub-modules.
   **Expected:** Build succeeds with no "duplicate identifier" errors.

### Test Data

- N/A

### Edge Cases

- If two sub-modules accidentally export the same name, the build should fail — verify this is not the case.

---

## TC-010: constants.ts exports typed constants with no `any`

**Priority:** P0
**Type:** Functional

### Objective

Verify that `constants.js` has been converted to `constants.ts` with explicit type annotations on every export and no `any` types.

### Preconditions

- `src/constants.ts` exists (renamed from `constants.js`)
- `src/constants.js` no longer exists

### Steps

1. Open `src/constants.ts`.
   **Expected:** `INITIAL_CASH` is typed as `number`, `STORAGE_KEYS` is typed as `Record<string, string>` or a more specific type, etc.

2. Search the file for the `any` keyword.
   **Expected:** Zero occurrences.

3. Run `npx tsc --noEmit`.
   **Expected:** No type errors from `constants.ts`.

### Test Data

- Current `constants.js` values: `INITIAL_CASH = 10000`, `STORAGE_KEYS = { scenario: 'mcqueen-scenario', ... }`

### Edge Cases

- `STORAGE_KEYS` should ideally use `as const` or a string literal type so downstream code gets precise key types.

---

## TC-011: utils/formatters.ts converted with type annotations

**Priority:** P1
**Type:** Functional

### Objective

Verify that `utils/formatters.js` has been converted to `utils/formatters.ts` with explicit types on all function parameters and return values.

### Preconditions

- `src/utils/formatters.ts` exists

### Steps

1. Open `src/utils/formatters.ts` and inspect all exported functions.
   **Expected:** Every function has typed parameters and return type annotations.

2. Search for `any` type usage.
   **Expected:** Zero occurrences.

3. Run existing `formatters.test.js` (or `.ts`) tests.
   **Expected:** All tests pass.

### Test Data

- Existing test file in `src/utils/__tests__/`

### Edge Cases

- Functions that accept `null` or `undefined` should use union types, not `any`.

---

## TC-012: utils/playerImages.ts, espnUrls.ts, devMode.ts converted

**Priority:** P1
**Type:** Functional

### Objective

Verify that all remaining utility files are converted to TypeScript with proper annotations.

### Preconditions

- `src/utils/playerImages.ts`, `src/utils/espnUrls.ts`, `src/utils/devMode.ts` exist

### Steps

1. Open each file and verify all exports have explicit type annotations.
   **Expected:** No implicit `any` types.

2. Run `npx tsc --noEmit`.
   **Expected:** No type errors from any utils file.

3. Verify `.js` versions no longer exist.
   **Expected:** Only `.ts` files remain in `src/utils/`.

### Test Data

- N/A

### Edge Cases

- `devMode.ts` may reference `window` or environment variables — types should handle browser vs. SSR environments.

---

## TC-013: Build succeeds with zero type errors after all conversions

**Priority:** P0
**Type:** Integration

### Objective

Verify the entire project compiles successfully after all TypeScript type definitions and conversions are in place.

### Preconditions

- All tasks mcq-tj0.1 and mcq-tj0.2 are complete
- `tsconfig.json` is configured correctly

### Steps

1. Run `npx tsc --noEmit` from the project root.
   **Expected:** Exit code 0, no type errors.

2. Run `npm run build` (Vite build).
   **Expected:** Build succeeds, producing output in `dist/`.

3. Verify no `.js` files remain for converted modules (constants, utils).
   **Expected:** Only `.ts`/`.tsx` versions exist for converted files.

### Test Data

- N/A

### Edge Cases

- JSX files that import from converted modules should still work (Vite resolves `.ts` imports from `.jsx` consumers).

---

## TC-014: storageService.ts exists with typed read/write functions

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/services/storageService.ts` exposes typed `read` and `write` functions for localStorage operations.

### Preconditions

- `src/services/storageService.ts` exists

### Steps

1. Inspect the module's exported API.
   **Expected:** Exports at minimum `read<T>(key: string, defaultValue: T): T` and `write<T>(key: string, value: T): void` (or equivalent typed signatures).

2. Call `write('test-key', { foo: 'bar' })` followed by `read('test-key', {})`.
   **Expected:** Returns `{ foo: 'bar' }`.

3. Call `read('nonexistent-key', 42)`.
   **Expected:** Returns `42` (the default value).

### Test Data

- Simple objects, numbers, strings, arrays as test values

### Edge Cases

- Writing `null` or `undefined` — should either store correctly or throw a clear error.
- Writing a value that exceeds localStorage quota — should handle gracefully.

---

## TC-015: Storage entries include schema version number

**Priority:** P0
**Type:** Functional

### Objective

Verify that every value written by `storageService` wraps the payload with a schema version.

### Preconditions

- `storageService.ts` exists and is functional

### Steps

1. Call `write('test-key', { cash: 10000 })`.
   **Expected:** `localStorage.getItem('test-key')` returns a JSON string containing a `version` field (e.g., `{ "version": 1, "data": { "cash": 10000 } }`).

2. Call `read('test-key', {})`.
   **Expected:** Returns only the inner data (`{ cash: 10000 }`), not the version wrapper.

3. Inspect the stored JSON structure directly via `localStorage.getItem`.
   **Expected:** Top-level object always has a `version` property of type `number`.

### Test Data

- Various data types: objects, arrays, primitives

### Edge Cases

- If a legacy entry (written before versioning) exists with no `version` field, `read` should still handle it (see TC-017).

---

## TC-016: read() validates stored data and returns default on corruption

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` detects corrupted or unparseable data and falls back to the provided default value.

### Preconditions

- `storageService.ts` exists

### Steps

1. Manually set `localStorage.setItem('corrupt-key', 'not-valid-json{{{')`.
   **Expected:** Calling `read('corrupt-key', [])` returns `[]`.

2. Manually set `localStorage.setItem('wrong-shape', JSON.stringify({ version: 1, data: 'unexpected-string' }))` where a validator expects an object.
   **Expected:** If a shape validator is provided, `read` returns the default value.

3. Manually set `localStorage.setItem('null-data', JSON.stringify({ version: 1, data: null }))`.
   **Expected:** `read('null-data', { cash: 0 })` returns `{ cash: 0 }`.

### Test Data

- Corrupt JSON strings, wrong data types, null data payloads

### Edge Cases

- Empty string in localStorage (`localStorage.setItem('empty', '')`) should return default.
- A value of `"undefined"` (the string) should return default.

---

## TC-017: Migration function handles version upgrades

**Priority:** P0
**Type:** Functional

### Objective

Verify that `storageService` can migrate stored data from an older schema version to the current version.

### Preconditions

- `storageService.ts` exists with migration support
- At least one migration is defined (e.g., v1 → v2)

### Steps

1. Manually store a v1 schema entry: `localStorage.setItem('migrate-key', JSON.stringify({ version: 1, data: { oldField: 'value' } }))`.
   **Expected:** Calling `read('migrate-key', {})` applies the v1→v2 migration and returns the transformed data.

2. After migration, inspect the stored value in localStorage.
   **Expected:** The stored entry has been updated to the current version number with the migrated data shape.

3. Store a value at the current version.
   **Expected:** `read` returns it directly with no migration applied.

### Test Data

- Fabricated v1 data structures with fields that differ from v2

### Edge Cases

- A stored entry with a version number higher than the current version should return the default (future-proofing).
- A stored entry with `version: 0` or negative version should be treated as corrupt and return default.
- Multi-step migration (v1→v2→v3) should chain correctly if multiple migrations exist.

---

## TC-018: read() handles missing localStorage key

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `read()` for a key that does not exist in localStorage returns the default value.

### Preconditions

- `storageService.ts` exists
- localStorage is cleared for the test key

### Steps

1. Ensure `localStorage.getItem('never-set')` returns `null`.
   **Expected:** Confirmed null.

2. Call `read('never-set', { cash: 10000 })`.
   **Expected:** Returns `{ cash: 10000 }`.

3. Call `read('never-set', [])`.
   **Expected:** Returns `[]`.

### Test Data

- Various default value types

### Edge Cases

- Default value of `0` (falsy) should be returned, not `null` or `undefined`.
- Default value of `false` (falsy boolean) should be returned correctly.

---

## TC-019: No direct localStorage calls remain in GameContext

**Priority:** P0
**Type:** Integration

### Objective

Verify that all `localStorage.getItem` and `localStorage.setItem` calls in `GameContext` (or its successor) have been replaced with `storageService.read` / `storageService.write`.

### Preconditions

- `storageService.ts` exists and is integrated
- GameContext (or successors) has been updated

### Steps

1. Search `GameContext.jsx` (or `.tsx`) for `localStorage.getItem`.
   **Expected:** Zero occurrences.

2. Search `GameContext.jsx` (or `.tsx`) for `localStorage.setItem`.
   **Expected:** Zero occurrences.

3. Search the entire `src/` directory for direct `localStorage` calls outside of `storageService.ts`.
   **Expected:** Zero occurrences (all access is routed through the service).

4. Verify the app still persists scenario, portfolio, watchlist, and cash across page reloads.
   **Expected:** Data persists correctly via the storage service.

### Test Data

- N/A

### Edge Cases

- Third-party libraries using localStorage are excluded from this check.

---

## TC-020: storageService unit tests cover all required scenarios

**Priority:** P1
**Type:** Functional

### Objective

Verify that unit tests exist for `storageService` covering the cases specified in the acceptance criteria: happy path read/write, corrupt data recovery, version migration, and missing key.

### Preconditions

- Unit test file for `storageService` exists (e.g., `src/services/__tests__/storageService.test.ts`)

### Steps

1. Run the storageService test suite.
   **Expected:** All tests pass.

2. Verify a test exists for happy-path read/write.
   **Expected:** At least one test writes and reads back a value successfully.

3. Verify a test exists for corrupt data recovery.
   **Expected:** At least one test stores invalid JSON and confirms the default is returned.

4. Verify a test exists for version migration.
   **Expected:** At least one test stores an old-version entry and confirms it is migrated.

5. Verify a test exists for missing key.
   **Expected:** At least one test reads a nonexistent key and confirms the default is returned.

### Test Data

- N/A (tests are self-contained)

### Edge Cases

- Tests should mock `localStorage` rather than relying on a real browser environment.

---

## TC-021: No static import statements for scenario JSON files

**Priority:** P0
**Type:** Functional

### Objective

Verify that all static `import ... from '../data/*.json'` statements have been removed from source files and replaced with dynamic `import()`.

### Preconditions

- Dynamic loading (mcq-tj0.4) is complete

### Steps

1. Search the entire `src/` directory for static import statements referencing scenario JSON files (`midweek.json`, `live.json`, `playoffs.json`, `superbowl.json`).
   **Expected:** Zero occurrences of static imports for these files.

2. Verify that `espnPlayers.json` and `leagueMembers.json` are also dynamically loaded or appropriately handled.
   **Expected:** No static JSON imports remain in any source file.

3. Inspect the code that replaced the static imports.
   **Expected:** Uses `import()` or a dynamic loading wrapper function.

### Test Data

- N/A

### Edge Cases

- Test/fixture files that import JSON for test data are excluded from this check.

---

## TC-022: Vite build produces separate chunks for each scenario JSON

**Priority:** P0
**Type:** Integration

### Objective

Verify that `vite build` code-splits each scenario JSON into its own chunk file.

### Preconditions

- Dynamic `import()` is in place for all scenario JSON files
- Vite config supports JSON chunk splitting

### Steps

1. Run `npm run build`.
   **Expected:** Build succeeds.

2. Inspect the `dist/assets/` directory for chunk files.
   **Expected:** Separate chunk files exist for each scenario (e.g., files containing `midweek`, `live`, `playoffs`, `superbowl` data).

3. Verify that the main bundle does not contain inline scenario data.
   **Expected:** Main JS bundle does not contain the full player arrays from any scenario JSON.

### Test Data

- N/A

### Edge Cases

- If Vite merges very small chunks, verify the total main bundle is still significantly smaller than before.

---

## TC-023: Scenario data loads asynchronously on user selection

**Priority:** P0
**Type:** Functional

### Objective

Verify that selecting a scenario triggers an async fetch of the scenario data rather than using pre-loaded data.

### Preconditions

- Dynamic loading is implemented
- App is running

### Steps

1. Open the app and observe the network tab (or equivalent monitoring).
   **Expected:** No scenario JSON chunks are loaded on initial page load (only the default/active scenario).

2. Switch to a different scenario (e.g., from "midweek" to "playoffs").
   **Expected:** A network request (or dynamic chunk load) occurs for the playoffs data.

3. Switch back to the original scenario.
   **Expected:** Data loads (possibly from cache) without errors.

### Test Data

- Available scenarios: midweek, live, playoffs, superbowl, espn-live

### Edge Cases

- Rapidly switching between scenarios should not cause race conditions or display stale data.

---

## TC-024: Loading state shown while scenario data is being fetched

**Priority:** P1
**Type:** Functional

### Objective

Verify that a loading indicator is displayed during the async fetch of scenario data.

### Preconditions

- Dynamic loading is implemented
- App is running

### Steps

1. Throttle network speed (or add artificial delay) and switch scenarios.
   **Expected:** A loading spinner, skeleton, or "Loading..." message appears.

2. Wait for the scenario to finish loading.
   **Expected:** Loading indicator disappears and scenario data is displayed correctly.

3. Switch to a scenario that has already been loaded (cached).
   **Expected:** Loading state is either very brief or skipped entirely.

### Test Data

- N/A

### Edge Cases

- If the dynamic import fails (e.g., network error), an error state should be shown instead of an infinite spinner.

---

## TC-025: Initial bundle size reduced by ~400KB

**Priority:** P1
**Type:** Integration

### Objective

Verify that the initial JavaScript bundle size is reduced by approximately 400KB after converting static JSON imports to dynamic loading.

### Preconditions

- Baseline bundle size is measured before the change
- Dynamic loading is fully implemented

### Steps

1. Run `npm run build` on the codebase *before* dynamic loading changes and record the total JS bundle size.
   **Expected:** Baseline measurement recorded (e.g., ~1MB+).

2. Run `npm run build` on the codebase *after* dynamic loading changes and record the total JS bundle size.
   **Expected:** Main bundle is at least ~400KB smaller than baseline.

3. Verify the total size of all chunks (main + lazy) is roughly the same as the original bundle.
   **Expected:** Data is not lost, just deferred to separate chunks.

### Test Data

- Vite build output size statistics

### Edge Cases

- If new code was added alongside this change, normalize for that when comparing bundle sizes.

---

## TC-026: Cypress E2E tests still pass after dynamic loading

**Priority:** P0
**Type:** Regression

### Objective

Verify that all existing Cypress E2E tests continue to pass after converting to dynamic scenario loading.

### Preconditions

- All dynamic loading changes are complete
- Cypress is configured and tests exist

### Steps

1. Run the full Cypress E2E test suite (`npx cypress run`).
   **Expected:** All tests pass with no failures.

2. Pay particular attention to tests that switch scenarios (navigation, market, portfolio tests).
   **Expected:** Scenario switching works correctly with async loading.

3. Check that tests covering scenario-specific features (live simulation, playoffs, superbowl) still function.
   **Expected:** All scenario-specific tests pass.

### Test Data

- Existing Cypress test fixtures

### Edge Cases

- Tests that rely on immediate data availability after scenario switch may need to account for async loading — verify no flaky failures.

---

## TC-027: storageService handles localStorage being unavailable

**Priority:** P1
**Type:** Functional

### Objective

Verify that `storageService` degrades gracefully when `localStorage` is unavailable (e.g., private browsing in some browsers, storage quota exceeded, or `localStorage` is blocked).

### Preconditions

- `storageService.ts` exists

### Steps

1. Mock `localStorage` to throw on `getItem` and `setItem`.
   **Expected:** `read()` returns the default value without throwing.

2. Mock `localStorage` to throw on `setItem` (quota exceeded).
   **Expected:** `write()` does not throw an unhandled exception; fails silently or logs a warning.

3. Mock `localStorage` as `undefined` (not available).
   **Expected:** `read()` returns default, `write()` is a no-op.

### Test Data

- N/A

### Edge Cases

- `SecurityError` thrown by some browsers when cookies are disabled should be caught.

---

## TC-028: Types do not use `any` — strict type safety across all new modules

**Priority:** P0
**Type:** Functional

### Objective

Verify that no `any` type appears in any of the newly created or converted TypeScript files.

### Preconditions

- All type definition files, converted utils, converted constants, and storageService exist as `.ts`

### Steps

1. Search all files in `src/types/` for the `any` keyword used as a type annotation.
   **Expected:** Zero occurrences.

2. Search `src/constants.ts` for `any`.
   **Expected:** Zero occurrences.

3. Search all files in `src/utils/*.ts` for `any`.
   **Expected:** Zero occurrences.

4. Search `src/services/storageService.ts` for `any`.
   **Expected:** Zero occurrences (generics like `<T>` should be used instead).

5. Run `npx tsc --noEmit --strict`.
   **Expected:** No errors. Implicit `any` is also caught by strict mode.

### Test Data

- N/A

### Edge Cases

- Comments containing the word "any" should be excluded from the check (only type-level usage matters).
- Generic type parameters (`<T>`) are acceptable and preferred over `any`.
