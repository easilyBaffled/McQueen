# Test Plan: mcq-qzq -- Service Layer Refactor

## Summary

- **Bead:** `mcq-qzq`
- **Feature:** Extract priceResolver, simulationEngine, and storageService as pure TypeScript modules from GameContext; convert existing JS services to TypeScript
- **Total Test Cases:** 24
- **Test Types:** Functional, Integration

---

## TC-001: priceResolver — returns override price when override exists

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getEffectivePrice` returns the price-override value (with user impact applied) when `priceOverrides` contains an entry for the given player, even if the player also has priceHistory.

### Preconditions

- `priceResolver` module is extracted as a pure function with signature: `getEffectivePrice(playerId, priceOverrides, userImpact, players)`
- A `players` array with at least one player that has both `basePrice` and `priceHistory`

### Steps

1. Call `getEffectivePrice('player-1', { 'player-1': 55.00 }, {}, players)` where player-1 has `basePrice: 40.00` and a priceHistory ending at `50.00`
   **Expected:** Returns `55.00` (the override value, not the history or base price)

2. Call `getEffectivePrice('player-1', { 'player-1': 55.00 }, { 'player-1': 0.05 }, players)`
   **Expected:** Returns `57.75` (55.00 * 1.05, override + user impact applied)

### Test Data

- Player: `{ id: 'player-1', basePrice: 40.00, priceHistory: [{ price: 50.00 }] }`
- Override: `{ 'player-1': 55.00 }`
- User impact: `{ 'player-1': 0.05 }`

### Edge Cases

- Override value of `0` should still be used (not treated as falsy and falling through to history)

---

## TC-002: priceResolver — falls back to priceHistory when no override

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getEffectivePrice` uses the last entry in the player's `priceHistory` array when no override exists for that player.

### Preconditions

- `priceResolver` module available
- Player has a non-empty `priceHistory` array

### Steps

1. Call `getEffectivePrice('player-1', {}, {}, players)` where player-1 has `priceHistory: [{ price: 42.00 }, { price: 48.00 }]`
   **Expected:** Returns `48.00` (last entry in priceHistory)

2. Call `getEffectivePrice('player-1', {}, { 'player-1': -0.02 }, players)`
   **Expected:** Returns `47.04` (48.00 * 0.98, history price with negative user impact)

### Test Data

- Player: `{ id: 'player-1', basePrice: 40.00, priceHistory: [{ price: 42.00 }, { price: 48.00 }] }`

### Edge Cases

- Player with a single priceHistory entry should return that entry's price
- Player with priceHistory where all entries have the same price

---

## TC-003: priceResolver — falls back to basePrice when no override and no history

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getEffectivePrice` uses the player's `basePrice` when there is no override and `priceHistory` is absent or empty.

### Preconditions

- `priceResolver` module available

### Steps

1. Call `getEffectivePrice('player-1', {}, {}, players)` where player-1 has `basePrice: 40.00` and no `priceHistory`
   **Expected:** Returns `40.00`

2. Call `getEffectivePrice('player-1', {}, {}, players)` where player-1 has `basePrice: 40.00` and `priceHistory: []`
   **Expected:** Returns `40.00`

### Test Data

- Player A: `{ id: 'player-1', basePrice: 40.00 }` (no priceHistory key)
- Player B: `{ id: 'player-1', basePrice: 40.00, priceHistory: [] }`

### Edge Cases

- Player with `basePrice: 0` should return `0`
- Player object is `undefined` or not found in players array — should return `0` (not throw)

---

## TC-004: priceResolver — unknown player returns zero

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getEffectivePrice` gracefully handles a `playerId` that does not exist in the `players` array and does not throw.

### Preconditions

- `priceResolver` module available

### Steps

1. Call `getEffectivePrice('nonexistent', {}, {}, players)` where players contains only `player-1` and `player-2`
   **Expected:** Returns `0` without throwing an error

2. Call `getEffectivePrice('nonexistent', {}, { 'nonexistent': 0.1 }, players)`
   **Expected:** Returns `0` (user impact on zero base is still zero)

### Test Data

- Players: `[{ id: 'player-1', basePrice: 40 }, { id: 'player-2', basePrice: 30 }]`

### Edge Cases

- Empty `players` array should return `0` for any playerId
- `null` or `undefined` playerId

