# Test Plan: mcq-vlu -- State Management: Split GameContext

## Summary

- **Bead:** `mcq-vlu`
- **Feature:** Replace monolithic GameContext.jsx with four domain-specific contexts (ScenarioContext, SimulationContext, TradingContext, SocialContext) each with its own provider, hook, and isolated re-render boundary
- **Total Test Cases:** 32
- **Test Types:** Functional, Integration, Regression

---

## TC-001: ScenarioContext exposes useScenario hook with correct initial state

**Priority:** P0
**Type:** Functional

### Objective

Verify that ScenarioContext provides the `useScenario` hook and that its default state matches the old GameContext defaults (scenario = 'midweek', scenarioLoading = true initially, currentData = null until loaded).

### Preconditions

- ScenarioProvider is rendered wrapping a test consumer component
- localStorage is cleared

### Steps

1. Render a component inside `<ScenarioProvider>` that calls `useScenario()`
   **Expected:** Hook returns an object containing `scenario`, `currentData`, `players`, `scenarioLoading`, and `setScenario`

2. Check `scenario` before any interaction
   **Expected:** Value is `'midweek'`

3. Check `scenarioLoading` immediately after mount
   **Expected:** Value is `true`

4. Wait for async load to complete
   **Expected:** `scenarioLoading` becomes `false`, `currentData` is non-null, `players` is a non-empty array

### Test Data

- Default scenario: `'midweek'`

### Edge Cases

- Confirm that rendering `useScenario()` outside of `ScenarioProvider` throws a descriptive error

---

## TC-002: ScenarioContext loads scenario data via dynamic import

**Priority:** P0
**Type:** Functional

### Objective

Verify that scenario data is loaded via dynamic `import()` and not via static imports, ensuring code-splitting is preserved.

### Preconditions

- ScenarioProvider is rendered

### Steps

1. Mount ScenarioProvider with default scenario `'midweek'`
   **Expected:** `scenarioLoading` transitions from `true` to `false`

2. Inspect `currentData` after loading completes
   **Expected:** Contains players array with expected player objects (id, name, basePrice, priceHistory)

3. Switch scenario to `'live'`
   **Expected:** `scenarioLoading` goes to `true`, then `false` when new data loads; `currentData` contains live scenario data

### Test Data

- Scenarios: `'midweek'`, `'live'`, `'playoffs'`, `'superbowl'`, `'espn-live'`

### Edge Cases

- Set scenario to an unknown key (e.g., `'nonexistent'`); loading should complete without crashing and `currentData` should remain at previous value or be null

---

## TC-003: ScenarioContext scenarioVersion increments on every switch

**Priority:** P0
**Type:** Functional

### Objective

Verify that `scenarioVersion` counter increments each time `setScenario` is called, enabling downstream contexts to detect resets.

### Preconditions

- ScenarioProvider is rendered and initial load complete

### Steps

1. Record the initial `scenarioVersion` value
   **Expected:** Value is a number (e.g., 0 or 1)

2. Call `setScenario('live')`
   **Expected:** `scenarioVersion` increments by 1

3. Call `setScenario('playoffs')`
   **Expected:** `scenarioVersion` increments by 1 again

4. Call `setScenario('playoffs')` (same scenario)
   **Expected:** `scenarioVersion` still increments (switch is switch, even to same scenario)

### Test Data

- N/A

### Edge Cases

- Rapid successive calls to `setScenario` should each produce a unique version value (no lost increments)

---

## TC-004: ScenarioContext persists scenario selection via storageService

**Priority:** P1
**Type:** Functional

### Objective

Verify that the selected scenario is persisted through storageService and restored on remount.

### Preconditions

- storageService is functional
- localStorage is cleared

### Steps

1. Render ScenarioProvider, switch to `'playoffs'`
   **Expected:** `scenario` is `'playoffs'`

2. Unmount and re-render a new ScenarioProvider
   **Expected:** `scenario` initializes as `'playoffs'` (read from storage)

### Test Data

