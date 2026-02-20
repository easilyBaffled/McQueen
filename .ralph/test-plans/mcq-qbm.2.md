# Test Plan: mcq-qbm.2 -- Add unit tests for simulation engines

## Summary

- **Bead:** `mcq-qbm.2`
- **Feature:** Comprehensive unit tests for `buildUnifiedTimeline`, `TimelineSimulationEngine`, and `EspnSimulationEngine` in `services/__tests__/simulationEngine.test.ts`, with mocked external dependencies and >90% branch coverage
- **Total Test Cases:** 38
- **Test Types:** Functional, Integration

---

## TC-001: buildUnifiedTimeline merges and sorts multi-player histories

**Priority:** P0
**Type:** Functional

### Objective

Verify that `buildUnifiedTimeline` interleaves price-history entries from multiple players into a single array sorted by ascending timestamp, which is foundational to the timeline engine's tick-based playback.

### Preconditions

- `buildUnifiedTimeline` is importable from `simulationEngine.ts`
- Two or more Player objects with interleaving `priceHistory` timestamps

### Steps

1. Create two players with interleaving timestamps (A at 10:00 and 12:00, B at 11:00 and 13:00)
   **Expected:** `buildUnifiedTimeline` returns an array of length 4

2. Inspect the `playerId` ordering
   **Expected:** Order is A, B, A, B (sorted by timestamp)

### Test Data

- Player A: priceHistory at `2026-01-01T10:00:00Z` ($40), `2026-01-01T12:00:00Z` ($42)
- Player B: priceHistory at `2026-01-01T11:00:00Z` ($30), `2026-01-01T13:00:00Z` ($32)

### Edge Cases

- Identical timestamps across players: should not crash, both entries appear in output
- Single player: timeline equals that player's history in original order

---

## TC-002: buildUnifiedTimeline populates all required fields

**Priority:** P0
**Type:** Functional

### Objective

Verify every `TimelineEntry` in the output contains `playerId`, `playerName`, `entryIndex`, `timestamp`, `price`, `reason`, and `content` so downstream consumers (the engine, UI) can rely on a consistent shape.

### Preconditions

- Player with a single priceHistory entry that includes `content`

### Steps

1. Call `buildUnifiedTimeline` with a player whose priceHistory has one entry including `content: [{ type: 'article' }]`
   **Expected:** Returned entry has all seven properties (`playerId`, `playerName`, `entryIndex`, `timestamp`, `price`, `reason`, `content`)

### Test Data

- Player A, priceHistory: `[{ timestamp: '...', price: 40, reason: { type: 'news', headline: 'A1' }, content: [{ type: 'article' }] }]`

### Edge Cases

- Entry without `content` field: property should still exist (as `undefined`)

---

## TC-003: buildUnifiedTimeline handles empty and missing histories

**Priority:** P1
**Type:** Functional

### Objective

Verify `buildUnifiedTimeline` gracefully handles players with no `priceHistory`, empty `priceHistory`, or an empty players array, returning an empty array without errors.

### Preconditions

- `buildUnifiedTimeline` is importable

### Steps

1. Call with an empty `players` array
   **Expected:** Returns `[]`

2. Call with a player whose `priceHistory` is `undefined`
   **Expected:** Returns `[]`

3. Call with a player whose `priceHistory` is `[]`
   **Expected:** Returns `[]`

### Test Data

- `[]`, `[makePlayer({ priceHistory: undefined })]`, `[makePlayer({ priceHistory: [] })]`

### Edge Cases

- Mix of players with and without histories: only populated histories contribute entries

---

## TC-004: buildUnifiedTimeline is pure and deterministic

**Priority:** P2
**Type:** Functional

### Objective

Confirm the function does not mutate input and returns identical results on repeated calls, ensuring safe use in React render paths and memoization.

### Preconditions

- Player array with at least one priceHistory entry

### Steps

1. Deep-clone the players array, call `buildUnifiedTimeline`, compare original to clone
   **Expected:** Original array is unchanged (no mutation)

