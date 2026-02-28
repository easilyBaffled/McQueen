# Test Plan: mcq-8hr.2 -- Add Vitest tests for Market page (0% coverage)

## Summary

- **Bead:** `mcq-8hr.2`
- **Feature:** Market page — player grid rendering, sort tabs, search filtering, welcome banner dismiss with localStorage, loading skeleton, and FirstTradeGuide integration
- **Total Test Cases:** 22
- **Test Types:** Functional, Integration

---

## TC-001: Player grid renders all players from getPlayers()

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Market page renders a PlayerCard for every player returned by the mocked `getPlayers()`. This is the core rendering behavior of the page.

### Preconditions

- Mock `useScenario` to return `{ currentData: { headline: 'Test headline' }, scenario: 'midweek' }`
- Mock `useTrading` to return `getPlayers()` producing 3+ mock `EnrichedPlayer` objects and `portfolio: {}`
- Mock `PlayerCard`, `MiniLeaderboard`, `FirstTradeGuide`, and `framer-motion`
- Advance timers past the 300ms loading delay

### Steps

1. Render the `Market` component inside a `MemoryRouter`
   **Expected:** The component mounts without errors

2. Wait for the loading state to resolve (advance timers 300ms+)
   **Expected:** The players grid is visible (no skeleton)

3. Assert the number of rendered `PlayerCard` mock elements matches the number of players from `getPlayers()`
   **Expected:** All 3+ player cards are rendered

### Test Data

- Mock players: `[{ id: 'p1', name: 'Patrick Mahomes', team: 'KC', currentPrice: 150, changePercent: 5.2, ... }, { id: 'p2', name: 'Josh Allen', team: 'BUF', currentPrice: 140, changePercent: -3.1, ... }, { id: 'p3', name: 'Lamar Jackson', team: 'BAL', currentPrice: 130, changePercent: 8.0, ... }]`

### Edge Cases

- Zero players returned: grid should render empty (no cards, no crash)

---

## TC-002: Each PlayerCard is wrapped in a link to /player/:id

**Priority:** P0
**Type:** Functional

### Objective

Verify that each rendered player card is wrapped in a `<Link>` pointing to the correct player detail route.

### Preconditions

- Same mocks as TC-001
- Timers advanced past loading

### Steps

1. Render Market and wait for loading to complete
   **Expected:** Player cards are visible

2. For each mock player, find the corresponding `<a>` element
   **Expected:** Each `<a>` has `href` equal to `/player/{player.id}`

### Test Data

- Same mock players as TC-001

### Edge Cases

- None (covered by TC-001 zero-players case)

---

## TC-003: Default sort is "Biggest Risers" (descending changePercent)

**Priority:** P0
**Type:** Functional

### Objective

Verify that on initial render, the player cards are sorted by `changePercent` descending (highest riser first) and the "Biggest Risers" tab is active.

### Preconditions

- Mock players with distinct `changePercent` values: e.g. +8.0, +5.2, -3.1
- Timers advanced past loading

### Steps

1. Render Market and wait for loading to complete
   **Expected:** Player cards appear in order: Lamar Jackson (+8.0), Patrick Mahomes (+5.2), Josh Allen (-3.1)

2. Check the "Biggest Risers" sort tab button
   **Expected:** It has the active CSS class applied

### Test Data

- Players with changePercent: 8.0, 5.2, -3.1

### Edge Cases

- All players with same changePercent: order is stable (no crash)

---

## TC-004: Sort by "Biggest Fallers" (ascending changePercent)

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking the "Biggest Fallers" tab reorders players by `changePercent` ascending (most negative first).

### Preconditions

- Same mocks as TC-003
- Timers advanced past loading

### Steps

1. Render Market and wait for loading to complete
   **Expected:** Players rendered in default risers order

2. Click the "Biggest Fallers" sort tab button
   **Expected:** Players reorder to: Josh Allen (-3.1), Patrick Mahomes (+5.2), Lamar Jackson (+8.0)

3. Check the "Biggest Fallers" tab
   **Expected:** It now has the active CSS class; "Biggest Risers" no longer does

### Test Data

- Same 3 mock players

### Edge Cases

- None

---

