# Test Plan: mcq-vlu.3 -- Create TradingContext

## Summary

- **Bead:** `mcq-vlu.3`
- **Feature:** TradingContext providing portfolio, cash, and user price impact state with buyShares/sellShares actions, priceResolver integration, storageService persistence, and scenario-change reset behavior
- **Total Test Cases:** 27
- **Test Types:** Functional, Integration

---

## TC-001: TradingProvider renders children

**Priority:** P0
**Type:** Functional

### Objective

Verify that wrapping components in `<TradingProvider>` renders the child tree without errors.

### Preconditions

- ScenarioContext and SimulationContext providers are available (TradingProvider depends on both)
- A valid `players` array and `scenarioVersion` are provided by ScenarioContext

### Steps

1. Render `<TradingProvider><div data-testid="child" /></TradingProvider>` inside required parent providers
   **Expected:** The child `<div>` is present in the DOM

### Test Data

- Minimal mock for ScenarioContext (`players: [], scenarioVersion: 0, currentData: null`)
- Minimal mock for SimulationContext (`priceOverrides: {}, isEspnLiveMode: false, espnPriceHistory: {}`)

### Edge Cases

- None

---

## TC-002: useTrading throws when used outside TradingProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `useTrading()` without a `<TradingProvider>` ancestor throws a descriptive error, preventing silent undefined-context bugs.

### Preconditions

- No TradingProvider in the component tree

### Steps

1. Render a component that calls `useTrading()` without wrapping it in `<TradingProvider>`
   **Expected:** An error is thrown with message "useTrading must be used within a TradingProvider"

### Test Data

- None

### Edge Cases

- None

---

## TC-003: useTrading returns complete context shape

**Priority:** P0
**Type:** Functional

### Objective

Verify that the object returned by `useTrading()` contains all expected properties matching the `TradingContextValue` interface: `portfolio`, `cash`, `buyShares`, `sellShares`, `getEffectivePrice`, `getPlayer`, `getPlayers`, `getPortfolioValue`.

### Preconditions

- TradingProvider is rendered with valid parent contexts

### Steps

1. Call `useTrading()` from a component inside `<TradingProvider>`
   **Expected:** Returned object has keys: `portfolio` (object), `cash` (number), `buyShares` (function), `sellShares` (function), `getEffectivePrice` (function), `getPlayer` (function), `getPlayers` (function), `getPortfolioValue` (function)

### Test Data

- Default provider mocks

### Edge Cases

- None

---

## TC-004: buyShares delegates to priceResolver.getEffectivePrice for pricing

**Priority:** P0
**Type:** Integration

### Objective

Verify that `buyShares` calls the pure `getEffectivePrice` function from `priceResolver.ts` (not inline price computation) to determine the share price. This confirms AC-2.

### Preconditions

- TradingProvider rendered with a player `"p1"` at base price 50
- `priceResolver.getEffectivePrice` is spied on or the output is observable via price changes

### Steps

1. Set up a `priceOverrides` map with `{ "p1": 75 }` in SimulationContext
   **Expected:** The override is available to the TradingProvider

2. Call `buyShares("p1", 2)`
   **Expected:** Returns `true`; cash is reduced by `75 * 2 = 150` (the override price), not by `50 * 2 = 100` (the raw base price)

### Test Data

- Player: `{ id: "p1", basePrice: 50, priceHistory: [] }`
- Price override: `{ "p1": 75 }`
- Starting cash: 10000

### Edge Cases

- When userImpact exists for the player, the effective price should incorporate `basePrice * (1 + impact)` via priceResolver

---

## TC-005: sellShares delegates to priceResolver.getEffectivePrice for pricing

**Priority:** P0
**Type:** Integration

### Objective

Verify that `sellShares` uses the priceResolver-computed effective price for proceeds calculation, not an inline formula.

### Preconditions

- Player `"p1"` is in the portfolio with at least 2 shares
- A price override of 80 is set for `"p1"`

### Steps

1. Call `sellShares("p1", 2)`
   **Expected:** Returns `true`; cash increases by `80 * 2 = 160` (the override price used as effective price)

### Test Data

- Player: `{ id: "p1", basePrice: 50 }`
- Price override: `{ "p1": 80 }`
- Portfolio: `{ "p1": { shares: 5, avgCost: 50 } }`

### Edge Cases