- Storage key: `STORAGE_KEYS.scenario`

### Edge Cases

- Corrupt value in storage (e.g., a number instead of a string) should fall back to `'midweek'`

---

## TC-005: SimulationContext exposes useSimulation hook with correct initial state

**Priority:** P0
**Type:** Functional

### Objective

Verify that SimulationContext provides tick, isPlaying, priceOverrides, history, and ESPN-related state with correct defaults.

### Preconditions

- SimulationProvider is rendered inside ScenarioProvider
- Default scenario is loaded

### Steps

1. Call `useSimulation()` inside the provider tree
   **Expected:** Returns object with `tick`, `isPlaying`, `priceOverrides`, `history`, `espnNews`, `espnLoading`, `espnError`

2. Check initial values
   **Expected:** `tick` = 0, `isPlaying` = false, `priceOverrides` = {}, `history` is an array with at least the initial entry

### Test Data

- N/A

### Edge Cases

- Calling `useSimulation()` outside SimulationProvider throws a descriptive error

---

## TC-006: SimulationContext selects correct engine based on scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that SimulationContext instantiates TimelineSimulationEngine for `'live'`/`'superbowl'` scenarios and EspnSimulationEngine for `'espn-live'`.

### Preconditions

- ScenarioProvider wraps SimulationProvider
- Scenario data is loaded

### Steps

1. Set scenario to `'live'`, start playing
   **Expected:** Simulation ticks advance using unified timeline data; history entries include player price updates from timeline

2. Set scenario to `'espn-live'`
   **Expected:** ESPN news fetching is triggered; `espnLoading` transitions to true then false; `espnNews` populates

3. Set scenario to `'midweek'`
   **Expected:** No simulation engine is active; `isPlaying` is false; tick does not auto-advance

### Test Data

- Scenarios: `'live'`, `'superbowl'`, `'espn-live'`, `'midweek'`

### Edge Cases

- Switching from `'live'` to `'midweek'` while playing stops the tick interval cleanly (no leaked intervals)

---

## TC-007: SimulationContext resets state on scenarioVersion change

**Priority:** P0
**Type:** Functional

### Objective

Verify that switching scenarios (detected via scenarioVersion) resets tick, priceOverrides, history, and ESPN state.

### Preconditions

- SimulationProvider nested inside ScenarioProvider
- A simulation has been running with accumulated state

### Steps

1. Set scenario to `'live'`, let ticks advance so `tick > 0` and `history.length > 1`
   **Expected:** State has accumulated

2. Switch scenario to `'playoffs'`
   **Expected:** `tick` resets to 0, `priceOverrides` clears to `{}`, `history` resets to single initial entry, `espnPriceHistory` clears

### Test Data

- N/A

### Edge Cases

- Switching scenario while `isPlaying` is true should stop playback before resetting

---

## TC-008: SimulationContext caps history array size

**Priority:** P1
**Type:** Functional

### Objective

Verify that the history array does not grow unboundedly but is capped at a configurable maximum.

### Preconditions

- SimulationProvider is rendered
- History max size is configured (e.g., 1000 entries)

### Steps

1. Simulate enough ticks or actions to exceed the configured max history size
   **Expected:** `history.length` does not exceed the configured cap

2. Add one more entry after hitting the cap
   **Expected:** Oldest entry is evicted; newest entry is appended; length stays at cap

### Test Data

- Configurable max size constant

### Edge Cases

- History cap of 0 or 1 should still work without errors

---

## TC-009: SimulationContext goToHistoryPoint navigates timeline

**Priority:** P1
**Type:** Functional

### Objective

Verify that `goToHistoryPoint` restores price overrides and tick to a prior state and truncates future history entries.

### Preconditions

- History has at least 5 entries

### Steps

1. Call `goToHistoryPoint(2)` (third entry, 0-indexed)
   **Expected:** `priceOverrides` match the prices from `history[2]`, `tick` matches `history[2].tick`, `history.length` is 3

