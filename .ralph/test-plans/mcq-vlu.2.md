# Test Plan: mcq-vlu.2 -- Create SimulationContext

## Summary

- **Bead:** `mcq-vlu.2`
- **Feature:** SimulationContext owning simulation engine lifecycle, price overrides, unified timeline, tick state, and history — with engine selection based on active scenario and full reset on scenarioVersion change
- **Total Test Cases:** 33
- **Test Types:** Functional, Integration

---

## TC-001: SimulationProvider renders and useSimulation returns correct shape

**Priority:** P0
**Type:** Functional

### Objective

Verify that `SimulationProvider` renders without error and `useSimulation` returns an object containing all documented state and action properties with correct types.

### Preconditions

- `SimulationProvider` wraps a test consumer, nested inside `ScenarioProvider`
- Initial scenario data has loaded

### Steps

1. Render a component inside `<ScenarioProvider><SimulationProvider>` that calls `useSimulation()`
   **Expected:** Hook returns an object with keys: `tick`, `isPlaying`, `setIsPlaying`, `priceOverrides`, `history`, `unifiedTimeline`, `playoffDilutionApplied`, `isEspnLiveMode`, `espnNews`, `espnLoading`, `espnError`, `espnPriceHistory`, `goToHistoryPoint`, `applyPlayoffDilution`, `refreshEspnNews`, `getUnifiedTimeline`

2. Check types of each returned value
   **Expected:** `tick` is number, `isPlaying` is boolean, `setIsPlaying` is function, `priceOverrides` is object, `history` is array, `unifiedTimeline` is array, `playoffDilutionApplied` is boolean, `isEspnLiveMode` is boolean, `espnNews` is array, `espnLoading` is boolean, `espnError` is null or string, `espnPriceHistory` is object, `goToHistoryPoint` is function, `applyPlayoffDilution` is function, `refreshEspnNews` is function, `getUnifiedTimeline` is function

### Test Data

- Default scenario: `'midweek'`

### Edge Cases

- Children of `SimulationProvider` render normally without blocking or throwing

---

## TC-002: useSimulation throws when used outside SimulationProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `useSimulation` outside of a `SimulationProvider` throws a descriptive error, preventing silent null context bugs.

### Preconditions

- No `SimulationProvider` in the component tree

### Steps

1. Render a component that calls `useSimulation()` without any `SimulationProvider` ancestor
   **Expected:** Throws an error with message `"useSimulation must be used within a SimulationProvider"`

### Test Data

- N/A

### Edge Cases

- Nesting `useSimulation` inside `ScenarioProvider` alone (without `SimulationProvider`) should still throw

---

## TC-003: Default state values on initial mount

**Priority:** P0
**Type:** Functional

### Objective

Verify that all state fields initialize to their expected default values before any scenario interaction occurs.

### Preconditions

- `SimulationProvider` rendered inside `ScenarioProvider` with default `'midweek'` scenario
- No scenario switch has been triggered (scenarioVersion is 0)

### Steps

1. Read `tick` immediately
   **Expected:** `0`

2. Read `isPlaying` immediately
   **Expected:** `false`

3. Read `priceOverrides` immediately
   **Expected:** Empty object `{}`

4. Read `playoffDilutionApplied`
   **Expected:** `false`

5. Read `isEspnLiveMode`
   **Expected:** `false` (default scenario is `'midweek'`, not `'espn-live'`)

6. Read `espnNews`
   **Expected:** Empty array `[]`

7. Read `espnLoading`
   **Expected:** `false`

8. Read `espnError`
   **Expected:** `null`

9. Read `espnPriceHistory`
   **Expected:** Empty object `{}`

### Test Data

- Default scenario: `'midweek'`

### Edge Cases

- `history` may be empty array initially (before players load) or may already contain the initial snapshot entry if players loaded synchronously

---

## TC-004: Initial history entry created when players load

**Priority:** P0
**Type:** Functional

### Objective

Verify that when players first become available (initial mount, scenarioVersion 0), an initial history snapshot is created containing all player prices.

### Preconditions

- `SimulationProvider` rendered inside `ScenarioProvider`
- `scenarioVersion` is `0` (no scenario switch yet)
- Players have loaded (non-empty array)

