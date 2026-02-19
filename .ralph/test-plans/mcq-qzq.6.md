# Test Plan: mcq-qzq.6 -- Create EspnSimulationEngine

## Summary

- **Bead:** `mcq-qzq.6`
- **Feature:** EspnSimulationEngine — a plain TypeScript class implementing SimulationEngine that encapsulates ESPN API polling, article-to-player matching, sentiment analysis, price calculation, and article deduplication
- **Total Test Cases:** 24
- **Test Types:** Functional, Integration

---

## TC-001: EspnSimulationEngine implements SimulationEngine interface

**Priority:** P0
**Type:** Functional

### Objective

Verify that `EspnSimulationEngine` satisfies the `SimulationEngine` interface contract — exposing `start()`, `stop()`, `tick()`, and `getPrice()` — so it can be used interchangeably with `TimelineSimulationEngine`.

### Preconditions

- `src/services/simulationEngine.ts` exports `EspnSimulationEngine`
- `SimulationEngine` interface is defined with `start`, `stop`, `tick`, `getPrice`

### Steps

1. Import `EspnSimulationEngine` and `SimulationEngine` from `simulationEngine.ts`
   **Expected:** Both exports resolve without errors

2. Instantiate `EspnSimulationEngine` with valid options and assign to a variable typed `SimulationEngine`
   **Expected:** No TypeScript compilation errors; the class satisfies the interface

3. Verify the instance has `start`, `stop`, `tick`, and `getPrice` as callable functions
   **Expected:** `typeof engine.start === 'function'`, same for `stop`, `tick`, `getPrice`

### Test Data

- Minimal valid options: `{ players: [], onPriceUpdate: vi.fn() }`

### Edge Cases

- `tick()` returns `Promise<void>` (async), which must be compatible with the interface's `void | Promise<void>` return type

---

## TC-002: Constructor requires onPriceUpdate to be a function

**Priority:** P0
**Type:** Functional

### Objective

Verify that constructing `EspnSimulationEngine` without a valid `onPriceUpdate` function throws immediately, preventing misconfigured engines from running silently.

### Preconditions

- `EspnSimulationEngine` is importable

### Steps

1. Instantiate `EspnSimulationEngine` with `onPriceUpdate` set to a string (`'not a function'` cast via `as unknown`)
   **Expected:** Constructor throws `Error('onPriceUpdate must be a function')`

2. Instantiate with `onPriceUpdate` set to `undefined`
   **Expected:** Constructor throws

3. Instantiate with `onPriceUpdate` set to `null`
   **Expected:** Constructor throws

4. Instantiate with a valid function reference
   **Expected:** Constructor succeeds; no error thrown

### Test Data

- `{ players: [], onPriceUpdate: <invalid> }`

### Edge Cases

- Passing a non-function truthy value (e.g., `{}`, `42`) should still throw

---

## TC-003: Constructor initializes prices from player basePrices

**Priority:** P0
**Type:** Functional

### Objective

Verify that on construction, each player's price is initialized to their `basePrice`, so `getPrice()` returns the correct starting value before any ticks.

### Preconditions

- Two or more players with distinct `basePrice` values

### Steps

1. Create an engine with players `[{ id: 'p1', basePrice: 50.0 }, { id: 'p2', basePrice: 35.0 }]`
   **Expected:** Engine instantiates successfully

2. Call `engine.getPrice('p1')`
   **Expected:** Returns `50.0`

3. Call `engine.getPrice('p2')`
   **Expected:** Returns `35.0`

### Test Data

- Player p1: `basePrice: 50.0`, Player p2: `basePrice: 35.0`

### Edge Cases

- Player with `basePrice: 0` should return `0`, not fall through to a default
- A player list with a single player should still initialize correctly

---

## TC-004: Constructor applies default values for optional dependencies

**Priority:** P1
**Type:** Functional

### Objective

