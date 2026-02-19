# Test Plan: mcq-qzq.4 -- Extract priceResolver as pure module

## Summary

- **Bead:** `mcq-qzq.4`
- **Feature:** Extraction of price-resolution helpers and `getEffectivePrice` from GameContext into a standalone, pure `services/priceResolver.ts` module
- **Total Test Cases:** 22
- **Test Types:** Functional, Integration

---

## TC-001: getEffectivePrice returns override price when override exists

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `priceOverrides` contains an entry for the given player, that override value is used as the base price (taking priority over history and basePrice).

### Preconditions

- `priceResolver.ts` module is importable
- A `players` array contains a player with id `"player-1"` and `basePrice: 40`

### Steps

1. Call `getEffectivePrice("player-1", { "player-1": 55.0 }, {}, players)`
   **Expected:** Returns `55.0`

2. Call `getEffectivePrice("player-1", { "player-1": 55.0 }, {}, players)` where the player also has priceHistory with a different latest price
   **Expected:** Returns `55.0` (override takes precedence over history)

### Test Data

- Player: `{ id: "player-1", basePrice: 40, priceHistory: [{ price: 50 }] }`
- Override map: `{ "player-1": 55.0 }`

### Edge Cases

- Override value is `0` — must be treated as a valid override, not falsy. `getEffectivePrice("player-1", { "player-1": 0 }, {}, players)` returns `0`

---

## TC-002: getEffectivePrice falls back to last priceHistory entry when no override

**Priority:** P0
**Type:** Functional

### Objective

Verify that when no override exists for the player, the function reads the last entry in the player's `priceHistory` array to determine the base price.

### Preconditions

- Player has a `priceHistory` array with multiple entries
- `priceOverrides` is empty `{}`

### Steps

1. Create a player with `priceHistory: [{ price: 42 }, { price: 48 }]`
   **Expected:** N/A (setup)