### Steps

1. Wait for players to load from the default scenario
   **Expected:** `players` array is non-empty

2. Read `history`
   **Expected:** Array with exactly one entry

3. Inspect `history[0]`
   **Expected:** `tick` is `0`, `action` is `'Scenario loaded'`, `prices` is an object with a key for each player ID mapped to their current price from `priceHistory`

### Test Data

- Default scenario: `'midweek'` with known player data

### Edge Cases

- If players array is empty (no players in scenario data), no initial history entry should be created
- The initial history entry should not be duplicated on re-render

---

## TC-005: Unified timeline built for live scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the active scenario is `'live'`, `unifiedTimeline` is computed by merging all players' `priceHistory` arrays into a single chronologically sorted array.

### Preconditions

- `ScenarioProvider` is set to `'live'` scenario
- `SimulationProvider` is rendered
- Players have loaded with `priceHistory` entries

### Steps

1. Switch scenario to `'live'` and wait for players to load
   **Expected:** Players load with `priceHistory` arrays

2. Read `unifiedTimeline`
   **Expected:** Non-empty array of `TimelineEntry` objects

3. Verify timeline entries are sorted by `timestamp` ascending
   **Expected:** Each entry's timestamp is >= the previous entry's timestamp

4. Verify timeline entries include data from multiple players
   **Expected:** Entries contain varying `playerId` values matching loaded players

### Test Data

- Scenario: `'live'` (loads `live.json`)

### Edge Cases

- If all players have empty `priceHistory`, `unifiedTimeline` should be `[]`

---

## TC-006: Unified timeline built for superbowl scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `'superbowl'` scenario also triggers unified timeline construction, identically to the `'live'` scenario.

### Preconditions

- `ScenarioProvider` is set to `'superbowl'` scenario
- `SimulationProvider` is rendered

### Steps

1. Switch scenario to `'superbowl'` and wait for players to load
   **Expected:** Players load

2. Read `unifiedTimeline`
   **Expected:** Non-empty array of `TimelineEntry` objects, sorted chronologically

### Test Data

- Scenario: `'superbowl'` (loads `superbowl.json`)

### Edge Cases

- N/A (parallel to TC-005 for a different scenario)

---

## TC-007: Unified timeline is empty for non-live scenarios

**Priority:** P0
**Type:** Functional

### Objective

Verify that for scenarios other than `'live'` and `'superbowl'` (i.e., `'midweek'`, `'playoffs'`, `'espn-live'`), the `unifiedTimeline` is an empty array.

### Preconditions

- `SimulationProvider` is rendered

### Steps

1. Set scenario to `'midweek'` and wait for load
   **Expected:** `unifiedTimeline` is `[]`

2. Set scenario to `'playoffs'` and wait for load
   **Expected:** `unifiedTimeline` is `[]`

3. Set scenario to `'espn-live'` and wait for load
   **Expected:** `unifiedTimeline` is `[]`

### Test Data

- Scenarios: `'midweek'`, `'playoffs'`, `'espn-live'`

### Edge Cases

- N/A

---

## TC-008: isEspnLiveMode is true only for espn-live scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that `isEspnLiveMode` is derived solely from the scenario name, being `true` when `scenario === 'espn-live'` and `false` for all other scenarios.

### Preconditions

- `SimulationProvider` is rendered

### Steps

1. Set scenario to `'midweek'`
   **Expected:** `isEspnLiveMode` is `false`

2. Set scenario to `'live'`
   **Expected:** `isEspnLiveMode` is `false`

3. Set scenario to `'espn-live'`
   **Expected:** `isEspnLiveMode` is `true`

4. Switch back to `'playoffs'`
   **Expected:** `isEspnLiveMode` is `false`

### Test Data

- All scenario IDs

### Edge Cases

- N/A

---

## TC-009: Full state reset on scenarioVersion change

**Priority:** P0
**Type:** Integration

### Objective

Verify that when `scenarioVersion` changes (triggered by `setScenario` in ScenarioContext), SimulationContext resets all simulation state: `tick`, `priceOverrides`, `playoffDilutionApplied`, ESPN state, and history.

### Preconditions