Verify that omitting optional constructor options (`fetchNews`, `analyzeSentiment`, `calculateNewPrice`, `newsLimit`, `refreshIntervalMs`) falls back to safe defaults, allowing the engine to function without explicit injection.

### Preconditions

- Construct with only required options (`players`, `onPriceUpdate`)

### Steps

1. Create engine with `{ players: [player], onPriceUpdate: vi.fn() }` — no optional fields
   **Expected:** Engine instantiates without errors

2. Call `engine.tick()`
   **Expected:** Default `fetchNews` returns `[]`; no price updates emitted; no errors thrown

3. Verify default `newsLimit` is `30` by observing that the default `fetchNews` is called (even though it returns empty)
   **Expected:** The fetch function would receive `30` as the limit argument if it were a real function

4. Verify default `refreshIntervalMs` is `60000` (1 minute) by calling `start()` and verifying interval setup
   **Expected:** `setInterval` is called with 60000ms

### Test Data

- Single player with `basePrice: 50`

### Edge Cases

- Default `analyzeSentiment` returns `{ sentiment: 'neutral', magnitude: 0, confidence: 0 }`
- Default `calculateNewPrice` returns the same price with `changePercent: 0`

---

## TC-005: tick() fetches articles using injected fetchNews

**Priority:** P0
**Type:** Functional

### Objective

Verify that `tick()` calls the injected `fetchNews` function with the configured `newsLimit`, confirming ESPN API polling is properly delegated.

### Preconditions

- Engine constructed with a mock `fetchNews` function

### Steps

1. Create engine with `fetchNews: vi.fn().mockResolvedValue([])` and `newsLimit: 15`
   **Expected:** Engine instantiates

2. Call `await engine.tick()`
   **Expected:** `fetchNews` was called exactly once with argument `15`

3. Call `await engine.tick()` again
   **Expected:** `fetchNews` called a second time (total 2 calls)

### Test Data

- `newsLimit: 15`

### Edge Cases

- When `newsLimit` is not specified, `fetchNews` should be called with `30` (the default)

---

## TC-006: tick() processes a relevant article and emits onPriceUpdate

**Priority:** P0
**Type:** Functional

### Objective

Verify the core pipeline: a fetched article that matches a player's search terms triggers sentiment analysis, price calculation, and an `onPriceUpdate` callback with a correctly structured `PriceReason`.

### Preconditions

- Engine with one player (`id: 'mahomes'`, `searchTerms: ['mahomes']`, `basePrice: 50`)
- Mock `fetchNews` returns one article with "Mahomes" in the headline
- Mock `analyzeSentiment` returns `{ sentiment: 'positive', magnitude: 0.8, confidence: 0.9 }`
- Mock `calculateNewPrice` returns `{ newPrice: 55.0, changePercent: 10 }`

### Steps

1. Call `await engine.tick()`
   **Expected:** `analyzeSentiment` called with `"<headline> <description>"`, `'Patrick Mahomes'`, `'QB'`

2. Verify `calculateNewPrice` was called with `(50, { sentiment: 'positive', magnitude: 0.8, confidence: 0.9 })`
   **Expected:** Called exactly once with current price and sentiment result

3. Verify `onPriceUpdate` was called with `('mahomes', 55.0, reason)`
   **Expected:** `reason` contains `{ type: 'news', headline: <article headline>, source: 'ESPN NFL', sentiment: 'positive', magnitude: 0.8 }`

4. Call `engine.getPrice('mahomes')`
   **Expected:** Returns `55.0`

### Test Data

- Article: `{ id: 'art-1', headline: 'Mahomes throws 4 TDs', description: 'Great game' }`

### Edge Cases

- Article with `source` field set should use that value instead of `'ESPN NFL'` fallback
- Article with `url` field should pass it through in the reason object

---

## TC-007: tick() skips irrelevant articles (no player match)

**Priority:** P0
**Type:** Functional

### Objective

Verify that articles whose text does not match any player's search terms are ignored — no sentiment analysis, no price calculation, no callbacks.

### Preconditions

