# Test Plan: mcq-1zw.7 -- Move module-level mutable state into React lifecycle

## Summary

- **Bead:** `mcq-1zw.7`
- **Feature:** Replace module-level `let` cache variables in SocialContext.tsx with `useRef` inside SocialProvider to prevent stale state across HMR, Fast Refresh, and test isolation boundaries
- **Total Test Cases:** 10
- **Test Types:** Functional, Integration, Regression

---

## TC-001: No module-level `let` variables remain in SocialContext.tsx

**Priority:** P0
**Type:** Functional

### Objective

Verify that the module scope of SocialContext.tsx contains zero mutable `let` declarations. This is the core structural requirement — if module-level mutable state remains, every downstream guarantee (HMR reset, test isolation) is void.

### Preconditions

- Implementation of mcq-1zw.7 is complete
- SocialContext.tsx source is available for inspection

### Steps

1. Open `src/context/SocialContext.tsx` and inspect all top-level (module-scope) declarations.
   **Expected:** No `let` declarations exist at module scope. The former `let leagueMembersCache` (line 27) and `let leagueHoldingsCache` (line 28) are removed entirely.

2. Search the file for any remaining module-level mutable state (e.g., `let`, mutable `const` objects used as caches outside a component).
   **Expected:** Zero matches. All mutable cache state has been moved inside the `SocialProvider` component body.

### Test Data

- Source file: `src/context/SocialContext.tsx`

### Edge Cases

- Confirm that module-level `const` declarations (e.g., `leagueLoader`, `SocialContext`) are still acceptable — only mutable `let` or unscoped mutable objects are disallowed.
- Verify `getLeagueData` function, if it still exists at module scope, no longer reads from or writes to module-level variables.

---

## TC-002: Cache state is stored in `useRef` inside SocialProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that `leagueMembersCache` and `leagueHoldingsCache` equivalents now live as `useRef` values inside the `SocialProvider` component, ensuring they are tied to the React component lifecycle.

### Preconditions

- Implementation of mcq-1zw.7 is complete

### Steps

1. Inspect `SocialProvider` component body for `useRef` calls that replace the former cache variables.
   **Expected:** Two `useRef` calls (or a single `useRef` holding both caches) are present inside `SocialProvider`. Initial values are `null` (matching the previous `let ... = null` pattern).

2. Verify that the cache refs are used in the league data loading logic (either passed to `getLeagueData` or inlined).
   **Expected:** The loading effect reads from and writes to the ref's `.current` property instead of module-level variables.

3. Verify the ref types match the former cache types: `LeagueMember[] | null` and `Record<string, LeagueHolding[]> | null`.
   **Expected:** TypeScript compilation succeeds with correct types on the refs.

### Test Data

- Source file: `src/context/SocialContext.tsx`

### Edge Cases

- If the caching logic was moved inline (instead of keeping a separate `getLeagueData` function), verify the inline logic still short-circuits when the ref already has data.

---

## TC-003: League data loads correctly on initial mount

**Priority:** P0
**Type:** Regression

### Objective

Verify that the refactoring to `useRef` does not break the initial async load of league members and holdings. This is a regression gate — existing TC-019 and TC-025 in the test suite cover this, but must still pass after the change.

### Preconditions

- SocialProvider is rendered inside the full provider tree (ScenarioProvider > SimulationProvider > TradingProvider > SocialProvider)
- `leagueMembers.json` data file is available

### Steps

1. Render a hook that calls `useSocial()` inside the full provider wrapper.
   **Expected:** Hook renders without error.

2. Wait for async league data to load (poll `getLeagueMembers().length > 0`).
   **Expected:** `getLeagueMembers()` returns the full 11-member array from `leagueMembers.json`.

3. Call `getLeagueHoldings('mahomes')` after load completes.
   **Expected:** Returns a non-empty array of enriched holdings with `memberId`, `shares`, `avgCost`, `name`, `avatar`, `currentValue`, and `gainPercent` fields.

### Test Data

- Player ID: `mahomes` (known to have league holdings in test data)
- Expected member count: 11

### Edge Cases

- Verify `getLeagueMembers()` returns an empty array before the async load completes (initial state), then populates after the effect fires.

---

## TC-004: Cache is used on subsequent calls within same mount (no redundant imports)

**Priority:** P1
**Type:** Functional

### Objective