---

## TC-005: priceResolver — user impact math precision

**Priority:** P1
**Type:** Functional

### Objective

Verify that the user impact multiplier is applied correctly and the result is rounded to two decimal places, matching the current `+(basePrice * (1 + impact)).toFixed(2)` behavior.

### Preconditions

- `priceResolver` module available

### Steps

1. Call `getEffectivePrice('player-1', { 'player-1': 33.33 }, { 'player-1': 0.001 }, players)`
   **Expected:** Returns `33.36` (33.33 * 1.001 = 33.36333, rounded to 2 decimals)

2. Call with a large negative impact: `getEffectivePrice('player-1', { 'player-1': 100.00 }, { 'player-1': -0.5 }, players)`
   **Expected:** Returns `50.00`

### Test Data

- Player: `{ id: 'player-1', basePrice: 25.00 }`

### Edge Cases

- User impact that results in floating-point rounding issues (e.g., 0.1 + 0.2 territory)
- Zero user impact should return the base/override price unchanged
- Very large positive impact (e.g., 1.0 = 100% increase)

---

## TC-006: priceResolver — pure function, no React dependency

**Priority:** P0
**Type:** Functional

### Objective

Verify that `priceResolver` module has no imports from React, `context/`, or any React hooks. It should be a plain TypeScript module importable from Node.js without a DOM or React runtime.

### Preconditions

- `priceResolver.ts` file exists in `src/services/`

### Steps

1. Inspect `priceResolver.ts` imports
   **Expected:** No imports from `react`, `react-dom`, or any file under `src/context/`

2. Import and call `getEffectivePrice` from a plain Vitest test (no `renderHook`, no JSX)
   **Expected:** Function executes successfully and returns a number

### Test Data

- N/A

### Edge Cases

- Module should not reference `useCallback`, `useMemo`, `useState`, or any hook

---

## TC-007: simulationEngine — TimelineSimulationEngine constructs unified timeline

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `buildUnifiedTimeline` function (extracted into the simulation engine module) correctly merges all players' `priceHistory` entries into a single chronologically sorted array.

### Preconditions

- `simulationEngine` module available with `buildUnifiedTimeline` or equivalent exported function
- Test players with overlapping timestamps

### Steps

1. Call `buildUnifiedTimeline(players)` with two players whose priceHistory timestamps interleave
   **Expected:** Returns a flat array of timeline entries sorted ascending by timestamp

2. Verify each entry contains `playerId`, `playerName`, `entryIndex`, `timestamp`, `price`, `reason`, `content`
   **Expected:** All fields are present on every entry

### Test Data

- Player A: priceHistory with timestamps `['2026-01-01T10:00', '2026-01-01T12:00']`
- Player B: priceHistory with timestamps `['2026-01-01T11:00', '2026-01-01T13:00']`
- Expected order: A[0], B[0], A[1], B[1]

### Edge Cases

- Player with no `priceHistory` (undefined) — should be skipped without error
- Player with empty `priceHistory: []` — should contribute zero entries
- All players have identical timestamps — order is stable (no crash)
- Single player — timeline equals that player's history in order

---

## TC-008: simulationEngine — TimelineSimulationEngine tick advancement

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `tick()` on the TimelineSimulationEngine advances the timeline index by one and emits the correct price update via the `onPriceUpdate` callback.

### Preconditions

- `TimelineSimulationEngine` instantiated with a unified timeline of 5 entries
- `onPriceUpdate` callback is a mock/spy

### Steps

1. Call `engine.tick()` once
   **Expected:** `onPriceUpdate` called with the playerId, price, and reason from timeline entry at index 1

2. Call `engine.tick()` three more times (advancing to index 4)
   **Expected:** `onPriceUpdate` called for each entry. After tick 4, the engine is at the last entry.

3. Call `engine.tick()` one more time (beyond timeline length)
   **Expected:** Engine stops (no further `onPriceUpdate` call). Equivalent to `setIsPlaying(false)` in current code.

### Test Data

- Timeline: 5 entries with distinct playerIds and prices

### Edge Cases

- Timeline with zero entries — `tick()` should be a no-op and engine should stop immediately
- Timeline with exactly one entry — first tick processes it, second tick stops

---