2. Call `goToHistoryPoint(-1)` (invalid index)
   **Expected:** No state change; no crash

3. Call `goToHistoryPoint(999)` (beyond array bounds)
   **Expected:** No state change; no crash

### Test Data

- N/A

### Edge Cases

- Calling `goToHistoryPoint` on an empty history should be a no-op

---

## TC-010: SimulationContext applyPlayoffDilution works correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that playoff dilution applies the correct multiplier to non-buyback players and can only be applied once.

### Preconditions

- Scenario is `'playoffs'`
- Players include at least one buyback and one non-buyback player

### Steps

1. Call `applyPlayoffDilution(10)` (10% dilution)
   **Expected:** Non-buyback player prices are reduced by 10%; buyback player prices unchanged; history entry logged

2. Call `applyPlayoffDilution(10)` again
   **Expected:** No-op; prices do not change further (guard flag prevents double application)

3. Switch to scenario `'midweek'`, call `applyPlayoffDilution(10)`
   **Expected:** No-op; dilution only applies in `'playoffs'` scenario

### Test Data

- Dilution percentage: 10
- At least one player with `isBuyback: true`

### Edge Cases

- Dilution of 0% should apply without error but not change prices
- Dilution of 100% should set non-buyback prices to 0

---

## TC-011: SimulationContext refreshEspnNews triggers manual fetch

**Priority:** P1
**Type:** Functional

### Objective

Verify that `refreshEspnNews` triggers an ESPN news fetch only in espn-live mode.

### Preconditions

- Scenario is `'espn-live'`

### Steps

1. Call `refreshEspnNews()`
   **Expected:** `espnLoading` transitions to true, then false; `espnNews` is updated

2. Switch scenario to `'midweek'`, call `refreshEspnNews()`
   **Expected:** No-op; no fetch is triggered

### Test Data

- Mock ESPN API responses

### Edge Cases

- If ESPN fetch fails, `espnError` should be set with a message; `espnLoading` should return to false

---

## TC-012: TradingContext exposes useTrading hook with correct initial state

**Priority:** P0
**Type:** Functional

### Objective

Verify that TradingContext provides portfolio, cash, and trading actions with correct defaults.

### Preconditions

- TradingProvider is rendered inside SimulationProvider > ScenarioProvider
- localStorage is cleared

### Steps

1. Call `useTrading()`
   **Expected:** Returns object with `portfolio`, `cash`, `buyShares`, `sellShares`, `getEffectivePrice`, `getPortfolioValue`

2. Check initial values
   **Expected:** `cash` = `INITIAL_CASH` (10000), `portfolio` = {} (or startingPortfolio from scenario)

### Test Data

- `INITIAL_CASH`: 10000

### Edge Cases

- Calling `useTrading()` outside TradingProvider throws a descriptive error

---

## TC-013: TradingContext buyShares deducts cash and updates portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify that buying shares correctly deducts cash, adds shares to portfolio with correct average cost, and applies user price impact.

### Preconditions

- Scenario loaded with known player prices
- User has sufficient cash

### Steps

1. Call `buyShares('mahomes', 2)` when Mahomes price is known (e.g., $50)
   **Expected:** `cash` decreases by 2 * price; `portfolio['mahomes'].shares` = 2; `portfolio['mahomes'].avgCost` = price; returns `true`

2. Call `buyShares('mahomes', 3)` again
   **Expected:** `portfolio['mahomes'].shares` = 5; `avgCost` is weighted average of both purchases

### Test Data

- Player: `'mahomes'`, known base price

### Edge Cases

- Buy 0 shares: should handle gracefully (no-op or return false)
- Buy fractional shares: behavior should be defined

---

## TC-014: TradingContext buyShares rejects on insufficient cash

**Priority:** P0
**Type:** Functional

### Objective

Verify that attempting to buy more shares than cash allows returns false and does not mutate state.

### Preconditions

- Cash is known, player price is known

### Steps

