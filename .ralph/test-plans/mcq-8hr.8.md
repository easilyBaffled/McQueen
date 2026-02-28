# Test Plan: mcq-8hr.8 -- Expand Vitest tests for partially-covered files (Portfolio, PlayerDetail, shared components)

## Summary

- **Bead:** `mcq-8hr.8`
- **Feature:** Expand unit test coverage for Portfolio, PlayerDetail, ScenarioToggle, Glossary, SkeletonLoader, and InfoTooltip to 75-80%+
- **Total Test Cases:** 42
- **Test Types:** Functional, Integration

---

## Portfolio (33% → 80%)

### TC-001: Holdings list displays correct share count per row

**Priority:** P0
**Type:** Functional

#### Objective

Verify each holding row shows the correct number of shares owned. This is core financial data that must be accurate.

#### Preconditions

- Portfolio has two holdings: p1 with 10 shares, p2 with 5 shares
- Both players resolve via `getPlayer`

#### Steps

1. Render Portfolio with the above holdings
   **Expected:** Two `holding-row` elements appear
2. Check the `holding-shares` text content for each row
   **Expected:** First row shows "10", second row shows "5"

#### Test Data

- `portfolio: { p1: { shares: 10, avgCost: 100 }, p2: { shares: 5, avgCost: 95 } }`

#### Edge Cases

- Holding with 1 share (singular boundary)

---

### TC-002: Holdings list displays average cost per row

**Priority:** P0
**Type:** Functional

#### Objective

Verify each holding row shows the average cost formatted to two decimal places.

#### Preconditions

- Portfolio has holding p1 with avgCost: 100

#### Steps

1. Render Portfolio with holding p1 (avgCost 100, currentPrice 120)
   **Expected:** `holding-cost` element shows "$100.00"

#### Test Data

- `portfolio: { p1: { shares: 10, avgCost: 100 } }`, player currentPrice: 120

#### Edge Cases

- avgCost with many decimal places (e.g. 99.999) should display as "$100.00"

---

### TC-003: Holdings list displays current market value per row

**Priority:** P0
**Type:** Functional

#### Objective

Verify each holding row shows currentPrice × shares as the current value, formatted to two decimal places.

#### Preconditions

- Player currentPrice is 120, holding has 10 shares

#### Steps

1. Render Portfolio
   **Expected:** `holding-value` shows "$1200.00"

#### Test Data

- currentPrice: 120, shares: 10

#### Edge Cases

- Very large values (e.g., 100 shares at $999.99 = $99,999.00) should still format correctly

---

### TC-004: Holdings row shows positive gain with up arrow and percentage

**Priority:** P1
**Type:** Functional

#### Objective

Verify that a holding with a gain (currentValue > costBasis) displays "▲ +" prefix and a positive percentage.

#### Preconditions

- Player currentPrice: 120, holding avgCost: 100, shares: 10 (gain = $200, +20%)

#### Steps

1. Render Portfolio with the above data
   **Expected:** `holding-gain` contains "▲ +$200.00" and "(+20.0%)"
2. Check the `holding-gain` element's aria-label
   **Expected:** Contains "Gain of $200.00, 20.0 percent"

#### Test Data

- currentPrice: 120, avgCost: 100, shares: 10

#### Edge Cases

- Exactly break-even (gain = 0) should still show "▲" per the `>= 0` logic

---

### TC-005: Holdings row shows negative loss with down arrow and percentage

**Priority:** P1
**Type:** Functional

#### Objective

Verify that a holding with a loss (currentValue < costBasis) displays "▼" prefix and a negative percentage.

#### Preconditions

- Player currentPrice: 80, holding avgCost: 100, shares: 5 (loss = -$100, -20%)

#### Steps

1. Render Portfolio with the above data
   **Expected:** `holding-gain` contains "▼ " prefix and negative dollar amount
2. Check the aria-label
   **Expected:** Contains "Loss of $100.00, 20.0 percent"

#### Test Data

- currentPrice: 80, avgCost: 100, shares: 5