## TC-009: simulationEngine — TimelineSimulationEngine start/stop lifecycle

**Priority:** P1
**Type:** Functional

### Objective

Verify that `start()` begins the interval-based tick loop and `stop()` clears it, preventing further price updates.

### Preconditions

- `TimelineSimulationEngine` instantiated with a timeline and a mock `onPriceUpdate`
- Timer mocking available (e.g., `vi.useFakeTimers()`)

### Steps

1. Call `engine.start()`
   **Expected:** An interval is set at `TICK_INTERVAL_MS` (3000ms)

2. Advance fake timers by 3000ms
   **Expected:** `onPriceUpdate` called once for the next timeline entry

3. Call `engine.stop()`
   **Expected:** Interval is cleared

4. Advance fake timers by 6000ms
   **Expected:** No additional `onPriceUpdate` calls after stop

### Test Data

- Timeline: 10 entries
- `TICK_INTERVAL_MS`: 3000

### Edge Cases

- Calling `stop()` before `start()` — should not throw
- Calling `start()` twice — should not create duplicate intervals

---

## TC-010: simulationEngine — EspnSimulationEngine article processing pipeline

**Priority:** P0
**Type:** Functional

### Objective

Verify that the ESPN engine fetches articles, runs sentiment analysis, calculates price impact, and emits price updates for relevant players.

### Preconditions

- `EspnSimulationEngine` instantiated with a player list and mock `onPriceUpdate`
- `fetchNFLNews` is mocked to return test articles
- `analyzeSentiment` and `calculateNewPrice` are available (or mocked for isolation)

### Steps

1. Provide a mock article mentioning Player A by name. Call the engine's tick/process method.
   **Expected:** `onPriceUpdate` called with Player A's id, a new calculated price, and a reason containing the article headline

2. Provide a mock article that does NOT mention any player. Call the engine's process method.
   **Expected:** `onPriceUpdate` is NOT called

### Test Data

- Player A: `{ id: 'mahomes', name: 'Patrick Mahomes', searchTerms: ['mahomes'], position: 'QB', basePrice: 50.00 }`
- Article: `{ id: 'art-1', headline: 'Mahomes throws 4 touchdowns in comeback win', description: '...' }`

### Edge Cases

- Article relevant to multiple players — should emit price updates for each
- Empty article list from ESPN — no updates emitted, no errors
- ESPN fetch failure — engine emits error state, does not crash

---

## TC-011: simulationEngine — EspnSimulationEngine article deduplication

**Priority:** P1
**Type:** Functional

### Objective

Verify that the ESPN engine tracks processed article IDs and does not re-process the same article on subsequent ticks.

### Preconditions

- `EspnSimulationEngine` instantiated
- `fetchNFLNews` returns the same articles on consecutive calls

### Steps

1. Call the engine's process method. Article `art-1` is processed.
   **Expected:** `onPriceUpdate` called once for Player A

2. Call the engine's process method again with the same articles returned by fetch.
   **Expected:** `onPriceUpdate` is NOT called again for `art-1` (already processed)

3. Add a new article `art-2` to the fetch response and call process again.
   **Expected:** `onPriceUpdate` called only for `art-2`, not `art-1`

### Test Data

- Articles: `[{ id: 'art-1', ... }, { id: 'art-2', ... }]`

### Edge Cases

- Article with the same content but different ID — should be treated as new
- Article with a missing/undefined ID

---

## TC-012: simulationEngine — common interface contract

**Priority:** P0
**Type:** Integration

### Objective

Verify that both `TimelineSimulationEngine` and `EspnSimulationEngine` implement the same `SimulationEngine` interface: `start()`, `stop()`, `tick()`, `getPrice()`, and `onPriceUpdate` callback.

### Preconditions

- Both engine implementations exist in `simulationEngine.ts`

### Steps

1. Instantiate `TimelineSimulationEngine` and verify it has methods: `start`, `stop`, `tick`, `getPrice`, and accepts an `onPriceUpdate` callback
   **Expected:** All methods exist and are callable

2. Instantiate `EspnSimulationEngine` and verify the same interface
   **Expected:** All methods exist and are callable

3. Both engines call the same `onPriceUpdate(playerId, price, reason)` callback signature
   **Expected:** Callback receives identical argument shapes from both engines