1. Call `buyShares('mahomes', 1_000_000)` (cost exceeds cash)
   **Expected:** Returns `false`; `cash` unchanged; `portfolio` unchanged

### Test Data

- Extremely large share count to guarantee cost > cash

### Edge Cases

- Buying exactly enough shares to spend all cash (cost === cash) should succeed

---

## TC-015: TradingContext sellShares adds proceeds and updates portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify that selling shares adds proceeds to cash, reduces share count, and applies user price impact.

### Preconditions

- User owns shares of a player

### Steps

1. Buy 5 shares of `'mahomes'`, then sell 2
   **Expected:** `cash` increases by 2 * currentPrice; `portfolio['mahomes'].shares` = 3; returns `true`

2. Sell remaining 3 shares
   **Expected:** `portfolio['mahomes']` is removed entirely (not left as `{ shares: 0 }`); `cash` increases accordingly

### Test Data

- Player: `'mahomes'`

### Edge Cases

- Sell shares of a player not in portfolio: returns `false`
- Sell more shares than owned: returns `false`, no state change

---

## TC-016: TradingContext uses priceResolver.getEffectivePrice

**Priority:** P1
**Type:** Functional

### Objective

Verify that TradingContext delegates effective price computation to the priceResolver module rather than computing inline.

### Preconditions

- priceResolver module is available
- TradingProvider is rendered

### Steps

1. Spy on or mock `priceResolver.getEffectivePrice`
   **Expected:** Spy is set up

2. Call `getEffectivePrice('mahomes')` from useTrading
   **Expected:** priceResolver.getEffectivePrice was called with appropriate arguments

3. Verify the returned value matches priceResolver output
   **Expected:** Values are identical

### Test Data

- N/A

### Edge Cases

- getEffectivePrice for a non-existent player should return a defined fallback (e.g., 0 or undefined)

---

## TC-017: TradingContext resets on scenarioVersion change

**Priority:** P0
**Type:** Functional

### Objective

Verify that switching scenarios resets portfolio to startingPortfolio, cash to INITIAL_CASH, and clears userImpact.

### Preconditions

- User has made trades (non-default portfolio and cash)

### Steps

1. Buy shares, confirm cash < INITIAL_CASH and portfolio is non-empty
   **Expected:** State reflects trades

2. Switch scenario (trigger scenarioVersion change)
   **Expected:** `cash` = `INITIAL_CASH`, `portfolio` = startingPortfolio from new scenario (or {}), user impact cleared

### Test Data

- INITIAL_CASH: 10000

### Edge Cases

- If new scenario has a `startingPortfolio`, it should be used instead of empty object

---

## TC-018: TradingContext persists portfolio and cash via storageService

**Priority:** P1
**Type:** Functional

### Objective

Verify that portfolio and cash are written to storage on change and restored on remount.

### Preconditions

- storageService is functional

### Steps

1. Buy shares, verify storage contains updated portfolio and cash values
   **Expected:** storageService `write` was called with updated portfolio and cash

2. Unmount and remount TradingProvider
   **Expected:** portfolio and cash are restored from storage

### Test Data

- Storage keys: `STORAGE_KEYS.portfolio`, `STORAGE_KEYS.cash`

### Edge Cases

- Corrupt storage values should fall back to defaults (INITIAL_CASH, empty portfolio)

---