2. Call `buildUnifiedTimeline` twice with the same input
   **Expected:** Both results are deeply equal

### Test Data

- Single player with two priceHistory entries

### Edge Cases

- None beyond the assertion itself

---

## TC-005: TimelineSimulationEngine tick advances and emits price updates

**Priority:** P0
**Type:** Functional

### Objective

Verify that each call to `tick()` advances `currentIndex` by one, reads the next `TimelineEntry`, updates the internal price map, and invokes `onPriceUpdate` with `(playerId, price, reason)`.

### Preconditions

- `TimelineSimulationEngine` instantiated with a 5-entry timeline and a mock `onPriceUpdate`

### Steps

1. Call `engine.tick()` once
   **Expected:** `onPriceUpdate` called once with `(player-1, 51, timeline[1].reason)`

2. Call `engine.tick()` three more times (total 4)
   **Expected:** `onPriceUpdate` called 4 times total, each with the correct entry's data

### Test Data

- Timeline of 5 entries generated via helper: `player-0` through `player-4`, prices 50–54

### Edge Cases

- Timeline with a single entry: first tick exhausts it, no callback fired (index goes past end)

---

## TC-006: TimelineSimulationEngine stops at timeline boundary

**Priority:** P0
**Type:** Functional

### Objective

Verify that once `currentIndex >= timeline.length`, the engine calls `stop()` internally and no further `onPriceUpdate` callbacks fire, preventing out-of-bounds reads.

### Preconditions

- Engine with a 5-entry timeline

### Steps

1. Call `tick()` four times to process entries 1–4
   **Expected:** `onPriceUpdate` called 4 times

2. Call `tick()` a fifth time (index would be 5, length is 5)
   **Expected:** `onPriceUpdate` still called only 4 times; no error thrown

3. Call `tick()` again after exhaustion
   **Expected:** Still 4 calls; engine is effectively stopped

### Test Data

- 5-entry timeline

### Edge Cases

- Empty timeline: `tick()` immediately stops (index 1 >= length 0), `onPriceUpdate` never called
- 1-entry timeline: first `tick()` stops (index 1 >= length 1), callback not fired

---

## TC-007: TimelineSimulationEngine start/stop lifecycle with setInterval

**Priority:** P0
**Type:** Functional

### Objective

Verify `start()` creates a `setInterval` that calls `tick()` at `tickIntervalMs`, and `stop()` clears the interval so no further ticks fire.

### Preconditions

- Vitest fake timers enabled (`vi.useFakeTimers()`)
- Engine with `tickIntervalMs: 3000`

### Steps

1. Call `engine.start()`, advance timers by 3000ms
   **Expected:** `onPriceUpdate` called once

2. Call `engine.stop()`, advance timers by 6000ms
   **Expected:** `onPriceUpdate` still called only once (interval cleared)

### Test Data

- 10-entry timeline, `tickIntervalMs: 3000`

### Edge Cases

- `stop()` before `start()`: should not throw
- `start()` called twice: should not create duplicate intervals (still 1 tick per interval)
- Restart after stop: `stop()` then `start()` resumes ticking from where it left off

---

## TC-008: TimelineSimulationEngine constructor validates onPriceUpdate

**Priority:** P0
**Type:** Functional

### Objective

Verify the constructor throws `'onPriceUpdate must be a function'` when the callback is not a function, catching misconfiguration at construction time.

### Preconditions

- None beyond importability

### Steps

1. Construct with `onPriceUpdate: null`
   **Expected:** Throws `'onPriceUpdate must be a function'`

2. Construct with `onPriceUpdate: undefined`
   **Expected:** Throws `'onPriceUpdate must be a function'`

3. Construct with `onPriceUpdate: 'not a function'`
   **Expected:** Throws `'onPriceUpdate must be a function'`

4. Construct with `onPriceUpdate: vi.fn()`
   **Expected:** No error

### Test Data