### Test Data

- Minimal constructor args for each engine

### Edge Cases

- Passing an invalid `onPriceUpdate` (e.g., not a function) — should throw or handle gracefully at construction time

---

## TC-013: storageService — read returns versioned data

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` correctly unwraps a versioned entry `{ version, data }` from localStorage and returns the `data` payload.

### Preconditions

- `storageService.ts` module available
- localStorage mock available

### Steps

1. Set `localStorage.setItem('key', JSON.stringify({ version: 1, data: { foo: 'bar' } }))`
   Call `read('key', {})`
   **Expected:** Returns `{ foo: 'bar' }`

2. Set `localStorage.setItem('key', JSON.stringify({ version: 1, data: [1, 2, 3] }))`
   Call `read('key', [])`
   **Expected:** Returns `[1, 2, 3]`

### Test Data

- Various data types: object, array, string, number, boolean

### Edge Cases

- `data` field is `null` — should return defaultValue
- `data` field is `undefined` — should return defaultValue

---

## TC-014: storageService — read handles legacy (unversioned) entries

**Priority:** P1
**Type:** Functional

### Objective

Verify that `read()` gracefully handles pre-migration localStorage entries that are raw JSON values without a `{ version, data }` wrapper.

### Preconditions

- `storageService.ts` module available

### Steps

1. Set `localStorage.setItem('key', JSON.stringify('midweek'))`
   Call `read('key', 'default')`
   **Expected:** Returns `'midweek'` (raw parsed value, treated as legacy)

2. Set `localStorage.setItem('key', JSON.stringify({ portfolio: {} }))`
   Call `read('key', {})`
   **Expected:** Returns `{ portfolio: {} }` (legacy object without version wrapper)

### Test Data

- Legacy string, object, array, and number values

### Edge Cases

- Legacy value that happens to have a `version` key but no `data` key — should be returned as-is (not treated as versioned)

---

## TC-015: storageService — read returns default for invalid/corrupt data

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read()` returns the `defaultValue` when localStorage contains corrupt, unparseable, or out-of-range versioned data.

### Preconditions

- `storageService.ts` module available

### Steps

1. Set `localStorage.setItem('key', 'not-valid-json{{{')`.
   Call `read('key', 'fallback')`
   **Expected:** Returns `'fallback'`

2. Set `localStorage.setItem('key', JSON.stringify({ version: 999, data: 'future' }))`.
   Call `read('key', 'fallback')`
   **Expected:** Returns `'fallback'` (version exceeds CURRENT_VERSION)

3. Set `localStorage.setItem('key', JSON.stringify({ version: 0, data: 'zero' }))`.
   Call `read('key', 'fallback')`
   **Expected:** Returns `'fallback'` (version <= 0 is invalid)

4. Call `read('key', 'fallback')` for a key that does not exist in localStorage
   **Expected:** Returns `'fallback'`

### Test Data

- Corrupt JSON strings, version numbers 0, -1, 999

### Edge Cases

- Empty string stored: `localStorage.setItem('key', '')` — should return defaultValue
- `null` stored explicitly

---

## TC-016: storageService — write wraps data with version

**Priority:** P0
**Type:** Functional

### Objective

Verify that `write()` stores a versioned `{ version, data }` wrapper in localStorage.

### Preconditions

- `storageService.ts` module available

### Steps

1. Call `write('key', { cash: 5000 })`
   **Expected:** `localStorage.getItem('key')` returns `JSON.stringify({ version: CURRENT_VERSION, data: { cash: 5000 } })`

2. Call `write('key', 'midweek')`
   **Expected:** Stored value is `{ version: 1, data: 'midweek' }`

### Test Data

- Object, string, number, array, boolean values

### Edge Cases

- Writing `null` — should store `{ version: 1, data: null }`
- localStorage quota exceeded — should fail silently (no thrown error)

---

## TC-017: storageService — remove deletes key

**Priority:** P2
**Type:** Functional

### Objective

Verify that `remove()` deletes the specified key from localStorage.

### Preconditions

- `storageService.ts` module available

### Steps

1. Set a key via `write('key', 'value')`. Call `remove('key')`.
   **Expected:** `localStorage.getItem('key')` returns `null`

2. Call `remove('nonexistent-key')`
   **Expected:** No error thrown

