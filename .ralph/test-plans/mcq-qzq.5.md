# Test Plan: mcq-qzq.5 -- Create SimulationEngine interface and TimelineSimulationEngine

## Summary

- **Bead:** `mcq-qzq.5`
- **Feature:** SimulationEngine interface and TimelineSimulationEngine class that unifies tick-based simulation, extracted from GameContext
- **Total Test Cases:** 18
- **Test Types:** Functional, Integration

---

## TC-001: SimulationEngine interface defines required methods

**Priority:** P0
**Type:** Functional

### Objective

Verify that the exported `SimulationEngine` interface requires `start()`, `stop()`, `tick()`, and `getPrice()` methods — confirming the contract described in AC-1.

### Preconditions

- `src/services/simulationEngine.ts` exists and exports `SimulationEngine`

### Steps

1. Inspect the `SimulationEngine` export from `simulationEngine.ts`
   **Expected:** Interface declares `start(): void`, `stop(): void`, `tick(): void | Promise<void>`, and `getPrice(playerId: string): number`

2. Compile the project with `tsc --noEmit`
   **Expected:** No type errors related to `SimulationEngine`

### Test Data

- N/A (structural/type-level verification)

### Edge Cases

- `tick()` return type must accommodate both synchronous (`void`) and asynchronous (`Promise<void>`) implementations so that `EspnSimulationEngine` can also satisfy the interface

---

## TC-002: OnPriceUpdate callback type is exported and matches AC-1

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `OnPriceUpdate` type is exported and that the engine constructor requires a callback matching `(playerId: string, price: number, reason: PriceReason | null) => void`.

### Preconditions

- `src/services/simulationEngine.ts` exports `OnPriceUpdate`

### Steps

1. Import `OnPriceUpdate` from the module
   **Expected:** Type resolves to `(playerId: string, price: number, reason: PriceReason | null) => void`

2. Construct a `TimelineSimulationEngine` passing a function that matches the signature
   **Expected:** No type errors; engine instantiates successfully

3. Construct a `TimelineSimulationEngine` passing a non-function value for `onPriceUpdate`
   **Expected:** Throws `Error('onPriceUpdate must be a function')`

### Test Data

- Valid callback: `vi.fn()`
- Invalid callback: `"not a function"`

### Edge Cases

- Passing `null` or `undefined` as `onPriceUpdate` should also throw

---

## TC-003: TimelineSimulationEngine implements SimulationEngine

**Priority:** P0
**Type:** Functional

### Objective

Verify that `TimelineSimulationEngine` structurally satisfies the `SimulationEngine` interface (AC-2) and can be assigned to a variable typed as `SimulationEngine`.

### Preconditions

- Both `SimulationEngine` and `TimelineSimulationEngine` are exported

### Steps

1. Create an instance of `TimelineSimulationEngine` with a valid timeline and callback
   **Expected:** Instance is created without errors

2. Assert that `typeof engine.start` is `'function'`
   **Expected:** True

3. Assert that `typeof engine.stop` is `'function'`
   **Expected:** True

4. Assert that `typeof engine.tick` is `'function'`
   **Expected:** True

5. Assert that `typeof engine.getPrice` is `'function'`
   **Expected:** True

6. Assign the instance to a variable typed `SimulationEngine`
   **Expected:** No TypeScript errors — the class satisfies the interface

### Test Data

- Empty timeline `[]`, callback `vi.fn()`

### Edge Cases

- N/A

---

## TC-004: buildUnifiedTimeline merges and sorts multiple player histories

**Priority:** P0
**Type:** Functional

### Objective

Verify that `buildUnifiedTimeline` is a pure function (AC-3) that interleaves price history entries from multiple players and sorts them chronologically by timestamp (AC-4: timeline construction from player data).

### Preconditions

- `buildUnifiedTimeline` is exported as a standalone function (not a method on a class)

### Steps

1. Create two `Player` objects with interleaving `priceHistory` timestamps (e.g., Player A at T=10:00 and T=12:00, Player B at T=11:00 and T=13:00)
   **Expected:** N/A (setup)

2. Call `buildUnifiedTimeline(players)`
   **Expected:** Returns an array of 4 `TimelineEntry` objects sorted as [A@10:00, B@11:00, A@12:00, B@13:00]

