# Test Plan: mcq-qbm.3 -- Add unit tests for context providers

## Summary

- **Bead:** `mcq-qbm.3`
- **Feature:** Unit tests for all four domain context providers (Scenario, Simulation, Trading, Social) using renderHook
- **Total Test Cases:** 50
- **Test Types:** Functional

---

## ScenarioContext

---

## TC-001: ScenarioProvider exposes correct context shape

**Priority:** P0
**Type:** Functional

### Objective

Verify that `useScenario()` inside `ScenarioProvider` returns an object with all six documented properties (`scenario`, `setScenario`, `currentData`, `players`, `scenarioLoading`, `scenarioVersion`) with correct types.

### Preconditions

- Render `useScenario` hook inside `ScenarioProvider` wrapper
- localStorage is cleared

### Steps

1. Call `renderHook(() => useScenario(), { wrapper: ScenarioProvider })`
   **Expected:** Hook returns an object containing `scenario` (string), `setScenario` (function), `currentData` (object|null), `players` (array), `scenarioLoading` (boolean), `scenarioVersion` (number)

### Test Data

- No external data required

### Edge Cases

- None

---

## TC-002: useScenario throws outside ScenarioProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `useScenario()` without a wrapping `ScenarioProvider` throws `"useScenario must be used within a ScenarioProvider"`.

### Preconditions

- No provider wrapper

### Steps

1. Call `renderHook(() => useScenario())` without a wrapper
   **Expected:** Throws error with message "useScenario must be used within a ScenarioProvider"

### Test Data

- None

### Edge Cases

- None

---

## TC-003: Default scenario is "midweek" with correct initial state

**Priority:** P0
**Type:** Functional

### Objective

Verify that on first mount with empty localStorage, scenario defaults to `"midweek"`, `scenarioLoading` is `true`, `scenarioVersion` is `0`, `currentData` is `null`, and `players` is `[]`.

### Preconditions

- localStorage cleared

### Steps

1. Render hook
   **Expected:** `scenario === "midweek"`, `scenarioLoading === true`, `scenarioVersion === 0`, `currentData === null`, `players === []`

### Test Data

- Empty localStorage

### Edge Cases

- None

---

## TC-004: Initial scenario data loads asynchronously

**Priority:** P0
**Type:** Functional

### Objective

Verify that after mount, the midweek scenario data loads via dynamic import, setting `scenarioLoading` to `false`, populating `currentData` and `players`.

### Preconditions

- Fresh mount with default "midweek" scenario

### Steps

1. Render hook
   **Expected:** `scenarioLoading` starts as `true`
2. Wait for loading to complete
   **Expected:** `scenarioLoading === false`, `currentData !== null`, `players.length > 0`

### Test Data

- midweek.json fixture data

### Edge Cases

- None

---

## TC-005: setScenario switches active scenario and loads new data

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `setScenario('playoffs')` changes `scenario`, sets `scenarioLoading` to `true` during load, then resolves with new data.

### Preconditions

- Initial midweek data loaded

### Steps

1. Call `setScenario('playoffs')`
   **Expected:** `scenario === "playoffs"`, `scenarioLoading === true`
2. Wait for loading
   **Expected:** `scenarioLoading === false`, `currentData !== null`, `players.length > 0`

### Test Data

- playoffs.json fixture data

### Edge Cases

- None

---

## TC-006: espn-live scenario transforms data into {scenario, players} shape

**Priority:** P1
**Type:** Functional

### Objective

Verify that switching to `"espn-live"` loads espnPlayers.json and wraps it in `{ scenario: "espn-live", players: [...] }`.

### Preconditions

- Initial midweek data loaded

### Steps

1. Call `setScenario('espn-live')`, wait for load
   **Expected:** `currentData.scenario === "espn-live"`, `currentData.players` is an array with length > 0

### Test Data

- espnPlayers.json fixture data

### Edge Cases

- None

---

## TC-007: Unknown scenario ID does not crash and stops loading

**Priority:** P1
**Type:** Functional

### Objective

Verify that setting an unknown scenario name (no matching loader) does not throw and loading completes with `scenarioLoading === false`.

### Preconditions

- Initial midweek data loaded

### Steps

1. Call `setScenario('nonexistent')`
   **Expected:** `scenario === "nonexistent"`, `scenarioLoading` transitions to `false` without error

