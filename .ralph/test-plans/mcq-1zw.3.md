# Test Plan: mcq-1zw.3 -- Fix stale closure bugs from exhaustive-deps suppressions

## Summary

- **Bead:** `mcq-1zw.3`
- **Feature:** Elimination of three stale closure bugs caused by missing React hook dependency array entries in SimulationContext and TradingContext
- **Total Test Cases:** 16
- **Test Types:** Functional, Integration, Regression

---

## TC-001: SimulationContext reset effect uses fresh player data when players change without scenarioVersion bump

**Priority:** P0
**Type:** Functional

### Objective

Verify that the reset effect at SimulationContext:89 does not close over stale `players` data. Before the fix, if `players` changed (e.g., ESPN live enrichment adding search terms) without `scenarioVersion` incrementing, the effect would use the old player list. After the fix (Option A: ref-gated with all deps), the effect body should see current `players` but only execute its reset logic when `scenarioVersion` actually changes.

### Preconditions

- SimulationProvider and ScenarioProvider rendered
- Initial scenario loaded with players available

### Steps

1. Render the SimulationProvider inside ScenarioProvider and wait for initial load.
   **Expected:** Initial history entry is created with prices derived from the current player list.

2. Switch to a new scenario (e.g., `live`) so `scenarioVersion` increments to 1.
   **Expected:** Reset effect fires; history is replaced with a single entry containing prices for all current players.

3. Externally trigger a player data change (simulating ESPN live enrichment updating player search terms or base prices) without changing scenarioVersion.
   **Expected:** The reset effect does NOT re-execute its reset logic (history is not wiped), because the ref-gated check sees that `scenarioVersion` has not changed since last execution.

4. Now switch scenario again (e.g., to `playoffs`) so `scenarioVersion` increments to 2.
   **Expected:** Reset effect fires using the *current* (enriched) player data — initial prices in the new history entry reflect the updated player objects, not stale ones from before enrichment.

### Test Data

- Players array from default midweek scenario
- Enriched players array with modified `searchTerms` or `basePrice` values

### Edge Cases

- Players array becomes empty between scenario switches (effect should handle gracefully)
- scenarioVersion is 0 on mount (effect should skip, per the existing guard)

---

## TC-002: SimulationContext reset effect correctly computes initial prices from fresh getCurrentPriceFromHistory

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the reset effect runs, it calls `getCurrentPriceFromHistory` with the current player objects, not stale closures. This ensures initial prices in the history entry are accurate after a scenario switch.

### Preconditions

- SimulationProvider and ScenarioProvider rendered
- A non-espn-live scenario is active

### Steps

1. Load default scenario and verify initial history entry prices match `getCurrentPriceFromHistory(player)` for each player.
   **Expected:** Each player's initial price in `history[0].prices` matches the value returned by `getCurrentPriceFromHistory` for that player.

2. Switch to `live` scenario.
   **Expected:** New history entry prices use `getCurrentPriceFromHistory` with `live` scenario players (who may have different `priceHistory` arrays).

3. Switch to `espn-live` scenario.
   **Expected:** New history entry prices use `player.basePrice` (not `getCurrentPriceFromHistory`), and the action message says "ESPN Live mode activated...".

### Test Data

- Players from midweek, live, and espn-live scenarios

### Edge Cases

- Player with empty `priceHistory` array (getCurrentPriceFromHistory should fall back to basePrice)

---

## TC-003: SimulationContext reset effect reads fresh `scenario` value for action message and isPlaying

**Priority:** P0
**Type:** Functional

### Objective

Verify the reset effect uses the current `scenario` string (not a stale closure) to determine the action message text and whether `isPlaying` should be set to true.

### Preconditions

- SimulationProvider and ScenarioProvider rendered

### Steps

1. Switch to `espn-live` scenario.
   **Expected:** History action is "ESPN Live mode activated - fetching real news..." and `isPlaying` is false.

2. Switch to `live` scenario.
   **Expected:** History action is "Scenario loaded" and `isPlaying` is true.

3. Switch to `superbowl` scenario.
   **Expected:** History action is "Scenario loaded" and `isPlaying` is true.

4. Switch to `midweek` scenario.
   **Expected:** History action is "Scenario loaded" and `isPlaying` is false.

### Test Data

- All scenario types: midweek, live, superbowl, playoffs, espn-live

### Edge Cases