3. Verify each entry contains: `playerId`, `playerName`, `entryIndex`, `timestamp`, `price`, `reason`
   **Expected:** All required fields are present with correct values

### Test Data

- Player A: `{ id: 'a', priceHistory: [{ timestamp: '2026-01-01T10:00:00Z', price: 40, reason: {...} }, { timestamp: '2026-01-01T12:00:00Z', price: 42, reason: {...} }] }`
- Player B: `{ id: 'b', priceHistory: [{ timestamp: '2026-01-01T11:00:00Z', price: 30, reason: {...} }, { timestamp: '2026-01-01T13:00:00Z', price: 32, reason: {...} }] }`

### Edge Cases

- Two entries with identical timestamps should not crash (stable sort is acceptable)
- `content` field on a price history entry is optional and should be passed through when present

---

## TC-005: buildUnifiedTimeline is a pure function with no side effects

**Priority:** P0
**Type:** Functional

### Objective

Confirm that `buildUnifiedTimeline` does not mutate its input array or the player objects (AC-3: extracted as a pure function).

### Preconditions

- `buildUnifiedTimeline` is exported

### Steps

1. Create a players array and deep-clone it for comparison
   **Expected:** N/A (setup)

2. Call `buildUnifiedTimeline(players)`
   **Expected:** Returns a new array

3. Deep-compare original players array with the clone
   **Expected:** Arrays are deeply equal — no mutation occurred

4. Call the function twice with the same input
   **Expected:** Both calls return identical results (deterministic)

### Test Data

- Two players with 2 price history entries each

### Edge Cases

- N/A

---

## TC-006: buildUnifiedTimeline handles empty and missing data

**Priority:** P1
**Type:** Functional

### Objective

Verify that `buildUnifiedTimeline` gracefully handles edge cases: empty player array, players with no `priceHistory`, and players with empty `priceHistory` arrays.

### Preconditions

- `buildUnifiedTimeline` is exported

### Steps

1. Call `buildUnifiedTimeline([])`
   **Expected:** Returns `[]`

2. Call `buildUnifiedTimeline([player])` where `player.priceHistory` is `undefined`
   **Expected:** Returns `[]`

3. Call `buildUnifiedTimeline([player])` where `player.priceHistory` is `[]`
   **Expected:** Returns `[]`

### Test Data

- Empty array: `[]`
- Player with no priceHistory: `makePlayer({ id: 'a' })`
- Player with empty priceHistory: `makePlayer({ id: 'a', priceHistory: [] })`

### Edge Cases

- Single player with one entry should return a single-element array

---

## TC-007: buildUnifiedTimeline preserves single-player ordering

**Priority:** P1
**Type:** Functional

### Objective

Verify that for a single player, `buildUnifiedTimeline` returns entries in the same chronological order as the input `priceHistory`.

### Preconditions

- `buildUnifiedTimeline` is exported

### Steps

1. Create a single player with 3 chronologically ordered price history entries
   **Expected:** N/A (setup)

2. Call `buildUnifiedTimeline([player])`
   **Expected:** Returns 3 entries in the same order, with `entryIndex` values 0, 1, 2

### Test Data

- Player with prices [40, 42, 45] at timestamps T=10:00, T=11:00, T=12:00

### Edge Cases

- N/A

---

## TC-008: TimelineSimulationEngine tick advances through timeline and fires callback

**Priority:** P0
**Type:** Functional

### Objective

Verify that each call to `tick()` advances `currentIndex` by 1 and invokes `onPriceUpdate` with the correct playerId, price, and reason (AC-4: tick advancement, price update callbacks).

### Preconditions

- A `TimelineSimulationEngine` is constructed with a 5-entry timeline and a mock `onPriceUpdate`

### Steps

1. Call `engine.tick()` once
   **Expected:** `onPriceUpdate` called once with the second timeline entry's data (index 1)

2. Call `engine.tick()` again
   **Expected:** `onPriceUpdate` called a second time with the third entry's data (index 2)

3. Call `engine.tick()` two more times
   **Expected:** `onPriceUpdate` total call count is 4; each call receives the correct entry data

