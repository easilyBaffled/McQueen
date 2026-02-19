# Test Plan: mcq-qzq.3 -- Convert espnService to TypeScript

## Summary

- **Bead:** `mcq-qzq.3`
- **Feature:** TypeScript conversion of espnService with full type annotations, using Article and GameEvent interfaces from types/espn.ts
- **Total Test Cases:** 12
- **Test Types:** Functional, Integration, Regression

---

## TC-001: File is renamed from .js to .ts

**Priority:** P0
**Type:** Functional

### Objective

Verify that the service file exists as `src/services/espnService.ts` and the old `.js` file no longer exists.

### Preconditions

- Repository is checked out at the branch containing this change

### Steps

1. Check for file `src/services/espnService.ts`
   **Expected:** File exists and contains the service implementation

2. Check for file `src/services/espnService.js`
   **Expected:** File does NOT exist (has been renamed, not copied)

### Test Data

- N/A

### Edge Cases

- Ensure no stale `.js` file remains alongside the `.ts` file (duplicate)

---

## TC-002: Article type is imported from types/espn.ts

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `Article` interface is imported from `types/espn.ts` (via the barrel `types/index.ts`) and used throughout the service, rather than being redefined locally.

### Preconditions

- `src/types/espn.ts` exports `Article` interface
- `src/types/index.ts` re-exports from `espn.ts`

### Steps

1. Open `src/services/espnService.ts` and inspect import statements
   **Expected:** `Article` is imported via `import type { Article, ... } from '../types'` or `from '../types/espn'`

2. Search `espnService.ts` for any local `interface Article` or `type Article` declaration
   **Expected:** No local Article definition exists — the type is solely imported

3. Verify all functions returning articles (`fetchNFLNews`, `fetchTeamNews`, `fetchPlayerNews`) use the imported `Article` type in their return signatures
   **Expected:** Return types are `Promise<Article[]>` using the imported interface

### Test Data

- N/A

### Edge Cases

- Verify that the imported `Article` interface shape (id, headline, description, published, url, images, thumbnail, source, type, premium, categories, _raw) matches what `normalizeNewsArticles` produces

---

## TC-003: GameEvent type is imported from types/espn.ts

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `GameEvent` interface (and related sub-interfaces `GameEventTeam`, `GameEventStatus`) is imported from `types/espn.ts` and used for scoreboard data.

### Preconditions

- `src/types/espn.ts` exports `GameEvent`, `GameEventTeam`, and `GameEventStatus` interfaces

### Steps

1. Open `src/services/espnService.ts` and inspect import statements
   **Expected:** `GameEvent` is imported from `'../types'` or `'../types/espn'`

2. Verify `fetchScoreboard` return type references `GameEvent`
   **Expected:** Return type is `Promise<{ events: GameEvent[]; week: unknown; season: unknown }>` or similar typed structure

3. Verify `normalizeGameEvent` return type is `GameEvent`
   **Expected:** Function signature includes `: GameEvent` return annotation

### Test Data

- N/A

### Edge Cases

- Ensure `GameEventTeam` and `GameEventStatus` sub-interfaces are also used (not inlined as anonymous types)

---

## TC-004: fetchNFLNews has full type annotations

**Priority:** P0
**Type:** Functional

### Objective

Verify that `fetchNFLNews` has typed parameters and return type with no implicit `any`.

### Preconditions

- `espnService.ts` compiles without errors

### Steps

1. Inspect the `fetchNFLNews` function signature
   **Expected:** Parameter `limit` is typed as `number` with default value; return type is `Promise<Article[]>`

2. Run TypeScript compiler in strict mode on the file (`npx tsc --noEmit --strict src/services/espnService.ts`)
   **Expected:** No type errors related to `fetchNFLNews`

### Test Data

- N/A

### Edge Cases

- Verify the `limit` parameter default value is preserved (e.g., `limit: number = 20`)

---

## TC-005: fetchTeamNews has full type annotations

**Priority:** P0
**Type:** Functional

### Objective

Verify that `fetchTeamNews` has typed parameters and return type with no implicit `any`.

### Preconditions

- `espnService.ts` compiles without errors

### Steps

1. Inspect the `fetchTeamNews` function signature
   **Expected:** Parameters `teamAbbr: string` and `limit: number` (with default) are typed; return type is `Promise<Article[]>`

2. Verify internal lookup of `NFL_TEAM_IDS[teamAbbr.toUpperCase()]` resolves to `number | undefined` with proper guard
   **Expected:** The `teamId` variable is typed and the `!teamId` guard handles the undefined case, returning `[]`

### Test Data

- N/A

### Edge Cases

- Verify case-insensitivity handling (`teamAbbr.toUpperCase()`) is preserved in the typed version

---

## TC-006: fetchPlayerNews has full type annotations

**Priority:** P0
**Type:** Functional

### Objective

Verify that `fetchPlayerNews` has typed parameters and return type with no implicit `any`.

### Preconditions

- `espnService.ts` compiles without errors

### Steps

1. Inspect the `fetchPlayerNews` function signature
   **Expected:** Parameters are `playerName: string`, `searchTerms: string[]` (default `[]`), `teamAbbr: string` (default `''`); return type is `Promise<Article[]>`

2. Verify the internal `articles` variable is typed as `Article[]`
   **Expected:** No implicit `any` on intermediate collections

3. Verify the filtering logic (`allArticles.filter(...)`) returns `Article[]`
   **Expected:** TypeScript infers the correct type without explicit `any`