## TC-005: Sort by "Most Active" (descending absolute changePercent)

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking "Most Active" sorts players by `Math.abs(changePercent)` descending.

### Preconditions

- Mock players with changePercent: +5.2, -8.0, +3.1 (absolute: 5.2, 8.0, 3.1)
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** Players visible

2. Click the "Most Active" sort tab
   **Expected:** Players reorder to: player with |-8.0| first, then |+5.2|, then |+3.1|

### Test Data

- Players with changePercent: 5.2, -8.0, 3.1

### Edge Cases

- Player with changePercent 0: should sort to the end

---

## TC-006: Sort by "Highest Price" (descending currentPrice)

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking "Highest Price" sorts players by `currentPrice` descending.

### Preconditions

- Mock players with distinct currentPrice values: 150, 140, 130
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** Players visible

2. Click the "Highest Price" sort tab
   **Expected:** Players reorder to: $150, $140, $130 (Mahomes, Allen, Jackson)

### Test Data

- Same 3 mock players with prices 150, 140, 130

### Edge Cases

- Players with identical prices: stable order, no crash

---

## TC-007: All four sort tabs are rendered with correct labels

**Priority:** P1
**Type:** Functional

### Objective

Verify that exactly four sort tab buttons are rendered with the labels: "Biggest Risers", "Biggest Fallers", "Most Active", "Highest Price".

### Preconditions

- Standard mocks
- Timers advanced past loading

### Steps

1. Render Market
   **Expected:** Four buttons appear in the sort tabs container

2. Check each button's text content
   **Expected:** "Biggest Risers", "Biggest Fallers", "Most Active", "Highest Price" — in that order

### Test Data

- None specific

### Edge Cases

- None

---

## TC-008: Search filters players by name (partial match)

**Priority:** P0
**Type:** Functional

### Objective

Verify that typing a partial player name in the search input filters the displayed player cards to only those matching.

### Preconditions

- Mock players: Patrick Mahomes, Josh Allen, Lamar Jackson
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** All 3 players visible

2. Type "mah" into the search input (aria-label "Search players")
   **Expected:** Only Patrick Mahomes is displayed; Josh Allen and Lamar Jackson are hidden

### Test Data

- Search query: "mah"

### Edge Cases

- Single character match: typing "j" should show both Josh Allen and Lamar Jackson (both have "j" in name)

---

## TC-009: Search is case-insensitive

**Priority:** P0
**Type:** Functional

### Objective

Verify that search matching is case-insensitive — "MAHOMES", "mahomes", and "Mahomes" all find the same player.

### Preconditions

- Mock players including Patrick Mahomes
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** All players visible

2. Type "MAHOMES" into the search input
   **Expected:** Patrick Mahomes is displayed

3. Clear and type "mahomes"
   **Expected:** Patrick Mahomes is still displayed

### Test Data

- Search queries: "MAHOMES", "mahomes"

### Edge Cases

- Mixed case: "mAhOmEs" should also match

---

## TC-010: Search filters by team name

**Priority:** P1
**Type:** Functional

### Objective

Verify that the search also matches against the player's `team` field, not just `name`.

### Preconditions

- Mock players: Patrick Mahomes (team: "KC"), Josh Allen (team: "BUF"), Lamar Jackson (team: "BAL")
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** All 3 players visible

2. Type "KC" into the search input
   **Expected:** Only Patrick Mahomes is displayed

3. Clear and type "buf"
   **Expected:** Only Josh Allen is displayed (case-insensitive team match)

### Test Data

- Search queries: "KC", "buf"

### Edge Cases

- None

---

## TC-011: Search with no results shows empty grid

**Priority:** P0
**Type:** Functional

### Objective

Verify that a search query matching no players results in an empty grid with no errors.

### Preconditions

- Mock players: Patrick Mahomes, Josh Allen, Lamar Jackson
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** All 3 players visible

2. Type "zzzznonexistent" into the search input
   **Expected:** No PlayerCard elements are rendered; the grid is empty; no error is thrown

### Test Data

- Search query: "zzzznonexistent"

### Edge Cases

- Empty string search: should show all players again (clearing the filter)

---

## TC-012: Search and sort work together

**Priority:** P1
**Type:** Integration

### Objective