- Engine with players having search terms `['mahomes']` and `['kelce']`
- `fetchNews` returns an article about weather with no player names

### Steps

1. Call `await engine.tick()`
   **Expected:** `analyzeSentiment` not called; `calculateNewPrice` not called; `onPriceUpdate` not called

2. Verify prices are unchanged via `getPrice()`
   **Expected:** Both players retain their `basePrice`

### Test Data

- Article: `{ id: 'art-1', headline: 'Weather forecast for Sunday', description: 'Rain expected' }`

### Edge Cases

- An article that partially matches (e.g., "mahome" without the "s") should NOT match — matching is via `includes()` which is exact substring

---

## TC-008: Article-to-player matching uses searchTerms (case-insensitive)

**Priority:** P0
**Type:** Functional

### Objective

Verify that player matching is case-insensitive and uses the player's `searchTerms` array. A match in either headline or description should trigger processing.

### Preconditions

- Player with `searchTerms: ['mahomes', 'patrick mahomes']`

### Steps

1. Tick with article: `{ headline: 'MAHOMES throws deep', description: 'nothing' }`
   **Expected:** Player matched (uppercase in headline, lowercase search term)

2. Tick (fresh engine) with article: `{ headline: 'nothing', description: 'great pass by Patrick Mahomes' }`
   **Expected:** Player matched via description containing second search term

3. Tick (fresh engine) with article: `{ headline: 'nothing', description: 'nothing' }`
   **Expected:** Player NOT matched

### Test Data

- Player: `{ id: 'mahomes', name: 'Patrick Mahomes', searchTerms: ['mahomes', 'patrick mahomes'] }`

### Edge Cases

- When `searchTerms` is undefined/not set, the engine falls back to `[player.name]`
- Search term with mixed case like `'McAfee'` should still match `'mcafee'` in article text

---

## TC-009: One article matches multiple players

**Priority:** P1
**Type:** Functional

### Objective

Verify that a single article mentioning multiple players fires separate `onPriceUpdate` callbacks for each matched player, with independent sentiment/price calculations.

### Preconditions

- Two players: Mahomes (`searchTerms: ['mahomes']`) and Kelce (`searchTerms: ['kelce']`)
- Article mentions both names

### Steps

1. Call `await engine.tick()`
   **Expected:** `onPriceUpdate` called exactly 2 times — once for each matched player

2. Verify each call receives the correct `playerId`
   **Expected:** One call with `'mahomes'`, one with `'kelce'`

3. Verify `analyzeSentiment` was called twice
   **Expected:** Called with each player's name and position respectively

### Test Data

- Article: `{ id: 'art-1', headline: 'Mahomes to Kelce connection', description: 'TD play' }`

### Edge Cases

- Price calculation for the second player should use that player's own current price, not the first player's updated price

---

## TC-010: Article deduplication — same article not re-processed

**Priority:** P0
**Type:** Functional

### Objective

Verify that `processedArticleIds` prevents an article from being processed more than once across multiple ticks, preventing duplicate price impacts.

### Preconditions

- `fetchNews` returns the same article on every call

### Steps

1. Call `await engine.tick()` — first tick
   **Expected:** `onPriceUpdate` called once for the matching player

2. Call `await engine.tick()` — second tick (same article returned)
   **Expected:** `onPriceUpdate` NOT called again (total still 1)

3. Call `await engine.tick()` — third tick
   **Expected:** Still no additional calls

### Test Data

- Article: `{ id: 'art-1', headline: 'Mahomes TD', description: 'Big play' }`

### Edge Cases

- An article with the same content but a different `id` should be processed as a new article

---

## TC-011: New articles processed while old ones are skipped

**Priority:** P0
**Type:** Functional

### Objective

Verify that on subsequent ticks, only newly-appearing articles are processed while previously-seen articles are deduplicated.

### Preconditions

- First tick: `fetchNews` returns `[art-1]`
- Second tick: `fetchNews` returns `[art-1, art-2]`