- Various invalid types: `null`, `undefined`, `'string'`, `42`, `{}`

### Edge Cases

- Arrow function and bound method should both succeed

---

## TC-009: TimelineSimulationEngine seeds initial price from first entry

**Priority:** P1
**Type:** Functional

### Objective

Verify that after construction (before any `tick()`), `getPrice` returns the price from `timeline[0]` for that player, so the UI can show an initial price immediately.

### Preconditions

- Timeline with at least one entry

### Steps

1. Construct engine with timeline where entry 0 has `playerId: 'mahomes'`, `price: 50`
   **Expected:** `engine.getPrice('mahomes')` returns `50` before any tick

2. Construct engine with empty timeline
   **Expected:** `engine.getPrice('anyone')` returns `0`

### Test Data

- Single-entry timeline for seeding; empty timeline for no-seed case

### Edge Cases

- None

---

## TC-010: TimelineSimulationEngine getPrice tracks latest price per player

**Priority:** P1
**Type:** Functional

### Objective

Verify `getPrice` reflects the most recently processed price for a given player, and returns `0` for unknown/empty player IDs.

### Preconditions

- Engine with multi-entry timeline where the same player appears multiple times with different prices

### Steps

1. Tick once; check `getPrice('mahomes')`
   **Expected:** Returns the price from timeline entry 1

2. Tick again; check `getPrice('mahomes')`
   **Expected:** Returns updated price from timeline entry 2

3. Check `getPrice('unknown')`
   **Expected:** Returns `0`

4. Check `getPrice('')`
   **Expected:** Returns `0`

### Test Data

- Timeline: mahomes at $50, $55, $60

### Edge Cases

- Player appears once then never again: `getPrice` retains last known value

---

## TC-011: TimelineSimulationEngine custom tickIntervalMs

**Priority:** P2
**Type:** Functional

### Objective

Verify the engine respects a custom `tickIntervalMs` and falls back to `TICK_INTERVAL_MS` constant when not specified.

### Preconditions

- Fake timers

### Steps

1. Construct with `tickIntervalMs: 1000`, start, advance 1000ms
   **Expected:** One tick fires

2. Construct without `tickIntervalMs`, start, advance by `TICK_INTERVAL_MS`
   **Expected:** One tick fires at the default interval

### Test Data

- 10-entry timeline

### Edge Cases

- None

---

## TC-012: EspnSimulationEngine implements SimulationEngine interface

**Priority:** P0
**Type:** Functional

### Objective

Verify `EspnSimulationEngine` satisfies the `SimulationEngine` interface (`start`, `stop`, `tick`, `getPrice`) so it can be used interchangeably with `TimelineSimulationEngine`.

### Preconditions

- `EspnSimulationEngine` and `SimulationEngine` are importable

### Steps

1. Assign an `EspnSimulationEngine` instance to a `SimulationEngine`-typed variable
   **Expected:** No TypeScript compilation error

2. Check `typeof` for `start`, `stop`, `tick`, `getPrice`
   **Expected:** All are `'function'`

3. Call `tick()` and inspect return value
   **Expected:** Returns a `Promise` (compatible with `void | Promise<void>`)

### Test Data

- Minimal options: `{ players: [], onPriceUpdate: vi.fn() }`

### Edge Cases

- None

---

## TC-013: EspnSimulationEngine constructor validates onPriceUpdate

**Priority:** P0
**Type:** Functional

### Objective

Verify the constructor throws for non-function `onPriceUpdate` values (same guard as `TimelineSimulationEngine`).

### Preconditions

- None

### Steps

1. Construct with `onPriceUpdate` as `'string'`, `undefined`, `null`, `{}`, `42`
   **Expected:** Each throws `'onPriceUpdate must be a function'`

2. Construct with `onPriceUpdate: vi.fn()`
   **Expected:** No error

### Test Data

- Various invalid types

### Edge Cases

- None

---

## TC-014: EspnSimulationEngine initializes prices from player basePrices

**Priority:** P0
**Type:** Functional