### Test Data

- None

### Edge Cases

- Verify no unhandled exceptions or console errors (beyond expected)

---

## TC-008: scenarioVersion increments monotonically on each setScenario call

**Priority:** P0
**Type:** Functional

### Objective

Verify that each call to `setScenario` increments `scenarioVersion` by 1, including switching to the same scenario repeatedly.

### Preconditions

- Initial data loaded (version 0)

### Steps

1. Note initial `scenarioVersion` (0)
2. Call `setScenario('live')`
   **Expected:** `scenarioVersion === 1`
3. Call `setScenario('playoffs')`
   **Expected:** `scenarioVersion === 2`
4. Call `setScenario('playoffs')` (same scenario)
   **Expected:** `scenarioVersion === 3`

### Test Data

- None

### Edge Cases

- Same-scenario switch still increments version

---

## TC-009: scenarioLoading resets to true during scenario switch

**Priority:** P1
**Type:** Functional

### Objective

Verify that after initial load completes, switching scenarios resets `scenarioLoading` to `true`, then back to `false` once data loads.

### Preconditions

- Initial midweek data loaded

### Steps

1. Call `setScenario('live')`
   **Expected:** `scenarioLoading === true`
2. Wait for load
   **Expected:** `scenarioLoading === false`, `currentData !== null`

### Test Data

- live.json fixture data

### Edge Cases

- None

---

## TC-010: Scenario selection persisted to localStorage

**Priority:** P1
**Type:** Functional

### Objective

Verify that each call to `setScenario` writes the new value to localStorage under `STORAGE_KEYS.scenario`.

### Preconditions

- localStorage cleared

### Steps

1. Render hook, wait for load
   **Expected:** localStorage `mcqueen-scenario` contains `"midweek"`
2. Call `setScenario('playoffs')`, wait for load
   **Expected:** localStorage `mcqueen-scenario` contains `"playoffs"`

### Test Data

- None

### Edge Cases

- None

---

## TC-011: Scenario selection restored from localStorage on mount

**Priority:** P1
**Type:** Functional

### Objective

Verify that if localStorage contains a saved scenario value, the provider initializes with that scenario instead of the default.

### Preconditions

- localStorage set to `{ version: 1, data: "playoffs" }` for scenario key

### Steps

1. Render hook
   **Expected:** `scenario === "playoffs"`
2. Wait for load
   **Expected:** `scenarioLoading === false`, data loaded for playoffs

### Test Data

- Pre-seeded localStorage

### Edge Cases

- Corrupt localStorage value (e.g., non-string data) — should still mount without crashing

---

## TC-012: Rapid scenario switching settles on last scenario

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `setScenario` multiple times synchronously results in only the last scenario being loaded, with cancelled flag preventing stale updates.

### Preconditions

- Initial midweek data loaded

### Steps

1. Call `setScenario('live')`, `setScenario('playoffs')`, `setScenario('superbowl')` in same `act()` block
   **Expected:** `scenario === "superbowl"`, `scenarioVersion` incremented 3 times
2. Wait for load
   **Expected:** `currentData` reflects superbowl data

### Test Data

- None

### Edge Cases

- Verify no warnings or state from intermediate scenarios (live, playoffs) leaks

---

## TC-013: players is derived as empty array when currentData is null

**Priority:** P2
**Type:** Functional

### Objective

Verify that before data loads, `players` is `[]` (derived from `currentData?.players || []`).

### Preconditions

- Just-mounted provider, before async load completes

### Steps

1. Render hook (do not wait)
   **Expected:** `currentData === null`, `players` is `[]`, `Array.isArray(players) === true`

### Test Data

- None

### Edge Cases

- None

---

## SimulationContext

---

## TC-014: SimulationProvider exposes correct context shape

**Priority:** P0
**Type:** Functional

### Objective

Verify that `useSimulation()` inside full provider tree returns all documented properties with correct types.

### Preconditions

- Render inside `ScenarioProvider > SimulationProvider`

### Steps