### Steps

1. First `tick()` — processes `art-1`
   **Expected:** `onPriceUpdate` called once

2. Second `tick()` — `art-1` skipped, `art-2` processed
   **Expected:** `onPriceUpdate` called once more (total 2)

### Test Data

- art-1 matches 'mahomes', art-2 matches 'kelce'

### Edge Cases

- If a batch contains 10 articles where 3 are new and 7 are old, exactly 3 should be processed (assuming each matches a player)

---

## TC-012: Articles with missing or empty id are skipped

**Priority:** P1
**Type:** Functional

### Objective

Verify that articles with falsy `id` values (empty string, undefined, null) are not processed, preventing corrupted state in the deduplication set.

### Preconditions

- `fetchNews` returns articles with invalid ids

### Steps

1. Tick with article `{ id: '', headline: 'Mahomes TD', description: 'Big play' }`
   **Expected:** `onPriceUpdate` not called

2. Tick with article `{ id: undefined, ... }` (cast appropriately)
   **Expected:** `onPriceUpdate` not called

### Test Data

- Relevant article content that WOULD match, but id is falsy

### Edge Cases

- An article with `id: '0'` (string zero) should be treated as a valid id and processed normally

---

## TC-013: Price accumulates correctly across multiple articles

**Priority:** P0
**Type:** Functional

### Objective

Verify that sequential price updates compound — the second article's price calculation receives the price set by the first article, not the original `basePrice`.

### Preconditions

- Player with `basePrice: 50`
- Two articles matching the same player
- `calculateNewPrice` returns different values based on input price

### Steps

1. Configure `calculateNewPrice` to add 5 to whatever current price is passed
   **Expected:** Set up mock

2. Tick with two articles: `art-1` and `art-2`
   **Expected:** First processes with `currentPrice=50`, resulting in `55`. Second processes with `currentPrice=55`, resulting in `60`.

3. Verify final `getPrice('player')` returns `60`
   **Expected:** Returns `60`

4. Verify `onPriceUpdate` called twice with prices `55` then `60`
   **Expected:** Two calls with accumulating prices

### Test Data

- `calculateNewPrice: (p) => ({ newPrice: p + 5, changePercent: 10 })`

### Edge Cases

- If articles arrive in a single tick (batch), they are processed in order so compounding is deterministic

---

## TC-014: onPriceUpdate reason object is correctly structured

**Priority:** P1
**Type:** Functional

### Objective

Verify the `PriceReason` object passed to `onPriceUpdate` contains all required fields from the article and sentiment result, matching the `PriceReason` type.

### Preconditions

- Engine with mocks that return known sentiment values

### Steps

1. Tick with a fully-populated article (`id`, `headline`, `description`, `source: 'AP'`, `url: 'https://...'`)
   **Expected:** `onPriceUpdate` called

2. Inspect the third argument (reason) of the `onPriceUpdate` call
   **Expected:** `{ type: 'news', headline: <article headline>, source: 'AP', url: 'https://...', sentiment: 'positive', magnitude: 0.8 }`

### Test Data

- Article with explicit `source` and `url` fields

### Edge Cases

- When `article.source` is undefined/empty, reason should fall back to `'ESPN NFL'`
- When `article.url` is undefined, `reason.url` should be `undefined`

---

## TC-015: start() triggers immediate tick then sets interval

**Priority:** P0
**Type:** Functional

### Objective

Verify that `start()` calls `tick()` immediately (not waiting for the first interval) and then sets up a recurring interval at `refreshIntervalMs`.

### Preconditions

- Use `vi.useFakeTimers()` to control interval timing

### Steps

1. Call `engine.start()`
   **Expected:** `fetchNews` called once immediately (from the synchronous `tick()` call)

2. Advance timers by `refreshIntervalMs` (default 60000ms)
   **Expected:** `fetchNews` called a second time

3. Advance timers by another `refreshIntervalMs`
   **Expected:** `fetchNews` called a third time

### Test Data