### Objective

Verify that after construction, `getPrice` for each player returns their `basePrice`, ensuring the UI can render prices before any news fetch completes.

### Preconditions

- Two players with different `basePrice` values

### Steps

1. Construct engine with player p1 (basePrice 50) and p2 (basePrice 35)
   **Expected:** `getPrice('p1')` is `50`, `getPrice('p2')` is `35`

### Test Data

- `espnPlayer({ id: 'p1', basePrice: 50 })`, `espnPlayer({ id: 'p2', basePrice: 35 })`

### Edge Cases

- `basePrice: 0` — `getPrice` returns `0` (distinguishable from unknown-player `0` only by knowing the player exists)
- Single player initialization

---

## TC-015: EspnSimulationEngine defaults for optional dependencies

**Priority:** P1
**Type:** Functional

### Objective

Verify the engine provides sensible defaults when optional constructor options (`fetchNews`, `analyzeSentiment`, `calculateNewPrice`, `newsLimit`, `refreshIntervalMs`) are omitted.

### Preconditions

- Engine constructed with only `players` and `onPriceUpdate`

### Steps

1. Construct with only required options
   **Expected:** No error

2. Call `tick()` with default `fetchNews`
   **Expected:** `onPriceUpdate` not called (default returns `[]`)

3. Verify default `newsLimit` is 30 by injecting `fetchNews` mock and checking call argument
   **Expected:** `fetchNews` called with `30`

4. Use fake timers and verify default `refreshIntervalMs` is 60000
   **Expected:** After `start()`, second `fetchNews` call fires at 60s

### Test Data

- Minimal options

### Edge Cases

- Default `analyzeSentiment` returns `{ sentiment: 'neutral', magnitude: 0, confidence: 0 }`
- Default `calculateNewPrice` returns `{ newPrice: currentPrice, changePercent: 0 }` (price unchanged)

---

## TC-016: EspnSimulationEngine article processing pipeline (happy path)

**Priority:** P0
**Type:** Functional

### Objective

Verify the full pipeline: `fetchNews` → player matching via `searchTerms` → `analyzeSentiment` → `calculateNewPrice` → `onPriceUpdate` callback with correctly structured `PriceReason`.

### Preconditions

- Engine with one player (Mahomes, searchTerms: `['mahomes']`)
- Mocked `fetchNews` returning one relevant article
- Mocked `analyzeSentiment` and `calculateNewPrice`

### Steps

1. Call `engine.tick()`
   **Expected:** `analyzeSentiment` called with `'headline description'`, player name, position

2. Inspect `calculateNewPrice` call
   **Expected:** Called with `(currentPrice, sentimentResult)`

3. Inspect `onPriceUpdate` call
   **Expected:** Called with `(playerId, newPrice, { type: 'news', headline, source, url, sentiment, magnitude })`

4. Check `engine.getPrice(playerId)`
   **Expected:** Returns the `newPrice` from `calculateNewPrice`

### Test Data

- Article: `{ id: 'art-1', headline: 'Mahomes throws 4 TDs', description: 'Great game' }`
- Sentiment: `{ sentiment: 'positive', magnitude: 0.8, confidence: 0.9 }`
- Price calc: `{ newPrice: 55, changePercent: 10 }`

### Edge Cases

- Article with empty description: sentiment receives `'headline '`
- Article with empty headline: sentiment receives `' description'`

---

## TC-017: EspnSimulationEngine skips irrelevant articles

**Priority:** P0
**Type:** Functional

### Objective

Verify that articles whose headline+description contain none of a player's `searchTerms` are skipped entirely — no sentiment analysis, no price calculation, no callback.

### Preconditions

- Engine with players whose searchTerms do not match the article

### Steps

1. Provide article `'Weather forecast for Sunday games'`
   **Expected:** `analyzeSentiment` not called, `calculateNewPrice` not called, `onPriceUpdate` not called

### Test Data