## TC-019: TradingContext getPortfolioValue is memoized

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getPortfolioValue` returns a memoized result and does not recompute on every call when dependencies haven't changed.

### Preconditions

- User has holdings in portfolio

### Steps

1. Call `getPortfolioValue()` twice in succession without state changes
   **Expected:** Same object reference returned (referential equality) or computation does not re-execute

2. Buy a share, call `getPortfolioValue()` again
   **Expected:** New value reflecting updated portfolio

### Test Data

- N/A

### Edge Cases

- Empty portfolio should return `{ value: 0, cost: 0, gain: 0, gainPercent: 0 }`

---

## TC-020: SocialContext exposes useSocial hook with correct initial state

**Priority:** P0
**Type:** Functional

### Objective

Verify that SocialContext provides watchlist, mission, and leaderboard functionality with correct defaults.

### Preconditions

- SocialProvider rendered inside full provider tree
- localStorage is cleared

### Steps

1. Call `useSocial()`
   **Expected:** Returns object with `watchlist`, `missionPicks`, `missionRevealed`, `addToWatchlist`, `removeFromWatchlist`, `isWatching`, `setMissionPick`, `clearMissionPick`, `revealMission`, `resetMission`, `getMissionScore`, `getLeaderboardRankings`, `getLeagueHoldings`, `getLeagueMembers`

2. Check initial values
   **Expected:** `watchlist` = [], `missionPicks` = `{ risers: [], fallers: [] }`, `missionRevealed` = false

### Test Data

- N/A

### Edge Cases

- Calling `useSocial()` outside SocialProvider throws a descriptive error

---

## TC-021: SocialContext watchlist add/remove/check operations

**Priority:** P0
**Type:** Functional

### Objective

Verify watchlist CRUD operations work correctly and are persisted.

### Preconditions

- SocialProvider rendered, watchlist initially empty

### Steps

1. Call `addToWatchlist('mahomes')`
   **Expected:** `watchlist` contains `'mahomes'`; `isWatching('mahomes')` returns `true`

2. Call `addToWatchlist('mahomes')` again (duplicate)
   **Expected:** `watchlist` still contains only one `'mahomes'` entry

3. Call `addToWatchlist('allen')`
   **Expected:** `watchlist` contains both `'mahomes'` and `'allen'`

4. Call `removeFromWatchlist('mahomes')`
   **Expected:** `watchlist` contains only `'allen'`; `isWatching('mahomes')` returns `false`

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- Remove a player not on watchlist: no-op, no error
- `isWatching` for non-existent player: returns `false`

---

## TC-022: SocialContext watchlist persists via storageService

**Priority:** P1
**Type:** Functional

### Objective

Verify that watchlist is persisted through storageService and survives remounts.

### Preconditions

- storageService is functional

### Steps

1. Add `'mahomes'` to watchlist, unmount, remount SocialProvider
   **Expected:** Watchlist still contains `'mahomes'`

### Test Data

- Storage key: `STORAGE_KEYS.watchlist`

### Edge Cases

- Corrupt storage (e.g., non-array) should fall back to `[]`

---

## TC-023: SocialContext watchlist persists across scenario switches

**Priority:** P0
**Type:** Functional

### Objective

Verify that the watchlist is NOT reset when scenarios change, unlike mission state.

### Preconditions

- Watchlist has entries

### Steps

1. Add `'mahomes'` to watchlist
   **Expected:** Watchlist contains `'mahomes'`

2. Switch scenario from `'midweek'` to `'playoffs'`
   **Expected:** Watchlist still contains `'mahomes'`

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-024: SocialContext mission pick/clear/reveal/reset operations

**Priority:** P0
**Type:** Functional

### Objective

Verify the full mission lifecycle: picking risers/fallers, clearing, revealing, and resetting.

### Preconditions

- SocialProvider rendered

### Steps

1. Call `setMissionPick('mahomes', 'riser')`
   **Expected:** `missionPicks.risers` contains `'mahomes'`

2. Call `setMissionPick('allen', 'faller')`
   **Expected:** `missionPicks.fallers` contains `'allen'`

3. Call `clearMissionPick('mahomes')`
   **Expected:** `missionPicks.risers` does not contain `'mahomes'`; `missionPicks.fallers` also does not contain it

4. Call `revealMission()`
   **Expected:** `missionRevealed` = true

5. Call `resetMission()`
   **Expected:** `missionPicks` = `{ risers: [], fallers: [] }`, `missionRevealed` = false

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- Setting a player as riser then switching to faller should remove from risers and add to fallers
- Adding more picks than `MISSION_PICKS_PER_CATEGORY` should not exceed the limit

---

## TC-025: SocialContext getMissionScore returns correct results

**Priority:** P1
**Type:** Functional

### Objective

Verify that mission scoring correctly counts correct predictions and computes a percentile.

### Preconditions

- Players have known price changes (positive or negative)
- Mission is revealed

### Steps

1. Pick a player with positive changePercent as `'riser'`, pick a player with negative changePercent as `'faller'`, reveal
   **Expected:** `getMissionScore()` returns `{ correct: 2, total: 2, percentile: 100 }`

2. Pick a player with positive changePercent as `'faller'` (wrong prediction), reveal
   **Expected:** `correct` is 0 for that pick; percentile is lower

### Test Data

- Players with known positive/negative price changes

### Edge Cases

- `getMissionScore()` before reveal returns `null`
- Score with zero picks: `{ correct: 0, total: 0, percentile: 50 }`

---

## TC-026: SocialContext mission state resets on scenarioVersion change

**Priority:** P0
**Type:** Functional

### Objective

Verify that switching scenarios resets mission picks and missionRevealed but does NOT reset watchlist.

### Preconditions

- Mission has picks and is revealed
- Watchlist has entries

### Steps

1. Set mission picks, reveal mission, add watchlist entries
   **Expected:** State reflects all operations

2. Switch scenario
   **Expected:** `missionPicks` = `{ risers: [], fallers: [] }`, `missionRevealed` = false, watchlist unchanged

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-027: SocialContext getLeaderboardRankings returns sorted array with user

**Priority:** P1
**Type:** Functional

### Objective

Verify leaderboard uses real league data (not hardcoded), includes the user, and is sorted by totalValue descending.

### Preconditions

- League member data is loaded
- User has a portfolio

### Steps

1. Call `getLeaderboardRankings()`
   **Expected:** Returns array of trader objects sorted by `totalValue` descending; each has `rank`, `name`, `avatar`, `totalValue`, `isUser`, `gapToNext`

2. Find user entry
   **Expected:** One entry has `isUser: true`, `name: 'You'`

3. Verify sorting
   **Expected:** `rankings[i-1].totalValue >= rankings[i].totalValue` for all i

4. Verify rank numbers
   **Expected:** First entry has `rank: 1`, sequential through array

### Test Data

- League members from `leagueMembers.json`

### Edge Cases

- User with no portfolio: still appears in rankings with cash-only value
- `gapToNext` for first-place trader should be 0

---

## TC-028: SocialContext getLeagueHoldings returns correct data

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getLeagueHoldings` returns combined league and user holdings for a given player.