1. Render hook, wait for scenario to load
   **Expected:** Object with `tick` (number), `isPlaying` (boolean), `setIsPlaying` (function), `priceOverrides` (object), `history` (array), `unifiedTimeline` (array), `playoffDilutionApplied` (boolean), `isEspnLiveMode` (boolean), `espnNews` (array), `espnLoading` (boolean), `espnError` (null|string), `espnPriceHistory` (object), `goToHistoryPoint` (function), `applyPlayoffDilution` (function), `refreshEspnNews` (function), `getUnifiedTimeline` (function)

### Test Data

- None

### Edge Cases

- None

---

## TC-015: useSimulation throws outside SimulationProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `useSimulation()` without `SimulationProvider` throws the expected error, including when only `ScenarioProvider` is present.

### Preconditions

- No `SimulationProvider` in wrapper

### Steps

1. Call `renderHook(() => useSimulation())` with no wrapper
   **Expected:** Throws "useSimulation must be used within a SimulationProvider"
2. Call with only `ScenarioProvider` wrapper
   **Expected:** Same error

### Test Data

- None

### Edge Cases

- `SimulationProvider` without `ScenarioProvider` should throw the ScenarioContext error

---

## TC-016: Default simulation state on mount

**Priority:** P0
**Type:** Functional

### Objective

Verify initial state: `tick === 0`, `isPlaying === false`, `priceOverrides === {}`, `playoffDilutionApplied === false`, `isEspnLiveMode === false`, `espnNews === []`, `espnLoading === false`, `espnError === null`, `espnPriceHistory === {}`.

### Preconditions

- Default midweek scenario loaded

### Steps

1. Render and wait for scenario load
   **Expected:** All fields match default values listed above

### Test Data

- None

### Edge Cases

- None

---

## TC-017: Initial history entry created when players load

**Priority:** P0
**Type:** Functional

### Objective

Verify that after players load, history contains exactly one entry with `tick: 0`, action `"Scenario loaded"`, and prices for all players.

### Preconditions

- Midweek scenario loaded

### Steps

1. Render and wait for load
   **Expected:** `history.length === 1`, `history[0].tick === 0`, `history[0].action === "Scenario loaded"`, every player ID is a key in `history[0].prices`
2. Rerender the hook
   **Expected:** `history.length` remains 1 (no duplicate entry)

### Test Data

- None

### Edge Cases

- Rerender should not duplicate history

---

## TC-018: Scenario reset clears all simulation state

**Priority:** P0
**Type:** Functional

### Objective

Verify that switching scenarios resets `tick` to 0, clears `priceOverrides`, resets `playoffDilutionApplied`, clears ESPN state, and creates a fresh initial history entry.

### Preconditions

- Start in live scenario (isPlaying = true), then switch to midweek

### Steps

1. Switch to `"live"`, confirm `isPlaying === true`
2. Switch to `"midweek"`, wait for load
   **Expected:** `tick === 0`, `priceOverrides === {}`, `playoffDilutionApplied === false`, `espnNews === []`, `espnError === null`, `espnPriceHistory === {}`, `history.length === 1`, `history[0].tick === 0`

### Test Data

- None

### Edge Cases

- Reset effect skips when `scenarioVersion === 0` (initial mount)

---

## TC-019: Auto-start playing for live and superbowl scenarios

**Priority:** P1
**Type:** Functional

### Objective

Verify that switching to `"live"` or `"superbowl"` sets `isPlaying` to `true`, while `"midweek"`, `"playoffs"`, and `"espn-live"` leave it `false`.

### Preconditions

- Initial data loaded

### Steps

1. Switch to `"live"`
   **Expected:** `isPlaying === true`
2. Switch to `"superbowl"`
   **Expected:** `isPlaying === true`
3. Switch to `"midweek"`
   **Expected:** `isPlaying === false`
4. Switch to `"playoffs"`
   **Expected:** `isPlaying === false`
5. Switch to `"espn-live"`
   **Expected:** `isPlaying === false`

### Test Data

- None

### Edge Cases

- None

---

## TC-020: Tick interval advances through unified timeline

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `isPlaying` is true in a live scenario, the tick advances by 1 per `TICK_INTERVAL_MS`, prices update from the timeline, and history grows.

### Preconditions

- Fake timers enabled, live scenario loaded and playing

### Steps

1. Advance timers by `TICK_INTERVAL_MS`
   **Expected:** `tick === 1`, `priceOverrides` has entries, `history.length` increased