- Players: Mahomes (searchTerms: `['mahomes']`), Kelce (searchTerms: `['kelce']`)
- Article: weather-only content

### Edge Cases

- Partial match does not trigger: `searchTerms: ['mahomesX']` should NOT match headline containing `'Mahomes'`

---

## TC-018: EspnSimulationEngine case-insensitive searchTerms matching

**Priority:** P1
**Type:** Functional

### Objective

Verify that article text matching against `searchTerms` is case-insensitive, so `'MAHOMES'` in headline matches `'mahomes'` in searchTerms.

### Preconditions

- Player with lowercase searchTerms, article with uppercase headline

### Steps

1. Article headline `'MAHOMES throws deep'`, searchTerms `['mahomes']`
   **Expected:** Match found, `onPriceUpdate` called

2. Match via description when headline has no match
   **Expected:** `onPriceUpdate` called

3. Mixed-case searchTerm like `'McAfee'` against lowercase article text
   **Expected:** Match found

### Test Data

- Various casing permutations

### Edge Cases

- Fallback to `player.name` when `searchTerms` is `undefined`: should match against `player.name`

---

## TC-019: EspnSimulationEngine one article matches multiple players

**Priority:** P1
**Type:** Functional

### Objective

Verify that a single article mentioning multiple players fires separate `onPriceUpdate` calls for each matched player with their respective prices, names, and positions.

### Preconditions

- Two players (Mahomes and Kelce) with distinct searchTerms
- One article containing both search terms

### Steps

1. `tick()` with article `'Mahomes to Kelce connection'`
   **Expected:** `onPriceUpdate` called twice, once for each player

2. Verify `analyzeSentiment` called with each player's name and position
   **Expected:** Two calls with different `(playerName, position)` pairs

3. Verify each player's `calculateNewPrice` receives their own current price
   **Expected:** Mahomes: 50, Kelce: 35

### Test Data

- Mahomes basePrice: 50, Kelce basePrice: 35

### Edge Cases

- Three or more players matched by one article

---

## TC-020: EspnSimulationEngine article deduplication by ID

**Priority:** P0
**Type:** Functional

### Objective

Verify the engine tracks processed article IDs in a `Set` and skips articles already seen, preventing duplicate price updates from the same news.

### Preconditions

- `fetchNews` returns the same article on every call

### Steps

1. Call `tick()` — article `art-1` processed
   **Expected:** `onPriceUpdate` called once

2. Call `tick()` again — same `art-1` returned by fetch
   **Expected:** `onPriceUpdate` still called only once (dedup)

3. Call `tick()` a third time
   **Expected:** Still once

### Test Data

- Single article `{ id: 'art-1', ... }`

### Edge Cases

- Same content with different ID is treated as new (dedup is ID-based, not content-based)
- Deduplication state persists across `stop()`/`start()` cycles

---

## TC-021: EspnSimulationEngine processes new articles while skipping old

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `fetchNews` returns a mix of already-processed and new articles, only the new ones are processed.

### Preconditions

- `fetchNews` returns `[art-1]` on first tick, `[art-1, art-2]` on second tick

### Steps

1. First `tick()`: processes `art-1`
   **Expected:** `onPriceUpdate` called once

2. Second `tick()`: `art-1` skipped, `art-2` processed
   **Expected:** `onPriceUpdate` called twice total

### Test Data

- art-1 matches Mahomes, art-2 matches Kelce

### Edge Cases

- None

---

## TC-022: EspnSimulationEngine skips articles with falsy IDs

**Priority:** P1
**Type:** Functional

### Objective

Verify articles with empty-string or undefined `id` are skipped to avoid polluting the deduplication set and processing garbage data.

### Preconditions

- `fetchNews` returns articles with falsy IDs

### Steps

1. Article with `id: ''`
   **Expected:** Skipped, `onPriceUpdate` not called

2. Article with `id: undefined`
   **Expected:** Skipped, `onPriceUpdate` not called

3. Article with `id: '0'` (string zero, truthy)
   **Expected:** Processed normally