#### Edge Cases

- None beyond what's stated

---

### TC-006: Summary card shows gain with positive styling class

**Priority:** P1
**Type:** Functional

#### Objective

Verify the Total Gain/Loss summary card applies the `positive` CSS class when gain >= 0.

#### Preconditions

- `getPortfolioValue` returns gain: 500, gainPercent: 20

#### Steps

1. Render Portfolio with positive portfolio gain
   **Expected:** Fourth summary card has class containing "positive"
2. Check the gain value element's aria-label
   **Expected:** Contains "Gain of $500.00"

#### Test Data

- `getPortfolioValue: () => ({ value: 3000, cost: 2500, gain: 500, gainPercent: 20 })`

#### Edge Cases

- Gain of exactly 0 should apply "positive" class (per `>= 0` check)

---

### TC-007: Summary card shows loss with negative styling class

**Priority:** P1
**Type:** Functional

#### Objective

Verify the Total Gain/Loss summary card applies the `negative` CSS class when gain < 0.

#### Preconditions

- `getPortfolioValue` returns gain: -200, gainPercent: -10

#### Steps

1. Render Portfolio with negative portfolio gain
   **Expected:** Fourth summary card has class containing "negative"
2. Check gain text
   **Expected:** Shows "▼" prefix (not "▲ +")

#### Test Data

- `getPortfolioValue: () => ({ value: 1800, cost: 2000, gain: -200, gainPercent: -10 })`

#### Edge Cases

- None beyond what's stated

---

### TC-008: Holding rows link to the correct player detail page

**Priority:** P1
**Type:** Functional

#### Objective

Verify each holding row is a link whose `href` points to `/player/{playerId}`.

#### Preconditions

- Portfolio has holding for player p1

#### Steps

1. Render Portfolio with holding p1
   **Expected:** The `holding-row` link has `href` equal to `/player/p1`

#### Test Data

- Player id: "p1"

#### Edge Cases

- None

---

### TC-009: Empty state "Browse Market" button links to /market

**Priority:** P1
**Type:** Functional

#### Objective

Verify the CTA button in the empty state navigates to the market page.

#### Preconditions

- Portfolio is empty (no holdings)

#### Steps

1. Render Portfolio with empty portfolio
   **Expected:** "Browse Market" link has `href` equal to "/market"

#### Test Data

- `portfolio: {}`

#### Edge Cases

- None

---

### TC-010: Empty state trending player links navigate to player detail

**Priority:** P2
**Type:** Functional

#### Objective

Verify each trending player suggestion in the empty state links to `/player/{id}`.

#### Preconditions

- Portfolio is empty, `getPlayers` returns trending players

#### Steps

1. Render Portfolio with empty portfolio and trending players
   **Expected:** Each trending player name is wrapped in a link to `/player/{playerId}`

#### Test Data

- Trending players: [{ id: 't1', name: 'Trending1' }, ...]

#### Edge Cases

- Empty trending players list (no `getPlayers` results) — "Trending Now" section should not appear

---

### TC-011: Empty state hides trending section when no players available

**Priority:** P2
**Type:** Functional

#### Objective

Verify that if `getPlayers` returns an empty array, the "Trending Now" section is not rendered.

#### Preconditions

- Portfolio is empty, `getPlayers` returns []

#### Steps

1. Render Portfolio with empty portfolio and empty player list
   **Expected:** Text "Trending Now" does not appear in the document

#### Test Data

- `getPlayers: () => []`

#### Edge Cases

- None

---

### TC-012: Trending players show change percent with correct direction arrow

**Priority:** P2
**Type:** Functional

#### Objective

Verify each trending player suggestion shows ▲ for positive and ▼ for negative changePercent, along with the aria-label.

#### Preconditions

- Portfolio empty, trending players include one with +10% and one with -3%

#### Steps

1. Render Portfolio with mixed trending players
   **Expected:** Positive player shows "▲" and "10.0%"; negative player shows "▼" and "3.0%"