### Test Data

- `TICK_INTERVAL_MS = 3000`

### Edge Cases

- None

---

## TC-021: Tick stops at end of unified timeline

**Priority:** P1
**Type:** Functional

### Objective

Verify that when tick reaches the end of the timeline, `isPlaying` is set to `false` and tick no longer advances.

### Preconditions

- Fake timers, live scenario

### Steps

1. Advance timers by `TICK_INTERVAL_MS * timeline.length`
   **Expected:** `isPlaying === false`, `tick === timeline.length - 1`
2. Advance more time
   **Expected:** `tick` unchanged

### Test Data

- None

### Edge Cases

- None

---

## TC-022: setIsPlaying toggles play/pause

**Priority:** P1
**Type:** Functional

### Objective

Verify pausing stops tick advancement and resuming continues from where it left off.

### Preconditions

- Fake timers, live scenario playing

### Steps

1. Call `setIsPlaying(false)`
   **Expected:** `isPlaying === false`
2. Advance timers
   **Expected:** `tick` unchanged from pause point
3. Call `setIsPlaying(true)`, advance one interval
   **Expected:** `tick` incremented past pause point

### Test Data

- None

### Edge Cases

- None

---

## TC-023: goToHistoryPoint restores state at given index

**Priority:** P1
**Type:** Functional

### Objective

Verify that `goToHistoryPoint(i)` restores `tick` and `priceOverrides` to the values at `history[i]`, and truncates history to `i + 1` entries.

### Preconditions

- Live scenario with multiple history entries accumulated

### Steps

1. Accumulate 5+ history entries via tick advancement
2. Call `goToHistoryPoint(1)`
   **Expected:** `tick === history[1].tick`, `priceOverrides === history[1].prices`, `history.length === 2`

### Test Data

- None

### Edge Cases

- `goToHistoryPoint(0)` restores initial snapshot
- `goToHistoryPoint(-1)` is a no-op (out of bounds)
- `goToHistoryPoint(999)` is a no-op (out of bounds)
- `goToHistoryPoint(history.length)` is a no-op (exact boundary)

---

## TC-024: applyPlayoffDilution adjusts non-buyback player prices

**Priority:** P1
**Type:** Functional

### Objective

Verify that in the playoffs scenario, calling `applyPlayoffDilution(25)` multiplies each non-buyback player's price by 0.75, sets `playoffDilutionApplied` to `true`, and appends a history entry.

### Preconditions

- Playoffs scenario loaded

### Steps

1. Call `applyPlayoffDilution(25)`
   **Expected:** `playoffDilutionApplied === true`, `priceOverrides` contains diluted prices for non-buyback players, history entry with action `"Playoff stock issuance: 25% dilution applied"`

### Test Data

- `dilutionPercent = 25`

### Edge Cases

- Second call is a no-op (prices unchanged, no new history entry)
- Calling in non-playoffs scenario is a no-op (`playoffDilutionApplied` stays `false`)

---

## TC-025: isEspnLiveMode reflects scenario correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify `isEspnLiveMode` is `true` only when scenario is `"espn-live"`, `false` for all others.

### Preconditions

- Initial data loaded

### Steps

1. Check default (midweek)
   **Expected:** `isEspnLiveMode === false`
2. Switch to `"espn-live"`
   **Expected:** `isEspnLiveMode === true`
3. Switch back to `"playoffs"`
   **Expected:** `isEspnLiveMode === false`

### Test Data

- None

### Edge Cases

- None

---

## TC-026: ESPN news fetch and sentiment-based price update

**Priority:** P1
**Type:** Functional

### Objective

Verify that in espn-live mode, `fetchNFLNews` is called, matching articles trigger sentiment analysis, and player prices update accordingly.

### Preconditions

- Mock `fetchNFLNews` to return an article mentioning a known player (e.g., Mahomes)

### Steps

1. Switch to `"espn-live"`, wait for fetch
   **Expected:** `espnLoading` transitions false → true → false, history contains ESPN-prefixed entry, `priceOverrides` updated for matching player

### Test Data

- Mock article: `{ id: "art-1", headline: "Patrick Mahomes scores touchdown...", ... }`

### Edge Cases

- Duplicate article IDs are not reprocessed
- Non-Error thrown value captured as generic message `"Failed to fetch ESPN news"`

