# Test Plan: mcq-1zw.8 -- Decompose PlayerDetail into sub-components

## Summary

- **Bead:** `mcq-1zw.8`
- **Feature:** Decompose the 881-line PlayerDetail god component into six focused sub-components (PlayerHeader, PriceChart, TradeForm, HoldingsCard, PriceTimeline, LeagueOwners) with a thin orchestrator, preserving all existing behavior and test coverage.
- **Total Test Cases:** 38
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: PlayerDetail orchestrator file size is within target range

**Priority:** P0
**Type:** Regression

### Objective

Verify that PlayerDetail.tsx has been reduced to a thin orchestrator of ~150–200 lines, confirming the decomposition actually occurred.

### Preconditions

- Decomposition work is complete
- Source files are available for inspection

### Steps

1. Count lines in `src/pages/PlayerDetail/PlayerDetail.tsx`
   **Expected:** File is between 100 and 250 lines (allowing slight tolerance around the 150–200 target)

2. Verify the file imports all six sub-components
   **Expected:** Imports for PlayerHeader, PriceChart, TradeForm, HoldingsCard, PriceTimeline, and LeagueOwners are present

### Test Data

- Source file: `src/pages/PlayerDetail/PlayerDetail.tsx`

### Edge Cases

- Orchestrator should not contain inline chart rendering, trade form logic, or timeline markup — only props-passing and hook calls

---

## TC-002: Sub-component files exist in correct directory structure

**Priority:** P0
**Type:** Functional

### Objective

Verify that all six sub-components are created in the specified directory with the correct filenames.

### Preconditions

- Decomposition work is complete

### Steps

1. Check for `src/pages/PlayerDetail/components/PlayerHeader.tsx`
   **Expected:** File exists and exports a React component

2. Check for `src/pages/PlayerDetail/components/PriceChart.tsx`
   **Expected:** File exists and exports a React component

3. Check for `src/pages/PlayerDetail/components/TradeForm.tsx`
   **Expected:** File exists and exports a React component

4. Check for `src/pages/PlayerDetail/components/HoldingsCard.tsx`
   **Expected:** File exists and exports a React component

5. Check for `src/pages/PlayerDetail/components/PriceTimeline.tsx`
   **Expected:** File exists and exports a React component

6. Check for `src/pages/PlayerDetail/components/LeagueOwners.tsx`
   **Expected:** File exists and exports a React component

### Test Data

- Directory: `src/pages/PlayerDetail/components/`

### Edge Cases

- An `index.ts` barrel file may or may not exist — either is acceptable as long as imports resolve

---

## TC-003: Orchestrator fetches data via useTrading and useSocial hooks

**Priority:** P0
**Type:** Functional

### Objective

Verify that PlayerDetail.tsx still calls `useTrading` and `useSocial` to retrieve player data, portfolio, and social features, then passes them as props to sub-components.

### Preconditions

- PlayerDetail orchestrator is rendered with mocked context providers

### Steps

1. Render PlayerDetail with a valid playerId route param and mocked TradingContext (getPlayer returns a player)
   **Expected:** Component renders without errors; `getPlayer` is called with the playerId from URL params

2. Verify that `useSocial` hooks are invoked (isWatching, getLeagueHoldings)
   **Expected:** Social context functions are called with the player ID

### Test Data

- playerId: `"mahomes"` via route `/player/mahomes`
- Mocked player object with all required fields

### Edge Cases

- Orchestrator should NOT contain any business logic for computing chart data, format functions, or trade execution — those belong in sub-components or utilities

---

## TC-004: Orchestrator handles URL params and navigation

**Priority:** P0
**Type:** Functional

### Objective

Verify that the orchestrator still reads `playerId` from `useParams` and provides navigation (back button, error-state redirect).

### Preconditions

- Component rendered inside MemoryRouter with route `/player/:playerId`

### Steps

1. Render PlayerDetail at `/player/mahomes`
   **Expected:** The player detail page renders with Mahomes data