### Test Data

- Timeline of 5 entries: `[{ playerId: 'player-0', price: 50 }, ..., { playerId: 'player-4', price: 54 }]`

### Edge Cases

- First entry (index 0) is used for initial price seeding during construction; first `tick()` advances to index 1

---

## TC-009: TimelineSimulationEngine stops at end of timeline

**Priority:** P0
**Type:** Functional

### Objective

Verify that the engine automatically stops when `currentIndex` reaches the end of the timeline (AC-4: stop at end of timeline). Additional ticks after exhaustion must be no-ops.

### Preconditions

- A `TimelineSimulationEngine` with a 5-entry timeline

### Steps

1. Call `engine.tick()` exactly 4 times (entries at indices 1–4)
   **Expected:** `onPriceUpdate` called 4 times

2. Call `engine.tick()` one more time (would be index 5, out of bounds)
   **Expected:** `onPriceUpdate` still called only 4 times total; engine has auto-stopped

3. Call `engine.tick()` again
   **Expected:** Still 4 total calls — tick is a no-op after exhaustion

### Test Data

- 5-entry timeline

### Edge Cases

- An engine with a 1-entry timeline: first `tick()` should immediately stop since the only entry was consumed in construction

---

## TC-010: TimelineSimulationEngine handles empty timeline

**Priority:** P1
**Type:** Functional

### Objective

Verify that constructing an engine with an empty timeline does not crash, and `tick()` is a no-op.

### Preconditions

- None

### Steps

1. Construct `TimelineSimulationEngine` with `timeline: []` and a mock callback
   **Expected:** No error thrown

2. Call `engine.tick()`
   **Expected:** `onPriceUpdate` is never called

3. Call `engine.getPrice('any-id')`
   **Expected:** Returns `0`

### Test Data

- Empty timeline `[]`

### Edge Cases

- N/A

---

## TC-011: start() begins interval-based ticking at configured interval

**Priority:** P0
**Type:** Functional

### Objective

Verify that `start()` sets up a `setInterval` that fires `tick()` at the configured `tickIntervalMs` (default 3000ms from `TICK_INTERVAL_MS`).

### Preconditions

- Fake timers enabled (`vi.useFakeTimers()`)
- A 10-entry timeline engine with `tickIntervalMs: 3000`

### Steps

1. Call `engine.start()`
   **Expected:** No immediate `onPriceUpdate` call (first tick fires after the interval)

2. Advance timers by 3000ms
   **Expected:** `onPriceUpdate` called once

3. Advance timers by another 3000ms
   **Expected:** `onPriceUpdate` called twice total

4. Call `engine.stop()` and restore real timers
   **Expected:** Cleanup succeeds

### Test Data

- 10-entry timeline, `tickIntervalMs: 3000`

### Edge Cases

- Custom `tickIntervalMs` value (e.g., 1000): advancing 1000ms should trigger a tick
- Omitting `tickIntervalMs` should default to `TICK_INTERVAL_MS` (3000)

---

## TC-012: stop() clears the interval and halts ticking

**Priority:** P0
**Type:** Functional

### Objective

Verify that `stop()` clears the interval so no further ticks are fired.

### Preconditions

- Fake timers enabled
- Engine started with `start()`

### Steps

1. Call `engine.start()`, advance 3000ms
   **Expected:** `onPriceUpdate` called once

2. Call `engine.stop()`
   **Expected:** No error

3. Advance timers by 6000ms
   **Expected:** `onPriceUpdate` still called only once — no additional ticks

### Test Data

- 10-entry timeline

### Edge Cases

- Calling `stop()` before `start()` should not throw
- Calling `stop()` multiple times should not throw

---

## TC-013: start() is idempotent — no duplicate intervals

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `start()` twice does not create a second interval, which would cause double-speed ticking.

### Preconditions

- Fake timers enabled
- A 10-entry timeline engine

### Steps

1. Call `engine.start()` twice in succession
   **Expected:** No error

2. Advance timers by 3000ms
   **Expected:** `onPriceUpdate` called exactly once (not twice)

3. Stop and clean up
   **Expected:** Cleanup succeeds

### Test Data

- 10-entry timeline