---

## TC-027: ESPN fetch error captured in espnError

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `fetchNFLNews` rejects, `espnError` is set to the error message.

### Preconditions

- Mock `fetchNFLNews` to reject with `new Error("Network timeout")`

### Steps

1. Switch to `"espn-live"`, wait for loading
   **Expected:** `espnError === "Network timeout"`, `espnLoading === false`

### Test Data

- None

### Edge Cases

- Non-Error thrown value (string) yields `"Failed to fetch ESPN news"`

---

## TC-028: refreshEspnNews manually triggers fetch

**Priority:** P2
**Type:** Functional

### Objective

Verify `refreshEspnNews()` triggers a new fetch when in espn-live mode, and is a no-op otherwise.

### Preconditions

- In espn-live mode with mock ESPN service

### Steps

1. Call `refreshEspnNews()`
   **Expected:** `fetchNFLNews` call count increases
2. Switch to midweek, call `refreshEspnNews()`
   **Expected:** `fetchNFLNews` call count unchanged

### Test Data

- None

### Edge Cases

- None

---

## TC-029: Unified timeline built for live/superbowl, empty for others

**Priority:** P1
**Type:** Functional

### Objective

Verify `unifiedTimeline` is a non-empty sorted array for `"live"` and `"superbowl"` scenarios, and empty `[]` for `"midweek"`, `"playoffs"`, and `"espn-live"`.

### Preconditions

- Various scenarios loaded

### Steps

1. Load `"live"`, check `unifiedTimeline`
   **Expected:** Non-empty array, sorted by timestamp ascending, multiple player IDs
2. Load `"superbowl"`, check `unifiedTimeline`
   **Expected:** Non-empty array, sorted by timestamp ascending
3. Load `"midweek"`, check
   **Expected:** `[]`
4. Load `"playoffs"`, check
   **Expected:** `[]`
5. Load `"espn-live"`, check
   **Expected:** `[]`

### Test Data

- None

### Edge Cases

- `getUnifiedTimeline()` returns the same data as the `unifiedTimeline` property

---

## TradingContext

---

## TC-030: TradingProvider exposes correct context shape

**Priority:** P0
**Type:** Functional

### Objective

Verify `useTrading()` returns all documented properties: `portfolio` (object), `cash` (number), `buyShares` (function), `sellShares` (function), `getEffectivePrice` (function), `getPlayer` (function), `getPlayers` (function), `getPortfolioValue` (function).

### Preconditions

- Full provider tree: Scenario > Simulation > Trading

### Steps

1. Render and wait for scenario load
   **Expected:** All eight properties present with correct types

### Test Data

- None

### Edge Cases

- None

---

## TC-031: useTrading throws outside TradingProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify `useTrading()` without `TradingProvider` throws `"useTrading must be used within a TradingProvider"`.

### Preconditions

- No TradingProvider wrapper

### Steps

1. Call `renderHook(() => useTrading())`
   **Expected:** Throws expected error

### Test Data

- None

### Edge Cases

- None

---

## TC-032: buyShares deducts cash, adds shares, computes weighted avg cost

**Priority:** P0
**Type:** Functional

### Objective

Verify that buying shares deducts `effectivePrice * shares` from cash, creates/updates portfolio entry with correct shares count and weighted average cost, and applies user impact.

### Preconditions

- Full provider tree, scenario loaded, sufficient cash

### Steps

1. Call `buyShares('allen', 2)` at known effective price
   **Expected:** Returns `true`, cash reduced by `price * 2`, portfolio contains `{ shares: 2, avgCost: price }`
2. Buy 3 more shares at (now different) effective price
   **Expected:** Portfolio shows `{ shares: 5, avgCost: weighted_average }`

### Test Data

- Player ID: `"allen"`

### Edge Cases

- None

---

## TC-033: buyShares returns false when insufficient cash

**Priority:** P0
**Type:** Functional

### Objective

Verify that attempting to buy more shares than cash allows returns `false` and does not modify cash or portfolio.

### Preconditions

- Scenario loaded

### Steps

1. Call `buyShares('allen', 1_000_000)`
   **Expected:** Returns `false`, cash unchanged, portfolio has no `allen` entry

### Test Data

- None

### Edge Cases