Verify that after the initial dynamic `import()` populates the `useRef` cache, subsequent accesses to the league data within the same provider mount do NOT re-trigger the import. The ref-based cache should short-circuit just as the old module-level cache did.

### Preconditions

- SocialProvider mounted and league data loaded

### Steps

1. Spy on or instrument the `leagueLoader` (the dynamic `import('../data/leagueMembers.json')` call).
   **Expected:** Called exactly once during the provider's lifetime.

2. Trigger a re-render of the provider (e.g., by changing watchlist state or other state that causes a re-render).
   **Expected:** `leagueLoader` is NOT called again. The ref cache is read instead.

3. Verify `getLeagueMembers()` still returns the full member list after re-renders.
   **Expected:** Same 11-member array as the initial load.

### Test Data

- Any state change that triggers a SocialProvider re-render (e.g., `addToWatchlist('allen')`)

### Edge Cases

- If the implementation moves caching into the effect (guarded by `ref.current !== null`), confirm the guard works correctly when the ref starts as `null`.

---

## TC-005: Cache resets when SocialProvider unmounts and remounts

**Priority:** P0
**Type:** Functional

### Objective

Verify that because the cache now lives in `useRef`, unmounting and remounting the `SocialProvider` resets the cache (refs are re-initialized). This is the key behavioral change from module-level state, which survived unmount/remount.

### Preconditions

- Full provider tree is available for rendering

### Steps

1. Render the full provider tree. Wait for league data to load.
   **Expected:** `getLeagueMembers()` returns 11 members.

2. Unmount the entire tree.
   **Expected:** Provider and all refs are destroyed.

3. Render a fresh instance of the full provider tree.
   **Expected:** The new `SocialProvider` instance creates new `useRef` values initialized to `null`. The loading effect fires again, re-importing league data. `getLeagueMembers()` eventually returns 11 members after the async load.

4. Spy on the dynamic import to confirm it is called again on the second mount.
   **Expected:** Import is invoked a second time (unlike the old module-level cache which would have short-circuited).

### Test Data

- N/A (uses default league data)

### Edge Cases

- Verify that during the brief window between remount and async load completion, `getLeagueMembers()` returns `[]` (the initial state), not stale data from the previous mount.

---

## TC-006: No cross-test cache leakage between independent test renders

**Priority:** P0
**Type:** Integration

### Objective

Verify that two independent test cases rendering `SocialProvider` do not share cache state. This is the primary test-isolation guarantee: the old module-level `let` variables leaked across test cases because `vi.resetModules()` was not called.

### Preconditions

- Vitest test runner
- No manual module reset between tests (the fix should make this unnecessary)

### Steps

1. In Test A: Render the full provider tree. Wait for league data to load. Confirm `getLeagueMembers()` returns 11 members. Unmount.
   **Expected:** Data loads and is available.

2. In Test B (separate `it()` block, same `describe`): Render a fresh full provider tree. Do NOT assume data is pre-loaded.
   **Expected:** The provider starts with fresh `useRef(null)` values. The loading effect fires independently. `getLeagueMembers()` returns `[]` initially, then 11 members after async load.

3. Verify Test B does not inherit any state from Test A.
   **Expected:** If Test A had mutated cache contents (hypothetically), Test B would not see those mutations because it has its own ref instances.

### Test Data

- N/A

### Edge Cases

- Run the SocialContext test file in isolation (`vitest run src/context/__tests__/SocialContext.test.tsx`) — must pass.
- Run the full test suite (`npm run test:run`) — SocialContext tests must still pass (no ordering-dependent failures from other test files populating the old module cache).

---

## TC-007: HMR remount resets cache (development verification)

**Priority:** P1
**Type:** Functional

### Objective

Verify that when Vite's Hot Module Replacement triggers a remount of `SocialProvider` (e.g., after editing `SocialContext.tsx`), the cache resets and fresh data is loaded. This was broken with module-level state because HMR preserves module scope.

### Preconditions

- Vite dev server running (`npm run dev`)
- App loaded in browser with SocialProvider mounted

### Steps

1. Open the app in the browser. Navigate to a view that displays league data (e.g., leaderboard).
   **Expected:** League members and rankings are displayed.

2. Make a trivial edit to `SocialContext.tsx` (e.g., add a comment) and save.
   **Expected:** Vite triggers HMR. The `SocialProvider` component remounts. New `useRef` instances are created with `null` initial values.