2. Check aria-labels
   **Expected:** "Up 10.0 percent" and "Down 3.0 percent" respectively

#### Test Data

- Player A: changePercent: 10, Player B: changePercent: -3

#### Edge Cases

- changePercent of 0 should show "▲" per `>= 0` logic

---

## PlayerDetail (47% → 75%)

### TC-013: Buy flow — successful purchase shows success toast and resets amount

**Priority:** P0
**Type:** Functional

#### Objective

Verify clicking the Buy button with valid funds calls `buyShares`, shows a success toast, and resets the quantity input to 1.

#### Preconditions

- Player exists, user has sufficient cash, `buyShares` returns true

#### Steps

1. Render PlayerDetail for a valid player
   **Expected:** Buy tab is active by default, quantity input shows "1"
2. Change quantity input to 3
   **Expected:** Estimated cost updates to `currentPrice × 3`
3. Click the Buy button
   **Expected:** `buyShares` called with (playerId, 3), `addToast` called with success message containing share count and cost, quantity resets to 1

#### Test Data

- Player: currentPrice 120.50, id "mahomes"

#### Edge Cases

- Buying exactly 1 share (singular text "1 share" vs "2 shares")

---

### TC-014: Buy flow — insufficient funds shows error toast

**Priority:** P0
**Type:** Functional

#### Objective

Verify that when `buyShares` returns false, an error toast is shown.

#### Preconditions

- Player exists, `buyShares` returns false (insufficient funds)

#### Steps

1. Render PlayerDetail
2. Click the Buy button
   **Expected:** `addToast` called with "Insufficient funds for this purchase" and "error" type

#### Test Data

- `buyShares: vi.fn(() => false)`

#### Edge Cases

- None

---

### TC-015: Sell flow — successful sale shows success toast and resets amount

**Priority:** P0
**Type:** Functional

#### Objective

Verify clicking the Sell button calls `sellShares`, shows a success toast with proceeds, and resets quantity to 1.

#### Preconditions

- Player exists, user holds shares, `sellShares` returns true

#### Steps

1. Render PlayerDetail with existing holding
2. Click the Sell tab
   **Expected:** Sell form appears with label "Shares (You own N)"
3. Set sell amount to 2, click the Sell button
   **Expected:** `sellShares` called with (playerId, 2), `addToast` called with success message, quantity resets to 1

#### Test Data

- Holding: { shares: 5, avgCost: 110 }, `sellShares: vi.fn(() => true)`

#### Edge Cases

- Selling all owned shares

---

### TC-016: Sell flow — failed sale shows error toast

**Priority:** P0
**Type:** Functional

#### Objective

Verify that when `sellShares` returns false, an error toast is shown.

#### Preconditions

- Player exists, user holds shares, `sellShares` returns false

#### Steps

1. Render PlayerDetail, switch to Sell tab
2. Click the Sell button
   **Expected:** `addToast` called with "Unable to complete sale" and "error" type

#### Test Data

- `sellShares: vi.fn(() => false)`

#### Edge Cases

- None

---

### TC-017: Buy quantity input enforces minimum of 1

**Priority:** P1
**Type:** Functional

#### Objective

Verify that entering 0, a negative number, or non-numeric text in the buy quantity field coerces to 1.

#### Preconditions

- Player exists, Buy tab active

#### Steps

1. Clear the buy amount input and type "0"
   **Expected:** Value becomes 1 (due to `Math.max(1, ...)`)
2. Clear and type "-5"
   **Expected:** Value becomes 1
3. Clear and type "abc"
   **Expected:** Value becomes 1 (due to `parseInt(...) || 1`)

#### Test Data

- Default player setup

#### Edge Cases

- Typing a decimal like "2.5" — `parseInt` yields 2

---

### TC-018: Sell quantity input is capped to owned shares

**Priority:** P1
**Type:** Functional

#### Objective

Verify the sell amount input cannot exceed the number of shares the user owns.

#### Preconditions

- User holds 5 shares, Sell tab active