- Cost exactly equals cash — should succeed, cash becomes 0

---

## TC-034: buyShares updates user impact (price increases)

**Priority:** P1
**Type:** Functional

### Objective

Verify that after buying, `getEffectivePrice` for that player increases by `shares * USER_IMPACT_FACTOR` multiplied against base.

### Preconditions

- Scenario loaded

### Steps

1. Record price before buy
2. Call `buyShares('allen', 5)`
   **Expected:** Effective price increases, approximately `priceBefore * (1 + 5 * USER_IMPACT_FACTOR)`

### Test Data

- `USER_IMPACT_FACTOR = 0.001`

### Edge Cases

- Cumulative impact from multiple buys

---

## TC-035: sellShares adds proceeds, reduces shares, preserves avgCost

**Priority:** P0
**Type:** Functional

### Objective

Verify selling shares adds `effectivePrice * shares` to cash, decreases share count, and leaves avgCost unchanged.

### Preconditions

- Player shares owned (from prior buy)

### Steps

1. Buy 5 shares, then sell 2
   **Expected:** Returns `true`, cash increased by `sellPrice * 2`, shares reduced to 3, avgCost unchanged

### Test Data

- None

### Edge Cases

- None

---

## TC-036: sellShares removes player from portfolio when all shares sold

**Priority:** P0
**Type:** Functional

### Objective

Verify that selling all shares of a player removes that player's key entirely from the portfolio object.

### Preconditions

- Player with 3 shares in portfolio

### Steps

1. Call `sellShares('allen', 3)`
   **Expected:** `portfolio.allen` is `undefined`, key not present in portfolio object

### Test Data

- None

### Edge Cases

- None

---

## TC-037: sellShares returns false when insufficient shares or unknown player

**Priority:** P0
**Type:** Functional

### Objective

Verify sell fails gracefully when requesting more shares than held, or when the player isn't in the portfolio at all.

### Preconditions

- Player with 2 shares in portfolio

### Steps

1. Call `sellShares('allen', 5)`
   **Expected:** Returns `false`, cash and portfolio unchanged
2. Call `sellShares('nonexistent', 1)`
   **Expected:** Returns `false`, cash unchanged

### Test Data

- None

### Edge Cases

- None

---

## TC-038: sellShares decreases user impact (price decreases)

**Priority:** P1
**Type:** Functional

### Objective

Verify that selling shares reduces the user impact, causing `getEffectivePrice` to decrease compared to post-buy price.

### Preconditions

- Player shares bought (impact applied)

### Steps

1. Buy 10 shares, record price
2. Sell 4 shares
   **Expected:** Effective price after sell < effective price after buy

### Test Data

- None

### Edge Cases

- None

---

## TC-039: Portfolio and cash reset on scenario change

**Priority:** P0
**Type:** Functional

### Objective

Verify that changing scenario resets portfolio to `currentData.startingPortfolio` (or `{}`), cash to `INITIAL_CASH`, and clears userImpact.

### Preconditions

- Portfolio modified from initial state

### Steps

1. Buy shares, confirm cash < INITIAL_CASH
2. Call `setScenario('playoffs')`, wait for load
   **Expected:** Cash === INITIAL_CASH, portfolio matches new scenario's startingPortfolio (or empty), user impact cleared (prices back to base)

### Test Data

- None

### Edge Cases

- `scenarioVersion === 0` does NOT trigger reset (initial mount)
- startingPortfolio applied from localStorage when empty on first mount

---

## TC-040: Portfolio and cash persisted to localStorage

**Priority:** P1
**Type:** Functional

### Objective

Verify that buying/selling writes updated portfolio and cash to localStorage via `storageService.write`.

### Preconditions

- Scenario loaded

### Steps

1. Buy shares
   **Expected:** `read(STORAGE_KEYS.portfolio)` includes the new holding, `read(STORAGE_KEYS.cash)` reflects reduced cash

### Test Data

- None

### Edge Cases

- Portfolio and cash restored from localStorage on mount

---

## TC-041: getPortfolioValue computes value, cost, gain, gainPercent correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify `getPortfolioValue()` returns correct aggregate computation across all holdings.

### Preconditions

- Known portfolio seeded via localStorage

### Steps