- `SimulationProvider` is rendered
- Simulation has been running with non-default state (e.g., tick > 0, priceOverrides populated, history has multiple entries)

### Steps

1. Start with `'live'` scenario, let tick advance to > 0 so `priceOverrides` and `history` are populated
   **Expected:** `tick > 0`, `priceOverrides` has entries, `history.length > 1`

2. Call `setScenario('midweek')` to trigger a scenarioVersion increment
   **Expected:** `tick` resets to `0`

3. Read `priceOverrides`
   **Expected:** Empty object `{}`

4. Read `playoffDilutionApplied`
   **Expected:** `false`

5. Read `espnNews`
   **Expected:** `[]`

6. Read `espnError`
   **Expected:** `null`

7. Read `espnPriceHistory`
   **Expected:** `{}`

8. Read `history`
   **Expected:** Single entry (the new initial snapshot) with `tick: 0`

### Test Data

- Initial scenario: `'live'`; target scenario: `'midweek'`

### Edge Cases

- Reset should also clear `processedArticleIds` (internal state) so that re-entering `'espn-live'` reprocesses articles from scratch

---

## TC-010: Reset auto-starts playing for live scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that when resetting to the `'live'` scenario, `isPlaying` is automatically set to `true`.

### Preconditions

- `SimulationProvider` is rendered with some non-live scenario
- `isPlaying` is `false`

### Steps

1. Set scenario to `'live'`
   **Expected:** After reset, `isPlaying` is `true`

### Test Data

- Switch from `'midweek'` to `'live'`

### Edge Cases

- Same behavior expected for `'superbowl'` (isPlaying auto-starts)

---

## TC-011: Reset auto-starts playing for superbowl scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that when resetting to the `'superbowl'` scenario, `isPlaying` is automatically set to `true`.

### Preconditions

- `SimulationProvider` is rendered with a non-superbowl scenario

### Steps

1. Set scenario to `'superbowl'`
   **Expected:** After reset, `isPlaying` is `true`

### Test Data

- Switch from `'midweek'` to `'superbowl'`

### Edge Cases

- N/A

---

## TC-012: Reset does NOT auto-start playing for non-live/superbowl scenarios

**Priority:** P0
**Type:** Functional

### Objective

Verify that when resetting to `'midweek'`, `'playoffs'`, or `'espn-live'`, `isPlaying` is `false` after the reset.

### Preconditions

- `SimulationProvider` is rendered
- `isPlaying` was `true` (e.g., from a prior `'live'` scenario)

### Steps

1. Set scenario from `'live'` to `'midweek'`
   **Expected:** `isPlaying` is `false`

2. Set scenario to `'playoffs'`
   **Expected:** `isPlaying` is `false`

3. Set scenario to `'espn-live'`
   **Expected:** `isPlaying` is `false`

### Test Data

- Non-live scenarios: `'midweek'`, `'playoffs'`, `'espn-live'`

### Edge Cases

- N/A

---

## TC-013: Reset creates initial history with correct prices per scenario type

**Priority:** P0
**Type:** Functional

### Objective

Verify that the reset effect creates an initial history entry where prices are derived from `getCurrentPriceFromHistory` for standard scenarios and from `player.basePrice` for `'espn-live'`.

### Preconditions

- `SimulationProvider` is rendered
- Players have loaded

### Steps

1. Set scenario to `'live'` and wait for reset to complete
   **Expected:** `history[0].prices` maps each player ID to the value returned by `getCurrentPriceFromHistory(player)`; `history[0].action` is `'Scenario loaded'`

2. Set scenario to `'espn-live'` and wait for reset to complete
   **Expected:** `history[0].prices` maps each player ID to `player.basePrice`; `history[0].action` is `'ESPN Live mode activated - fetching real news...'`

### Test Data

- Players with known `basePrice` and `priceHistory` values

### Edge Cases

- Player with no `priceHistory` in a standard scenario should fall back to `basePrice` via `getCurrentPriceFromHistory`

---

## TC-014: Reset skipped when scenarioVersion is 0

**Priority:** P1
**Type:** Functional

### Objective

Verify that the scenarioVersion reset effect does not fire on initial mount (when `scenarioVersion === 0`). The initial history is instead handled by a separate mount effect.

### Preconditions