#### Steps

1. Change sell amount to 10
   **Expected:** Value is clamped to 5 (the owned share count)
2. Change sell amount to 0
   **Expected:** Value is clamped to 1

#### Test Data

- Holding: { shares: 5, avgCost: 110 }

#### Edge Cases

- Holding with exactly 1 share — max and min are both 1

---

### TC-019: Sell tab is disabled when user has no holdings

**Priority:** P1
**Type:** Functional

#### Objective

Verify the Sell tab button has the `disabled` attribute when there is no holding for the current player.

#### Preconditions

- Player exists, portfolio is empty (no holding for this player)

#### Steps

1. Render PlayerDetail with no holding for the player
   **Expected:** The Sell tab button has `disabled` attribute
2. Verify the Buy tab is still clickable
   **Expected:** Buy tab is not disabled

#### Test Data

- `portfolio: {}`

#### Edge Cases

- None

---

### TC-020: Watchlist toggle — add to watchlist

**Priority:** P1
**Type:** Functional

#### Objective

Verify clicking the watchlist button when not watching calls `addToWatchlist` and shows an info toast.

#### Preconditions

- Player exists, `isWatching` returns false

#### Steps

1. Render PlayerDetail
   **Expected:** Watchlist button shows "Add to Watchlist"
2. Click the watchlist button
   **Expected:** `addToWatchlist` called with player ID, `addToast` called with "Added {name} to watchlist" and "success"

#### Test Data

- `isWatching: () => false`

#### Edge Cases

- None

---

### TC-021: Watchlist toggle — remove from watchlist

**Priority:** P1
**Type:** Functional

#### Objective

Verify clicking the watchlist button when already watching calls `removeFromWatchlist` and shows an info toast.

#### Preconditions

- Player exists, `isWatching` returns true

#### Steps

1. Render PlayerDetail
   **Expected:** Watchlist button shows "Watching" and has the `watching` CSS class
2. Click the watchlist button
   **Expected:** `removeFromWatchlist` called with player ID, `addToast` called with "Removed {name} from watchlist" and "info"

#### Test Data

- `isWatching: () => true`

#### Edge Cases

- None

---

### TC-022: Error state for invalid player ID

**Priority:** P0
**Type:** Functional

#### Objective

Verify that when `getPlayer` returns null (player not found), the error state is shown with a "Back to Market" button.

#### Preconditions

- `getPlayer` returns null, `useParams` provides a nonexistent playerId

#### Steps

1. Render PlayerDetail with invalid player ID
   **Expected:** `error-state` test ID is present
2. Check the heading text
   **Expected:** "Player Not Found" is displayed
3. Check the description
   **Expected:** "This player doesn't exist in the current scenario." is displayed
4. Click "Back to Market"
   **Expected:** `navigate('/market')` is called

#### Test Data

- `getPlayer: () => null`, `playerId: 'nonexistent'`

#### Edge Cases

- None

---

### TC-023: Estimated cost updates dynamically as buy quantity changes

**Priority:** P1
**Type:** Functional

#### Objective

Verify the "Estimated Cost" display recalculates when the buy quantity input changes.

#### Preconditions

- Player currentPrice: 120.50, Buy tab active

#### Steps

1. Render PlayerDetail with default buy amount of 1
   **Expected:** `order-total` shows "$120.50"
2. Change buy amount to 5
   **Expected:** `order-total` shows "$602.50"

#### Test Data

- Player currentPrice: 120.50

#### Edge Cases

- Very large quantity (e.g. 100) should still display correctly

---

### TC-024: Holdings card displays position details when user has holding

**Priority:** P1
**Type:** Functional

#### Objective

Verify the "Your Position" card shows shares, avg cost, market value, and P/L when the user has a holding.

#### Preconditions

- User holds 5 shares at avgCost 110, currentPrice 120.50

#### Steps

1. Render PlayerDetail
   **Expected:** `holdings-card` is present with heading "Your Position"