- `refreshIntervalMs: 60000` (default)

### Edge Cases

- Custom `refreshIntervalMs: 5000` should fire at 5-second intervals

---

## TC-016: start() is idempotent — calling twice does not create duplicate intervals

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `start()` when the engine is already running does not create a second interval, which would cause double-processing.

### Preconditions

- Use `vi.useFakeTimers()`

### Steps

1. Call `engine.start()` — first call
   **Expected:** Interval created; `fetchNews` called once immediately

2. Call `engine.start()` — second call (while already running)
   **Expected:** No additional interval created; `fetchNews` NOT called again

3. Advance timers by one interval period
   **Expected:** `fetchNews` called exactly once more (not twice)

### Test Data

- Default options

### Edge Cases

- N/A

---

## TC-017: stop() clears the refresh interval

**Priority:** P0
**Type:** Functional

### Objective

Verify that `stop()` clears the interval so no further ticks occur, enabling clean teardown.

### Preconditions

- Use `vi.useFakeTimers()`
- Engine started with `start()`

### Steps

1. Call `engine.start()`
   **Expected:** Interval running

2. Call `engine.stop()`
   **Expected:** Interval cleared

3. Advance timers by several interval periods
   **Expected:** `fetchNews` NOT called again after stop

### Test Data

- Default options

### Edge Cases

- Calling `stop()` when engine was never started should not throw
- Calling `stop()` twice in a row should not throw

---

## TC-018: stop() then start() resumes polling

**Priority:** P1
**Type:** Functional

### Objective

Verify that after stopping, `start()` can resume the polling cycle, including an immediate tick.

### Preconditions

- Use `vi.useFakeTimers()`

### Steps

1. Call `engine.start()` then `engine.stop()`
   **Expected:** Engine stopped

2. Call `engine.start()` again
   **Expected:** `fetchNews` called again immediately; new interval set up

3. Advance timers by one interval period
   **Expected:** `fetchNews` called again from the new interval

### Test Data

- Default options

### Edge Cases

- Previously processed article ids should persist across stop/start cycles (deduplication state is not reset)

---

## TC-019: tick() handles fetch failure gracefully

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `fetchNews` throws or rejects, `tick()` swallows the error and does not crash, corrupt state, or fire `onPriceUpdate`.

### Preconditions

- `fetchNews` configured to reject with an error

### Steps

1. Set `fetchNews` to `vi.fn().mockRejectedValue(new Error('Network error'))`
   **Expected:** Setup complete

2. Call `await engine.tick()`
   **Expected:** Resolves (does not throw); `onPriceUpdate` not called

3. Verify prices unchanged
   **Expected:** `getPrice()` returns original base prices

4. Change `fetchNews` to return valid articles on next call; call `tick()` again
   **Expected:** Engine recovers; processes articles normally

### Test Data

- Network error, then recovery with valid articles

### Edge Cases

- TypeError thrown inside fetchNews (not just network errors)
- fetchNews returns undefined instead of an array

---