- `SimulationProvider` is rendered fresh
- `scenarioVersion` is `0`

### Steps

1. Render `SimulationProvider` and observe the reset effect
   **Expected:** The reset effect early-returns without clearing state or creating a history entry

2. Wait for players to load
   **Expected:** The separate initial-mount effect creates the first history entry

### Test Data

- Default scenario: `'midweek'`

### Edge Cases

- N/A

---

## TC-015: Tick interval advances through unified timeline

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `isPlaying` is `true` for a `'live'` or `'superbowl'` scenario with a non-empty `unifiedTimeline`, a tick interval fires at `TICK_INTERVAL_MS` and advances `tick`, updates `priceOverrides`, and appends to `history`.

### Preconditions

- Scenario is `'live'` with loaded players and non-empty `unifiedTimeline`
- `isPlaying` is `true`

### Steps

1. Wait for at least one tick interval to fire
   **Expected:** `tick` increments from `0` to `1`

2. Read `priceOverrides`
   **Expected:** Contains an entry for the player in `unifiedTimeline[1]` with the corresponding price

3. Read `history`
   **Expected:** New entry appended with `tick: 1`, `action` matching the timeline entry's reason headline, and `playerId`/`playerName` from the timeline entry

### Test Data

- Scenario: `'live'` with known timeline entries
- `TICK_INTERVAL_MS` constant value

### Edge Cases

- If `unifiedTimeline` has only one entry (index 0), the first tick should stop playback since there's nothing at index 1

---

## TC-016: Simulation stops when tick reaches end of timeline

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `tick` reaches the last index of `unifiedTimeline`, `isPlaying` is set to `false` and the interval is cleared.

### Preconditions

- `'live'` scenario with a short `unifiedTimeline` (e.g., 3 entries)
- `isPlaying` is `true`

### Steps

1. Let the simulation tick until `tick` would exceed `unifiedTimeline.length - 1`
   **Expected:** `isPlaying` becomes `false`

2. Read `tick`
   **Expected:** `tick` equals `unifiedTimeline.length - 1` (the last valid index)

3. Wait additional time beyond one tick interval
   **Expected:** `tick` does not increment further; no additional history entries are appended

### Test Data

- Short timeline with known length

### Edge Cases

- Empty `unifiedTimeline` (`length === 0`): the tick effect should not start an interval at all

---

## TC-017: Tick interval cleared on unmount

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `SimulationProvider` unmounts while a tick interval is active, the interval is properly cleared to prevent memory leaks and stale setState calls.

### Preconditions

- `'live'` scenario with `isPlaying` true and tick interval running

### Steps

1. Unmount the `SimulationProvider` while the tick interval is active
   **Expected:** No React warnings about setState on unmounted component; no errors in console

2. Wait beyond several tick intervals
   **Expected:** No additional ticks fire

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-018: setIsPlaying toggles play/pause

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `setIsPlaying(true)` starts the tick interval and `setIsPlaying(false)` stops it.

### Preconditions

- `'live'` scenario with non-empty `unifiedTimeline`

### Steps

1. Read initial `isPlaying` after reset
   **Expected:** `true` (auto-started for live scenario)

2. Call `setIsPlaying(false)`
   **Expected:** `isPlaying` is `false`; tick stops advancing

3. Record current `tick` value, wait beyond one `TICK_INTERVAL_MS`
   **Expected:** `tick` has not changed

4. Call `setIsPlaying(true)`
   **Expected:** `isPlaying` is `true`; tick resumes advancing from where it left off

### Test Data

- Scenario: `'live'`

### Edge Cases

- Calling `setIsPlaying(true)` when already playing should not create a duplicate interval
- Calling `setIsPlaying(false)` when already paused is a no-op

---

## TC-019: goToHistoryPoint restores state at given index

**Priority:** P0
**Type:** Functional

### Objective

Verify that `goToHistoryPoint(index)` restores `priceOverrides` and `tick` to the state captured at `history[index]`, and truncates history to that point.

### Preconditions

- `'live'` scenario with several history entries accumulated (tick has advanced multiple times)

### Steps

1. Let the simulation run until `history` has at least 4 entries
   **Expected:** `history.length >= 4`