2. Check position stats
   **Expected:** Shares shows "5", Avg Cost shows "$110.00", Market Value shows "$602.50", P/L shows gain with "▲" prefix

#### Test Data

- Holding: { shares: 5, avgCost: 110 }, currentPrice: 120.50

#### Edge Cases

- Holdings card should NOT appear when user has no holding

---

### TC-025: Player header displays name, team, position, and price

**Priority:** P1
**Type:** Functional

#### Objective

Verify the player header section renders the player's name, team badge, position, and current price.

#### Preconditions

- Player: name "Patrick Mahomes", team "KC", position "QB", currentPrice 120.50

#### Steps

1. Render PlayerDetail
   **Expected:** `player-name` shows "Patrick Mahomes"
2. Check team and position
   **Expected:** "KC" and "QB" text are present
3. Check price display
   **Expected:** `player-price` area shows "$120.50"
4. Check price change
   **Expected:** `price-change` shows the changePercent with correct direction arrow and aria-label

#### Test Data

- Standard player mock data

#### Edge Cases

- Negative changePercent should show "▼" instead of "▲"

---

## ScenarioToggle (48% → 80%)

### TC-026: Switching scenario updates active tab styling

**Priority:** P0
**Type:** Functional

#### Objective

Verify that after clicking a different scenario tab, `aria-selected` updates to reflect the new selection and `setScenario` is called with the correct ID.

#### Preconditions

- Component rendered with initial scenario "midweek"

#### Steps

1. Render ScenarioToggle with scenario "midweek"
   **Expected:** Midweek tab has `aria-selected="true"`, all others have `aria-selected="false"`
2. Click the "Playoffs" tab
   **Expected:** `setScenario` called with "playoffs"
3. Re-render with scenario "playoffs"
   **Expected:** Playoffs tab has `aria-selected="true"`, Midweek has `aria-selected="false"`

#### Test Data

- scenarios: midweek, live, playoffs, superbowl, espn-live

#### Edge Cases

- Clicking the already-active tab should still call `setScenario` (no deselect behavior)

---

### TC-027: Mobile dropdown selection calls setScenario and closes dropdown

**Priority:** P1
**Type:** Functional

#### Objective

Verify selecting a scenario from the mobile dropdown calls `setScenario` and closes the menu.

#### Preconditions

- Component rendered, mobile dropdown is opened

#### Steps

1. Click the mobile dropdown trigger
   **Expected:** `aria-expanded="true"`, dropdown menu appears
2. Click the "Playoffs" item in the dropdown
   **Expected:** `setScenario` called with "playoffs", dropdown closes (`aria-expanded="false"`)

#### Test Data

- Initial scenario: "midweek"

#### Edge Cases

- None

---

### TC-028: Non-active tabs have tabIndex -1 for roving tabindex

**Priority:** P2
**Type:** Functional

#### Objective

Verify that only the active tab has `tabIndex={0}` and all other tabs have `tabIndex={-1}`, implementing roving tabindex.

#### Preconditions

- Component rendered with scenario "midweek"

#### Steps

1. Render ScenarioToggle with scenario "midweek"
   **Expected:** Midweek tab has `tabIndex` of "0"
2. Check remaining tabs
   **Expected:** All other tabs have `tabIndex` of "-1"

#### Test Data

- scenario: "midweek"

#### Edge Cases

- None

---

### TC-029: Mobile dropdown trigger shows current scenario label

**Priority:** P2
**Type:** Functional

#### Objective

Verify the mobile dropdown trigger text updates to reflect the currently selected scenario.

#### Preconditions

- Component rendered with scenario "playoffs"

#### Steps

1. Render ScenarioToggle with scenario "playoffs"
   **Expected:** Mobile trigger text includes "Playoffs"
2. Render with scenario "superbowl"
   **Expected:** Mobile trigger text includes "Super Bowl"

#### Test Data

- Various scenario IDs

#### Edge Cases

- Unknown scenario ID should fall back to first scenario ("Midweek")

---

## Glossary (48% → 80%)