### Preconditions

- League holdings data loaded
- User holds shares of the queried player

### Steps

1. Buy shares of a player, then call `getLeagueHoldings(playerId)`
   **Expected:** Result includes user entry (`memberId: 'user'`) alongside league member entries; each has `name`, `avatar`, `shares`, `avgCost`, `currentValue`, `gainPercent`

2. Call `getLeagueHoldings` for a player with no league holdings and no user holdings
   **Expected:** Returns empty array

### Test Data

- Player with known league holdings

### Edge Cases

- User with 0 shares (after selling all) should not appear in the result

---

## TC-029: Provider composition order in App.tsx

**Priority:** P0
**Type:** Integration

### Objective

Verify that the four context providers are nested in the correct order: ScenarioProvider > SimulationProvider > TradingProvider > SocialProvider, and that inner contexts can access outer context values.

### Preconditions

- App.tsx is updated with new provider composition

### Steps

1. Inspect App.tsx provider nesting order
   **Expected:** ScenarioProvider is outermost of the four, SocialProvider is innermost

2. Render the full app, call each hook in a leaf component
   **Expected:** All four hooks (`useScenario`, `useSimulation`, `useTrading`, `useSocial`) return valid context objects without errors

3. Verify SimulationContext can read scenarioVersion from ScenarioContext
   **Expected:** SimulationContext resets when scenario changes

4. Verify TradingContext can read priceOverrides from SimulationContext
   **Expected:** `getEffectivePrice` reflects simulation price overrides