- Rapid consecutive scenario switches (only the final scenario's values should be reflected)

---

## TC-004: SimulationContext ESPN refresh effect uses current fetchAndProcessEspnNews callback

**Priority:** P0
**Type:** Functional

### Objective

Verify that the ESPN auto-refresh effect at SimulationContext:222 calls the *current* `fetchAndProcessEspnNews` callback — not a stale version captured at initial effect setup. Before the fix, the interval would keep calling an old closure that had stale `players`, `espnPriceHistory`, `processedArticleIds`, and `priceOverrides`.

### Preconditions

- SimulationProvider and ScenarioProvider rendered
- ESPN service mock configured

### Steps

1. Switch to `espn-live` scenario with mock returning article A matching player "mahomes".
   **Expected:** `fetchAndProcessEspnNews` is called; article A is processed; mahomes gets a price override; article ID is added to processedArticleIds.

2. Update the mock to return article A plus new article B (also matching mahomes).
   **Expected:** On the next ESPN_REFRESH_MS interval tick, `fetchAndProcessEspnNews` fires with the *current* `processedArticleIds` (containing article A's ID), so only article B is processed.

3. Verify mahomes price is updated based on article B's sentiment, and article A is not re-processed.
   **Expected:** History contains exactly one ESPN entry for article A and one for article B (no duplicates).

### Test Data

- Two ESPN articles matching "mahomes": article A (id: "art-a") and article B (id: "art-b")

### Edge Cases

- fetchAndProcessEspnNews dependencies change multiple times between interval ticks
- Interval fires while a previous fetch is still in-flight (race condition)

---

## TC-005: ESPN refresh effect does not cause infinite re-render loop after adding fetchAndProcessEspnNews to deps

**Priority:** P0
**Type:** Regression

### Objective

Adding `fetchAndProcessEspnNews` to the dependency array of the ESPN auto-refresh effect could cause an infinite loop if the useCallback's own dependencies are not stable. Verify no infinite re-renders or rapid-fire fetches occur.

### Preconditions

- SimulationProvider and ScenarioProvider rendered
- Fake timers enabled

### Steps

1. Switch to `espn-live` scenario.
   **Expected:** `fetchNFLNews` is called once for the initial fetch.

2. Advance timers by a small amount (e.g., 100ms) well below ESPN_REFRESH_MS.
   **Expected:** No additional calls to `fetchNFLNews` beyond the initial one.

3. Advance timers by ESPN_REFRESH_MS.
   **Expected:** Exactly one additional call to `fetchNFLNews` (the scheduled refresh).

4. Observe render count or effect execution count over 5 refresh cycles.
   **Expected:** fetch count increases linearly (once per ESPN_REFRESH_MS), not exponentially.

### Test Data

- Mock `fetchNFLNews` returning empty array (to isolate timing from processing)

### Edge Cases

- fetchAndProcessEspnNews useCallback deps change on every render (should be prevented by stable deps)

---

## TC-006: ESPN refresh interval is properly cleaned up and re-established when fetchAndProcessEspnNews changes

**Priority:** P1
**Type:** Functional

### Objective

When `fetchAndProcessEspnNews` changes (because its deps changed), the effect should clean up the old interval and set up a new one with the updated callback. Verify no leaked intervals.

### Preconditions

- SimulationProvider and ScenarioProvider rendered
- Fake timers enabled
- `espn-live` scenario active

### Steps

1. Activate `espn-live` with mock returning empty articles.
   **Expected:** Interval established; initial fetch fires.

2. Update mock to return a new article (causing `fetchAndProcessEspnNews` to change on next render because `processedArticleIds` changes).
   **Expected:** After processing, the old interval is cleared and a new one is set.

3. Advance timers by ESPN_REFRESH_MS.
   **Expected:** The new interval fires with the updated callback (fresh processedArticleIds).

4. Switch away from `espn-live` to `midweek`.
   **Expected:** Interval is cleared; no further fetches occur after switching.

### Test Data

- ESPN article with id "interval-test"

### Edge Cases

- Unmount during an active interval (no errors, interval is cleared)

---

## TC-007: TradingContext reset effect uses fresh currentData when currentData changes without scenarioVersion bump

**Priority:** P0
**Type:** Functional

### Objective

Verify that the reset effect at TradingContext:71 does not close over stale `currentData`. Before the fix, if `currentData` changed without `scenarioVersion` incrementing, the effect would use old `startingPortfolio`. After the fix (Option A: ref-gated), the effect should see current `currentData` but only reset when `scenarioVersion` changes.

### Preconditions

- TradingProvider, SimulationProvider, and ScenarioProvider rendered

### Steps

1. Render full provider stack and wait for initial load.
   **Expected:** Portfolio is initialized from `currentData.startingPortfolio`.

2. Simulate a `currentData` update (e.g., startingPortfolio changes from `{mahomes: {shares:3, avgCost:138}}` to `{mahomes: {shares:5, avgCost:150}}`) without changing scenarioVersion.
   **Expected:** The reset effect does NOT fire (scenarioVersion hasn't changed), so portfolio retains its current state.

3. Switch scenario so scenarioVersion increments.
   **Expected:** Reset effect fires using the *current* `currentData.startingPortfolio` — portfolio is set to `{mahomes: {shares:5, avgCost:150}}` (the updated data), not the stale original.

### Test Data

- Original startingPortfolio: `{mahomes: {shares: 3, avgCost: 138}}`
- Updated startingPortfolio: `{mahomes: {shares: 5, avgCost: 150}}`

### Edge Cases

- `currentData` is null or undefined at reset time (should use empty object as fallback)
- `currentData.startingPortfolio` is missing (should default to `{}`)

---

## TC-008: TradingContext reset effect resets cash and userImpact with current values

**Priority:** P0
**Type:** Functional

### Objective

Verify that the reset effect at TradingContext:71 correctly resets `cash` to `INITIAL_CASH` and clears `userImpact` to `{}` when scenarioVersion changes, regardless of any intermediate state changes.

### Preconditions

- TradingProvider, SimulationProvider, and ScenarioProvider rendered

### Steps

1. Buy shares of multiple players to modify cash and userImpact.
   **Expected:** Cash decreases; userImpact entries are created.

2. Switch scenario so scenarioVersion increments.
   **Expected:** Cash resets to INITIAL_CASH; userImpact is cleared (effective prices return to base); portfolio resets to startingPortfolio.

### Test Data

- Buy 10 shares of "allen" and 5 shares of "mahomes" before reset

### Edge Cases

- Cash is already at INITIAL_CASH when reset fires (should remain INITIAL_CASH)
- userImpact is already empty when reset fires (should remain empty)

---

## TC-009: All three eslint-disable-line comments are removed

**Priority:** P0
**Type:** Regression

### Objective

Verify that the three `eslint-disable-line react-hooks/exhaustive-deps` suppression comments have been removed from the codebase.

### Preconditions

- Code changes applied

### Steps

1. Search SimulationContext.tsx for `eslint-disable-line react-hooks/exhaustive-deps`.
   **Expected:** Zero occurrences found.

2. Search TradingContext.tsx for `eslint-disable-line react-hooks/exhaustive-deps`.
   **Expected:** Zero occurrences found.

3. Search the entire `src/context/` directory for any remaining `eslint-disable.*exhaustive-deps` comments.
   **Expected:** Zero occurrences found.

### Test Data

- N/A (static code analysis)

### Edge Cases

- Ensure no other files have had suppressions accidentally added as part of this change

---

## TC-010: npm run lint passes with no exhaustive-deps warnings

**Priority:** P0
**Type:** Regression

### Objective

Verify the project linter runs cleanly with zero `react-hooks/exhaustive-deps` warnings, confirming that all dependency arrays are now correct.

### Preconditions

- Code changes applied
- Node modules installed

### Steps

1. Run `npm run lint`.
   **Expected:** Exit code 0; output contains no `react-hooks/exhaustive-deps` warnings for SimulationContext.tsx or TradingContext.tsx.

2. Grep lint output for "exhaustive-deps".
   **Expected:** Zero matches.

### Test Data

- N/A

### Edge Cases

- Ensure lint rule is enabled (not globally disabled) — verify `.eslintrc` or equivalent config still includes `react-hooks/exhaustive-deps` as a warning or error

---

## TC-011: npm run test:run passes for SimulationContext test suite

**Priority:** P0
**Type:** Regression

### Objective

Verify all existing SimulationContext tests continue to pass after the fix, confirming no regressions in reset behavior, tick advancement, ESPN integration, or unified timeline logic.

### Preconditions

- Code changes applied

### Steps

1. Run `npm run test:run -- --reporter=verbose src/context/__tests__/SimulationContext.test.tsx`.
   **Expected:** All tests pass (33 existing tests across reset, tick interval, ESPN integration, and utility function groups).

### Test Data

- Existing test fixtures and mocks

### Edge Cases

- Tests that use fake timers (tick interval, ESPN refresh) should not be destabilized by effect cleanup/re-setup changes

---

## TC-012: npm run test:run passes for TradingContext test suite

**Priority:** P0
**Type:** Regression

### Objective

Verify all existing TradingContext tests continue to pass after the fix, confirming no regressions in buy/sell, portfolio reset, price computation, or ESPN mode enrichment.

### Preconditions

- Code changes applied

### Steps

1. Run `npm run test:run -- --reporter=verbose src/context/__tests__/TradingContext.test.tsx`.
   **Expected:** All tests pass (30+ existing tests across buy, sell, reset, getPlayer, getPlayers, getPortfolioValue, and ESPN enrichment groups).

### Test Data

- Existing test fixtures and mocks

### Edge Cases

- Tests relying on scenario reset timing should not be affected by additional deps in the effect

---

## TC-013: npm run build succeeds without errors

**Priority:** P0
**Type:** Regression

### Objective

Verify the project builds successfully, confirming no TypeScript errors or other compilation issues introduced by the fix.

### Preconditions

- Code changes applied

### Steps

1. Run `npm run build`.
   **Expected:** Exit code 0; no errors in output.

### Test Data

- N/A

### Edge Cases

- Ensure no unused import warnings if `useRef` was added or signatures changed

---

## TC-014: SimulationContext reset effect ref-gate prevents re-execution when non-scenarioVersion deps change

**Priority:** P1
**Type:** Functional

### Objective

After adding `players`, `scenario`, and `getCurrentPriceFromHistory` to the dependency array (Option A), verify that the ref-based gating mechanism prevents the reset logic from running unless `scenarioVersion` has actually changed.

### Preconditions

- SimulationProvider and ScenarioProvider rendered

### Steps

1. Load initial scenario. Record history length.
   **Expected:** History has 1 entry.

2. Trigger a player data update (e.g., via ESPN live enrichment modifying a player object in the players array) without changing scenarioVersion.
   **Expected:** The effect may re-run (because `players` dep changed), but the ref check sees scenarioVersion has not changed since last reset — reset logic is skipped; history length unchanged.

3. Verify simulation state is undisturbed (tick, priceOverrides, espn state all retained).
   **Expected:** All state values identical to before the player data change.

### Test Data

- Default midweek players with a subsequent enrichment update

### Edge Cases

- Multiple player data updates in rapid succession without scenarioVersion change (none should trigger reset)

---

## TC-015: TradingContext reset effect ref-gate prevents re-execution when non-scenarioVersion deps change

**Priority:** P1
**Type:** Functional

### Objective

After adding `currentData` to the dependency array (Option A), verify that the ref-based gating mechanism prevents the reset logic from running unless `scenarioVersion` has actually changed.

### Preconditions

- TradingProvider, SimulationProvider, and ScenarioProvider rendered

### Steps

1. Load initial scenario. Buy some shares to modify portfolio and cash.
   **Expected:** Portfolio and cash reflect the purchase.

2. Trigger a `currentData` update without changing scenarioVersion.
   **Expected:** The effect may re-run (because `currentData` dep changed), but the ref check sees scenarioVersion hasn't changed — reset logic is skipped; portfolio and cash unchanged.

3. Verify trading state is undisturbed (portfolio, cash, userImpact all retained).
   **Expected:** All state values identical to after the purchase in step 1.

### Test Data

- Purchase of 2 shares of "allen" before currentData update

### Edge Cases

- currentData changes from non-null to null without scenarioVersion change (should not reset)

---

## TC-016: Full integration — scenario switch resets both SimulationContext and TradingContext atomically with fresh data

**Priority:** P1
**Type:** Integration

### Objective

Verify that when scenarioVersion changes, both contexts reset together using current (non-stale) data, and the application remains in a consistent state.

### Preconditions

- Full provider stack (Scenario → Simulation → Trading) rendered

### Steps

1. Load default midweek scenario. Buy shares and advance simulation state.
   **Expected:** Portfolio has holdings; cash is reduced; history has multiple entries.

2. Switch to `live` scenario.
   **Expected:** SimulationContext resets (tick=0, fresh history with current live players, isPlaying=true, espn state cleared). TradingContext resets (portfolio=startingPortfolio, cash=INITIAL_CASH, userImpact={}). Both use fresh player data from the `live` scenario.

3. Advance some ticks in live mode, then switch to `espn-live`.
   **Expected:** SimulationContext resets again with espn-live initial prices (using `basePrice`). TradingContext resets. ESPN fetch is triggered. No stale data from the live scenario leaks through.

4. Switch back to `midweek`.
   **Expected:** Clean reset; ESPN intervals cleared; no stale ESPN data in prices or history.

### Test Data

- Full player rosters from midweek, live, and espn-live scenarios

### Edge Cases

- Rapidly switching through all 5 scenarios in sequence (midweek → live → superbowl → playoffs → espn-live) — final state should be consistent with espn-live, no stale data from any intermediate scenario