Verify that search filtering and sort ordering compose correctly — filter first, then sort the filtered results.

### Preconditions

- Mock players: Patrick Mahomes (KC, price 150, change +5.2), Travis Kelce (KC, price 120, change +2.0), Josh Allen (BUF, price 140, change -3.1)
- Timers advanced past loading

### Steps

1. Render Market, wait for loading
   **Expected:** All 3 players visible

2. Type "KC" into the search input
   **Expected:** Only Mahomes and Kelce are shown

3. Click "Highest Price" sort tab
   **Expected:** Mahomes ($150) appears before Kelce ($120); Allen is still hidden

### Test Data

- 3 mock players, 2 sharing "KC" team

### Edge Cases

- None

---

## TC-013: Welcome banner displays when localStorage key is absent

**Priority:** P0
**Type:** Functional

### Objective

Verify that the welcome banner is shown on first visit when `mcqueen-welcome-dismissed` is not set in localStorage.

### Preconditions

- `localStorage.getItem('mcqueen-welcome-dismissed')` returns `null`
- Standard mocks

### Steps

1. Render Market
   **Expected:** The welcome banner is visible, containing "Welcome to McQueen!" heading

2. Verify the banner content
   **Expected:** Contains explanatory text about the NFL stock market and the football emoji icon

### Test Data

- localStorage: empty / no `mcqueen-welcome-dismissed` key

### Edge Cases

- None

---

## TC-014: Welcome banner is hidden when localStorage key is set

**Priority:** P0
**Type:** Functional

### Objective

Verify that the welcome banner does NOT appear when the user has previously dismissed it (localStorage key exists).

### Preconditions

- `localStorage.setItem('mcqueen-welcome-dismissed', 'true')` called before render
- Standard mocks

### Steps

1. Set `localStorage` item `mcqueen-welcome-dismissed` to `'true'`
   **Expected:** Key is stored

2. Render Market
   **Expected:** The welcome banner is NOT present in the DOM

### Test Data

- localStorage: `{ 'mcqueen-welcome-dismissed': 'true' }`

### Edge Cases

- None

---

## TC-015: Dismissing the welcome banner persists to localStorage

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the dismiss button on the welcome banner hides it and writes to localStorage so it stays hidden on future visits.

### Preconditions

- `localStorage` is clear (banner is visible)
- Standard mocks

### Steps

1. Render Market
   **Expected:** Welcome banner is visible

2. Click the dismiss button (aria-label "Dismiss welcome message")
   **Expected:** The welcome banner is removed from the DOM

3. Check `localStorage.getItem('mcqueen-welcome-dismissed')`
   **Expected:** Returns `'true'`

### Test Data

- None

### Edge Cases

- None

---

## TC-016: Loading state shows MarketSkeleton and LeaderboardSkeleton

**Priority:** P0
**Type:** Functional

### Objective

Verify that during the initial 300ms loading period, the Market page shows the `MarketSkeleton` and `LeaderboardSkeleton` components instead of the player grid and leaderboard.

### Preconditions

- Use fake timers (vi.useFakeTimers)
- Mock `MarketSkeleton` and `LeaderboardSkeleton` to render identifiable test elements
- Standard mocks for context

### Steps

1. Render Market (do NOT advance timers)
   **Expected:** `MarketSkeleton` mock is visible; `LeaderboardSkeleton` mock is visible

2. Verify that `PlayerCard` mocks are NOT rendered
   **Expected:** No player cards in the DOM

3. Verify that `MiniLeaderboard` mock is NOT rendered
   **Expected:** No leaderboard in the DOM

### Test Data

- None

### Edge Cases

- None

---

## TC-017: Loading state resolves after 300ms timer

**Priority:** P0
**Type:** Functional

### Objective

Verify that after 300ms the loading state clears, skeletons disappear, and actual content (player grid + leaderboard) appears.

### Preconditions

- Use fake timers
- Standard mocks

### Steps

1. Render Market
   **Expected:** Skeleton loaders visible

2. Advance timers by 300ms (`vi.advanceTimersByTime(300)`)
   **Expected:** `MarketSkeleton` mock is gone; `LeaderboardSkeleton` mock is gone