2. Call `goToHistoryPoint(1)`
   **Expected:** `priceOverrides` matches `history[1].prices`

3. Read `tick`
   **Expected:** Equals `history[1].tick`

4. Read `history`
   **Expected:** `history.length === 2` (entries 0 and 1; everything after index 1 is truncated)

### Test Data

- Known history entries from live scenario simulation

### Edge Cases

- `goToHistoryPoint(0)` should restore to the initial snapshot

---

## TC-020: goToHistoryPoint with invalid index does nothing

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `goToHistoryPoint` with an out-of-bounds index (negative or >= history.length) is a no-op.

### Preconditions

- `SimulationProvider` rendered with some history entries

### Steps

1. Record current `tick`, `priceOverrides`, and `history.length`
   **Expected:** Known values

2. Call `goToHistoryPoint(-1)`
   **Expected:** No state change; `tick`, `priceOverrides`, and `history` remain unchanged

3. Call `goToHistoryPoint(history.length)` (one past the last valid index)
   **Expected:** No state change

4. Call `goToHistoryPoint(999)`
   **Expected:** No state change

### Test Data

- N/A

### Edge Cases

- `goToHistoryPoint` called when `history` is empty should be a no-op

---

## TC-021: applyPlayoffDilution adjusts prices for playoffs scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that `applyPlayoffDilution(percent)` multiplies each non-buyback player's current price by `(1 - percent/100)` and records a dilution history entry.

### Preconditions

- Scenario is `'playoffs'`
- `playoffDilutionApplied` is `false`
- Players have loaded with known prices

### Steps

1. Record current prices for all players (from `priceOverrides` or `getCurrentPriceFromHistory`)
   **Expected:** Known prices

2. Call `applyPlayoffDilution(25)` (25% dilution)
   **Expected:** `priceOverrides` for each non-buyback player is `currentPrice * 0.75`, rounded to 2 decimal places

3. Verify buyback players are unaffected
   **Expected:** Players with `isBuyback === true` have unchanged prices in `priceOverrides`

4. Read `playoffDilutionApplied`
   **Expected:** `true`

5. Read last entry in `history`
   **Expected:** Contains `action` matching `'Playoff stock issuance: 25% dilution applied'`

### Test Data

- Scenario: `'playoffs'` with mix of regular and buyback players
- Dilution percent: `25`

### Edge Cases

- `applyPlayoffDilution(0)` should result in no price change (multiplier is 1.0)
- `applyPlayoffDilution(100)` should result in prices of `0.00` for non-buyback players

---

## TC-022: applyPlayoffDilution can only be applied once

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `applyPlayoffDilution` a second time is a no-op once `playoffDilutionApplied` is `true`.

### Preconditions

- Scenario is `'playoffs'`
- `applyPlayoffDilution(25)` has already been called

### Steps

1. Record `priceOverrides` after first dilution
   **Expected:** Diluted prices

2. Call `applyPlayoffDilution(50)` (a second dilution attempt)
   **Expected:** `priceOverrides` remain unchanged from step 1; no new history entry appended

3. Read `playoffDilutionApplied`
   **Expected:** Still `true`

### Test Data

- N/A

### Edge Cases

- After a scenario reset (scenarioVersion change), `playoffDilutionApplied` resets to `false`, allowing dilution on the next playoffs scenario

---

## TC-023: applyPlayoffDilution is no-op for non-playoffs scenarios

**Priority:** P1
**Type:** Functional

### Objective

Verify that `applyPlayoffDilution` does nothing when the active scenario is not `'playoffs'`.

### Preconditions

- Scenario is `'live'` (or any non-playoffs scenario)
- `playoffDilutionApplied` is `false`

### Steps

1. Call `applyPlayoffDilution(25)`
   **Expected:** `priceOverrides` remain unchanged; `playoffDilutionApplied` remains `false`; no history entry appended

### Test Data

- Scenarios: `'midweek'`, `'live'`, `'superbowl'`, `'espn-live'`

### Edge Cases

- N/A

---

## TC-024: ESPN fetch triggers on espn-live activation

**Priority:** P0
**Type:** Integration

### Objective

Verify that when the scenario switches to `'espn-live'`, the ESPN news fetch is triggered immediately and `espnLoading` reflects the loading state.