2. Click the back button/link
   **Expected:** `navigate(-1)` is called

### Test Data

- Route: `/player/mahomes`

### Edge Cases

- Verify `playerId` of `undefined` is handled (fallback to empty string as currently implemented)

---

## TC-005: PlayerHeader renders player name

**Priority:** P0
**Type:** Functional

### Objective

Verify that PlayerHeader displays the player's name in an h1 element with the correct test ID.

### Preconditions

- PlayerHeader component is rendered with player prop containing name "Patrick Mahomes"

### Steps

1. Render PlayerHeader with player data
   **Expected:** Element with `data-testid="player-name"` contains text "Patrick Mahomes"

### Test Data

- player.name: `"Patrick Mahomes"`

### Edge Cases

- Very long player names (e.g., "D'Brickashaw Ferguson Jr. III") should render without truncation or overflow

---

## TC-006: PlayerHeader renders team badge and position

**Priority:** P0
**Type:** Functional

### Objective

Verify team badge and position labels are displayed in the header.

### Preconditions

- PlayerHeader rendered with player data

### Steps

1. Render PlayerHeader with team "KC" and position "QB"
   **Expected:** Text "KC" appears in a team badge element; text "QB" appears in a position element

### Test Data

- player.team: `"KC"`, player.position: `"QB"`

### Edge Cases

- Unusual team abbreviations (e.g., "JAX" vs "JAC") should render as-is

---

## TC-007: PlayerHeader renders player headshot image

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the player avatar image loads correctly, and falls back to a placeholder on error.

### Preconditions

- `getPlayerHeadshotUrl` is mocked

### Steps

1. Render PlayerHeader with `getPlayerHeadshotUrl` returning a valid URL
   **Expected:** An `<img>` element renders with the URL as `src` and player name as `alt`

2. Trigger `onError` on the image element
   **Expected:** Image is replaced by the SVG avatar placeholder

3. Render PlayerHeader with `getPlayerHeadshotUrl` returning `null`
   **Expected:** Avatar placeholder SVG is shown from the start

### Test Data

- Headshot URL: `"https://example.com/headshot.png"`

### Edge Cases

- Image that loads slowly should not cause layout shift (avatar container has fixed dimensions)

---

## TC-008: PlayerHeader renders current price with positive change

**Priority:** P0
**Type:** Functional

### Objective

Verify the price section displays the current price and an upward change indicator when changePercent is positive.

### Preconditions

- PlayerHeader rendered with positive changePercent

### Steps

1. Render with currentPrice 120.50 and changePercent 5.20
   **Expected:** `data-testid="player-price"` contains "$120.50"; the `up` CSS class is applied

2. Check the price change indicator
   **Expected:** `data-testid="price-change"` shows "▲ 5.20%" with `aria-label` "Up 5.20 percent"

### Test Data

- currentPrice: `120.50`, changePercent: `5.20`

### Edge Cases

- changePercent of exactly 0 should be treated as "up" (non-negative) per current logic (`isUp = player.changePercent >= 0`)

---

## TC-009: PlayerHeader renders current price with negative change

**Priority:** P0
**Type:** Functional

### Objective

Verify the price section displays a downward change indicator when changePercent is negative.

### Preconditions

- PlayerHeader rendered with negative changePercent

### Steps

1. Render with currentPrice 90.00 and changePercent -5.20
   **Expected:** `data-testid="player-price"` contains "$90.00"; the `down` CSS class is applied

2. Check the price change indicator
   **Expected:** `data-testid="price-change"` shows "▼ 5.20%" with `aria-label` "Down 5.20 percent"

### Test Data

- currentPrice: `90.00`, changePercent: `-5.20`

### Edge Cases

- Very large negative changes (e.g., -99.99%) should format correctly

---

## TC-010: PriceChart renders the Recharts LineChart

**Priority:** P0
**Type:** Functional

### Objective

Verify that PriceChart renders a chart container with the price history data.

### Preconditions

- PriceChart is rendered with valid priceHistory data
- Recharts is mocked (as in existing tests)