- Effective price includes userImpact — proceeds should reflect the impacted price

---

## TC-006: Portfolio initializes from storageService on mount

**Priority:** P0
**Type:** Functional

### Objective

Verify that on mount, portfolio state is initialized by calling `read(STORAGE_KEYS.portfolio, {})` from storageService, restoring any previously persisted portfolio.

### Preconditions

- storageService contains a previously saved portfolio in localStorage under key `"mcqueen-portfolio"`

### Steps

1. Write `{ "p1": { shares: 3, avgCost: 45 } }` to storageService under portfolio key
   **Expected:** Value is stored

2. Mount `<TradingProvider>` and read `portfolio` from `useTrading()`
   **Expected:** `portfolio` equals `{ "p1": { shares: 3, avgCost: 45 } }`

### Test Data

- Stored portfolio: `{ "p1": { shares: 3, avgCost: 45 } }`

### Edge Cases

- No stored portfolio (empty localStorage) — should default to `{}`

---

## TC-007: Cash initializes from storageService on mount

**Priority:** P0
**Type:** Functional

### Objective

Verify that on mount, cash state is initialized by calling `read(STORAGE_KEYS.cash, INITIAL_CASH)`, restoring any previously persisted cash balance.

### Preconditions

- storageService contains a cash value under key `"mcqueen-cash"`

### Steps

1. Write `7500.50` to storageService under cash key
   **Expected:** Value is stored

2. Mount `<TradingProvider>` and read `cash` from `useTrading()`
   **Expected:** `cash` equals `7500.50`

### Test Data

- Stored cash: `7500.50`

### Edge Cases

- No stored cash — should default to `INITIAL_CASH` (10000)

---

## TC-008: Portfolio changes are written to storageService

**Priority:** P0
**Type:** Functional

### Objective

Verify that whenever the portfolio state changes, the new value is persisted via `write(STORAGE_KEYS.portfolio, portfolio)`.

### Preconditions

- TradingProvider is mounted with a player available
- storageService `write` is spied on

### Steps

1. Call `buyShares("p1", 1)` to trigger a portfolio change
   **Expected:** `write` is called with key `"mcqueen-portfolio"` and the updated portfolio object containing `"p1"`

2. Call `sellShares("p1", 1)` to trigger another portfolio change
   **Expected:** `write` is called again with the updated (now empty) portfolio

### Test Data

- Player: `{ id: "p1", basePrice: 50 }`

### Edge Cases

- Multiple rapid buys — each triggers a write

---

## TC-009: Cash changes are written to storageService

**Priority:** P0
**Type:** Functional

### Objective

Verify that whenever cash state changes, the new value is persisted via `write(STORAGE_KEYS.cash, cash)`.

### Preconditions

- TradingProvider is mounted; storageService `write` is spied on

### Steps

1. Call `buyShares("p1", 1)` to reduce cash
   **Expected:** `write` is called with key `"mcqueen-cash"` and the new (lower) cash value

### Test Data

- Player: `{ id: "p1", basePrice: 50 }`

### Edge Cases

- None

---

## TC-010: Empty localStorage applies startingPortfolio from currentData

**Priority:** P1
**Type:** Functional

### Objective

Verify that when localStorage has no saved portfolio (empty object), the `startingPortfolio` from `currentData` is applied on initial data load. This only happens once (guarded by `didApplyStarting` ref).

### Preconditions

- localStorage is clear (no portfolio key)
- ScenarioContext provides `currentData.startingPortfolio = { "mahomes": { shares: 10, avgCost: 55 } }`

### Steps

1. Mount `<TradingProvider>` with the above currentData
   **Expected:** `portfolio` equals `{ "mahomes": { shares: 10, avgCost: 55 } }`

2. Unmount and remount `<TradingProvider>` (simulating page refresh) with non-empty localStorage
   **Expected:** The stored portfolio is used, not `startingPortfolio` again

### Test Data

- `currentData.startingPortfolio`: `{ "mahomes": { shares: 10, avgCost: 55 } }`

### Edge Cases

- `currentData` is `null` — startingPortfolio logic is skipped, portfolio stays `{}`
- `currentData.startingPortfolio` is `undefined` — logic is skipped

---

## TC-011: Portfolio resets to startingPortfolio on scenarioVersion change

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `scenarioVersion` changes (to a non-zero value), the portfolio is set to `currentData.startingPortfolio` (or `{}` if not available).