### Preconditions

- `SimulationProvider` rendered
- ESPN API (or mock) is available
- Scenario is not yet `'espn-live'`

### Steps

1. Set scenario to `'espn-live'` and wait for reset
   **Expected:** `isEspnLiveMode` becomes `true`

2. Observe `espnLoading`
   **Expected:** Transitions to `true` during fetch, then back to `false` on completion

3. Read `espnNews` after fetch completes
   **Expected:** Array of article objects from the ESPN API response

### Test Data

- Mock ESPN API returning known articles

### Edge Cases

- If the ESPN API returns an empty articles array, `espnNews` should be `[]` and `espnError` should be `null`

---

## TC-025: ESPN auto-refresh runs on interval

**Priority:** P1
**Type:** Functional

### Objective

Verify that while in `'espn-live'` mode, the ESPN fetch runs automatically at `ESPN_REFRESH_MS` intervals.

### Preconditions

- Scenario is `'espn-live'`
- Mock ESPN API is available

### Steps

1. Set scenario to `'espn-live'` and wait for initial fetch
   **Expected:** First fetch completes

2. Advance timers by `ESPN_REFRESH_MS`
   **Expected:** A second fetch is triggered

3. Advance timers by another `ESPN_REFRESH_MS`
   **Expected:** A third fetch is triggered

### Test Data

- `ESPN_REFRESH_MS` constant value

### Edge Cases

- The refresh interval should be cleared when leaving `'espn-live'` mode (switching to a different scenario)

---

## TC-026: ESPN fetch updates prices via sentiment analysis

**Priority:** P0
**Type:** Integration

### Objective

Verify that ESPN articles relevant to a player trigger sentiment analysis, price recalculation, and updates to `priceOverrides`, `espnPriceHistory`, and `history`.

### Preconditions

- Scenario is `'espn-live'`
- Mock ESPN API returns an article mentioning a known player
- Sentiment and price calculation services are available (or mocked)

### Steps

1. Trigger an ESPN fetch with an article whose headline/description matches a player's `searchTerms`
   **Expected:** `priceOverrides[playerId]` is updated to the new calculated price

2. Read `espnPriceHistory[playerId]`
   **Expected:** Contains at least one entry with sentiment data

3. Read `history`
   **Expected:** New entry appended with `action` starting with `'ESPN:'`, `playerId`, `playerName`, and `sentiment`

### Test Data

- Mock article: `{ id: 'art-1', headline: 'Patrick Mahomes dominates', description: 'Great performance' }`
- Player with `searchTerms: ['Mahomes']`

### Edge Cases

- Article mentioning multiple players should update prices for all matched players

---

## TC-027: Duplicate ESPN articles are not reprocessed

**Priority:** P1
**Type:** Functional

### Objective

Verify that articles already processed (tracked by `processedArticleIds`) are skipped on subsequent fetches, preventing duplicate price impacts.

### Preconditions

- Scenario is `'espn-live'`
- An initial fetch has processed article `id: 'art-1'`

### Steps

1. Record `priceOverrides` after initial fetch
   **Expected:** Known values

2. Trigger a second fetch that returns the same article `id: 'art-1'`
   **Expected:** `priceOverrides` remain unchanged; no new history entry for this article

3. Trigger a fetch that includes `id: 'art-1'` AND a new `id: 'art-2'`
   **Expected:** Only `art-2` is processed; `art-1` is skipped

### Test Data

- Mock articles with known IDs

### Edge Cases

- After a scenario reset (leaving and re-entering `'espn-live'`), `processedArticleIds` should be cleared, allowing previously seen articles to be reprocessed

---

## TC-028: ESPN fetch error captured in espnError

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the ESPN API fetch fails, the error is captured in `espnError` and `espnLoading` returns to `false`.

### Preconditions

- Scenario is `'espn-live'`
- ESPN API mock is configured to reject

### Steps

1. Mock `fetchNFLNews` to throw `new Error('Network timeout')`
   **Expected:** Mock in place

2. Trigger the ESPN fetch
   **Expected:** `espnLoading` transitions to `true`, then back to `false`

3. Read `espnError`
   **Expected:** `'Network timeout'`

4. Read `espnNews`
   **Expected:** Remains `[]` (or whatever it was before the failed fetch)