### Edge Cases

- Calling `start()`, then `stop()`, then `start()` again should work correctly (restarting the interval)

---

## TC-014: getPrice returns latest price for a known player

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getPrice(playerId)` returns the most recent price set during timeline advancement (AC-4: price update callbacks).

### Preconditions

- Engine constructed with a timeline containing entries for multiple players

### Steps

1. Call `engine.tick()` to advance to the entry for `player-1` at price 51
   **Expected:** `engine.getPrice('player-1')` returns `51`

2. Call `engine.tick()` again, advancing to `player-2` at price 52
   **Expected:** `engine.getPrice('player-2')` returns `52`; `engine.getPrice('player-1')` still returns `51`

### Test Data

- Timeline with entries: `[{playerId: 'player-0', price: 50}, {playerId: 'player-1', price: 51}, {playerId: 'player-2', price: 52}]`

### Edge Cases

- When the same player appears multiple times, `getPrice` returns the latest price (replacement, not accumulation)

---

## TC-015: getPrice returns 0 for unknown player

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getPrice` returns `0` (not `undefined` or `NaN`) for a player ID that has never appeared in the timeline.

### Preconditions

- Engine constructed with a non-empty timeline

### Steps

1. Call `engine.getPrice('nonexistent-player')`
   **Expected:** Returns `0`

### Test Data

- Any valid timeline; query with `'nonexistent-player'`

### Edge Cases

- Empty string as player ID should also return `0`

---

## TC-016: Constructor seeds initial price from first timeline entry

**Priority:** P1
**Type:** Functional

### Objective

Verify that during construction, the engine reads the first timeline entry and seeds `prices[entry.playerId]` with its price, so `getPrice` works before any `tick()` call.

### Preconditions

- Non-empty timeline

### Steps

1. Construct engine with a timeline whose first entry is `{ playerId: 'mahomes', price: 50, ... }`
   **Expected:** `engine.getPrice('mahomes')` returns `50` immediately after construction (before any tick)

2. Construct engine with an empty timeline
   **Expected:** No price is seeded; `getPrice('anyone')` returns `0`

### Test Data

- Single-entry timeline: `[{ playerId: 'mahomes', price: 50, ... }]`

### Edge Cases

- N/A

---

## TC-017: No React dependency — engine is a plain TypeScript class

**Priority:** P0
**Type:** Functional

### Objective

Verify that `simulationEngine.ts` has zero React imports and can be instantiated in a pure Node/Vitest environment without any React context or DOM (AC-5).

### Preconditions

- Access to the source file `src/services/simulationEngine.ts`

### Steps

1. Inspect imports of `simulationEngine.ts`
   **Expected:** No imports from `react`, `react-dom`, or any React-related packages

2. Instantiate `TimelineSimulationEngine` in a Vitest test (no jsdom, no React)
   **Expected:** Instance created successfully; `start()`, `tick()`, `stop()`, `getPrice()` all function correctly

3. Verify the module's dependency graph (e.g., via bundler analysis or manual inspection)
   **Expected:** Only imports from `../types`, `../types/simulation`, and `../constants` — all plain TypeScript modules

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-018: Extensibility — a third engine class can implement SimulationEngine

**Priority:** P1
**Type:** Integration

### Objective

Verify that a new class implementing `SimulationEngine` compiles and can be used interchangeably with `TimelineSimulationEngine` (AC-6: adding a third mode only requires a new class).

### Preconditions

- `SimulationEngine` interface is importable

### Steps

1. Define a minimal stub class that implements `SimulationEngine`:
   ```typescript
   class StubEngine implements SimulationEngine {
     start() {}
     stop() {}
     tick() {}
     getPrice(_id: string) { return 0; }
   }
   ```
   **Expected:** No TypeScript compilation errors

2. Assign an instance of `StubEngine` to a variable typed `SimulationEngine`
   **Expected:** Assignment succeeds without type errors

3. Call `start()`, `tick()`, `getPrice('x')`, `stop()` on the variable
   **Expected:** All methods callable through the interface type

### Test Data

- N/A

### Edge Cases

- A class that omits one method (e.g., no `getPrice`) should produce a compile error when assigned to `SimulationEngine`