### Preconditions

- TradingProvider is mounted with a portfolio containing holdings
- ScenarioContext provides `currentData.startingPortfolio = { "allen": { shares: 5, avgCost: 40 } }`

### Steps

1. Confirm the portfolio has current holdings (e.g., bought some shares)
   **Expected:** Portfolio is non-empty

2. Trigger a `scenarioVersion` change (e.g., from 1 to 2) via ScenarioContext
   **Expected:** Portfolio is now `{ "allen": { shares: 5, avgCost: 40 } }` (the startingPortfolio)

### Test Data

- Starting portfolio: `{ "allen": { shares: 5, avgCost: 40 } }`
- Pre-existing holdings from trades

### Edge Cases

- `currentData` is `null` — portfolio resets to `{}`
- `currentData.startingPortfolio` is `undefined` — portfolio resets to `{}`

---

## TC-012: Cash resets to INITIAL_CASH on scenarioVersion change

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `scenarioVersion` changes (to a non-zero value), cash is reset to `INITIAL_CASH` (10000).

### Preconditions

- TradingProvider is mounted; cash has been reduced by prior trades

### Steps

1. Call `buyShares("p1", 5)` to reduce cash below 10000
   **Expected:** Cash is less than 10000

2. Trigger a `scenarioVersion` change (e.g., from 1 to 2)
   **Expected:** Cash is exactly `10000`

### Test Data

- INITIAL_CASH = 10000

### Edge Cases

- Cash was exactly 10000 before reset — still set to 10000 (idempotent)

---

## TC-013: userImpact cleared on scenarioVersion change

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `scenarioVersion` changes, the `userImpact` state is reset to an empty object `{}`, so prior trading activity no longer influences effective prices.

### Preconditions

- TradingProvider is mounted; several buy/sell operations have been performed, building up userImpact values

### Steps

1. Call `buyShares("p1", 10)` to accumulate userImpact for "p1"
   **Expected:** Effective price for "p1" is higher than base price (impact = 10 * 0.001 = 0.01 → 1% increase)

2. Trigger a `scenarioVersion` change
   **Expected:** Effective price for "p1" returns to base price (userImpact is cleared)

### Test Data

- Player: `{ id: "p1", basePrice: 100 }`
- USER_IMPACT_FACTOR = 0.001

### Edge Cases

- None

---

## TC-014: scenarioVersion 0 does not trigger reset

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `scenarioVersion` is `0` (initial value), the reset effect is skipped — portfolio, cash, and userImpact are left unchanged.

### Preconditions

- TradingProvider is mounted with `scenarioVersion = 0`
- Portfolio has been modified via trades

### Steps

1. Perform trades to modify portfolio and cash
   **Expected:** Portfolio and cash reflect the trades

2. Confirm `scenarioVersion` is `0`
   **Expected:** Portfolio and cash remain as modified — no reset occurs

### Test Data

- Any traded state

### Edge Cases

- None

---

## TC-015: buyShares deducts cash and adds shares to portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify the core buy mechanic: cash is reduced by `effectivePrice * shares`, and the portfolio gains an entry (or updates an existing one) for the purchased player.

### Preconditions

- TradingProvider is mounted with a player `"mahomes"` at effective price 50
- Cash is at INITIAL_CASH (10000)
- Portfolio is empty

### Steps

1. Call `buyShares("mahomes", 3)`
   **Expected:** Returns `true`

2. Read `cash`
   **Expected:** `10000 - (50 * 3) = 9850`

3. Read `portfolio["mahomes"]`
   **Expected:** `{ shares: 3, avgCost: 50 }`

### Test Data

- Player: `{ id: "mahomes", basePrice: 50 }`
- Initial cash: 10000

### Edge Cases

- Buying 0 shares — cost is 0, operation succeeds trivially (shares: 0 added)

---

## TC-016: buyShares computes weighted average cost on multiple buys

**Priority:** P0
**Type:** Functional

### Objective

Verify that when buying additional shares of a player already in the portfolio, `avgCost` is recalculated as a weighted average of old and new positions.

### Preconditions

- Player `"p1"` effective price is 50 for the first buy
- Portfolio already holds `{ "p1": { shares: 2, avgCost: 40 } }` from a prior purchase at price 40

### Steps

1. Call `buyShares("p1", 3)` at effective price 50
   **Expected:** Returns `true`