### Test Data

- N/A

### Edge Cases

- Rendering a provider out of order (e.g., TradingProvider outside SimulationProvider) should throw or produce a clear error

---

## TC-030: All useGame() references replaced with domain hooks

**Priority:** P0
**Type:** Regression

### Objective

Verify that no component imports or calls `useGame()` after migration. Every consumer uses the appropriate domain hook.

### Preconditions

- Migration is complete; GameContext.jsx is deleted

### Steps

1. Search the codebase for any import of `useGame` or `GameContext`
   **Expected:** Zero results

2. Verify each component uses the correct hook:
   - `Market.jsx`: uses `useScenario` (for `scenario`, `currentData`) and `useTrading` (for `portfolio`, `getPlayers`)
   - `PlayerDetail.jsx`: uses `useScenario`, `useSimulation`, `useTrading`, `useSocial`
   - `Portfolio.jsx`: uses `useTrading`
   - `Watchlist.jsx`: uses `useSocial` and `useTrading`
   - `Leaderboard.jsx`: uses `useTrading` and `useSocial`
   - `ScenarioToggle.jsx`: uses `useScenario`
   - `LiveTicker.jsx`: uses `useScenario` and `useSimulation`
   - `DailyMission.jsx`: uses `useSocial` and `useScenario`
   - `PlayerCard.jsx`: uses `useScenario`, `useTrading`, `useSocial`
   - `Layout.jsx`: uses `useTrading` and `useScenario`
   - `MiniLeaderboard.jsx`: uses `useSocial`
   - `TimelineDebugger.jsx`: uses `useSimulation`
   - `Timeline.jsx`: uses `useSimulation`
   - `PlayoffAnnouncementModal.jsx`: uses `useSimulation` and `useScenario`
   **Expected:** Each component only imports hooks for the data it actually uses

### Test Data

- Full list of 14+ consumer components (see steps)

### Edge Cases

- Ensure no leftover `GameContext` type references in test files

---

## TC-031: Re-render isolation — watchlist changes do not re-render Market or PlayerDetail

**Priority:** P0
**Type:** Integration

### Objective

Verify that the context split achieves re-render isolation: changes in SocialContext (e.g., watchlist) do NOT trigger re-renders in components that only subscribe to ScenarioContext/SimulationContext/TradingContext.

### Preconditions

- Full provider tree rendered
- Market and PlayerDetail components rendered
- React render counting or profiling in place

### Steps

1. Render Market page, attach a render counter (e.g., `React.Profiler` or `useRef` counter)
   **Expected:** Initial render recorded

2. Add a player to watchlist via `addToWatchlist('mahomes')`
   **Expected:** Market component does NOT re-render (render count unchanged)

3. Render PlayerDetail page for a specific player, attach render counter
   **Expected:** Initial render recorded

4. Add another player to watchlist
   **Expected:** PlayerDetail does NOT re-render (unless it explicitly subscribes to watchlist for that player's watched state — in which case only the watchlist-consuming sub-component re-renders)

### Test Data

- N/A

### Edge Cases

- Buying shares (TradingContext) should NOT re-render components that only use ScenarioContext
- Changing scenario should re-render components in all contexts (since all depend on scenarioVersion)

---

## TC-032: GameContext.jsx is deleted from the codebase

**Priority:** P0
**Type:** Regression

### Objective

Verify that the original monolithic `GameContext.jsx` file is completely removed and no code path references it.

### Preconditions

- Migration is complete

### Steps

1. Check for file existence: `src/context/GameContext.jsx`
   **Expected:** File does not exist

2. Search for any import path containing `GameContext`
   **Expected:** Zero import statements reference `GameContext`

3. Run the full test suite
   **Expected:** All tests pass; no broken imports

4. Run the application build
   **Expected:** Build succeeds with no missing module errors

### Test Data

- N/A

### Edge Cases

- Old test file `src/context/__tests__/GameContext.test.jsx` should either be deleted or migrated to test the new contexts