### Test Data

- Various falsy ID values

### Edge Cases

- None

---

## TC-023: EspnSimulationEngine price accumulation across articles in one tick

**Priority:** P0
**Type:** Functional

### Objective

Verify that when multiple articles in one fetch batch affect the same player, each subsequent article's `calculateNewPrice` receives the price set by the previous article, not the original `basePrice`.

### Preconditions

- Two articles matching the same player in one fetch response
- `calculateNewPrice` adds $5 per call

### Steps

1. `tick()` with `[art-1, art-2]` both matching Mahomes (basePrice 50)
   **Expected:** First `calculateNewPrice` called with 50, second with 55

2. Check `getPrice('mahomes')`
   **Expected:** Returns 60

3. Check `onPriceUpdate` calls
   **Expected:** Called twice: first with 55, second with 60

### Test Data

- `calculateNewPrice: (p) => ({ newPrice: p + 5, changePercent: 10 })`

### Edge Cases

- None

---

## TC-024: EspnSimulationEngine PriceReason object structure

**Priority:** P1
**Type:** Functional

### Objective

Verify the `PriceReason` object passed to `onPriceUpdate` contains `type: 'news'`, `headline`, `source`, `url`, `sentiment`, and `magnitude` with correct values and fallbacks.

### Preconditions

- Mocked dependencies with known return values

### Steps

1. Article with `source: 'AP'` and `url: 'https://example.com'`
   **Expected:** Reason has `source: 'AP'`, `url: 'https://example.com'`

2. Article with `source: ''` (empty string)
   **Expected:** Reason has `source: 'ESPN NFL'` (fallback)

3. Article with `source: undefined`
   **Expected:** Reason has `source: 'ESPN NFL'` (fallback)

4. Article with no `url` property
   **Expected:** Reason has `url: undefined`

### Test Data

- Various article shapes

### Edge Cases

- None

---

## TC-025: EspnSimulationEngine start() triggers immediate tick then interval

**Priority:** P0
**Type:** Functional

### Objective

Verify `start()` calls `tick()` immediately (no waiting for the first interval), then sets up periodic polling at `refreshIntervalMs`.

### Preconditions

- Fake timers enabled

### Steps

1. Call `engine.start()`
   **Expected:** `fetchNews` called once immediately

2. Advance timers by `refreshIntervalMs`
   **Expected:** `fetchNews` called a second time

3. Advance again
   **Expected:** Third call

### Test Data

- `refreshIntervalMs: 60000` (default) or custom value

### Edge Cases

- Custom `refreshIntervalMs: 5000` — polling fires every 5s

---

## TC-026: EspnSimulationEngine start() is idempotent

**Priority:** P1
**Type:** Functional

### Objective

Verify calling `start()` when already running does not create a duplicate interval or fire an extra immediate tick.

### Preconditions

- Fake timers

### Steps

1. Call `start()` twice in succession
   **Expected:** `fetchNews` called once (not twice)

2. Advance by `refreshIntervalMs`
   **Expected:** `fetchNews` called twice total (one immediate + one interval), not three

### Test Data

- Default options

### Edge Cases

- None

---

## TC-027: EspnSimulationEngine stop() clears interval

**Priority:** P0
**Type:** Functional

### Objective

Verify `stop()` clears the polling interval so no further ticks fire.

### Preconditions

- Fake timers

### Steps

1. `start()`, then `stop()`, then advance timers by 30000ms
   **Expected:** `fetchNews` called only once (the immediate tick from `start`)

### Test Data

- Default options

### Edge Cases

- `stop()` before `start()`: no error
- `stop()` called twice: no error

---

## TC-028: EspnSimulationEngine stop then start resumes polling

**Priority:** P1
**Type:** Functional

### Objective

Verify the engine can be restarted after being stopped, firing a new immediate tick and resuming the interval.

### Preconditions

- Fake timers

### Steps

1. `start()` — fetchNews called once
   **Expected:** 1 call