3. Observe the leaderboard/league data in the browser after HMR completes.
   **Expected:** Data reloads correctly. No stale or missing data. Console does not show errors related to stale cache references.

### Test Data

- Any trivial edit to `SocialContext.tsx` that triggers HMR

### Edge Cases

- Rapid successive edits (multiple HMR cycles in quick succession) should each reset cleanly without accumulating stale refs.

---

## TC-008: `getLeagueData` accepts refs or caching logic is inlined correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `getLeagueData` function (if it still exists) correctly accepts ref parameters, or that its logic has been properly inlined into the provider's effect. The function signature or inline logic must read/write `.current` on the refs.

### Preconditions

- Implementation complete

### Steps

1. If `getLeagueData` still exists as a separate function: verify its signature accepts cache refs (e.g., `getLeagueData(membersRef, holdingsRef)` or a single combined ref).
   **Expected:** Function reads `ref.current` to check for cached data and writes `ref.current` to populate the cache.

2. If caching logic is inlined in the `useEffect`: verify the effect checks `ref.current !== null` before calling `leagueLoader()`, and sets `ref.current` after loading.
   **Expected:** The guard prevents redundant imports. The assignment populates the cache for subsequent reads within the same mount.

3. Run `npm run build` (TypeScript compilation + bundling).
   **Expected:** Build succeeds with no type errors. The ref types are compatible with the data shapes returned by `leagueLoader`.

### Test Data

- N/A (structural/code review test)

### Edge Cases

- If `getLeagueData` is kept at module scope but now accepts refs as parameters, verify it does NOT close over any module-level mutable state (no accidental capture of old variables).

---

## TC-009: Existing SocialContext tests pass in isolation and in full suite

**Priority:** P0
**Type:** Regression

### Objective

Verify that all 25 existing test cases (TC-001 through TC-025 in `SocialContext.test.tsx`) pass without modification after the refactor. This is the primary regression gate specified in the acceptance criteria.

### Preconditions

- Implementation complete
- No changes to test file (tests should pass as-is against the refactored code)

### Steps

1. Run SocialContext tests in isolation:
   ```
   npx vitest run src/context/__tests__/SocialContext.test.tsx
   ```
   **Expected:** All tests pass. Zero failures, zero skipped.

2. Run the full test suite:
   ```
   npm run test:run
   ```
   **Expected:** All tests pass, including SocialContext tests. No test ordering issues.

3. Run the build:
   ```
   npm run build
   ```
   **Expected:** Build succeeds with zero errors.

### Test Data

- N/A

### Edge Cases

- TC-020 ("League data is cached after first load") currently verifies caching by unmounting and remounting. With the ref-based approach, this test's behavior may change — if the test expects the cache to survive unmount (module-level behavior), it will need updating. Verify whether this test passes as-is or requires adjustment.

---

## TC-010: No functional regression in leaderboard rankings and league holdings

**Priority:** P1
**Type:** Regression

### Objective

Verify that the downstream consumers of league cache data — `getLeaderboardRankings` and `getLeagueHoldings` — continue to produce correct results after the cache is moved to refs.

### Preconditions

- SocialProvider mounted with full provider tree
- League data loaded

### Steps

1. Call `getLeaderboardRankings()` after league data loads.
   **Expected:** Returns a sorted array (descending by `totalValue`) containing all AI members plus the user. Rankings are 1-based and sequential. `gapToNext` is 0 for rank 1. `traderAhead` is `null` for rank 1.

2. Call `getLeagueHoldings('mahomes')` (a player with known league holdings and a user holding).
   **Expected:** Returns enriched holdings array. User holding appears first (memberId `'user'`). Each holding has correct `currentValue` (effectivePrice * shares) and `gainPercent`.

3. Call `getLeagueHoldings('unknown_player_xyz')`.
   **Expected:** Returns empty array `[]`.

4. Buy shares of a player via trading, then call `getLeagueHoldings` for that player.
   **Expected:** User holding appears in results with correct share count and average cost.

### Test Data

- Player IDs: `mahomes`, `allen`, `unknown_player_xyz`
- User starts with `mahomes` in `startingPortfolio`

### Edge Cases

- Verify leaderboard recalculates correctly after a trade (user's `totalValue` changes, ranking may shift).
- Verify AI member `cash` is still `AI_BASE_CASH` (not affected by cache refactor).
