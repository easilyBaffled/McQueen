# Test Plan: mcq-8hr.1 -- Create shared test helpers (renderWithProviders + mockData)

## Summary

- **Bead:** `mcq-8hr.1`
- **Feature:** Shared test utility that wraps components in all required context providers, plus a reusable mock data module for players, portfolios, and leaderboard entries
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: renderWithProviders wraps component in ScenarioContext

**Priority:** P0
**Type:** Functional

### Objective

Verify that `renderWithProviders` supplies a mocked `useScenario` hook so that components consuming ScenarioContext render without throwing.

### Preconditions

- `src/test/renderWithProviders.tsx` exists and exports a `renderWithProviders` function
- A trivial test component that calls `useScenario()` and displays `scenario`

### Steps

1. Call `renderWithProviders(<TestComponent />)` with no overrides
   **Expected:** Component renders without "useScenario must be used within a ScenarioProvider" error

2. Query the rendered output for the default scenario value (e.g., `"midweek"`)
   **Expected:** The default scenario value is present in the DOM

### Test Data

- Default ScenarioContext mock should include at minimum: `scenario`, `setScenario`, `players`, `scenarioLoading`, `scenarioVersion`, `currentData`

### Edge Cases

- Calling `renderWithProviders` with an empty options object should still use all defaults without error

---

## TC-002: renderWithProviders wraps component in TradingContext

**Priority:** P0
**Type:** Functional

### Objective

Verify that `renderWithProviders` supplies a mocked `useTrading` hook so that components consuming TradingContext render without throwing.

### Preconditions

- A trivial test component that calls `useTrading()` and displays `cash`

### Steps

1. Call `renderWithProviders(<TestComponent />)` with no overrides
   **Expected:** Component renders without "useTrading must be used within a TradingProvider" error

2. Query the rendered output for the default cash value
   **Expected:** The default cash value (e.g., `10000`) is present in the DOM

### Test Data

- Default TradingContext mock should include: `portfolio`, `cash`, `buyShares`, `sellShares`, `getEffectivePrice`, `getPlayer`, `getPlayers`, `getPortfolioValue`

### Edge Cases

- `buyShares` and `sellShares` should be callable mock functions (vi.fn()) that don't throw

---

## TC-003: renderWithProviders wraps component in SocialContext

**Priority:** P0
**Type:** Functional

### Objective

Verify that `renderWithProviders` supplies a mocked `useSocial` hook so that components consuming SocialContext render without throwing.

### Preconditions

- A trivial test component that calls `useSocial()` and displays `watchlist.length`

### Steps

1. Call `renderWithProviders(<TestComponent />)` with no overrides
   **Expected:** Component renders without "useSocial must be used within a SocialProvider" error

2. Query the rendered output for the default watchlist length (`0`)
   **Expected:** The value `0` is present in the DOM

### Test Data

- Default SocialContext mock should include: `watchlist`, `missionPicks`, `missionRevealed`, `isWatching`, `getLeagueHoldings`, `getLeaderboardRankings`, `getLeagueMembers`, `addToWatchlist`, `removeFromWatchlist`, `setMissionPick`, `clearMissionPick`, `revealMission`, `resetMission`, `getMissionScore`

### Edge Cases

- `isWatching` should return `false` by default; `getLeagueHoldings` should return `[]` by default (matching existing mock patterns in PlayerCard.test.tsx)

---

## TC-004: renderWithProviders wraps component in ToastContext

**Priority:** P0
**Type:** Functional

### Objective

Verify that `renderWithProviders` supplies a mocked `useToast` hook so that components consuming ToastContext render without throwing.

### Preconditions

- A trivial test component that calls `useToast()` and invokes `addToast`

### Steps

1. Call `renderWithProviders(<TestComponent />)` with no overrides
   **Expected:** Component renders without "useToast must be used within a ToastProvider" error

2. Invoke the `addToast` function from within the test component
   **Expected:** No error is thrown; `addToast` is a callable mock function

### Test Data

- Default ToastContext mock should include: `addToast` (vi.fn()), `removeToast` (vi.fn())

### Edge Cases

- `addToast` should return a numeric id by default (matching real implementation signature)

---

## TC-005: renderWithProviders allows per-context overrides

**Priority:** P0
**Type:** Functional

### Objective

Verify that callers can override individual context values (e.g., pass a custom `portfolio` to TradingContext) and the overrides are reflected in the rendered component.

### Preconditions

- `renderWithProviders` accepts an options object allowing partial overrides for each context

### Steps

1. Call `renderWithProviders(<TestComponent />, { tradingOverrides: { cash: 5000 } })`
   **Expected:** Component sees `cash === 5000` instead of the default

2. Call `renderWithProviders(<TestComponent />, { scenarioOverrides: { scenario: 'playoffs' } })`
   **Expected:** Component sees `scenario === 'playoffs'`