### Steps

1. Render PriceChart with 2 priceHistory entries
   **Expected:** `data-testid="chart-card"` is present; `data-testid="chart-container"` is present; Recharts `LineChart` mock (`data-testid="line-chart"`) is rendered

### Test Data

- priceHistory with baseline at $100 and TD event at $120.50

### Edge Cases

- Empty priceHistory array (no entries): chart should still render without crashing (empty chart)
- Single-entry priceHistory: chart renders a single point

---

## TC-011: PriceChart displays "Price History" heading

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the chart card has the correct heading text.

### Preconditions

- PriceChart rendered

### Steps

1. Render PriceChart
   **Expected:** Text "Price History" is visible within the chart card

### Test Data

- Standard player data

### Edge Cases

- None

---

## TC-012: PriceChart event markers render for significant events

**Priority:** P1
**Type:** Functional

### Objective

Verify that event markers (via Recharts Customized component) are rendered for game_event, significant news, and league_trade reasons, but not for baseline entries.

### Preconditions

- PriceChart rendered with entries including TD, INT, news, league_trade, and baseline

### Steps

1. Render PriceChart with mixed priceHistory entries
   **Expected:** Markers appear for game_event and league_trade entries; baseline entries with "baseline" in headline are skipped

### Test Data

- priceHistory entries with types: news (baseline), game_event (TD), game_event (INT), league_trade

### Edge Cases

- Entry with reason.type = "news" but no eventType should not show a marker (unless it has an eventType)

---

## TC-013: PriceChart event marker popup opens on click

**Priority:** P1
**Type:** Functional

### Objective

Verify that clicking an event marker on the chart opens the EventMarkerPopup with correct event data.

### Preconditions

- PriceChart rendered with real (non-mocked) Customized component or integration-level test

### Steps

1. Click on an event marker for a TD event
   **Expected:** EventMarkerPopup appears with the event's headline, price, and timestamp

2. Close the popup
   **Expected:** EventMarkerPopup is removed from the DOM

### Test Data

- TD event: headline "Throws 3 TDs", price 120.50

### Edge Cases

- Clicking a different marker while one popup is open should switch to the new event's data

---

## TC-014: TradeForm renders buy tab as default active

**Priority:** P0
**Type:** Functional

### Objective

Verify the trade form defaults to the Buy tab on initial render.

### Preconditions

- TradeForm rendered with activeTab = "buy" (or component manages its own state starting at "buy")

### Steps

1. Render TradeForm
   **Expected:** Buy tab has `aria-selected="true"` and `tabIndex={0}`; Sell tab has `aria-selected="false"` and `tabIndex={-1}`

### Test Data

- Default state

### Edge Cases

- None

---

## TC-015: TradeForm buy flow — successful purchase

**Priority:** P0
**Type:** Functional

### Objective

Verify that entering a quantity and clicking Buy calls buyShares and shows a success toast.

### Preconditions

- TradeForm rendered with buyShares mock returning true

### Steps

1. Enter "3" in the shares input
   **Expected:** Input value is "3"

2. Verify estimated cost updates
   **Expected:** Order total shows "$361.50" (120.50 * 3)

3. Click the Buy button
   **Expected:** `buyShares("mahomes", 3)` is called; success toast contains "3 shares" and "$361.50"; input resets to 1

### Test Data

- currentPrice: `120.50`, buyAmount: `3`

### Edge Cases

- Buying exactly 1 share should show singular "1 share of" (not "1 shares of")

---

## TC-016: TradeForm buy flow — insufficient funds

**Priority:** P0
**Type:** Functional

### Objective

Verify that when buyShares returns false, an error toast is shown.

### Preconditions

- TradeForm rendered with buyShares mock returning false

### Steps

1. Click the Buy button
   **Expected:** Error toast "Insufficient funds for this purchase" is displayed

### Test Data

- buyShares returns `false`

### Edge Cases

- None

---

## TC-017: TradeForm sell tab activation and successful sale

