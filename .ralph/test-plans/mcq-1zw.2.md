# Test Plan: mcq-1zw.2 -- Memoize all context provider values

## Summary

- **Bead:** `mcq-1zw.2`
- **Feature:** Wrap context provider value objects in `useMemo` to prevent unnecessary consumer re-renders on every parent render
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: ScenarioContext value object is referentially stable across renders

**Priority:** P0
**Type:** Functional

### Objective

Verify that `ScenarioProvider`'s value object retains the same reference between renders when none of its dependencies change. This is the core behavior the memoization is intended to provide.

### Preconditions

- ScenarioProvider is rendered with default state
- Initial scenario data has finished loading (`scenarioLoading === false`)

### Steps

1. Render `useScenario()` inside `ScenarioProvider` and wait for loading to complete.
   **Expected:** Hook returns a valid context object.

2. Capture the context value reference. Trigger a re-render of the provider (e.g., via `rerender()`).
   **Expected:** The context value reference after re-render is `===` identical to the one captured before re-render (Object.is equality).

### Test Data

- Default scenario: `midweek`

### Edge Cases

- Force parent re-render via an unrelated state change in a wrapper component; the value reference must remain stable.

---

## TC-002: SimulationContext value object is referentially stable across renders

**Priority:** P0
**Type:** Functional

### Objective

Verify that `SimulationProvider`'s value object retains the same reference between renders when none of its 16 dependency properties change.

### Preconditions

- Full provider stack rendered (ScenarioProvider > SimulationProvider)
- Scenario data loaded, simulation idle (`tick === 0`, `isPlaying === false`)

### Steps

1. Render `useSimulation()` inside the full provider stack and wait for scenario loading to complete.
   **Expected:** Hook returns a valid context object with `tick === 0`.

2. Capture the context value reference. Trigger a re-render of the provider tree.
   **Expected:** The context value reference after re-render is `===` identical to the one captured before.

### Test Data

- Default midweek scenario (no auto-play)

### Edge Cases

- Verify stability when `isPlaying` is false and no tick interval is running.

---

## TC-003: TradingContext value object is referentially stable across renders

**Priority:** P0
**Type:** Functional

### Objective

Verify that `TradingProvider`'s value object retains the same reference between renders when none of its 8 dependency properties change.

### Preconditions

- Full provider stack rendered (Scenario > Simulation > Trading)
- Scenario data loaded

### Steps

1. Render `useTrading()` inside the full provider stack and wait for scenario loading to complete.
   **Expected:** Hook returns a valid context object.

2. Capture the context value reference. Trigger a re-render of the provider tree.
   **Expected:** The context value reference after re-render is `===` identical to the one captured before.

### Test Data

- Default midweek scenario with starting portfolio

### Edge Cases

- No trades have been executed (initial state).

---

## TC-004: SocialContext value object is referentially stable across renders

**Priority:** P0
**Type:** Functional

### Objective

Verify that `SocialProvider`'s value object retains the same reference between renders when none of its 13 dependency properties change.

### Preconditions

- Full provider stack rendered (Scenario > Simulation > Trading > Social)
- Scenario data loaded

### Steps

1. Render `useSocial()` inside the full provider stack and wait for scenario loading to complete.
   **Expected:** Hook returns a valid context object.

2. Capture the context value reference. Trigger a re-render of the provider tree.
   **Expected:** The context value reference after re-render is `===` identical to the one captured before.

### Test Data

- Default midweek scenario, empty watchlist

### Edge Cases

- League data has loaded asynchronously before the stability check.

---

## TC-005: ScenarioContext `players` array is memoized and referentially stable

**Priority:** P0
**Type:** Functional

### Objective

Verify that the derived `players` array in `ScenarioProvider` is wrapped in `useMemo` so that `currentData?.players || []` does not produce a new array reference on every render. This is explicitly required by the design notes.

### Preconditions

- ScenarioProvider rendered, scenario data loaded

### Steps

1. Render `useScenario()` and wait for loading to complete. Capture `result.current.players` reference.
   **Expected:** `players` is a non-empty array.

2. Trigger a re-render (e.g., `rerender()`). Compare `result.current.players` to the captured reference.
   **Expected:** References are `===` identical; no new array allocated.

### Test Data

- Default midweek scenario with known player list