2. Read `portfolio["p1"]`
   **Expected:** `{ shares: 5, avgCost: 46 }` — computed as `(2*40 + 3*50) / 5 = 230 / 5 = 46`

### Test Data

- Existing holding: `{ shares: 2, avgCost: 40 }`
- New purchase: 3 shares at price 50

### Edge Cases

- avgCost result is rounded to 2 decimal places (e.g., `(2*40 + 1*55) / 3 = 45.00`)

---

## TC-017: buyShares updates userImpact

**Priority:** P1
**Type:** Functional

### Objective

Verify that each `buyShares` call increases the user impact for that player by `shares * USER_IMPACT_FACTOR`.

### Preconditions

- TradingProvider is mounted; no prior trades

### Steps

1. Call `buyShares("p1", 5)` (USER_IMPACT_FACTOR = 0.001)
   **Expected:** userImpact for "p1" becomes `5 * 0.001 = 0.005`

2. Call `buyShares("p1", 3)` again
   **Expected:** userImpact for "p1" becomes `0.005 + 3 * 0.001 = 0.008`

### Test Data

- USER_IMPACT_FACTOR = 0.001

### Edge Cases

- Buying a different player does not affect "p1"'s impact
- Impact accumulates across multiple buys

---

## TC-018: buyShares returns false when insufficient cash

**Priority:** P0
**Type:** Functional

### Objective

Verify that `buyShares` returns `false` and does not modify portfolio or cash when the total cost exceeds available cash.

### Preconditions

- Cash is 10000; player effective price is 50

### Steps

1. Call `buyShares("p1", 1_000_000)` (cost = 50,000,000 > 10,000)
   **Expected:** Returns `false`

2. Read `cash`
   **Expected:** Still `10000`

3. Read `portfolio["p1"]`
   **Expected:** `undefined` (no entry created)

### Test Data

- Player: `{ id: "p1", basePrice: 50 }`
- Shares requested: 1,000,000

### Edge Cases

- Cost exactly equals cash — should succeed (see TC-019)
- Cost exceeds cash by $0.01 — should fail

---

## TC-019: buyShares succeeds when cost exactly equals available cash

**Priority:** P1
**Type:** Functional

### Objective

Verify the boundary condition where `cost === cash`: the buy should succeed and cash should become exactly 0.

### Preconditions

- Cash is set to 500; player effective price is 50

### Steps

1. Call `buyShares("p1", 10)` (cost = 50 * 10 = 500 = cash)
   **Expected:** Returns `true`

2. Read `cash`
   **Expected:** `0`

3. Read `portfolio["p1"]`
   **Expected:** `{ shares: 10, avgCost: 50 }`

### Test Data

- Cash: 500
- Player price: 50
- Shares: 10

### Edge Cases

- None

---

## TC-020: sellShares adds proceeds to cash and reduces shares

**Priority:** P0
**Type:** Functional

### Objective

Verify the core sell mechanic: cash increases by `effectivePrice * shares`, and the portfolio entry's `shares` count is reduced.

### Preconditions

- Portfolio holds `{ "p1": { shares: 5, avgCost: 40 } }`
- Effective price for "p1" is 60
- Cash is 8000

### Steps

1. Call `sellShares("p1", 2)`
   **Expected:** Returns `true`

2. Read `cash`
   **Expected:** `8000 + (60 * 2) = 8120`

3. Read `portfolio["p1"]`
   **Expected:** `{ shares: 3, avgCost: 40 }` (avgCost does not change on sell)

### Test Data

- Player: `{ id: "p1", basePrice: 60 }`
- Portfolio: `{ "p1": { shares: 5, avgCost: 40 } }`

### Edge Cases

- None

---

## TC-021: sellShares removes player from portfolio when all shares sold

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `remainingShares === 0`, the player's key is removed entirely from the portfolio object (not left as `{ shares: 0 }`).

### Preconditions

- Portfolio holds `{ "p1": { shares: 3, avgCost: 50 } }`

### Steps

1. Call `sellShares("p1", 3)`
   **Expected:** Returns `true`

2. Read `portfolio["p1"]`
   **Expected:** `undefined` (key removed)

3. Read `Object.keys(portfolio)`
   **Expected:** Does not contain `"p1"`

### Test Data

- Portfolio: `{ "p1": { shares: 3, avgCost: 50 } }`