3. Verify player cards and leaderboard
   **Expected:** `PlayerCard` mocks are now rendered; `MiniLeaderboard` mock is now rendered

### Test Data

- None

### Edge Cases

- None

---

## TC-018: Scenario change re-triggers loading state

**Priority:** P1
**Type:** Functional

### Objective

Verify that when the `scenario` value from `useScenario` changes, the loading state resets (skeletons reappear for 300ms).

### Preconditions

- Use fake timers
- Mock `useScenario` with a mutable `scenario` value that can be changed via rerender

### Steps

1. Render Market and advance timers 300ms
   **Expected:** Loading complete, player cards visible

2. Change the `scenario` mock value and trigger a rerender
   **Expected:** Skeletons reappear (loading state is true again)

3. Advance timers by 300ms
   **Expected:** Skeletons disappear, player cards visible again

### Test Data

- Initial scenario: `'midweek'`, changed to: `'live'`

### Edge Cases

- None

---

## TC-019: FirstTradeGuide receives hasCompletedFirstTrade=false when portfolio is empty

**Priority:** P1
**Type:** Integration

### Objective

Verify that when the user has no trades (empty portfolio), `FirstTradeGuide` is rendered with `hasCompletedFirstTrade={false}`.

### Preconditions

- Mock `useTrading` to return `portfolio: {}`
- Mock `FirstTradeGuide` to capture and expose its props

### Steps

1. Render Market
   **Expected:** `FirstTradeGuide` mock is rendered

2. Check the props passed to `FirstTradeGuide`
   **Expected:** `hasCompletedFirstTrade` is `false`

### Test Data

- Portfolio: `{}`

### Edge Cases

- None

---

## TC-020: FirstTradeGuide receives hasCompletedFirstTrade=true when portfolio has trades

**Priority:** P1
**Type:** Integration

### Objective

Verify that when the user has at least one trade in portfolio, `FirstTradeGuide` is rendered with `hasCompletedFirstTrade={true}`.

### Preconditions

- Mock `useTrading` to return `portfolio: { 'p1': { shares: 5, avgCost: 100 } }`
- Mock `FirstTradeGuide` to capture and expose its props

### Steps

1. Render Market
   **Expected:** `FirstTradeGuide` mock is rendered

2. Check the props passed to `FirstTradeGuide`
   **Expected:** `hasCompletedFirstTrade` is `true`

### Test Data

- Portfolio: `{ 'p1': { shares: 5, avgCost: 100 } }`

### Edge Cases

- None

---

## TC-021: First PlayerCard receives showFirstTradeTip=true when portfolio is empty

**Priority:** P1
**Type:** Integration

### Objective

Verify that when the portfolio is empty (no trades), the first PlayerCard in the sorted list receives `showFirstTradeTip={true}`, and all others receive `false`.

### Preconditions

- Mock `useTrading` with `portfolio: {}`
- Mock `PlayerCard` to capture props
- Timers advanced past loading

### Steps

1. Render Market, wait for loading
   **Expected:** Multiple PlayerCard mocks rendered

2. Check the first PlayerCard's props
   **Expected:** `showFirstTradeTip` is `true`

3. Check the second PlayerCard's props
   **Expected:** `showFirstTradeTip` is `false`

### Test Data

- Portfolio: `{}`

### Edge Cases

- When portfolio is non-empty, ALL PlayerCards should have `showFirstTradeTip={false}`

---

## TC-022: Market header displays headline from currentData

**Priority:** P1
**Type:** Functional

### Objective

Verify that the page title reads "Today's Movers" and the subtitle displays the headline from `currentData`.

### Preconditions

- Mock `useScenario` to return `currentData: { headline: 'Mahomes throws 4 TDs in blowout win' }`
- Timers advanced past loading

### Steps

1. Render Market and wait for loading
   **Expected:** An `<h1>` element with text "Today's Movers" is present

2. Check the subtitle paragraph
   **Expected:** Contains "Mahomes throws 4 TDs in blowout win"

### Test Data

- `currentData.headline`: `'Mahomes throws 4 TDs in blowout win'`

### Edge Cases

- `currentData` is `null`: subtitle should fall back to "Market activity"
- `currentData.headline` is `undefined`: subtitle should fall back to "Market activity"
