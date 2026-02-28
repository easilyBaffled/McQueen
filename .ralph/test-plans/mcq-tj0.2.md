# Test Plan: mcq-tj0.2 -- Convert constants and utils to TypeScript

## Summary

- **Bead:** `mcq-tj0.2`
- **Feature:** Rename constants.js → constants.ts and all utils/*.js → utils/*.ts with proper type annotations, preserving runtime behavior
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: constants.ts compiles without TypeScript errors

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/constants.ts` passes the TypeScript compiler under the project's `strict: true` configuration with no type errors.

### Preconditions

- TypeScript is installed as a dev dependency
- `tsconfig.json` has `strict: true` enabled

### Steps

1. Run `npx tsc --noEmit` targeting the project
   **Expected:** No type errors originating from `src/constants.ts`

2. Open `src/constants.ts` and inspect every exported binding
   **Expected:** Each constant (`INITIAL_CASH`, `USER_IMPACT_FACTOR`, `AI_BASE_CASH`, `TICK_INTERVAL_MS`, `ESPN_REFRESH_MS`, `ESPN_NEWS_LIMIT`, `MISSION_PICKS_PER_CATEGORY`, `STORAGE_VERSION`) has an explicit `: number` annotation. `STORAGE_KEYS` uses `as const` assertion. The derived type `StorageKey` is exported.

### Test Data

- N/A

### Edge Cases

- Verify that `STORAGE_KEYS` is `as const` (readonly) — assigning a new value to a key should produce a compile error

---

## TC-002: All utils/*.ts files compile without TypeScript errors

**Priority:** P0
**Type:** Functional

### Objective

Verify that every file under `src/utils/` passes the TypeScript compiler with no errors under strict mode.

### Preconditions

- TypeScript is installed as a dev dependency
- `tsconfig.json` has `strict: true` enabled

### Steps

1. Run `npx tsc --noEmit` targeting the project
   **Expected:** No type errors originating from `src/utils/formatters.ts`, `src/utils/devMode.ts`, `src/utils/espnUrls.ts`, or `src/utils/playerImages.ts`

2. Confirm no `.js` files remain in `src/utils/`
   **Expected:** Running `ls src/utils/*.js` returns no results

### Test Data

- N/A

### Edge Cases

- Verify there are no residual `.js` files alongside the `.ts` files (no duplicate modules)

---

## TC-003: No remaining .js source files for converted modules

**Priority:** P0
**Type:** Regression

### Objective

Verify that the original `.js` files have been fully removed, so there are no duplicate module resolutions.

### Preconditions

- Conversion is complete

### Steps

1. Check for `src/constants.js`
   **Expected:** File does not exist

2. Check for any `.js` files in `src/utils/` (excluding generated/bundled output)
   **Expected:** No `.js` files exist: `constants.js`, `formatters.js`, `devMode.js`, `espnUrls.js`, `playerImages.js` are all absent

### Test Data

- N/A

### Edge Cases

- Verify no `.jsx` variants were accidentally created (e.g., `constants.jsx`)

---

## TC-004: Import resolution — consumers of constants.ts still resolve correctly

**Priority:** P0
**Type:** Integration

### Objective

Verify that all files importing from `constants` (previously `.js`) resolve the renamed `.ts` module without errors.

### Preconditions

- `tsconfig.json` has `allowJs: true` and `moduleResolution: "bundler"`

### Steps

1. Open `src/context/GameContext.jsx` and confirm its import of `../constants` resolves
   **Expected:** No module-not-found error; the import statement does not include a file extension (or uses `.ts` if extensions are required)

2. Open `src/services/simulationEngine.ts` and confirm its import of `../constants` resolves
   **Expected:** No module-not-found error; TypeScript types from constants are available

3. Open `src/services/storageService.ts` and confirm its import of `../constants` resolves
   **Expected:** No module-not-found error; `STORAGE_KEYS`, `StorageKey`, and `STORAGE_VERSION` are importable

4. Run the project build/dev server
   **Expected:** No build errors related to unresolved imports of constants

### Test Data

- N/A

### Edge Cases

- If any consumer used `import ... from '../constants.js'` with an explicit extension, verify it was updated to drop the extension or use `.ts`

---

## TC-005: Import resolution — consumers of utils/*.ts still resolve correctly

**Priority:** P0
**Type:** Integration

### Objective

Verify that all files importing from `utils/*` modules resolve the renamed `.ts` files without errors.

### Preconditions

- Conversion is complete; build tooling configured

### Steps

1. Open `src/components/PlayerCard.jsx` and confirm its utils imports resolve
   **Expected:** No module-not-found errors for any utils import

2. Open `src/pages/PlayerDetail.jsx` and confirm its utils imports resolve
   **Expected:** No module-not-found errors

3. Open `src/components/ScenarioToggle.jsx` and confirm its utils imports resolve
   **Expected:** No module-not-found errors

4. Open `src/components/TimelineDebugger.jsx` and confirm its utils imports resolve
   **Expected:** No module-not-found errors

5. Run the project build
   **Expected:** Zero unresolved-module errors involving any `utils/` path

### Test Data

- N/A

### Edge Cases

- Verify default export from `espnUrls.ts` is still importable (it exports a default object in addition to named exports)

---

## TC-006: formatters.ts — formatCurrency returns correct output

**Priority:** P1
**Type:** Functional

### Objective

Verify that `formatCurrency` preserves its runtime behavior after the TypeScript conversion: correct USD formatting, configurable decimal places, and proper parameter types.

### Preconditions

- `src/utils/formatters.ts` compiles without errors

### Steps

1. Call `formatCurrency(1234.56)`
   **Expected:** Returns `"$1,234.56"`

2. Call `formatCurrency(1234.5, 0)`
   **Expected:** Returns `"$1,235"` (rounds to zero decimals)

3. Call `formatCurrency(0)`
   **Expected:** Returns `"$0.00"`

4. Call `formatCurrency(-500.1)`
   **Expected:** Returns `"-$500.10"`

### Test Data

- Positive float: `1234.56`
- Zero: `0`
- Negative: `-500.1`

### Edge Cases

- Very large value: `formatCurrency(999999999.99)` — verify no formatting breakage
- Very small value: `formatCurrency(0.001)` — verify rounding to 2 decimals yields `"$0.00"`
- Passing a non-number argument should be a compile-time type error (verify TS rejects `formatCurrency("abc")`)

---

## TC-007: formatters.ts — formatPercent returns correct output

**Priority:** P1
**Type:** Functional

### Objective

Verify that `formatPercent` preserves its runtime behavior: sign prefix, configurable decimals, and percent suffix.

### Preconditions

- `src/utils/formatters.ts` compiles without errors

### Steps

1. Call `formatPercent(12.345)`
   **Expected:** Returns `"+12.35%"` (positive sign, 2 decimal default)

2. Call `formatPercent(-3.1)`
   **Expected:** Returns `"-3.10%"` (negative sign, 2 decimals)

3. Call `formatPercent(0)`
   **Expected:** Returns `"+0.00%"` (zero gets positive sign per `>=` check)

4. Call `formatPercent(5.5, 0)`
   **Expected:** Returns `"+6%"` (0 decimal places, rounded)

### Test Data

- Positive: `12.345`
- Negative: `-3.1`
- Zero: `0`

### Edge Cases

- Boundary: `formatPercent(-0.001, 2)` — should return `"-0.00%"` or `"+0.00%"` depending on rounding; verify consistent behavior
- Type safety: `formatPercent("bad")` should be a compile-time error

---

## TC-008: formatters.ts — formatCompact returns correct output

**Priority:** P1
**Type:** Functional

### Objective

Verify that `formatCompact` produces compact notation strings (e.g., "1.2K", "3.5M") and its type signature is correct.

### Preconditions

- `src/utils/formatters.ts` compiles without errors

### Steps

1. Call `formatCompact(1500)`
   **Expected:** Returns `"1.5K"`

2. Call `formatCompact(2500000)`
   **Expected:** Returns `"2.5M"`

3. Call `formatCompact(999)`
   **Expected:** Returns `"999"` (no compact suffix below 1000)

4. Call `formatCompact(0)`
   **Expected:** Returns `"0"`

### Test Data

- Thousands: `1500`
- Millions: `2500000`
- Below threshold: `999`

### Edge Cases

- Negative values: `formatCompact(-1500)` — verify returns `"-1.5K"`
- Return type is `string` (verify annotation)

---

## TC-009: formatters.ts — formatRelativeTime returns correct output

**Priority:** P1
**Type:** Functional

### Objective

Verify that `formatRelativeTime` accepts both `string` and `Date` inputs and produces human-readable relative time strings.

### Preconditions

- `src/utils/formatters.ts` compiles without errors

### Steps

1. Call `formatRelativeTime(new Date(Date.now() - 30000))` (30 seconds ago)
   **Expected:** Returns a string like `"30 seconds ago"`

2. Call `formatRelativeTime(new Date(Date.now() - 3600000))` (1 hour ago)
   **Expected:** Returns `"1 hour ago"`

3. Call `formatRelativeTime(new Date(Date.now() - 86400000))` (1 day ago)
   **Expected:** Returns `"yesterday"` or `"1 day ago"`

4. Call `formatRelativeTime("2025-01-01T00:00:00Z")` (string input)
   **Expected:** Returns a valid relative time string (no runtime error from string input)

### Test Data

- `Date` object offsets: 30s, 1h, 1d
- ISO string: `"2025-01-01T00:00:00Z"`

### Edge Cases

- Future date: `formatRelativeTime(new Date(Date.now() + 60000))` — negative diff; verify no crash (may return unexpected string, but should not throw)
- Invalid date string: `formatRelativeTime("not-a-date")` — should be accepted by the type signature (`string | Date`) but may produce `NaN`; verify it does not throw an unhandled exception

---

## TC-010: devMode.ts — type annotations and function signatures

**Priority:** P1
**Type:** Functional

### Objective

Verify that `isDevMode`, `enableDevMode`, and `disableDevMode` have correct TypeScript return type annotations and compile cleanly.

### Preconditions

- `src/utils/devMode.ts` compiles without errors

### Steps

1. Inspect `isDevMode` signature
   **Expected:** Return type is explicitly annotated as `boolean`

2. Inspect `enableDevMode` signature
   **Expected:** Return type is explicitly annotated as `void`

3. Inspect `disableDevMode` signature
   **Expected:** Return type is explicitly annotated as `void`

4. Verify that calling `const result: boolean = isDevMode()` compiles
   **Expected:** No type error

5. Verify that calling `const result: string = isDevMode()` produces a compile error
   **Expected:** Type error — `boolean` is not assignable to `string`

### Test Data

- N/A

### Edge Cases

- SSR/Node environment: `isDevMode()` checks `typeof window` and `typeof localStorage` before access — verify the function does not throw when `window` is undefined (important for type-narrowing correctness)

---

## TC-011: espnUrls.ts — function signatures and type annotations

**Priority:** P1
**Type:** Functional

### Objective

Verify that all functions in `espnUrls.ts` have correct parameter and return type annotations and that the module compiles cleanly, including its JSON import and type cast.

### Preconditions

- `src/utils/espnUrls.ts` compiles without errors
- `src/data/espnPlayers.json` exists
- `EspnPlayersData` type is exported from `src/types`

### Steps

1. Verify `nameToSlug(name: string): string` compiles and returns a string
   **Expected:** `nameToSlug("Patrick Mahomes")` → `"patrick-mahomes"` (runtime behavior preserved)

2. Verify `getPlayerNewsUrl(espnId: string, playerName: string): string` compiles
   **Expected:** Returns a URL string starting with `https://www.espn.com/nfl/player/news/_/id/`

3. Verify `getEspnIdFromPlayerId(playerId: string): string | null` compiles
   **Expected:** Returns `string` for a known player, `null` for an unknown ID

4. Verify `getPlayerData(playerId: string)` return type matches `EspnPlayersData['players'][number] | null`
   **Expected:** Return type includes all player fields from the `EspnPlayersData` type

5. Verify `PLAYER_NEWS_URLS` is typed as `Record<string, string>`
   **Expected:** Accessing any key returns `string`; no implicit `any`

6. Verify `TEAM_NEWS_URLS` is typed as `Record<string, string>`
   **Expected:** Accessing any key returns `string`; no implicit `any`

### Test Data

- Known player ID from `espnPlayers.json`
- Unknown player ID: `"nonexistent-player"`

### Edge Cases

- `nameToSlug` with names containing apostrophes: `nameToSlug("Ja'Marr Chase")` — verify apostrophe is stripped
- `nameToSlug` with names containing periods: `nameToSlug("T.J. Watt")` — verify periods are stripped
- `getEspnIdFromPlayerId` with empty string: should return `null`

---

## TC-012: playerImages.ts — type annotations and custom types

**Priority:** P1
**Type:** Functional

### Objective

Verify that `playerImages.ts` defines and uses the `ImageSize` type alias correctly and that all functions have proper annotations.

### Preconditions

- `src/utils/playerImages.ts` compiles without errors

### Steps

1. Verify `ImageSize` is defined as `'small' | 'medium' | 'large'`
   **Expected:** The type is a union of three string literals

2. Verify `ESPN_IDS` is typed as `Record<string, string>`
   **Expected:** No implicit `any`

3. Verify `DIMENSIONS` is typed as `Record<ImageSize, { w: number; h: number }>`
   **Expected:** All three sizes have `w` and `h` number properties

4. Verify `getPlayerHeadshotUrl(playerId: string, size?: ImageSize): string | null` compiles
   **Expected:** Known player returns URL string; unknown player returns `null`

5. Verify `getTeamLogoUrl(teamAbbr: string, size?: number): string | null` compiles
   **Expected:** Known team returns URL string; unknown team returns `null`

6. Verify that `getPlayerHeadshotUrl("mahomes", "invalid")` is a compile-time error
   **Expected:** Type error — `"invalid"` is not assignable to `ImageSize`

### Test Data

- Known player: `"mahomes"`
- Known team: `"KC"`
- Unknown player: `"unknown-player"`
- Unknown team: `"XXX"`

### Edge Cases

- Default parameter: `getPlayerHeadshotUrl("mahomes")` uses `'medium'` size — verify URL contains `w=96&h=70`
- `getTeamLogoUrl("KC", 0)` — zero size is a valid number; verify URL contains `w=0&h=0`

---

## TC-013: Exported type `StorageKey` is usable by consumers

**Priority:** P1
**Type:** Integration

### Objective

Verify that the new `StorageKey` type exported from `constants.ts` is importable and correctly narrows to the literal string values in `STORAGE_KEYS`.

### Preconditions

- `src/constants.ts` compiles without errors
- A consumer file (e.g., `storageService.ts`) imports from constants

### Steps

1. In a TypeScript file, write `import { StorageKey } from '../constants'`
   **Expected:** Import resolves without error

2. Assign `const key: StorageKey = 'mcqueen-portfolio'`
   **Expected:** Compiles without error (literal is a valid `StorageKey`)

3. Assign `const key: StorageKey = 'invalid-key'`
   **Expected:** Compile error — `'invalid-key'` is not assignable to `StorageKey`

4. Verify `StorageKey` resolves to `'mcqueen-scenario' | 'mcqueen-portfolio' | 'mcqueen-watchlist' | 'mcqueen-cash'`
   **Expected:** Exactly four literal string values in the union

### Test Data

- Valid keys: `'mcqueen-scenario'`, `'mcqueen-portfolio'`, `'mcqueen-watchlist'`, `'mcqueen-cash'`
- Invalid key: `'mcqueen-invalid'`

### Edge Cases

- Verify that `STORAGE_KEYS.scenario` has type `'mcqueen-scenario'` (not widened to `string`) due to `as const`

---

## TC-014: Application builds and runs without regression

**Priority:** P0
**Type:** Regression

### Objective

Verify that the full application builds successfully and runs without runtime errors after the JS-to-TS conversion, confirming no behavioral regressions were introduced.

### Preconditions

- All file renames and type annotations are complete
- All dependencies installed

### Steps

1. Run the project build command (e.g., `npm run build` or `vite build`)
   **Expected:** Build completes with exit code 0 and no errors

2. Run the dev server and load the application in a browser
   **Expected:** Application loads without console errors related to module resolution or type issues

3. Navigate to a page that displays player cards (uses `formatCurrency`, `getPlayerHeadshotUrl`)
   **Expected:** Player cards render with formatted prices and headshot images

4. Navigate to a player detail page (uses `espnUrls`, `formatPercent`, `formatRelativeTime`)
   **Expected:** ESPN links are correct, percentages are formatted with sign prefixes, relative times display properly

5. Toggle dev mode via URL parameter `?dev=true`
   **Expected:** Dev mode activates (verifies `devMode.ts` runtime behavior preserved)

### Test Data

- Any player with a known ESPN ID (e.g., Mahomes)
- URL with `?dev=true` query parameter

### Edge Cases

- Verify that hot module replacement (HMR) works correctly with the renamed `.ts` files during development
- Verify no runtime `undefined` errors from missing exports (all named exports preserved)