**Priority:** P0
**Type:** Functional

### Objective

Verify switching to the Sell tab and completing a sale.

### Preconditions

- TradeForm rendered with holding (shares: 5, avgCost: 110); sellShares returns true

### Steps

1. Click the Sell tab
   **Expected:** Sell tab becomes active; form shows "Shares (You own 5)"

2. Enter "2" in the shares input
   **Expected:** Input value is "2"; order total shows "$241.00" (120.50 * 2)

3. Click the Sell button
   **Expected:** `sellShares("mahomes", 2)` is called; success toast contains "2 shares"; input resets to 1

### Test Data

- holding: `{ shares: 5, avgCost: 110 }`, currentPrice: `120.50`

### Edge Cases

- Selling exactly 1 share shows "1 share of" (singular)

---

## TC-018: TradeForm sell flow — failed sale

**Priority:** P0
**Type:** Functional

### Objective

Verify that when sellShares returns false, an error toast is shown.

### Preconditions

- TradeForm with sellShares returning false

### Steps

1. Switch to Sell tab and click Sell
   **Expected:** Error toast "Unable to complete sale" is displayed

### Test Data

- sellShares returns `false`

### Edge Cases

- None

---

## TC-019: TradeForm buy quantity input enforces minimum of 1

**Priority:** P1
**Type:** Functional

### Objective

Verify the buy quantity input clamps values below 1 and non-numeric input to 1.

### Preconditions

- TradeForm in buy mode

### Steps

1. Enter "0" in the shares input
   **Expected:** Value becomes "1"

2. Enter "-5" in the shares input
   **Expected:** Value becomes "1"

3. Enter "abc" in the shares input
   **Expected:** Value becomes "1"

### Test Data

- Various invalid inputs: `"0"`, `"-5"`, `"abc"`, `""`

### Edge Cases

- Empty string input should resolve to 1

---

## TC-020: TradeForm sell quantity input caps at owned shares

**Priority:** P1
**Type:** Functional

### Objective

Verify the sell quantity input clamps to the number of shares the user owns.

### Preconditions

- TradeForm in sell mode; user owns 5 shares

### Steps

1. Enter "10" in the shares input
   **Expected:** Value is capped to 5; order total shows "$602.50" (120.50 * 5)

2. Enter "0" in the shares input
   **Expected:** Value is clamped to 1; order total shows "$120.50"

### Test Data

- holding.shares: `5`, currentPrice: `120.50`

### Edge Cases

- Entering exactly the number of owned shares should be accepted as-is

---

## TC-021: TradeForm sell tab is disabled when user has no holdings

**Priority:** P0
**Type:** Functional

### Objective

Verify the Sell tab is disabled when the user does not own any shares of this player.

### Preconditions

- TradeForm rendered with no holding for this player

### Steps

1. Check the Sell tab button
   **Expected:** Sell tab has `disabled` attribute; Buy tab is enabled

### Test Data

- portfolio: `{}` (empty)

### Edge Cases

- None

---

## TC-022: TradeForm estimated cost updates dynamically

**Priority:** P1
**Type:** Functional

### Objective

Verify that the estimated cost/proceeds display updates in real-time as the quantity input changes.

### Preconditions

- TradeForm in buy mode

### Steps

1. Default quantity of 1
   **Expected:** Order total shows "$120.50"

2. Change quantity to 5
   **Expected:** Order total shows "$602.50"

3. Change quantity to 10
   **Expected:** Order total shows "$1205.00"

### Test Data

- currentPrice: `120.50`

### Edge Cases

- Very large quantities (e.g., 9999) should still compute correctly without overflow display issues

---

## TC-023: TradeForm keyboard navigation between tabs

**Priority:** P1
**Type:** Functional

### Objective

Verify that ArrowRight and ArrowLeft keys navigate between Buy and Sell tabs per ARIA roving tabindex pattern.

### Preconditions

- TradeForm rendered with holdings (both tabs enabled)

### Steps