### Edge Cases

- When `currentData` is `null` (before load completes), `players` should be a stable empty array reference (`[]`) across renders, not a new `[]` each time.

---

## TC-006: ScenarioContext value updates when a dependency changes

**Priority:** P0
**Type:** Functional

### Objective

Verify that the memoized value in `ScenarioProvider` correctly produces a new reference when a dependency actually changes (e.g., `setScenario` is called), ensuring memoization does not suppress legitimate updates.

### Preconditions

- ScenarioProvider rendered, initial data loaded

### Steps

1. Render `useScenario()` and wait for loading to complete. Capture the context value reference.
   **Expected:** Valid context object for `midweek`.

2. Call `setScenario('playoffs')`. Wait for loading to complete.
   **Expected:** The context value reference is now different from the one captured in step 1. `scenario === 'playoffs'`. `players` contains playoff player data.

### Test Data

- Switch from `midweek` to `playoffs`

### Edge Cases

- Verify that `scenarioLoading` transitioning `true → false` also produces a new value reference.
- Verify `scenarioVersion` increment produces a new value reference.

---

## TC-007: SimulationContext value updates when tick advances

**Priority:** P0
**Type:** Functional

### Objective

Verify that the memoized value in `SimulationProvider` produces a new reference when `tick` increments (i.e., the dependency array correctly lists `tick`).

### Preconditions

- Full provider stack rendered
- Live or superbowl scenario active and playing

### Steps

1. Switch to `live` scenario and wait for loading. Capture the context value reference.
   **Expected:** `isPlaying === true`, `tick === 0`.

2. Wait for at least one tick interval (~1 second).
   **Expected:** `tick > 0`. The context value reference has changed.

### Test Data

- `live` scenario with unified timeline

### Edge Cases

- When simulation reaches the end of the timeline and `isPlaying` flips to `false`, verify the value reference updates one final time.

---

## TC-008: TradingContext value updates after a buy transaction

**Priority:** P0
**Type:** Functional

### Objective

Verify that the memoized value in `TradingProvider` produces a new reference when `portfolio` or `cash` changes due to a trade.

### Preconditions

- Full provider stack rendered, scenario loaded, sufficient cash

### Steps

1. Render `useTrading()` and wait for scenario loading. Capture the context value reference and `cash`.
   **Expected:** `cash === 10000` (initial).

2. Call `buyShares('mahomes', 1)`.
   **Expected:** `cash < 10000`. The context value reference has changed from step 1.

### Test Data

- Player `mahomes`, buy 1 share

### Edge Cases

- After a failed buy (insufficient funds), the value reference should remain unchanged (no unnecessary update).

---

## TC-009: SocialContext value updates when watchlist changes

**Priority:** P0
**Type:** Functional

### Objective

Verify that the memoized value in `SocialProvider` produces a new reference when `watchlist` state changes.

### Preconditions

- Full provider stack rendered, scenario loaded

### Steps

1. Render `useSocial()` and wait for scenario loading. Capture the context value reference.
   **Expected:** `watchlist` is empty `[]`.

2. Call `addToWatchlist('mahomes')`.
   **Expected:** `watchlist` contains `'mahomes'`. The context value reference has changed.

### Test Data

- Player `mahomes`

### Edge Cases