### TC-030: Search filters by definition text, not just term name

**Priority:** P1
**Type:** Functional

#### Objective

Verify that typing a word that appears only in a definition (not a term name) still shows matching results.

#### Preconditions

- Glossary is open

#### Steps

1. Type "green" in the search input (appears in Risers definition: "Shown in green")
   **Expected:** "Risers" term is displayed
2. Type "favorites" in the search input (appears in Watchlist definition)
   **Expected:** "Watchlist" term is displayed, other terms are hidden

#### Test Data

- Search queries: "green", "favorites"

#### Edge Cases

- Case-insensitive: "GREEN" should match the same terms as "green"

---

### TC-031: Clearing search restores all terms

**Priority:** P1
**Type:** Functional

#### Objective

Verify that after filtering by search, clearing the input restores all glossary terms.

#### Preconditions

- Glossary is open, user has typed a filter query

#### Steps

1. Type "portfolio" in search
   **Expected:** Only "Portfolio" (and possibly "Total Value" which mentions portfolio) visible
2. Clear the search input
   **Expected:** All 10 glossary terms are displayed again

#### Test Data

- Initial search: "portfolio"

#### Edge Cases

- None

---

### TC-032: Each glossary item shows term, definition, and example

**Priority:** P1
**Type:** Functional

#### Objective

Verify that each rendered glossary item contains its term heading, definition paragraph, and example paragraph with the "Example:" label.

#### Preconditions

- Glossary is open with no search filter

#### Steps

1. Check the first glossary item ("Portfolio")
   **Expected:** Heading "Portfolio" present, definition text about "collection of player investments" present, example text about "Patrick Mahomes and Josh Allen" present with "Example:" label

#### Test Data

- Default glossary terms

#### Edge Cases

- None

---

### TC-033: Glossary dialog has correct ARIA attributes

**Priority:** P2
**Type:** Functional

#### Objective

Verify the glossary panel has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the title.

#### Preconditions

- Glossary is open

#### Steps

1. Render Glossary with `isOpen={true}`
   **Expected:** Dialog element has `role="dialog"` and `aria-modal="true"`
2. Check aria-labelledby
   **Expected:** Points to the element with id "glossary-title"
3. Check the title element
   **Expected:** Element with id "glossary-title" contains "Trading Terms"

#### Test Data

- `isOpen: true`

#### Edge Cases

- None

---

### TC-034: Search input has correct aria-label

**Priority:** P2
**Type:** Functional

#### Objective

Verify the search input has `aria-label="Search trading terms"`.

#### Preconditions

- Glossary is open

#### Steps

1. Render Glossary with `isOpen={true}`
   **Expected:** Input with `aria-label="Search trading terms"` is present

#### Test Data

- `isOpen: true`

#### Edge Cases

- None

---

## SkeletonLoader (11% → 80%)

### TC-035: PlayerCardSkeleton renders header, body, and footer sections

**Priority:** P0
**Type:** Functional

#### Objective

Verify the PlayerCardSkeleton renders the three structural sections with their child elements.

#### Preconditions

- None (stateless component)

#### Steps

1. Render PlayerCardSkeleton
   **Expected:** Container has class matching "skeleton-card"
2. Check header section
   **Expected:** Contains elements with classes "skeleton-team-badge", "skeleton-position", "skeleton-avatar"
3. Check body section
   **Expected:** Contains elements with classes "skeleton-name", "skeleton-price", "skeleton-change", "skeleton-chart", "skeleton-headline"
4. Check footer section
   **Expected:** Contains element with class "skeleton-owners"

#### Test Data

- None

#### Edge Cases

- None

---

### TC-036: MarketSkeleton renders grid container with skeleton-market-grid class

**Priority:** P1
**Type:** Functional

#### Objective

Verify the MarketSkeleton wrapper has the correct grid CSS class.

#### Preconditions

- None

#### Steps

1. Render MarketSkeleton
   **Expected:** Container element has class matching "skeleton-market-grid"

#### Test Data