### Test Data

- N/A

### Edge Cases

- localStorage unavailable (e.g., SSR environment) — should not throw

---

## TC-018: storageService — handles missing localStorage gracefully

**Priority:** P1
**Type:** Functional

### Objective

Verify that all storageService functions (`read`, `write`, `remove`) handle environments where `localStorage` is unavailable (SSR, restricted contexts) without throwing.

### Preconditions

- `storageService.ts` module available
- Test environment mocks `localStorage` as undefined or throws on access

### Steps

1. Mock `localStorage` to be undefined. Call `read('key', 'default')`.
   **Expected:** Returns `'default'` without throwing

2. Mock `localStorage` to throw on access. Call `write('key', 'value')`.
   **Expected:** No error thrown, function returns `undefined`

3. Mock `localStorage` to throw on access. Call `remove('key')`.
   **Expected:** No error thrown

### Test Data

- N/A

### Edge Cases

- `localStorage` exists but `getItem` throws (e.g., security restriction in iframe)

---

## TC-019: espnService TypeScript conversion — exports preserve existing API

**Priority:** P0
**Type:** Integration

### Objective

Verify that the TypeScript-converted `espnService.ts` exports the same public API as the original `espnService.js`: `fetchNFLNews`, `fetchTeamNews`, `fetchPlayerNews`, `fetchScoreboard`, `clearCache`, `getCacheStats`, `NFL_TEAM_IDS`.

### Preconditions

- `espnService.ts` exists, replacing `espnService.js`

### Steps

1. Import all named exports from `espnService.ts`
   **Expected:** `fetchNFLNews`, `fetchTeamNews`, `fetchPlayerNews`, `fetchScoreboard`, `clearCache`, `getCacheStats`, `NFL_TEAM_IDS` are all defined

2. Verify `fetchNFLNews` is an async function that accepts an optional `limit: number`
   **Expected:** Function signature matches `(limit?: number) => Promise<Article[]>`

3. Verify `NFL_TEAM_IDS` contains all 32 NFL team entries
   **Expected:** Object has 32 keys with numeric values

### Test Data

- N/A

### Edge Cases

- Default export object should also be preserved if it existed in the JS version

---

## TC-020: sentimentEngine TypeScript conversion — exports preserve existing API

**Priority:** P0
**Type:** Integration

### Objective

Verify that the TypeScript-converted `sentimentEngine.ts` exports the same public API: `analyzeSentiment`, `getMagnitudeLevel`, `getSentimentDescription`.

### Preconditions

- `sentimentEngine.ts` exists, replacing `sentimentEngine.js`

### Steps

1. Import `analyzeSentiment` from `sentimentEngine.ts` and call with test input
   **Expected:** Returns object with shape `{ sentiment, magnitude, confidence, keywords }`

2. Import `getMagnitudeLevel` and call with `0.7`
   **Expected:** Returns `'high'`

3. Import `getSentimentDescription` and call with `{ sentiment: 'positive', magnitude: 0.8 }`
   **Expected:** Returns a non-empty string description

### Test Data

- Headline: `'Mahomes throws 4 touchdowns in dominant win'`

### Edge Cases

- Empty string input to `analyzeSentiment` — should return neutral sentiment with zero magnitude

---

## TC-021: priceCalculator TypeScript conversion — exports preserve existing API

**Priority:** P0
**Type:** Integration

### Objective

Verify that the TypeScript-converted `priceCalculator.ts` exports the same public API: `calculatePriceImpact`, `applyPriceImpact`, `calculateNewPrice`, `calculateCumulativeImpact`, `createPriceHistoryEntry`.

### Preconditions

- `priceCalculator.ts` exists, replacing `priceCalculator.js`

### Steps

1. Import `calculateNewPrice` from `priceCalculator.ts` and call with `(50.00, { sentiment: 'positive', magnitude: 0.5, confidence: 0.8 })`
   **Expected:** Returns object with `newPrice` (number), `previousPrice` (50.00), `change` (number), `changePercent` (number)

2. Import `createPriceHistoryEntry` and call with test article and sentiment
   **Expected:** Returns object with `timestamp`, `price`, `reason`, `content` fields

### Test Data

- Current price: `50.00`
- Sentiment result: `{ sentiment: 'positive', magnitude: 0.5, confidence: 0.8 }`