2. `stop()`, then `start()` again
   **Expected:** 2 calls (second immediate tick)

3. Advance by `refreshIntervalMs`
   **Expected:** 3 calls

### Test Data

- Default options

### Edge Cases

- Deduplication state persists across stop/start: previously seen articles still skipped

---

## TC-029: EspnSimulationEngine fetch failure handling

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `fetchNews` rejects, `tick()` resolves without throwing, prices remain unchanged, and subsequent successful ticks work normally.

### Preconditions

- `fetchNews` mock configured to reject

### Steps

1. `tick()` when `fetchNews` rejects with `new Error('Network error')`
   **Expected:** `tick()` resolves (no unhandled rejection), `onPriceUpdate` not called

2. Check `getPrice` after failure
   **Expected:** Returns original `basePrice` (unchanged)

3. Configure `fetchNews` to succeed on next call, then `tick()`
   **Expected:** `onPriceUpdate` fires, price updated (engine recovers)

### Test Data

- `fetchNews` rejects first, resolves second

### Edge Cases

- `TypeError` from `fetchNews`: also swallowed gracefully

---

## TC-030: EspnSimulationEngine getPrice for unknown players

**Priority:** P1
**Type:** Functional

### Objective

Verify `getPrice` returns `0` for any player ID not in the engine's player list or price map.

### Preconditions

- Engine with at least one player

### Steps

1. `engine.getPrice('nonexistent-player')`
   **Expected:** Returns `0`

2. `engine.getPrice('')`
   **Expected:** Returns `0`

3. Process articles, then check `getPrice('nonexistent')`
   **Expected:** Still `0`

### Test Data

- Single player engine

### Edge Cases

- None

---

## TC-031: No React imports in simulationEngine.ts

**Priority:** P1
**Type:** Functional

### Objective

Verify the module has no dependency on React or React DOM, confirming it is a pure service layer suitable for testing without a React runtime.

### Preconditions

- Filesystem access to read `simulationEngine.ts`

### Steps

1. Read the file content and scan for `from 'react'` or `from 'react-dom'`
   **Expected:** No matches

2. Scan for React hook names (`useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`)
   **Expected:** No matches

3. Instantiate engine in a plain test (no React providers)
   **Expected:** Works without error

### Test Data

- None

### Edge Cases

- None

---

## TC-032: Both engines share the OnPriceUpdate callback signature

**Priority:** P1
**Type:** Integration

### Objective

Verify both `TimelineSimulationEngine` and `EspnSimulationEngine` invoke `onPriceUpdate` with the same `(string, number, object|null)` signature, enabling a single callback to serve either engine.

### Preconditions

- One mock spy shared between both engine types

### Steps

1. Fire a tick on `TimelineSimulationEngine`; inspect callback args
   **Expected:** `(string, number, object)` — playerId, price, reason

2. Fire a tick on `EspnSimulationEngine`; inspect callback args
   **Expected:** Same `(string, number, object)` shape

### Test Data

- Timeline with one processable entry; ESPN with one matching article

### Edge Cases

- None

---

## TC-033: EspnSimulationEngine dependency injection — all three dependencies called

**Priority:** P1
**Type:** Functional

### Objective

Verify that injected `fetchNews`, `analyzeSentiment`, and `calculateNewPrice` are all invoked during a tick, confirming the DI seams work correctly for mocking.

### Preconditions

- All three dependencies provided as mocks

### Steps

1. Call `tick()` with a relevant article
   **Expected:** All three mocks called at least once

### Test Data

- Standard article matching player

### Edge Cases

- Replacing a mock's return value changes behavior on next tick (verifies mocks are the actual callees)

---

## TC-034: EspnSimulationEngine sentiment text is headline + description concatenated

**Priority:** P1
**Type:** Functional

### Objective

Verify `analyzeSentiment` receives `'headline description'` (space-separated), not just the headline, so sentiment quality benefits from full article context.

### Preconditions

- Mock `analyzeSentiment` to capture arguments