1. Seed portfolio with `{ mahomes: { shares: 10, avgCost: 40 }, allen: { shares: 5, avgCost: 60 } }`
2. Call `getPortfolioValue()`
   **Expected:** `value = sum(effectivePrice * shares)`, `cost = sum(avgCost * shares)`, `gain = value - cost`, `gainPercent = ((value - cost) / cost) * 100`

### Test Data

- Specific portfolio entries with known avgCost

### Edge Cases

- Empty portfolio returns `{ value: 0, cost: 0, gain: 0, gainPercent: 0 }`

---

## TC-042: getPlayer returns enriched player data

**Priority:** P1
**Type:** Functional

### Objective

Verify `getPlayer(id)` returns a player object enriched with `currentPrice`, `changePercent`, `priceChange`, `moveReason`, `contentTiles`, `allContent`, and `priceHistory`.

### Preconditions

- Scenario loaded with players

### Steps

1. Call `getPlayer('mahomes')`
   **Expected:** Returns object with all base player fields plus enriched fields, `currentPrice` matches `getEffectivePrice('mahomes')`, `changePercent` computed from basePrice
2. Call `getPlayer('nonexistent_id')`
   **Expected:** Returns `null`

### Test Data

- None

### Edge Cases

- Returns `null` for unknown player ID

---

## TC-043: getPlayers returns all players with enriched data

**Priority:** P1
**Type:** Functional

### Objective

Verify `getPlayers()` returns an array of all players, each with `currentPrice`, `changePercent`, `priceChange`, `moveReason`, and `contentTiles`.

### Preconditions

- Scenario loaded

### Steps

1. Call `getPlayers()`
   **Expected:** Array length matches `players.length`, each element has enriched fields

### Test Data

- None

### Edge Cases

- None

---

## SocialContext

---

## TC-044: SocialProvider exposes correct context shape and defaults

**Priority:** P0
**Type:** Functional

### Objective

Verify `useSocial()` returns all documented properties with correct initial values: empty watchlist, empty missionPicks, missionRevealed false, and all functions present.

### Preconditions

- Full provider tree, localStorage cleared

### Steps

1. Render and wait for scenario + league data load
   **Expected:** `watchlist === []`, `missionPicks === { risers: [], fallers: [] }`, `missionRevealed === false`, all 13 functions/properties present

### Test Data

- None

### Edge Cases

- None

---

## TC-045: useSocial throws outside SocialProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify `useSocial()` without `SocialProvider` throws `"useSocial must be used within a SocialProvider"`.

### Preconditions

- No SocialProvider wrapper

### Steps

1. Call `renderHook(() => useSocial())`
   **Expected:** Throws expected error

### Test Data

- None

### Edge Cases

- None

---

## TC-046: Watchlist add, remove, idempotency, and persistence

**Priority:** P0
**Type:** Functional

### Objective

Verify `addToWatchlist`, `removeFromWatchlist`, and `isWatching` work correctly, including idempotent adds, removal of nonexistent IDs, localStorage persistence, and survival across scenario changes.

### Preconditions

- Full provider tree

### Steps

1. `addToWatchlist('mahomes')`
   **Expected:** `watchlist === ['mahomes']`, `isWatching('mahomes') === true`, `isWatching('allen') === false`
2. `addToWatchlist('mahomes')` again
   **Expected:** `watchlist === ['mahomes']` (no duplicate)
3. `addToWatchlist('allen')`
   **Expected:** `watchlist === ['mahomes', 'allen']`
4. `removeFromWatchlist('mahomes')`
   **Expected:** `watchlist === ['allen']`
5. `removeFromWatchlist('nonexistent')`
   **Expected:** `watchlist === ['allen']` (no-op)
6. Verify `read(STORAGE_KEYS.watchlist)` matches current watchlist
7. Switch scenario
   **Expected:** Watchlist unchanged

### Test Data

- None

### Edge Cases

- Watchlist restored from localStorage on mount
- Corrupt localStorage falls back to empty array

---

## TC-047: Mission picks — set, clear, category limits, and cross-category move

**Priority:** P0
**Type:** Functional

### Objective

Verify `setMissionPick` adds players to risers/fallers, enforces `MISSION_PICKS_PER_CATEGORY` (3) limit, moves players between categories, and `clearMissionPick` removes from both.