2. Call `getEffectivePrice("player-1", {}, {}, [player])`
   **Expected:** Returns `48.0` (last entry's price)

### Test Data

- Player: `{ id: "player-1", basePrice: 40, priceHistory: [{ timestamp: "t1", price: 42, reason: {...} }, { timestamp: "t2", price: 48, reason: {...} }] }`

### Edge Cases

- Single-entry history: returns that single entry's price
- History exists but override key is for a different player: still uses history for the requested player

---

## TC-003: getEffectivePrice falls back to basePrice when no override and no history

**Priority:** P0
**Type:** Functional

### Objective

Verify that when there is no override and no price history (or empty history), the function falls back to the player's `basePrice`.

### Preconditions

- Player has no `priceHistory` property or an empty array
- `priceOverrides` is empty

### Steps

1. Call `getEffectivePrice("player-1", {}, {}, [playerWithNoHistory])`
   **Expected:** Returns the player's `basePrice` (e.g., `40.0`)

2. Call `getEffectivePrice("player-1", {}, {}, [playerWithEmptyHistory])` where `priceHistory: []`
   **Expected:** Returns `basePrice` (e.g., `40.0`)

### Test Data

- Player A: `{ id: "player-1", basePrice: 40 }` (no priceHistory key)
- Player B: `{ id: "player-1", basePrice: 40, priceHistory: [] }`

### Edge Cases

- `basePrice` is `0`: returns `0`

---

## TC-004: getEffectivePrice returns 0 for unknown or null player

**Priority:** P0
**Type:** Functional

### Objective

Verify that the function safely returns `0` when the player cannot be resolved — either because the playerId is null/undefined, or the player is not found in the array.

### Preconditions

- `players` array does not contain the requested playerId (or is empty)

### Steps

1. Call `getEffectivePrice("nonexistent", {}, {}, players)`
   **Expected:** Returns `0`

2. Call `getEffectivePrice("player-1", {}, {}, [])`
   **Expected:** Returns `0`

3. Call `getEffectivePrice(null, {}, {}, players)`
   **Expected:** Returns `0`

4. Call `getEffectivePrice(undefined, {}, {}, players)`
   **Expected:** Returns `0`

### Test Data

- `players`: array with known ids that do not include the queried id

### Edge Cases

- Empty string `""` as playerId: should return `0` (no player matched)

---

## TC-005: getEffectivePrice applies user impact multiplier correctly

**Priority:** P0
**Type:** Functional

### Objective

Verify that the user impact factor is applied as `basePrice * (1 + impact)` and the result is rounded to two decimal places.

### Preconditions

- Player exists in the array
- `userImpact` map has an entry for the player

### Steps

1. Call `getEffectivePrice("player-1", { "player-1": 55.0 }, { "player-1": 0.05 }, players)`
   **Expected:** Returns `57.75` (55 * 1.05)

2. Call with negative impact: `getEffectivePrice("player-1", { "player-1": 100.0 }, { "player-1": -0.5 }, players)`
   **Expected:** Returns `50.0` (100 * 0.5)

3. Call with zero impact: `getEffectivePrice("player-1", { "player-1": 42.5 }, { "player-1": 0 }, players)`
   **Expected:** Returns `42.5` (unchanged)

4. Call with 100% increase: `getEffectivePrice("player-1", { "player-1": 50.0 }, { "player-1": 1.0 }, players)`
   **Expected:** Returns `100.0` (50 * 2)

5. Call with fractional precision: `getEffectivePrice("player-1", { "player-1": 33.33 }, { "player-1": 0.001 }, players)`
   **Expected:** Returns `33.36` (rounded to two decimals)

### Test Data

- Various combinations of override prices and impact factors

### Edge Cases

- Impact applied to history-based price (no override): `getEffectivePrice("player-1", {}, { "player-1": -0.02 }, playersWithHistory)` where history price is `48.0` should return `47.04`
- Missing impact key for player: treated as `0`, price unchanged

---

## TC-006: priceResolver has zero React imports

**Priority:** P0
**Type:** Functional

### Objective

Verify that `services/priceResolver.ts` contains no React dependency — no imports from `react`, no hooks, no JSX. This is the core contract of the extraction: pure computational functions.

### Preconditions

- `services/priceResolver.ts` exists on disk

### Steps

1. Inspect the import statements of `services/priceResolver.ts`
   **Expected:** No import from `'react'`, `'react-dom'`, or any React-related package

2. Import and call all exported functions from a plain TypeScript/Vitest test file with no React runtime configured
   **Expected:** All functions execute successfully without any React-related errors

### Test Data

- N/A (static analysis + runtime verification)

### Edge Cases

- Transitive dependencies: verify that imported types (e.g., `Player`, `ContentItem`) also contain no React dependency

---

## TC-007: getCurrentPriceFromHistory returns last history entry price

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getCurrentPriceFromHistory` reads the price from the last element of the player's `priceHistory` array.

### Preconditions

- Player has a populated `priceHistory` array

### Steps

1. Call `getCurrentPriceFromHistory(player)` where player has `priceHistory: [{ price: 42 }, { price: 48 }]`
   **Expected:** Returns `48`

2. Call with a single-entry history `[{ price: 55 }]`
   **Expected:** Returns `55`

### Test Data

- Player with multi-entry and single-entry priceHistory

### Edge Cases

- History with identical prices across all entries

---

## TC-008: getCurrentPriceFromHistory falls back to basePrice when no history

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a player has no `priceHistory` or an empty array, the function returns `basePrice`.

### Preconditions

- Player exists but has no priceHistory or empty priceHistory

### Steps

1. Call `getCurrentPriceFromHistory(makePlayer({ basePrice: 40 }))` (no priceHistory key)
   **Expected:** Returns `40`

2. Call `getCurrentPriceFromHistory(makePlayer({ basePrice: 40, priceHistory: [] }))`
   **Expected:** Returns `40`

### Test Data

- Player with `basePrice: 40`, no priceHistory

### Edge Cases

- `basePrice` is `0`: returns `0`

---

## TC-009: getCurrentPriceFromHistory returns 0 for null/undefined player

**Priority:** P1
**Type:** Functional

### Objective

Verify safe handling of null/undefined input.

### Preconditions

- None

### Steps

1. Call `getCurrentPriceFromHistory(null)`
   **Expected:** Returns `0`

2. Call `getCurrentPriceFromHistory(undefined)`
   **Expected:** Returns `0`

### Test Data

- N/A

### Edge Cases

- None beyond the null/undefined cases

---

## TC-010: getChangePercentFromHistory computes correct percentage

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getChangePercentFromHistory` computes `((currentPrice - basePrice) / basePrice) * 100` using the last history entry price.

### Preconditions

- Player has a non-zero `basePrice` and at least one priceHistory entry

### Steps

1. Call `getChangePercentFromHistory(player)` where `basePrice: 40` and last history price is `48`
   **Expected:** Returns `20` (20% increase)

2. Call with a price decrease: `basePrice: 50`, last history price `40`
   **Expected:** Returns `-20` (20% decrease)

### Test Data

- Player with `basePrice: 40`, `priceHistory: [{ price: 48 }]`

### Edge Cases

- No price change (current == base): returns `0`
- Very large percentage swings

---

## TC-011: getChangePercentFromHistory returns 0 for null player or zero basePrice

**Priority:** P1
**Type:** Functional

### Objective

Verify safe handling when player is null or basePrice is zero (division-by-zero guard).

### Preconditions

- None

### Steps

1. Call `getChangePercentFromHistory(null)`
   **Expected:** Returns `0`

2. Call `getChangePercentFromHistory(makePlayer({ basePrice: 0 }))`
   **Expected:** Returns `0` (avoids division by zero)

### Test Data

- Null player, player with `basePrice: 0`

### Edge Cases

- Player with `basePrice: 0` and priceHistory entries (should still return `0`, not NaN/Infinity)

---

## TC-012: getMoveReasonFromHistory returns last headline

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getMoveReasonFromHistory` extracts the `reason.headline` from the last priceHistory entry.

### Preconditions

- Player has priceHistory with `reason` objects containing `headline`

### Steps

1. Call `getMoveReasonFromHistory(player)` where history has entries with headlines `"Rush"` and `"TD pass"`
   **Expected:** Returns `"TD pass"` (last entry)

### Test Data

- Player with `priceHistory: [{ reason: { headline: "Rush" } }, { reason: { headline: "TD pass" } }]`

### Edge Cases

- Single-entry history: returns that entry's headline

---

## TC-013: getMoveReasonFromHistory returns empty string for null player or missing reason

**Priority:** P1
**Type:** Functional

### Objective

Verify safe handling when player is null or the last history entry has no reason.

### Preconditions

- None

### Steps

1. Call `getMoveReasonFromHistory(null)`
   **Expected:** Returns `""`

2. Call `getMoveReasonFromHistory(player)` where last entry has `reason: undefined`
   **Expected:** Returns `""`

3. Call with player having no priceHistory
   **Expected:** Returns `""`

### Test Data

- Null player, player with missing reason in last history entry

### Edge Cases

- `reason` exists but `headline` is undefined: returns `""` (via optional chaining)
- `reason` exists but `headline` is empty string: returns `""`

---

## TC-014: getLatestContentFromHistory returns content from last entry

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getLatestContentFromHistory` returns the `content` array from the last priceHistory entry.

### Preconditions

- Player has priceHistory with `content` arrays

### Steps

1. Call `getLatestContentFromHistory(player)` where history has two entries with different content
   **Expected:** Returns only the content from the last entry (e.g., `[{ type: "video" }]`)

### Test Data

- Player with `priceHistory: [{ content: [{ type: "article" }] }, { content: [{ type: "video" }] }]`

### Edge Cases

- Single content item in last entry
- Multiple content items in last entry

---

## TC-015: getLatestContentFromHistory returns empty array for null player or missing content

**Priority:** P1
**Type:** Functional

### Objective

Verify safe handling when player is null or last entry has no content.

### Preconditions

- None

### Steps

1. Call `getLatestContentFromHistory(null)`
   **Expected:** Returns `[]`

2. Call `getLatestContentFromHistory(player)` where last entry has no `content` key
   **Expected:** Returns `[]`

3. Call with empty priceHistory array
   **Expected:** Returns `[]`

### Test Data

- Null player, player with missing content in last history entry

### Edge Cases

- `content` key is present but is an empty array: returns `[]`

---

## TC-016: getAllContentFromHistory aggregates content across all entries

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getAllContentFromHistory` flattens and returns content items from all priceHistory entries.

### Preconditions

- Player has multiple priceHistory entries with content

### Steps

1. Call `getAllContentFromHistory(player)` where two history entries each have one content item
   **Expected:** Returns `[{ type: "article" }, { type: "video" }]` (both items, in order)

### Test Data

- Player with `priceHistory: [{ content: [{ type: "article" }] }, { content: [{ type: "video" }] }]`

### Edge Cases

- Some entries have content, others do not: only entries with content contribute items
- Entry with multiple content items: all items from that entry are included

---

## TC-017: getAllContentFromHistory returns empty array for null player or no history

**Priority:** P1
**Type:** Functional

### Objective

Verify safe handling when player is null, has no priceHistory, or has empty priceHistory.

### Preconditions

- None

### Steps

1. Call `getAllContentFromHistory(null)`
   **Expected:** Returns `[]`

2. Call `getAllContentFromHistory(makePlayer())` (no priceHistory key)
   **Expected:** Returns `[]`

3. Call `getAllContentFromHistory(makePlayer({ priceHistory: [] }))`
   **Expected:** Returns `[]`

### Test Data

- Null, player without priceHistory, player with empty priceHistory

### Edge Cases

- All history entries have empty content arrays: returns `[]`

---

## TC-018: All functions are exported from priceResolver.ts

**Priority:** P0
**Type:** Functional

### Objective

Verify that all six functions specified in the acceptance criteria are named exports from `services/priceResolver.ts`.

### Preconditions

- Module exists at `src/services/priceResolver.ts`

### Steps

1. Import `{ getEffectivePrice, getCurrentPriceFromHistory, getChangePercentFromHistory, getMoveReasonFromHistory, getLatestContentFromHistory, getAllContentFromHistory }` from `services/priceResolver`
   **Expected:** All six imports resolve without error

2. Verify each import is a function (typeof check)
   **Expected:** All six are `"function"`

### Test Data

- N/A

### Edge Cases

- No default export leaking React components

---

## TC-019: getEffectivePrice function signature matches specification

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getEffectivePrice` accepts the exact parameter signature: `(playerId, priceOverrides, userImpact, players)` — a pure function with no closure over React state.

### Preconditions

- Module is importable

### Steps

1. Call `getEffectivePrice` with all four arguments explicitly provided
   **Expected:** Returns a number without requiring any prior context or React provider wrapping

2. Call the same function with different `players` arrays in successive calls
   **Expected:** Results change based on the provided array, confirming no stale closure

### Test Data

- Two different players arrays with different prices for the same playerId

### Edge Cases

- Calling with `undefined` for optional fields still produces a deterministic result

---

## TC-020: GameContext imports from priceResolver instead of defining inline

**Priority:** P0
**Type:** Integration

### Objective

Verify that `GameContext.jsx` (or its successor) imports `getEffectivePrice` and helper functions from `services/priceResolver` rather than defining them inline.

### Preconditions

- `GameContext.jsx` exists

### Steps

1. Inspect `GameContext.jsx` import statements for `services/priceResolver`
   **Expected:** Contains `import { getEffectivePrice, ... } from '../services/priceResolver'` (or aliased import)

2. Search `GameContext.jsx` for inline definitions of `getCurrentPriceFromHistory`, `getChangePercentFromHistory`, `getMoveReasonFromHistory`, `getLatestContentFromHistory`, `getAllContentFromHistory`
   **Expected:** No inline `function` declarations for these names — they are only referenced via import

### Test Data

- N/A (static analysis)

### Edge Cases

- Aliased imports (e.g., `getEffectivePrice as getEffectivePricePure`) are acceptable as long as the source is `priceResolver`

---

## TC-021: Unit tests achieve >90% branch coverage

**Priority:** P0
**Type:** Functional

### Objective

Verify that the test suite for `priceResolver.ts` covers more than 90% of branches, as required by AC-4.

### Preconditions

- Test file `services/__tests__/priceResolver.test.ts` exists
- Vitest (or configured test runner) supports coverage reporting

### Steps

1. Run `npx vitest run --coverage src/services/__tests__/priceResolver.test.ts`
   **Expected:** All tests pass

2. Check the branch coverage percentage for `src/services/priceResolver.ts` in the coverage report
   **Expected:** Branch coverage >= 90%

### Test Data

- N/A (tooling output)

### Edge Cases

- Ensure coverage includes: null/undefined player paths, empty history paths, zero basePrice path, override-exists vs override-missing branches, impact-present vs impact-absent branches

---

## TC-022: getEffectivePrice priority chain is correct (override > history > basePrice)

**Priority:** P0
**Type:** Functional

### Objective

Verify the complete priority chain in a single player setup: override wins over history, and history wins over basePrice.

### Preconditions

- Player has all three price sources: basePrice, priceHistory, and an entry in priceOverrides

### Steps

1. Create player with `basePrice: 30`, `priceHistory: [{ price: 40 }]`; set override to `50`
   **Expected:** `getEffectivePrice` returns `50` (override wins)

2. Remove override (empty `{}`)
   **Expected:** Returns `40` (history wins over basePrice)

3. Remove history (empty `[]` or undefined)
   **Expected:** Returns `30` (basePrice is final fallback)

### Test Data

- Player: `{ id: "p", basePrice: 30, priceHistory: [{ price: 40, ... }] }`
- Override map: `{ "p": 50 }` then `{}`

### Edge Cases

- Override set to same value as history price: still uses override path (no semantic difference but confirms code path)