### Test Data

- N/A

### Edge Cases

- Verify deduplication logic (`allArticles.find(a => a.id === article.id)`) type-checks correctly

---

## TC-007: fetchScoreboard has full type annotations

**Priority:** P0
**Type:** Functional

### Objective

Verify that `fetchScoreboard` has a typed return value including `GameEvent[]` for events.

### Preconditions

- `espnService.ts` compiles without errors

### Steps

1. Inspect the `fetchScoreboard` function signature
   **Expected:** Return type is `Promise<{ events: GameEvent[]; week: unknown; season: unknown }>` (or a named interface)

2. Verify the error fallback return matches the typed shape
   **Expected:** Fallback `{ events: [], week: null, season: null }` is assignable to the declared return type

### Test Data

- N/A

### Edge Cases

- If `week` and `season` are typed more specifically than `unknown`, verify the raw ESPN API data is compatible with those types

---

## TC-008: Cache utility functions are typed

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getFromCache`, `setCache`, `clearCache`, and `getCacheStats` all have explicit type annotations on parameters and return values.

### Preconditions

- `espnService.ts` compiles without errors

### Steps

1. Inspect `getFromCache` signature
   **Expected:** Parameter `key: string`, return type `unknown | null` (or a generic)

2. Inspect `setCache` signature
   **Expected:** Parameters `key: string, data: unknown`, return type `void`

3. Inspect `clearCache` signature
   **Expected:** No parameters, return type `void`

4. Inspect `getCacheStats` signature
   **Expected:** No parameters, return type `{ size: number; keys: string[]; entries: Array<{ key: string; age: number; expired: boolean }> }`

5. Inspect `CacheEntry` interface
   **Expected:** Defined with `data: unknown` and `timestamp: number`

### Test Data

- N/A

### Edge Cases

- Verify the `cache` variable is typed as `Map<string, CacheEntry>`

---

## TC-009: No `any` types in the codebase

**Priority:** P0
**Type:** Functional

### Objective

Verify that the converted file contains zero unescaped `any` type annotations. All types should be explicit and specific.

### Preconditions

- `espnService.ts` is the fully converted file

### Steps

1. Search the file for occurrences of `: any`, `as any`, `<any>`, or `any[]`
   **Expected:** Zero matches. All types should be replaced with specific types or `unknown`

2. Search for `@typescript-eslint/no-explicit-any` eslint-disable comments
   **Expected:** Zero disable comments for the `no-explicit-any` rule

3. Run the project ESLint with the `@typescript-eslint/no-explicit-any` rule enabled
   **Expected:** No violations reported for `espnService.ts`

### Test Data

- N/A

### Edge Cases

- The `fetchWithFallback` internal function may use `any` for the raw ESPN API response — verify it uses `unknown` or a specific response type instead
- The `normalizeNewsArticles` and `normalizeGameEvent` functions previously used `any` for raw API data parameters — verify these are replaced with `unknown` or a defined raw response type

---

## TC-010: Build succeeds with the TypeScript conversion

**Priority:** P0
**Type:** Integration

### Objective

Verify that the full project builds successfully with the converted TypeScript file.

### Preconditions

- All project dependencies are installed
- No other unrelated build errors exist in the project

### Steps

1. Run `npm run build` (or the project's build command)
   **Expected:** Build completes with exit code 0 and no TypeScript compilation errors

2. Run `npx tsc --noEmit` to type-check without emitting
   **Expected:** No type errors reported

### Test Data

- N/A

### Edge Cases

- Verify no circular dependency issues introduced by the new import paths
- Verify downstream files that import from `espnService` still compile (import paths unchanged since the file extension is not included in imports)

---

## TC-011: Existing tests still pass after conversion

**Priority:** P0
**Type:** Regression

### Objective

Verify that the existing test suite in `src/services/__tests__/espnService.test.js` continues to pass without modifications after the file rename and type annotations.

### Preconditions

- Test runner (vitest) is configured and working
- `espnService.test.js` imports from `../espnService` (extensionless, resolves to `.ts`)

### Steps

1. Run `npx vitest run src/services/__tests__/espnService.test.js`
   **Expected:** All existing tests pass (NFL_TEAM_IDS mapping, cache utilities, fetchNFLNews, fetchTeamNews, fetchScoreboard)

2. Verify test import path `from '../espnService'` resolves correctly to the new `.ts` file
   **Expected:** No module resolution errors

### Test Data

- N/A

### Edge Cases

- If the test file itself needs a `.ts` rename as part of a broader refactor, verify it is NOT included in this bead's scope (this bead only covers the service file)

---

## TC-012: NFL_TEAM_IDS constant is properly typed

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `NFL_TEAM_IDS` mapping is typed as `Record<string, number>` and still contains all 32 NFL teams.

### Preconditions

- `espnService.ts` compiles without errors

### Steps

1. Inspect the `NFL_TEAM_IDS` declaration
   **Expected:** Typed as `Record<string, number>` (or a more specific union type of team abbreviations)

2. Count the entries in `NFL_TEAM_IDS`
   **Expected:** Exactly 32 entries, one per NFL team

3. Spot-check several team mappings (e.g., KC → 12, BUF → 2, ARI → 22)
   **Expected:** Values match the original `.js` file

### Test Data

- Known mappings: ARI=22, ATL=1, BAL=33, BUF=2, KC=12, SF=25

### Edge Cases

- Verify the export is a named export (`export const NFL_TEAM_IDS`) so existing imports are unaffected