3. Call `renderWithProviders(<TestComponent />, { socialOverrides: { watchlist: ['p1'] } })`
   **Expected:** Component sees `watchlist` containing `'p1'`

### Test Data

- Custom override values as listed above

### Edge Cases

- Overriding only one context should leave all other contexts at their defaults
- Overriding with an empty object `{}` should behave the same as no override

---

## TC-006: renderWithProviders returns standard RTL render result

**Priority:** P1
**Type:** Functional

### Objective

Verify that `renderWithProviders` returns the same object shape as `@testing-library/react`'s `render()`, including `container`, `getByText`, `rerender`, etc.

### Preconditions

- None beyond the helper existing

### Steps

1. Capture the return value of `renderWithProviders(<TestComponent />)`
   **Expected:** Return object has properties `container`, `getByText`, `queryByText`, `rerender`, `unmount`

2. Call `result.rerender(<TestComponent updatedProp="new" />)`
   **Expected:** The re-rendered component reflects the updated prop

### Test Data

- A simple test component that renders a prop value

### Edge Cases

- `unmount()` should cleanly tear down without console errors

---

## TC-007: mockData exports a valid mock Player object

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/test/mockData.ts` exports a mock player conforming to the `Player` type with all required fields populated.

### Preconditions

- `src/test/mockData.ts` exists and exports a mock player (e.g., `mockPlayer`)

### Steps

1. Import `mockPlayer` from `src/test/mockData`
   **Expected:** The import succeeds without TypeScript errors

2. Validate that `mockPlayer` has all required fields: `id`, `name`, `team`, `position`, `basePrice`
   **Expected:** All fields are present and have realistic NFL player values

3. Validate optional fields are present where useful for testing: `priceHistory` (array), `totalSharesAvailable` (number)
   **Expected:** `priceHistory` is an array (may be empty or have sample entries); other optional fields are defined

### Test Data

- Expected shape matches the `Player` interface from `src/types/scenario.ts`

### Edge Cases

- `priceHistory` entries, if present, should each have valid `timestamp`, `price`, and `reason` fields conforming to `PriceHistoryEntry`

---

## TC-008: mockData exports a valid mock EnrichedPlayer object

**Priority:** P1
**Type:** Functional

### Objective

Verify that `mockData.ts` exports a mock enriched player (with computed fields) conforming to the `EnrichedPlayer` type, usable for component tests that expect computed price data.

### Preconditions

- `src/test/mockData.ts` exports an enriched player (e.g., `mockEnrichedPlayer`)

### Steps

1. Import the enriched player mock
   **Expected:** Import succeeds

2. Validate it has all `Player` fields plus `currentPrice`, `changePercent`, `priceChange`, `moveReason`, `contentTiles`
   **Expected:** All fields present with sensible values (e.g., `currentPrice > 0`, `contentTiles` is an array)

### Test Data

- Should match the `EnrichedPlayer` interface from `src/types/index.ts`

### Edge Cases

- Should include both a positive `changePercent` variant and the ability to derive a negative variant via spread (e.g., `{ ...mockEnrichedPlayer, changePercent: -3.1 }`)

---

## TC-009: mockData exports valid mock Portfolio data

**Priority:** P0
**Type:** Functional

### Objective

Verify that `mockData.ts` exports mock portfolio data conforming to the `Portfolio` type (a `Record<string, Holding>`).

### Preconditions

- `src/test/mockData.ts` exports a `mockPortfolio`

### Steps

1. Import `mockPortfolio` from `src/test/mockData`
   **Expected:** Import succeeds

2. Validate that each entry has `shares` (number > 0) and `avgCost` (number > 0)
   **Expected:** At least one entry exists; all entries conform to `Holding` interface

3. Verify the player IDs used as keys are consistent with the mock player IDs
   **Expected:** Portfolio keys reference known mock player IDs

### Test Data

- Expected shape: `{ [playerId]: { shares: number, avgCost: number } }`

### Edge Cases

- An empty portfolio variant (`mockEmptyPortfolio = {}`) should also be available or trivially constructible

---

## TC-010: mockData exports valid mock LeaderboardEntry data

**Priority:** P1
**Type:** Functional

### Objective

Verify that `mockData.ts` exports mock leaderboard data conforming to `LeaderboardEntry[]`, suitable for Leaderboard component tests.

### Preconditions

- `src/test/mockData.ts` exports `mockLeaderboardRankings`

### Steps

1. Import `mockLeaderboardRankings` from `src/test/mockData`
   **Expected:** Import succeeds; value is a non-empty array

2. Validate each entry has required fields: `memberId`, `name`, `isUser`, `cash`, `holdingsValue`, `totalValue`, `rank`, `gapToNext`
   **Expected:** All fields present and correctly typed

3. Verify the array contains exactly one entry with `isUser: true`
   **Expected:** One user entry exists with `name: 'You'`

4. Verify entries are sorted by `totalValue` descending
   **Expected:** `rankings[i-1].totalValue >= rankings[i].totalValue` for all i

### Test Data

- Should include at least 3 entries (top-3 with medals) plus the user entry
- Should match the shape in Leaderboard.test.tsx `mockRankings`

### Edge Cases

- Should include at least one entry with a negative `gainPercent` to test loss display

---

## TC-011: mockData objects are type-safe (TypeScript compilation)

**Priority:** P1
**Type:** Functional

### Objective

Verify that all exported mock data objects satisfy their respective TypeScript interfaces without `as` casts or `@ts-ignore` directives.

### Preconditions

- `src/test/mockData.ts` is a `.ts` file (not `.js`)

### Steps

1. Run the TypeScript compiler in check mode (`tsc --noEmit`) with the project config
   **Expected:** No type errors in `src/test/mockData.ts`

2. Attempt to assign each mock to a typed variable in a test:
   ```
   const p: Player = mockPlayer;
   const ep: EnrichedPlayer = mockEnrichedPlayer;
   const pf: Portfolio = mockPortfolio;
   const lb: LeaderboardEntry[] = mockLeaderboardRankings;
   ```
   **Expected:** All assignments compile without errors

### Test Data

- N/A

### Edge Cases

- If optional fields are omitted from mocks, they must genuinely be optional in the interface (not just missing)

---

## TC-012: Refactored existing test produces identical results using renderWithProviders

**Priority:** P0
**Type:** Regression

### Objective

Verify that refactoring an existing test (e.g., from PlayerCard.test.tsx or Leaderboard.test.tsx) to use `renderWithProviders` and `mockData` produces the same pass/fail outcomes as the original `vi.mock`-based version.

### Preconditions

- At least one existing test file has been refactored to use the new helpers
- The original test assertions remain unchanged

### Steps

1. Run the refactored test file via `npx vitest run <refactored-test-file>`
   **Expected:** All tests pass

2. Compare the refactored test's assertion count to the original
   **Expected:** Same number of assertions; no tests removed or skipped

3. Verify the refactored test no longer uses inline `vi.mock()` calls for the four contexts (ScenarioContext, TradingContext, SocialContext, ToastContext)
   **Expected:** No `vi.mock('...Context')` calls remain for the contexts covered by `renderWithProviders`

### Test Data

- The original test file's assertions serve as the regression baseline

### Edge Cases

- If the original test mocked additional modules beyond the four contexts (e.g., `recharts`, `react-router-dom`, `framer-motion`), those mocks should remain since they are outside `renderWithProviders` scope

---

## TC-013: renderWithProviders does not break when component uses multiple contexts simultaneously

**Priority:** P0
**Type:** Integration

### Objective

Verify that a component consuming all four contexts (Scenario, Trading, Social, Toast) at once renders correctly within `renderWithProviders`.

### Preconditions

- A test component that calls `useScenario()`, `useTrading()`, `useSocial()`, and `useToast()` and renders values from each

### Steps

1. Call `renderWithProviders(<MultiContextComponent />)`
   **Expected:** Component renders without errors

2. Query the DOM for values from each context (scenario name, cash, watchlist length, toast function availability)
   **Expected:** All four context values are present and match defaults

3. Pass overrides for all four contexts simultaneously
   **Expected:** All overridden values are reflected in the rendered output

### Test Data

- Overrides: `{ scenarioOverrides: { scenario: 'live' }, tradingOverrides: { cash: 7500 }, socialOverrides: { watchlist: ['p1', 'p2'] }, toastOverrides: { addToast: customMockFn } }`

### Edge Cases

- Partial overrides across multiple contexts (e.g., override Scenario + Trading but use defaults for Social + Toast)

---

## TC-014: mockData objects are isolated between tests (no shared mutable state)

**Priority:** P1
**Type:** Functional

### Objective

Verify that mutating a mock data object in one test does not affect the mock data in subsequent tests, ensuring test isolation.

### Preconditions

- Mock data is exported from `src/test/mockData.ts`

### Steps

1. In Test A: import `mockPlayer`, mutate it (`mockPlayer.name = 'Modified'`), verify mutation took effect
   **Expected:** `mockPlayer.name === 'Modified'` within Test A

2. In Test B (runs after Test A): import `mockPlayer`, check its name
   **Expected:** `mockPlayer.name` is the original value (e.g., `'Patrick Mahomes'`), NOT `'Modified'`

### Test Data

- Standard mock player from mockData.ts

### Edge Cases

- If mocks are exported as plain objects (not factory functions), they will share state. The helper should either export factory functions (e.g., `createMockPlayer()`) or tests should spread/clone before mutating. Verify which strategy is used and that it works.