- Adding a duplicate player to watchlist should NOT produce a new value reference (the `addToWatchlist` callback already guards against duplicates, so state doesn't change).

---

## TC-010: Functional regression — all existing context tests still pass

**Priority:** P0
**Type:** Regression

### Objective

Verify that wrapping values in `useMemo` introduces no behavioral regressions. The full existing test suite must continue to pass.

### Preconditions

- All four context files have been modified with `useMemo`
- Node modules installed

### Steps

1. Run `npm run test:run`.
   **Expected:** All tests pass. Zero failures. Exit code 0.

### Test Data

- Full existing test suite (37 test files)

### Edge Cases

- Pay special attention to tests that assert on object shapes (e.g., `toHaveProperty`) to ensure memoization hasn't changed the value structure.

---

## TC-011: Build gate — project compiles after changes

**Priority:** P0
**Type:** Regression

### Objective

Verify that the memoized code compiles without TypeScript errors, confirming correct `useMemo` return types and dependency arrays.

### Preconditions

- All four context files modified

### Steps

1. Run `npm run build`.
   **Expected:** Build completes successfully with exit code 0. No TypeScript errors.

### Test Data

- N/A

### Edge Cases

- Ensure `useMemo` is imported in files that don't already import it (ScenarioContext, TradingContext, SocialContext currently lack it).

---

## TC-012: useMemo dependency completeness — no missing dependencies

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `useMemo` dependency arrays are complete, so that ESLint's `react-hooks/exhaustive-deps` rule does not flag warnings. An incomplete dep array would mean stale values are served to consumers.

### Preconditions

- All four context files modified
- ESLint configured with react-hooks plugin

### Steps

1. Run the project linter (or `npx eslint src/context/ScenarioContext.tsx src/context/SimulationContext.tsx src/context/TradingContext.tsx src/context/SocialContext.tsx --rule '{"react-hooks/exhaustive-deps": "error"}'`).
   **Expected:** No `react-hooks/exhaustive-deps` warnings or errors related to the `useMemo` calls.

### Test Data

- ScenarioContext value deps: `scenario`, `setScenario`, `currentData`, `players`, `scenarioLoading`, `scenarioVersion`
- SimulationContext value deps: `tick`, `isPlaying`, `setIsPlaying`, `priceOverrides`, `history`, `unifiedTimeline`, `playoffDilutionApplied`, `isEspnLiveMode`, `espnNews`, `espnLoading`, `espnError`, `espnPriceHistory`, `goToHistoryPoint`, `applyPlayoffDilution`, `refreshEspnNews`, `getUnifiedTimeline`
- TradingContext value deps: `portfolio`, `cash`, `buyShares`, `sellShares`, `getEffectivePrice`, `getPlayer`, `getPlayers`, `getPortfolioValue`
- SocialContext value deps: `watchlist`, `missionPicks`, `missionRevealed`, `addToWatchlist`, `removeFromWatchlist`, `isWatching`, `setMissionPick`, `clearMissionPick`, `revealMission`, `resetMission`, `getMissionScore`, `getLeaderboardRankings`, `getLeagueHoldingsFn`, `getLeagueMembers`

### Edge Cases

- Stable references (e.g., `useCallback` outputs) are included in the dep array even though they never change; this is correct and should not be flagged.

---

## TC-013: Consumer re-render count reduced during simulation ticks

**Priority:** P1
**Type:** Integration

### Objective

Verify the primary motivation: consumers of contexts unaffected by a tick (e.g., a component that only consumes `SocialContext`) do NOT re-render when `SimulationContext` ticks. The context decomposition + memoization together should isolate re-renders.

### Preconditions

- Full provider stack rendered
- Live scenario active and playing
- A render-counting test component that consumes only `useSocial()`

### Steps

1. Create a test component that calls `useSocial()` and increments a render counter ref.
   **Expected:** Component renders once on mount.

2. Let the simulation tick 3–5 times.
   **Expected:** The social-only consumer's render count has NOT increased beyond the initial render. Only `SimulationContext` consumers should re-render on tick.

### Test Data

- `live` scenario, auto-playing

### Edge Cases

- A component consuming both `useSimulation()` and `useSocial()` WILL re-render on tick (expected behavior; this confirms the tick is propagating through SimulationContext).

---

## TC-014: Scenario switch correctly invalidates all memoized values

**Priority:** P1
**Type:** Integration

### Objective

Verify that switching scenarios causes all four context value objects to produce new references with updated data, confirming that memoization does not "cache across" a scenario reset.

### Preconditions

- Full provider stack rendered, midweek scenario loaded

### Steps

1. Capture all four context value references (scenario, simulation, trading, social).
   **Expected:** All valid for midweek.

2. Call `setScenario('playoffs')`. Wait for loading to complete.
   **Expected:** All four context value references have changed. `scenario === 'playoffs'`. `tick === 0`. `cash === 10000` (reset). `missionPicks` is empty (reset).

3. Verify functional correctness: `getPlayers()` returns playoff players, `buyShares` works against new data.
   **Expected:** All operations work correctly with the new scenario data.

### Test Data

- Switch from `midweek` to `playoffs`

### Edge Cases

- Rapid switching (`midweek → live → playoffs → superbowl`) settles on the last scenario with correct memoized values for that scenario only.