- None

#### Edge Cases

- count=0 should render an empty grid with no children

---

### TC-037: LeaderboardSkeleton renders header and exactly 5 rows with rank, name, value

**Priority:** P1
**Type:** Functional

#### Objective

Verify the LeaderboardSkeleton renders a header element and 5 row elements, each containing rank, name, and value placeholders.

#### Preconditions

- None

#### Steps

1. Render LeaderboardSkeleton
   **Expected:** Element with class "skeleton-leaderboard-header" exists
2. Check rows
   **Expected:** 5 elements with class "skeleton-leaderboard-row"
3. Check each row's children
   **Expected:** Each row contains "skeleton-rank", "skeleton-name-small", and "skeleton-value" elements

#### Test Data

- None

#### Edge Cases

- None

---

### TC-038: MissionSkeleton renders header, grid, and player items with button placeholders

**Priority:** P1
**Type:** Functional

#### Objective

Verify MissionSkeleton renders a header, a grid with 12 player items, each containing a mini-player placeholder and two button placeholders.

#### Preconditions

- None

#### Steps

1. Render MissionSkeleton
   **Expected:** Element with class "skeleton-mission-header" exists
2. Check grid
   **Expected:** Element with class "skeleton-mission-grid" exists containing 12 child items
3. Check each player item
   **Expected:** Contains "skeleton-player-mini" element and two "skeleton-button" elements

#### Test Data

- None

#### Edge Cases

- None

---

### TC-039: All skeleton components apply shimmer animation variants

**Priority:** P1
**Type:** Functional

#### Objective

Verify that PlayerCardSkeleton, LeaderboardSkeleton, MissionSkeleton, and TextSkeleton receive the shimmer animation props (initial="initial", animate="animate").

#### Preconditions

- None (inspected via mock of framer-motion)

#### Steps

1. Render each skeleton component
   **Expected:** The root motion.div element is rendered (confirming variants are passed through the framer-motion mock)

#### Test Data

- None

#### Edge Cases

- None

---

## InfoTooltip (45% → 80%)

### TC-040: Click on trigger button prevents event propagation

**Priority:** P1
**Type:** Functional

#### Objective

Verify that clicking the "?" trigger button calls `e.preventDefault()` and `e.stopPropagation()`, preventing parent link/form interactions.

#### Preconditions

- InfoTooltip rendered inside a clickable parent element

#### Steps

1. Render InfoTooltip term="shares" inside a parent with an onClick handler
2. Click the "?" trigger button
   **Expected:** Parent's onClick is NOT called (propagation stopped)

#### Test Data

- term: "shares"

#### Edge Cases

- None

---

### TC-041: No trigger button rendered for unknown term

**Priority:** P1
**Type:** Functional

#### Objective

Verify that when an unknown term is passed with children, no "?" button is rendered — only the children pass through.

#### Preconditions

- term is not in `tooltipDefinitions`

#### Steps

1. Render `<InfoTooltip term="unknownXyz">Label</InfoTooltip>`
   **Expected:** "Label" text is present
2. Query for any button element
   **Expected:** No button with aria-label "What is unknownXyz?" exists

#### Test Data

- term: "unknownXyz"

#### Edge Cases

- None

---

### TC-042: Tooltip content matches the exact definition for each term

**Priority:** P1
**Type:** Functional

#### Objective

Verify that hovering over each known term shows the correct definition text from `tooltipDefinitions`.

#### Preconditions

- None

#### Steps

1. For each known term (shares, portfolio, risers, fallers, watchlist, price, gainLoss, totalValue, cash, buy, sell):
   a. Render `<InfoTooltip term={term}>Label</InfoTooltip>`
   b. Mouse-enter the wrapper
   **Expected:** The tooltip content matches the definition (e.g., "shares" shows "Units of ownership in a player...")
   c. Mouse-leave the wrapper
   **Expected:** Tooltip content disappears

#### Test Data

- All 11 known terms from `tooltipDefinitions`

#### Edge Cases

- None