### Edge Cases

- Other players in portfolio remain unaffected

---

## TC-022: sellShares updates userImpact (decreases)

**Priority:** P1
**Type:** Functional

### Objective

Verify that each `sellShares` call decreases the user impact for that player by `shares * USER_IMPACT_FACTOR`.

### Preconditions

- userImpact for "p1" has been increased by prior buy operations

### Steps

1. Call `buyShares("p1", 10)` to build up impact of `0.01`
   **Expected:** userImpact for "p1" is `0.01`

2. Call `sellShares("p1", 4)`
   **Expected:** userImpact for "p1" becomes `0.01 - 4 * 0.001 = 0.006`

### Test Data

- USER_IMPACT_FACTOR = 0.001

### Edge Cases

- Selling all shares can drive impact below 0 (net seller) — the implementation allows negative impact values

---

## TC-023: sellShares returns false when insufficient shares

**Priority:** P0
**Type:** Functional

### Objective

Verify that `sellShares` returns `false` and does not modify cash or portfolio when the player holds fewer shares than requested.

### Preconditions

- Portfolio holds `{ "p1": { shares: 2, avgCost: 50 } }`

### Steps

1. Call `sellShares("p1", 5)` (requesting 5, only 2 held)
   **Expected:** Returns `false`

2. Read `cash`
   **Expected:** Unchanged

3. Read `portfolio["p1"]`
   **Expected:** Still `{ shares: 2, avgCost: 50 }`

### Test Data

- Portfolio: `{ "p1": { shares: 2, avgCost: 50 } }`

### Edge Cases

- Requesting exactly held shares — should succeed (boundary, covered in TC-021)

---

## TC-024: sellShares returns false when player not in portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify that `sellShares` returns `false` when attempting to sell a player that has no portfolio entry.

### Preconditions

- Portfolio is empty `{}` or does not contain "p1"

### Steps

1. Call `sellShares("p1", 1)`
   **Expected:** Returns `false`

2. Read `cash`
   **Expected:** Unchanged

### Test Data

- Empty portfolio

### Edge Cases

- Player exists in the `players` list but not in portfolio — still returns false

---

## TC-025: getPortfolioValue returns correct value, cost, gain, and gainPercent

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getPortfolioValue()` correctly computes the aggregate portfolio statistics.

### Preconditions

- Portfolio: `{ "p1": { shares: 10, avgCost: 40 }, "p2": { shares: 5, avgCost: 60 } }`
- Effective prices: p1 = 50, p2 = 55

### Steps

1. Call `getPortfolioValue()`
   **Expected:** Returns:
   - `value`: `10*50 + 5*55 = 775`
   - `cost`: `10*40 + 5*60 = 700`
   - `gain`: `775 - 700 = 75`
   - `gainPercent`: `(75 / 700) * 100 = 10.71`

### Test Data

- Players and overrides set up to produce the above effective prices

### Edge Cases

- All values are rounded to 2 decimal places via `.toFixed(2)`

---

## TC-026: getPortfolioValue with empty portfolio

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getPortfolioValue()` handles an empty portfolio gracefully, returning zeroes.

### Preconditions

- Portfolio is `{}`

### Steps

1. Call `getPortfolioValue()`
   **Expected:** Returns `{ value: 0, cost: 0, gain: 0, gainPercent: 0 }`

### Test Data

- Empty portfolio

### Edge Cases

- `gainPercent` should be `0` (not `NaN` or `Infinity`) because `totalCost === 0` triggers the ternary fallback

---

## TC-027: getPortfolioValue is memoized with useCallback

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getPortfolioValue` returns a referentially stable function reference when its dependencies (`portfolio`, `getEffectivePrice`) have not changed, confirming the memoization required by AC-5 / M7.

### Preconditions

- TradingProvider is mounted

### Steps

1. Capture the `getPortfolioValue` function reference from `useTrading()`
   **Expected:** A function reference is returned

2. Trigger a re-render that does NOT change portfolio or effective prices (e.g., an unrelated state update)
   **Expected:** The `getPortfolioValue` reference is the same object (referential equality via `===`)

3. Trigger a change to portfolio (e.g., `buyShares("p1", 1)`)
   **Expected:** The `getPortfolioValue` reference is now a different object (dependencies changed)

### Test Data

- Any valid player setup

### Edge Cases

- None