### Test Data

- Mock error: `new Error('Network timeout')`

### Edge Cases

- Non-Error thrown value: if the fetch throws a non-Error object, `espnError` should fall back to `'Failed to fetch ESPN news'`
- After a successful subsequent fetch, `espnError` should be cleared to `null`

---

## TC-029: refreshEspnNews manually triggers fetch in espn-live mode

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `refreshEspnNews()` triggers an immediate ESPN news fetch when in `'espn-live'` mode, independent of the auto-refresh interval.

### Preconditions

- Scenario is `'espn-live'`
- Initial auto-fetch has completed

### Steps

1. Call `refreshEspnNews()`
   **Expected:** `espnLoading` transitions to `true`, then `false` after fetch completes

2. Verify new articles are processed
   **Expected:** Any new (unprocessed) articles update prices and history

### Test Data

- Mock ESPN API with new articles not yet seen

### Edge Cases

- Calling `refreshEspnNews()` when NOT in `'espn-live'` mode should be a no-op (no fetch triggered, no loading state change)

---

## TC-030: ESPN refresh interval cleared on scenario change

**Priority:** P1
**Type:** Functional

### Objective

Verify that switching away from `'espn-live'` to another scenario clears the ESPN auto-refresh interval, preventing stale fetches.

### Preconditions

- Scenario is `'espn-live'` with auto-refresh running

### Steps

1. Set scenario to `'live'` (leave espn-live)
   **Expected:** ESPN refresh interval is cleared

2. Advance timers by several `ESPN_REFRESH_MS` intervals
   **Expected:** No ESPN fetches are triggered

3. Read `isEspnLiveMode`
   **Expected:** `false`

### Test Data

- N/A

### Edge Cases

- Re-entering `'espn-live'` should start a fresh interval

---

## TC-031: getUnifiedTimeline returns the computed timeline

**Priority:** P2
**Type:** Functional

### Objective

Verify that `getUnifiedTimeline()` returns the same array as the `unifiedTimeline` state value.

### Preconditions

- `SimulationProvider` rendered with `'live'` scenario

### Steps

1. Read `unifiedTimeline` from context
   **Expected:** Non-empty array

2. Call `getUnifiedTimeline()`
   **Expected:** Returns the same array reference or equivalent content as `unifiedTimeline`

### Test Data

- Scenario: `'live'`

### Edge Cases

- For non-live scenarios, `getUnifiedTimeline()` should return `[]`

---

## TC-032: SimulationContext requires ScenarioContext as ancestor

**Priority:** P0
**Type:** Integration

### Objective

Verify that `SimulationProvider` depends on `ScenarioContext` (via `useScenario`) and throws or errors if rendered without `ScenarioProvider` as an ancestor.

### Preconditions

- No `ScenarioProvider` in the component tree

### Steps

1. Render `<SimulationProvider>` without any `ScenarioProvider` ancestor
   **Expected:** Throws an error (from `useScenario` hook: `"useScenario must be used within a ScenarioProvider"`)

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-033: Multiple rapid scenario switches reset cleanly

**Priority:** P1
**Type:** Integration

### Objective

Verify that rapidly switching scenarios (triggering multiple scenarioVersion increments) results in a clean final state corresponding to the last selected scenario, with no leaked intervals or stale state.

### Preconditions

- `SimulationProvider` rendered

### Steps

1. Rapidly call `setScenario('live')`, `setScenario('espn-live')`, `setScenario('playoffs')` in quick succession
   **Expected:** Final state corresponds to `'playoffs'` scenario

2. Read `isPlaying`
   **Expected:** `false` (playoffs does not auto-start)

3. Read `isEspnLiveMode`
   **Expected:** `false` (not espn-live)

4. Read `unifiedTimeline`
   **Expected:** `[]` (playoffs doesn't build timeline)

5. Wait for several tick intervals
   **Expected:** No tick changes, no ESPN fetches — all stale intervals from intermediate scenarios are cleared

### Test Data

- Scenario sequence: `'live'` → `'espn-live'` → `'playoffs'`

### Edge Cases

- Intermediate `'live'` scenario's tick interval should be cleaned up before the final `'playoffs'` state settles