1. Focus the Buy tab and press ArrowRight
   **Expected:** Focus moves to Sell tab

2. Press ArrowLeft
   **Expected:** Focus moves back to Buy tab

3. On Sell tab, press ArrowRight
   **Expected:** Focus wraps to Buy tab

### Test Data

- Both tabs enabled (user has holdings)

### Edge Cases

- When Sell tab is disabled, ArrowRight from Buy should not move focus to the disabled tab

---

## TC-024: HoldingsCard renders position details

**Priority:** P0
**Type:** Functional

### Objective

Verify HoldingsCard displays shares owned, average cost, market value, and profit/loss.

### Preconditions

- HoldingsCard rendered with holding data

### Steps

1. Render with shares: 5, avgCost: 110, currentPrice: 120.50
   **Expected:** `data-testid="holdings-card"` contains: "Your Position", shares "5", avg cost "$110.00", market value "$602.50"

2. Check P/L display
   **Expected:** Shows gain with upward arrow: "▲ +$52.50" (since (120.50 - 110) * 5 = 52.50)

### Test Data

- holding: `{ shares: 5, avgCost: 110 }`, currentPrice: `120.50`

### Edge Cases

- Holding at a loss (currentPrice < avgCost): should show "▼" with loss amount
- Break-even (currentPrice === avgCost): should show "▲ +$0.00" (non-negative treated as gain)

---

## TC-025: HoldingsCard is not rendered when user has no holding

**Priority:** P0
**Type:** Functional

### Objective

Verify HoldingsCard is conditionally rendered — absent when there is no holding.

### Preconditions

- PlayerDetail rendered with empty portfolio

### Steps

1. Render PlayerDetail with no holdings for this player
   **Expected:** `data-testid="holdings-card"` is NOT in the DOM

### Test Data

- portfolio: `{}`

### Edge Cases

- None

---

## TC-026: HoldingsCard shows loss with down arrow

**Priority:** P1
**Type:** Functional

### Objective

Verify the P/L indicator correctly shows a loss state.

### Preconditions

- HoldingsCard rendered where currentPrice < avgCost

### Steps

1. Render with shares: 5, avgCost: 130, currentPrice: 120.50
   **Expected:** P/L shows "▼ $47.50" with `text-down` class; `aria-label` contains "Loss of $47.50"

### Test Data

- holding: `{ shares: 5, avgCost: 130 }`, currentPrice: `120.50`

### Edge Cases

- None

---

## TC-027: PriceTimeline renders entries from priceHistory

**Priority:** P0
**Type:** Functional

### Objective

Verify PriceTimeline displays all price history entries in reverse chronological order.

### Preconditions

- PriceTimeline rendered with priceHistory data

### Steps

1. Render with 2 priceHistory entries (Baseline at $100, TD at $120.50)
   **Expected:** `data-testid="timeline-card"` is present; heading "Price Changes" is visible; 2 `data-testid="timeline-entry"` elements exist

2. Verify reverse order (most recent first)
   **Expected:** "Throws 3 TDs" appears before "Baseline" in the DOM

### Test Data

- priceHistory: baseline ($100, Jan 1) and TD event ($120.50, Jan 2)

### Edge Cases

- Single entry: timeline renders with one entry and no connector line
- Empty priceHistory: timeline card may render with no entries (no crash)

---

## TC-028: PriceTimeline entry displays formatted timestamp

**Priority:** P1
**Type:** Functional

### Objective

Verify each timeline entry shows a human-readable timestamp badge.

### Preconditions

- PriceTimeline rendered with entries that have timestamps

### Steps

1. Render with entry timestamp "2025-01-02T14:00:00Z"
   **Expected:** Timeline entry shows formatted date like "Jan 2, 2:00 PM" (locale-dependent)

### Test Data

- timestamp: `"2025-01-02T14:00:00Z"`

### Edge Cases

- Missing or empty timestamp string: should render empty string (not crash)

---