## TC-020: getPrice() returns 0 for unknown player ids

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getPrice()` returns `0` for a player id that was never registered, providing a safe default rather than `undefined`.

### Preconditions

- Engine constructed with known players

### Steps

1. Call `engine.getPrice('nonexistent-player')`
   **Expected:** Returns `0`

2. Call `engine.getPrice('')`
   **Expected:** Returns `0`

### Test Data

- Engine with players `['mahomes', 'kelce']`

### Edge Cases

- After processing articles, `getPrice` for a non-existent player should still return `0` (not affected by other price updates)

---

## TC-021: No React dependency — engine is a plain TypeScript class

**Priority:** P0
**Type:** Functional

### Objective

Verify AC-5: the engine module contains no React imports, confirming it can be used outside a React context (e.g., in Node.js, tests, or a worker thread).

### Preconditions

- Access to `src/services/simulationEngine.ts` source file

### Steps

1. Read the contents of `simulationEngine.ts`
   **Expected:** No `import ... from 'react'` or `import ... from 'react-dom'` statements

2. Verify the module does not reference `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`, or any React hooks
   **Expected:** No React hook usage found

3. Instantiate `EspnSimulationEngine` in a plain test (no `renderHook`, no component tree)
   **Expected:** Engine works without any React runtime

### Test Data

- File content inspection

### Edge Cases

- Transitive dependencies (e.g., imported modules) should also be React-free for the engine to work in isolation

---

## TC-022: Emits price updates through the same onPriceUpdate callback as TimelineSimulationEngine

**Priority:** P0
**Type:** Integration

### Objective

Verify AC-6: both engines use the identical `OnPriceUpdate` callback signature, so a consumer (e.g., `SimulationContext`) can swap engines without changing its callback handler.

### Preconditions

- A single `onPriceUpdate` callback function
- Both `EspnSimulationEngine` and `TimelineSimulationEngine` instances

### Steps

1. Create a shared `onPriceUpdate` spy function
   **Expected:** Spy created

2. Instantiate `TimelineSimulationEngine` with the spy; tick; record the call arguments
   **Expected:** Spy called with `(playerId: string, price: number, reason: PriceReason | null)`

3. Instantiate `EspnSimulationEngine` with the same spy; tick; record the call arguments
   **Expected:** Spy called with the same `(playerId: string, price: number, reason: PriceReason | null)` signature

4. Verify both sets of call arguments are structurally compatible
   **Expected:** Both calls have 3 arguments: string, number, object-or-null

### Test Data

- Timeline entry and ESPN article that each produce a price update

### Edge Cases

- The `reason` shape differs slightly between engines (ESPN includes `sentiment`, `magnitude`; timeline includes `content`), but the `type` and `headline` fields are shared

---

## TC-023: Dependencies are injectable (testable with mocks)

**Priority:** P0
**Type:** Functional

### Objective

Verify AC-3: `fetchNews`, `analyzeSentiment`, and `calculateNewPrice` are all provided via constructor injection, allowing full mock-based testing without hitting real ESPN APIs or sentiment services.

### Preconditions

- Mock functions for all three dependencies

### Steps

1. Create engine with all three mocked: `fetchNews`, `analyzeSentiment`, `calculateNewPrice`
   **Expected:** Engine instantiates; no real API calls made

2. Call `tick()` with `fetchNews` returning one matching article
   **Expected:** `analyzeSentiment` mock called with article text; `calculateNewPrice` mock called with base price and sentiment result

3. Replace `analyzeSentiment` mock to return `{ sentiment: 'negative', magnitude: 0.9, confidence: 0.95 }`
   **Expected:** `calculateNewPrice` receives the negative sentiment on next tick with a new article

### Test Data

- Mock implementations returning controlled values

### Edge Cases

- If an injected dependency throws, the engine should handle it gracefully (fetch errors are caught; sentiment/price errors would propagate — verify which behavior is intended)

---

## TC-024: Sentiment analysis receives concatenated headline and description

**Priority:** P1
**Type:** Functional

### Objective

Verify that the text passed to `analyzeSentiment` is the concatenation of `article.headline + ' ' + article.description`, matching the original GameContext logic.

### Preconditions

- Mock `analyzeSentiment` capturing its arguments

### Steps

1. Tick with article `{ headline: 'Big Win', description: 'Mahomes threw 4 TDs' }`
   **Expected:** `analyzeSentiment` called with first argument `'Big Win Mahomes threw 4 TDs'`

2. Verify the second argument is the player's `name`
   **Expected:** Called with `'Patrick Mahomes'`

3. Verify the third argument is the player's `position`
   **Expected:** Called with `'QB'`

### Test Data

- Player: `{ name: 'Patrick Mahomes', position: 'QB', searchTerms: ['mahomes'] }`

### Edge Cases

- Article with empty `description` should pass `'<headline> '` (headline + space + empty string)
- Article with empty `headline` should pass `' <description>'`