### Edge Cases

- `currentPrice` of `0` — should not produce NaN or Infinity
- Negative sentiment with high magnitude — price should decrease

---

## TC-022: services index barrel — re-exports all modules including new ones

**Priority:** P1
**Type:** Integration

### Objective

Verify that `src/services/index.ts` re-exports the three new modules (`priceResolver`, `simulationEngine`, `storageService`) alongside the existing ones.

### Preconditions

- `src/services/index.ts` updated with new exports

### Steps

1. Import from `services/index.ts` and verify `getEffectivePrice` (from priceResolver) is accessible
   **Expected:** Function is defined and callable

2. Import from `services/index.ts` and verify simulation engine classes/factory are accessible
   **Expected:** `TimelineSimulationEngine` and `EspnSimulationEngine` (or factory function) are defined

3. Import from `services/index.ts` and verify `read`, `write`, `remove` (from storageService) are accessible
   **Expected:** All three functions are defined

### Test Data

- N/A

### Edge Cases

- No naming conflicts between exports of different modules

---

## TC-023: simulationEngine — onPriceUpdate callback writes priceOverrides and history

**Priority:** P0
**Type:** Integration

### Objective

Verify that when either engine implementation calls `onPriceUpdate`, the callback correctly writes to both the price overrides map and the history array — matching the current behavior in GameContext.

### Preconditions

- Engine instantiated with mock state setters for `priceOverrides` and `history`

### Steps

1. Trigger a timeline tick that fires `onPriceUpdate('mahomes', 55.00, { headline: 'Big play' })`
   **Expected:** priceOverrides updated: `{ mahomes: 55.00 }`. History entry added with `playerId: 'mahomes'`, `action` containing the headline.

2. Trigger a second tick for a different player `onPriceUpdate('kelce', 32.50, { headline: 'Catch' })`
   **Expected:** priceOverrides now has both `mahomes: 55.00` and `kelce: 32.50`. History has two entries.

### Test Data

- Two players: mahomes, kelce

### Edge Cases

- `onPriceUpdate` called with a playerId that already has an override — override should be replaced, not accumulated
- Reason object is `null` or missing `headline` — history entry should still be created with a fallback action string

---

## TC-024: helper functions extracted into priceResolver — getCurrentPriceFromHistory, buildUnifiedTimeline

**Priority:** P1
**Type:** Functional

### Objective

Verify that the pure helper functions currently at the top of GameContext.jsx (`getCurrentPriceFromHistory`, `getChangePercentFromHistory`, `getMoveReasonFromHistory`, `getLatestContentFromHistory`, `getAllContentFromHistory`, `buildUnifiedTimeline`) are extracted into the appropriate service module(s) and remain functionally equivalent.

### Preconditions

- Helper functions are exported from `priceResolver.ts` and/or `simulationEngine.ts`

### Steps

1. Call `getCurrentPriceFromHistory(player)` with a player whose `priceHistory` has 3 entries
   **Expected:** Returns the `price` field of the last entry

2. Call `getCurrentPriceFromHistory(null)`
   **Expected:** Returns `0`

3. Call `getChangePercentFromHistory(player)` with `basePrice: 40`, current history price `48`
   **Expected:** Returns `20` (percent)

4. Call `getMoveReasonFromHistory(player)` with last history entry having `reason: { headline: 'TD pass' }`
   **Expected:** Returns `'TD pass'`

5. Call `getAllContentFromHistory(player)` with 2 history entries each having 1 content item
   **Expected:** Returns flat array of 2 content items

6. Call `buildUnifiedTimeline([])` with empty players array
   **Expected:** Returns `[]`

### Test Data

- Player: `{ id: 'p1', basePrice: 40, priceHistory: [{ price: 42, timestamp: '...', reason: { headline: 'Rush' }, content: [{ type: 'article' }] }, { price: 48, timestamp: '...', reason: { headline: 'TD pass' }, content: [{ type: 'video' }] }] }`

### Edge Cases

- `getChangePercentFromHistory` with `basePrice: 0` — should return `0`, not Infinity
- `getLatestContentFromHistory` on player with no content in last entry — returns `[]`
- `getMoveReasonFromHistory` on player with last entry having no `reason` — returns `''`