## TC-029: PriceTimeline entry displays event type badge

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify each entry shows a type badge (TD, INT, NEWS, TRADE, etc.) with the correct color.

### Preconditions

- PriceTimeline rendered with varied event types

### Steps

1. Render with a game_event (eventType: "TD") entry
   **Expected:** Badge shows "TD" with green (#00C853) background tint

2. Render with a game_event (eventType: "INT") entry
   **Expected:** Badge shows "INT" with red (#FF1744) background tint

3. Render with a news-type entry
   **Expected:** Badge shows "NEWS" with blue (#2196F3) background tint

4. Render with a league_trade-type entry
   **Expected:** Badge shows "TRADE" with purple (#9C27B0) background tint

### Test Data

- Multiple entries with different reason types

### Edge Cases

- Entry with unknown reason type: badge should show "EVENT" with default color

---

## TC-030: PriceTimeline entry with URL renders as clickable link

**Priority:** P1
**Type:** Functional

### Objective

Verify that timeline entries with valid URLs render the headline as an external link.

### Preconditions

- PriceTimeline rendered with entry that has a valid URL in reason

### Steps

1. Render with entry reason.url = "https://espn.com/article"
   **Expected:** Headline is rendered as `<a>` with `href="https://espn.com/article"`, `target="_blank"`, and `rel="noopener noreferrer"`

2. Render with entry reason.url = "#" (hash-only link)
   **Expected:** Headline falls back to player ESPN news page URL or renders as plain text `<p>` if no fallback available

### Test Data

- reason.url: `"https://espn.com/article"` and `"#"`

### Edge Cases

- Entry with no URL and no fallback news URL: renders as plain `<p>` element

---

## TC-031: PriceTimeline shows price diff between consecutive entries

**Priority:** P1
**Type:** Functional

### Objective

Verify each entry (except the last/oldest) shows the price difference from the previous entry.

### Preconditions

- PriceTimeline with at least 2 entries

### Steps

1. Render with entries: $100 (baseline) then $120.50 (TD)
   **Expected:** The TD entry shows "$120.50 (+20.50)"; the baseline entry shows "$100.00" with no diff

### Test Data

- Baseline: $100, TD: $120.50

### Edge Cases

- Negative price change: should show "(-10.00)" format
- First entry in the array uses basePrice as previous price

---

## TC-032: PriceTimeline TD entry has special styling

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that TD events get the `is-td` class for green left border and star marker.

### Preconditions

- PriceTimeline rendered with a TD event

### Steps

1. Render with a game_event entry having eventType "TD"
   **Expected:** The timeline-entry element has the `is-td` CSS class; the timeline-marker has `marker-td` class; a star SVG icon is rendered

### Test Data

- reason: `{ type: "game_event", eventType: "TD" }`

### Edge Cases

- INT events get `is-int` class with X icon and red border

---

## TC-033: LeagueOwners renders table of holders

**Priority:** P0
**Type:** Functional

### Objective

Verify LeagueOwners displays a list of league members who hold this player.

### Preconditions

- LeagueOwners rendered with league holdings data

### Steps

1. Render with 2 holders: GridironGuru (10 shares, +8.2%) and You (5 shares, -2.1%)
   **Expected:** `data-testid="league-owners-card"` is present; heading shows "League Owners (2)"; 2 `data-testid="league-owner-row"` elements exist

2. Verify holder details
   **Expected:** "GridironGuru" name is visible; "10 shares" text is visible; "+8.2%" gain is shown with up styling

### Test Data

- leagueHoldings: `[{ memberId: "gridiron", name: "GridironGuru", avatar: "🏈", isUser: false, shares: 10, avgCost: 100, gainPercent: 8.2 }, { memberId: "user", name: "You", avatar: "👤", isUser: true, shares: 5, avgCost: 110, gainPercent: -2.1 }]`

### Edge Cases

- Empty leagueHoldings array: the entire LeagueOwners card should not render

---

## TC-034: LeagueOwners highlights current user row

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the current user's row has a distinct visual treatment.

### Preconditions

- LeagueOwners rendered with a holder that has `isUser: true`

### Steps

1. Render with one user holder (isUser: true)
   **Expected:** The user's row has the `is-user` CSS class; avatar shows "👤" instead of the holder's custom avatar

### Test Data

- holder: `{ memberId: "user", name: "You", isUser: true, avatar: "🎯", shares: 5 }`

### Edge Cases

- Non-user holders should NOT have the `is-user` class and should display their custom avatar

---

## TC-035: LeagueOwners displays gain/loss per holder with correct styling

**Priority:** P1
**Type:** Functional

### Objective

Verify each holder row shows their gain percentage with appropriate up/down styling and aria labels.

### Preconditions

- LeagueOwners rendered with holders having positive and negative gains

### Steps

1. Check holder with gainPercent 8.2
   **Expected:** Shows "▲ +8.2%" with `text-up` class; `aria-label` contains "Gain 8.2 percent"

2. Check holder with gainPercent -2.1
   **Expected:** Shows "▼ -2.1%" with `text-down` class; `aria-label` contains "Loss 2.1 percent"

### Test Data

- gainPercent: `8.2` and `-2.1`

### Edge Cases

- gainPercent of exactly 0: should show gain styling (non-negative)

---

## TC-036: Watchlist toggle — add to watchlist (integration through orchestrator)

**Priority:** P0
**Type:** Integration

### Objective

Verify the watchlist toggle still works end-to-end through the orchestrator passing callbacks to the sub-component tree.

### Preconditions

- PlayerDetail rendered with isWatching returning false

### Steps

1. Find and verify the watchlist button shows "Add to Watchlist"
   **Expected:** `data-testid="watchlist-button"` text is "Add to Watchlist"

2. Click the watchlist button
   **Expected:** `addToWatchlist("mahomes")` is called; success toast "Added Patrick Mahomes to watchlist" appears

### Test Data

- isWatching: `false`, player.name: "Patrick Mahomes"

### Edge Cases

- Already watching: button shows "Watching" with `watching` CSS class; clicking calls removeFromWatchlist and shows info toast

---

## TC-037: Error state renders for invalid player ID (integration)

**Priority:** P0
**Type:** Integration

### Objective

Verify the orchestrator still renders the error state when getPlayer returns null, and the "Back to Market" button navigates correctly.

### Preconditions

- PlayerDetail rendered with a nonexistent playerId; getPlayer returns null

### Steps

1. Render PlayerDetail at `/player/nonexistent`
   **Expected:** `data-testid="error-state"` is in the DOM; "Player Not Found" heading and explanation text are visible

2. Click "Back to Market" button
   **Expected:** `navigate("/market")` is called

### Test Data

- playerId: `"nonexistent"`, getPlayer returns `null`

### Edge Cases

- None of the sub-components (PriceChart, TradeForm, etc.) should render when player is null

---

## TC-038: Gate criteria pass — build, typecheck, tests, coverage

**Priority:** P0
**Type:** Regression

### Objective

Verify all four gate commands pass after decomposition, confirming no regressions in type safety, test coverage, or build output.

### Preconditions

- All decomposition work is complete and committed

### Steps

1. Run `npx tsc --noEmit`
   **Expected:** Exit code 0, no type errors

2. Run `npm run build`
   **Expected:** Exit code 0, production build succeeds

3. Run `npm run test:run`
   **Expected:** All existing tests pass (including all PlayerDetail tests, keyboard tests)

4. Run `npm run test:coverage`
   **Expected:** PlayerDetail coverage holds or improves compared to pre-decomposition baseline. No sub-component has 0% coverage.

### Test Data

- Full project build/test environment

### Edge Cases

- The 3 existing `eslint-disable @typescript-eslint/no-explicit-any` suppressions should be moved to their respective sub-components (PriceChart primarily) — they are deferred to mcq-1zw.1 but should not increase in count
- CSS modules: verify no broken class references (class name in JSX that doesn't exist in any .module.css file)