### Preconditions

- Full provider tree

### Steps

1. `setMissionPick('mahomes', 'riser')`
   **Expected:** `risers === ['mahomes']`, `fallers === []`
2. `setMissionPick('allen', 'riser')`, `setMissionPick('burrow', 'riser')`
   **Expected:** `risers === ['mahomes', 'allen', 'burrow']` (3 = limit)
3. `setMissionPick('lamar', 'riser')`
   **Expected:** `risers` still length 3, `lamar` not added
4. `setMissionPick('mahomes', 'faller')`
   **Expected:** `mahomes` removed from risers, added to fallers
5. Fill fallers to 3, then move a riser to faller
   **Expected:** Player removed from risers but NOT added to full fallers
6. `clearMissionPick('allen')`
   **Expected:** `allen` removed from whichever category it was in
7. `clearMissionPick('nonexistent')`
   **Expected:** No-op

### Test Data

- `MISSION_PICKS_PER_CATEGORY = 3`

### Edge Cases

- Setting pick for same player in same category is idempotent (removes then re-adds)

---

## TC-048: Mission reveal, score calculation, and reset

**Priority:** P0
**Type:** Functional

### Objective

Verify `revealMission` sets `missionRevealed` to true, `getMissionScore` returns `null` before reveal and `{ correct, total, percentile }` after, and `resetMission` clears everything.

### Preconditions

- Full provider tree with mission picks set

### Steps

1. Set some picks, call `getMissionScore()` before reveal
   **Expected:** Returns `null`
2. Call `revealMission()`
   **Expected:** `missionRevealed === true`
3. Call `getMissionScore()`
   **Expected:** Returns `{ correct, total, percentile }` where correct counts risers with positive changePercent and fallers with negative changePercent, `percentile = round(50 + (correct / max(total, 1)) * 50)`
4. Call `resetMission()`
   **Expected:** `missionPicks === { risers: [], fallers: [] }`, `missionRevealed === false`

### Test Data

- Players with known positive/negative changePercent

### Edge Cases

- All picks correct → percentile 100
- All picks wrong → percentile 50
- Zero picks + reveal → `{ correct: 0, total: 0, percentile: 50 }`
- `revealMission()` is idempotent
- `resetMission()` on default state is a no-op

---

## TC-049: Mission state resets on scenario change (but watchlist does not)

**Priority:** P1
**Type:** Functional

### Objective

Verify that switching scenarios clears `missionPicks` and `missionRevealed`, but only when `scenarioVersion > 0` (not on initial mount).

### Preconditions

- Picks set, mission revealed

### Steps

1. Set picks and reveal
2. Switch scenario
   **Expected:** `missionPicks === { risers: [], fallers: [] }`, `missionRevealed === false`
3. Verify watchlist unchanged across the switch

### Test Data

- None

### Edge Cases

- `scenarioVersion === 0` does NOT trigger reset

---

## TC-050: Leaderboard rankings include user and AI members, sorted correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify `getLeaderboardRankings()` returns all AI league members plus the user entry, sorted descending by totalValue, with correct rank numbering, gapToNext, and traderAhead fields.

### Preconditions

- Full provider tree, league data loaded

### Steps

1. Call `getLeaderboardRankings()`
   **Expected:** Array sorted by `totalValue` descending, each entry has sequential `rank` starting at 1
2. Check user entry
   **Expected:** `isUser === true`, `name === "You"`, `avatar === "👤"`, `totalValue === cash + holdingsValue`
3. Check AI entries
   **Expected:** Each has `cash === AI_BASE_CASH`, `holdingsValue` computed from effective prices
4. Check rank 1 entry
   **Expected:** `gapToNext === 0`, `traderAhead === null`
5. Check non-rank-1 entries
   **Expected:** `gapToNext === prevEntry.totalValue - thisEntry.totalValue`, `traderAhead.memberId === prevEntry.memberId`

### Test Data

- `AI_BASE_CASH = 2000`

### Edge Cases

- `getLeagueHoldings('mahomes')` includes user holding first when user owns shares, omits user when user has none
- `getLeagueHoldings('unknown')` returns empty array
- `getLeagueMembers()` returns all 11 members including user with `isUser: true`
- League data is cached after first load (remount returns same data without re-importing)