### Steps

1. Article with headline `'Big Win'` and description `'Mahomes threw 4 TDs'`
   **Expected:** `analyzeSentiment` called with `'Big Win Mahomes threw 4 TDs'`

2. Article with empty description
   **Expected:** Called with `'headline '` (trailing space)

3. Article with empty headline
   **Expected:** Called with `' description'` (leading space)

### Test Data

- Various headline/description combinations

### Edge Cases

- None

---

## TC-035: onPriceUpdate callback integration with external state

**Priority:** P1
**Type:** Integration

### Objective

Verify that when the `onPriceUpdate` callback updates external data structures (simulating `priceOverrides` and `history` in context), those structures are correctly populated across multiple ticks.

### Preconditions

- Callback that writes to a `priceOverrides` record and a `history` array

### Steps

1. Tick once through a timeline entry for Mahomes at $55
   **Expected:** `priceOverrides.mahomes === 55`, `history.length === 1`

2. Tick again through Kelce at $32.50
   **Expected:** `priceOverrides` has both players, `history.length === 2`

### Test Data

- Timeline: Mahomes start at $50, Mahomes $55 (tick 1), Kelce $32.50 (tick 2)

### Edge Cases

- Same player updated twice: `priceOverrides` holds latest value only (replaced, not accumulated)
- Missing headline in reason: callback should handle gracefully (fallback to default action text)

---

## TC-036: SimulationEngine interface can be implemented by third-party class

**Priority:** P2
**Type:** Functional

### Objective

Verify the `SimulationEngine` interface is a clean contract that any class can implement, confirming the design is extensible beyond the two built-in engines.

### Preconditions

- `SimulationEngine` type importable

### Steps

1. Define a `StubEngine` class implementing `SimulationEngine` with no-op methods
   **Expected:** TypeScript compiles; all four methods are `typeof 'function'`

2. Assign instance to `SimulationEngine`-typed variable
   **Expected:** No type error

### Test Data

- None

### Edge Cases

- None

---

## TC-037: External dependencies are properly mocked (fetchNews, espnService)

**Priority:** P0
**Type:** Functional

### Objective

Verify that all tests use `vi.fn()` mocks for `fetchNews`, `analyzeSentiment`, and `calculateNewPrice` rather than hitting real network or service code, ensuring tests are fast, deterministic, and isolated.

### Preconditions

- Test file uses Vitest `vi.fn()` for all external dependencies

### Steps

1. Audit that every `EspnSimulationEngine` test provides mocked `fetchNews` (or relies on the default empty resolver)
   **Expected:** No real HTTP calls made during test execution

2. Verify `analyzeSentiment` and `calculateNewPrice` are either mocked or omitted (using defaults)
   **Expected:** No real AI/NLP service calls

3. Run full test suite via `npm run test:run`
   **Expected:** All tests pass without network access

### Test Data

- N/A (meta-test about test infrastructure)

### Edge Cases

- None

---

## TC-038: Branch coverage exceeds 90%

**Priority:** P0
**Type:** Functional

### Objective

Verify the combined test suite achieves >90% branch coverage on `simulationEngine.ts`, as required by the acceptance criteria, covering all `if/else` paths, `??` fallbacks, and early returns.

### Preconditions

- All preceding TCs implemented
- Vitest coverage configured

### Steps

1. Run `npm run test:run -- --coverage` scoped to `simulationEngine.test.ts`
   **Expected:** Branch coverage for `simulationEngine.ts` is >90%

2. Review uncovered branches (if any) and confirm they are unreachable or trivial
   **Expected:** All meaningful branches exercised

### Test Data

- N/A

### Edge Cases

- Branches requiring coverage: `onPriceUpdate` type-check, `timeline.length > 0` seed, `currentIndex >= timeline.length` boundary, `!article.id` guard, `searchTerms || [player.name]` fallback, `article.source || 'ESPN NFL'` fallback, `fetchNews` catch block, `intervalId !== null` guards in start/stop
