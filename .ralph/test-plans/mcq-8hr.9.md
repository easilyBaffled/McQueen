# Test Plan: mcq-8hr.9 -- Add data-testid attributes to source components for Cypress selectors

## Summary

- **Bead:** `mcq-8hr.9`
- **Feature:** Adding data-testid attributes to ~12 source components so that all ~59 Cypress CSS class selectors have stable, hash-proof equivalents
- **Total Test Cases:** 20
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Market.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Market.tsx renders all 7 required data-testid attributes on the correct DOM elements so Cypress can locate them without CSS class selectors.

### Preconditions

- App is running locally
- Onboarding has been completed (localStorage `mcqueen-onboarded` = "true")
- Welcome banner dismiss flag is cleared so banner is visible

### Steps

1. Navigate to `/market`
   **Expected:** The market page loads successfully

2. Inspect the root container element
   **Expected:** `[data-testid="market-page"]` exists on the outermost `<div>`

3. Inspect the player grid area
   **Expected:** `[data-testid="players-grid"]` exists and contains player card links

4. Inspect the sort tab buttons (e.g., "Biggest Risers", "Biggest Fallers")
   **Expected:** Each sort button has `[data-testid="sort-tab"]`

5. Inspect the search input field
   **Expected:** `[data-testid="search-input"]` exists on the `<input type="search">` element

6. Inspect the welcome banner (visible because dismiss flag was cleared)
   **Expected:** `[data-testid="welcome-banner"]` exists on the banner container

7. Inspect the dismiss button inside the welcome banner
   **Expected:** `[data-testid="welcome-dismiss"]` exists on the `<button>` element

8. Inspect the sidebar containing the mini leaderboard
   **Expected:** `[data-testid="market-sidebar"]` exists on the sidebar `<div>`

### Test Data

- Clear `mcqueen-welcome-dismissed` from localStorage before test to ensure banner visibility

### Edge Cases

- After dismissing the welcome banner and reloading, `[data-testid="welcome-banner"]` should not exist in the DOM
- When the skeleton loader is showing (first 300ms), `[data-testid="players-grid"]` should not yet be present

---

## TC-002: PlayerDetail.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that PlayerDetail.tsx renders all 19 required data-testid attributes covering the header, chart, trading card, holdings, watchlist, timeline, and league owners sections.

### Preconditions

- App is running with scenario data that includes player "mahomes"
- Onboarding completed
- User has purchased at least 1 share of mahomes (so holdings card is visible)

### Steps

1. Navigate to `/player/mahomes`
   **Expected:** Page loads; `[data-testid="player-detail-page"]` exists

2. Inspect the back navigation button
   **Expected:** `[data-testid="back-link"]` exists

3. Inspect the player header area
   **Expected:** `[data-testid="player-header"]` exists

4. Inspect the player name heading
   **Expected:** `[data-testid="player-name"]` exists and contains "Patrick Mahomes" (or equivalent)

5. Inspect the price display
   **Expected:** `[data-testid="player-price"]` exists and contains a dollar amount

6. Inspect the price change badge
   **Expected:** `[data-testid="price-change"]` exists and shows a percentage with an arrow

7. Inspect the chart section
   **Expected:** `[data-testid="chart-card"]` exists; `[data-testid="chart-container"]` exists inside it

8. Inspect the trading panel
   **Expected:** `[data-testid="trading-card"]` exists

9. Inspect the Buy/Sell tab buttons
   **Expected:** Each tab has `[data-testid="trading-tab"]`

10. Inspect the share quantity input
    **Expected:** `[data-testid="form-input"]` exists on the `<input type="number">`

11. Inspect the order total display
    **Expected:** `[data-testid="order-total"]` exists and shows a dollar amount

12. Inspect the Buy button
    **Expected:** An element matching `[data-testid="trade-button"]` exists; it is distinguishable as the Buy variant (see TC-013 for variant handling)

13. Inspect the holdings card (visible because user owns shares)
    **Expected:** `[data-testid="holdings-card"]` exists

14. Inspect the watchlist toggle button
    **Expected:** `[data-testid="watchlist-button"]` exists

15. Inspect the price history timeline section
    **Expected:** `[data-testid="timeline-card"]` exists; `[data-testid="price-timeline"]` exists inside it; at least one `[data-testid="timeline-entry"]` exists

16. Inspect the league owners section
    **Expected:** `[data-testid="league-owners-card"]` exists; at least one `[data-testid="league-owner-row"]` exists

### Test Data

- Player ID: `mahomes`
- Pre-purchase 1 share so holdings card renders

### Edge Cases

- `[data-testid="holdings-card"]` should NOT exist if the user owns 0 shares of this player
- `[data-testid="league-owners-card"]` should NOT exist if no league members hold this player

---

## TC-003: PlayerDetail.tsx — error state has data-testid

**Priority:** P0
**Type:** Functional

### Objective

Verify that the error/not-found state of PlayerDetail renders the `error-state` data-testid so Cypress can assert on invalid player routes.

### Preconditions

- App is running

### Steps

1. Navigate to `/player/nonexistent-player-id-12345`
   **Expected:** `[data-testid="player-detail-page"]` exists (wrapper is always rendered)

2. Inspect the error container
   **Expected:** `[data-testid="error-state"]` exists and contains "Player Not Found"

### Test Data

- Invalid player ID: `nonexistent-player-id-12345`

### Edge Cases

- The `[data-testid="error-state"]` should only appear for truly invalid IDs, not for valid players with no data

---

## TC-004: Timeline.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Timeline.tsx renders all 7 required data-testid attributes for the event list, filters, search, and inline trade widget.

### Preconditions

- App is running
- Onboarding completed
- Navigate to home page `/` (Timeline is the default route)

### Steps

1. Navigate to `/`
   **Expected:** Timeline page loads with events

2. Inspect the search input
   **Expected:** `[data-testid="search-input"]` exists on the text input

3. Inspect the filter dropdowns (Type, Magnitude, Time)
   **Expected:** Each `<select>` has `[data-testid="filter-select"]`

4. Inspect the timeline track container
   **Expected:** `[data-testid="timeline-track"]` exists

5. Inspect any timeline event card
   **Expected:** `[data-testid="timeline-event"]` exists on each event wrapper; `[data-testid="timeline-event-content"]` exists inside it

6. Click a timeline event to expand it
   **Expected:** `[data-testid="inline-trade-widget"]` becomes visible inside the expanded event

7. Inspect the Buy/Sell buttons within the inline trade widget
   **Expected:** Elements matching `[data-testid="trade-btn"]` exist (one for Buy, one for Sell)

### Test Data

- Default scenario data with at least one timeline event

### Edge Cases

- When search yields no results, `[data-testid="timeline-event"]` should not exist in the DOM
- When all events are filtered out, the empty state should render (no timeline-event elements)

---

## TC-005: Watchlist.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Watchlist.tsx renders all 5 required data-testid attributes for empty state, quick-add, grid, card wrappers, and remove buttons.

### Preconditions

- App is running
- Onboarding completed
- Watchlist is empty (no players added yet)

### Steps

1. Navigate to `/watchlist` with empty watchlist
   **Expected:** `[data-testid="empty-state"]` is visible

2. Inspect the quick-add player buttons
   **Expected:** `[data-testid="quick-add-player"]` exists on each suggested player button

3. Click the first quick-add button to add a player
   **Expected:** `[data-testid="watchlist-grid"]` appears; `[data-testid="empty-state"]` disappears

4. Inspect the card wrapper around the watched player
   **Expected:** `[data-testid="watchlist-card-wrapper"]` exists

5. Inspect the remove button on the watched player card
   **Expected:** `[data-testid="remove-button"]` exists

### Test Data

- Start with empty watchlist (clear localStorage)

### Edge Cases

- When watchlist has players, `[data-testid="empty-state"]` should not exist
- When the last player is removed, `[data-testid="watchlist-grid"]` should disappear and `[data-testid="empty-state"]` should reappear

---

## TC-006: Portfolio.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Portfolio.tsx renders all 9 required data-testid attributes on the summary cards, holdings list, and individual holding row columns.

### Preconditions

- App is running with default scenario (starts with 3 holdings)
- Onboarding completed

### Steps

1. Navigate to `/portfolio`
   **Expected:** Page loads with holdings visible

2. Inspect the summary section
   **Expected:** `[data-testid="portfolio-summary"]` exists

3. Inspect individual summary cards
   **Expected:** 4 elements with `[data-testid="summary-card"]` exist

4. Inspect each summary card's internals
   **Expected:** Each card contains `[data-testid="summary-label"]` and `[data-testid="summary-value"]`

5. Inspect the holdings list container
   **Expected:** `[data-testid="holdings-list"]` exists

6. Inspect individual holding rows
   **Expected:** `[data-testid="holding-row"]` elements exist (3 for default scenario)

7. Inspect the first holding row's columns
   **Expected:** The row contains `[data-testid="player-name"]`, `[data-testid="holding-shares"]`, `[data-testid="holding-cost"]`, `[data-testid="holding-value"]`, and `[data-testid="holding-gain"]`

### Test Data

- Default midweek scenario with 3 starting holdings

### Edge Cases

- If user has no holdings (all sold), `[data-testid="holdings-list"]` should not exist; an empty-state should render instead
- `[data-testid="summary-card"]` count should always be 4 regardless of holdings

---

## TC-007: Mission.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Mission.tsx renders the 3 required data-testid attributes for the page wrapper, help toggle, and help panel.

### Preconditions

- App is running
- Onboarding completed
- Mission help has been seen (localStorage `mcqueen-mission-help-seen` = "true")

### Steps

1. Navigate to `/mission`
   **Expected:** `[data-testid="mission-page"]` exists

2. Inspect the help toggle button
   **Expected:** `[data-testid="help-toggle"]` exists and shows "How It Works" text

3. Click the help toggle button
   **Expected:** `[data-testid="mission-help"]` becomes visible

4. Click the help toggle button again
   **Expected:** `[data-testid="mission-help"]` is removed from the DOM

### Test Data

- Set `mcqueen-mission-help-seen` = "true" in localStorage so help is initially hidden

### Edge Cases

- For new users (mission-help-seen not set), `[data-testid="mission-help"]` should be visible by default on page load

---

## TC-008: DailyMission.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that DailyMission.tsx renders all 8 required data-testid attributes for the mission component, picks interface, and results view.

### Preconditions

- App is running
- Navigate to `/mission`
- Mission has not been revealed yet

### Steps

1. Inspect the DailyMission component wrapper
   **Expected:** `[data-testid="daily-mission"]` exists

2. Inspect the player selector area
   **Expected:** `[data-testid="player-selector"]` exists

3. Inspect the riser/faller selector buttons on each player chip
   **Expected:** Elements with `[data-testid="selector-btn"]` exist (see TC-013 for variant handling of up/down)

4. Inspect the picks columns
   **Expected:** Elements with `[data-testid="picks-column"]` exist (see TC-013 for risers/fallers variants)

5. Inspect empty pick chip placeholders
   **Expected:** Elements with `[data-testid="pick-chip"]` exist

6. Select 3 risers and 3 fallers, then inspect the reveal button
   **Expected:** `[data-testid="reveal-button"]` exists and is enabled

7. Click the reveal button
   **Expected:** `[data-testid="mission-results"]` becomes visible

8. Inspect the Play Again button in the results view
   **Expected:** `[data-testid="reset-button"]` exists

9. Click the Play Again button
   **Expected:** `[data-testid="mission-results"]` disappears; `[data-testid="player-selector"]` reappears

### Test Data

- Use first 6 players: pick indices 0, 1, 2 as risers and indices 3, 4, 5 as fallers

### Edge Cases

- `[data-testid="reveal-button"]` should have the `disabled` attribute when fewer than 6 picks are made
- Filled pick-chip elements (not empty placeholders) should also have `[data-testid="pick-chip"]`

---

## TC-009: Onboarding.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Onboarding.tsx renders all 6 required data-testid attributes for the modal overlay, step navigation, and skip functionality.

### Preconditions

- App is running
- localStorage is cleared (new user state — onboarding not yet completed)

### Steps

1. Navigate to `/`
   **Expected:** `[data-testid="onboarding-overlay"]` is visible

2. Inspect the modal dialog
   **Expected:** `[data-testid="onboarding-modal"]` is visible

3. Inspect the step indicator dots
   **Expected:** `[data-testid="step-dot"]` elements exist (6 dots for 6 steps)

4. Inspect the skip button
   **Expected:** `[data-testid="skip-button"]` exists and contains "Skip" text

5. On step 0 (first step), check for back button
   **Expected:** `[data-testid="back-button"]` does NOT exist

6. Click the next button
   **Expected:** `[data-testid="next-button"]` exists and advances to step 1

7. On step 1, check for back button
   **Expected:** `[data-testid="back-button"]` exists and is visible

8. Click skip button
   **Expected:** `[data-testid="onboarding-overlay"]` is removed from the DOM

### Test Data

- Clear all `mcqueen*` localStorage keys to trigger onboarding

### Edge Cases

- After completing onboarding (either skip or full progression), reloading the page should NOT show `[data-testid="onboarding-overlay"]`
- On the last step (step 5), `[data-testid="next-button"]` should show "Start Trading!" text

---

## TC-010: PlayerCard.tsx — data-testid attribute present

**Priority:** P0
**Type:** Functional

### Objective

Verify that PlayerCard.tsx renders the `player-card` data-testid on its root element, as this is used by the `getPlayerCards` Cypress custom command.

### Preconditions

- App is running
- Onboarding completed
- Navigate to `/market` and wait for player cards to load

### Steps

1. Navigate to `/market`
   **Expected:** Player cards load in the grid

2. Inspect any rendered PlayerCard component root element
   **Expected:** `[data-testid="player-card"]` exists on the outermost `<div>` (the `motion.div`)

3. Count all `[data-testid="player-card"]` elements
   **Expected:** Count is greater than 0 and matches the number of visible player cards

### Test Data

- Default scenario with multiple players

### Edge Cases

- PlayerCard is reused in Watchlist; verify `[data-testid="player-card"]` also appears on cards rendered at `/watchlist`

---

## TC-011: Toast.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Toast.tsx renders the 3 required data-testid attributes for the toast notification, success variant, and close button.

### Preconditions

- App is running
- Onboarding completed
- Navigate to a player detail page with the ability to buy shares

### Steps

1. Navigate to `/player/mahomes` and click the Buy button
   **Expected:** A toast notification appears

2. Inspect the toast element
   **Expected:** `[data-testid="toast"]` exists and is visible

3. Inspect the toast for its type class
   **Expected:** `[data-testid="toast-success"]` exists (since the buy was successful). The toast type variant should be identifiable via data-testid (e.g. `toast-success` for success, `toast-error` for error)

4. Inspect the close button inside the toast
   **Expected:** `[data-testid="toast-close"]` exists

5. Click the close button
   **Expected:** `[data-testid="toast"]` is removed from the DOM

### Test Data

- Player: `mahomes`, buy 1 share (default amount)

### Edge Cases

- For error toasts (e.g., buying with insufficient funds), verify the appropriate toast variant testid exists
- After the auto-dismiss timeout (3 seconds), `[data-testid="toast"]` should no longer exist

---

## TC-012: Leaderboard.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Leaderboard.tsx renders all 9 required data-testid attributes, replacing the existing `[class*="..."]` partial-match selectors used in Cypress tests.

### Preconditions

- App is running
- Onboarding completed

### Steps

1. Navigate to `/leaderboard`
   **Expected:** Page loads with leaderboard data

2. Inspect the leaderboard table container
   **Expected:** `[data-testid="leaderboard-table"]` exists

3. Inspect individual table rows
   **Expected:** `[data-testid="table-row"]` elements exist (at least 10)

4. Inspect the first table row's columns
   **Expected:** Row contains `[data-testid="col-trader"]`, `[data-testid="col-value"]`, and `[data-testid="col-gain"]`

5. Inspect the user rank card above the table
   **Expected:** `[data-testid="user-rank-card"]` exists

6. Inspect the rank badge inside the user rank card
   **Expected:** `[data-testid="rank-badge"]` exists and contains text starting with "#"

7. Inspect the rank value (portfolio value) inside the user rank card
   **Expected:** `[data-testid="rank-value"]` exists and contains a "$" amount

8. Inspect the user's own row in the rankings table
   **Expected:** `[data-testid="user-row"]` exists on the row containing "You"

### Test Data

- Default scenario with simulated league members

### Edge Cases

- The Leaderboard currently uses `[class*="..."]` partial-match selectors in Cypress because CSS Modules hash class names — this test verifies that data-testid provides a stable alternative
- Top 3 rows should still display medal emojis alongside their data-testid attributes

---

## TC-013: Layout.tsx — data-testid attributes present

**Priority:** P0
**Type:** Functional

### Objective

Verify that Layout.tsx renders all 5 required data-testid attributes for navigation links, balance display, header center, and help button.

### Preconditions

- App is running
- Onboarding completed

### Steps

1. Navigate to `/`
   **Expected:** Layout renders with header and navigation

2. Inspect navigation links
   **Expected:** Each `<a>` (NavLink) in the nav bar has `[data-testid="nav-link"]` — 6 total (Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard)

3. Inspect the balance value in the header
   **Expected:** `[data-testid="balance-value"]` exists and displays a dollar amount

4. Inspect the balance label in the header
   **Expected:** `[data-testid="balance-label"]` exists and contains "Total Value"

5. Inspect the header center section (scenario toggle area)
   **Expected:** `[data-testid="header-center"]` exists

6. Inspect the help/glossary button
   **Expected:** `[data-testid="help-button"]` exists

### Test Data

- Any route (Layout wraps all routes)

### Edge Cases

- The `nav-link` and `active` classes are currently applied as global (non-module) classes in Layout.tsx — verify the data-testid is added alongside the existing className pattern
- `[data-testid="nav-link"]` count must be exactly 6 on every page

---

## TC-014: Compound selectors — variant data-testid handling for buy/sell, up/down

**Priority:** P0
**Type:** Functional

### Objective

Verify that elements targeted by compound Cypress selectors (e.g., `.trade-button.buy`, `.selector-btn.up`, `.picks-column.risers`) can be uniquely identified via data-testid, either through variant-specific testids or a combination of testid + additional attributes.

### Preconditions

- App is running
- Onboarding completed

### Steps

1. Navigate to `/player/mahomes`; inspect the Buy button
   **Expected:** The Buy action button can be selected as `[data-testid="trade-button"][data-testid-variant="buy"]` or `[data-testid="trade-button-buy"]` — whichever convention is chosen, it must be unique within the page

2. Buy 1 share, switch to the Sell tab, and inspect the Sell button
   **Expected:** The Sell action button is distinguishable from Buy (e.g., `[data-testid="trade-button-sell"]` or variant attribute)

3. Navigate to `/`; expand a timeline event and inspect the inline Buy/Sell buttons
   **Expected:** Trade buttons within the inline widget are identifiable as `[data-testid="trade-btn"]` with buy/sell distinction

4. Navigate to `/mission`; inspect selector buttons
   **Expected:** Up-arrow buttons have `[data-testid="selector-btn"]` distinguishable as "up" variant; down-arrow buttons as "down" variant

5. Inspect picks columns
   **Expected:** Risers column has `[data-testid="picks-column"]` distinguishable as "risers"; Fallers column as "fallers"

### Test Data

- Navigate to relevant pages for each compound selector

### Edge Cases

- The Cypress tests use `.trade-button.buy` (both classes on same element) — ensure the data-testid approach allows the same level of specificity
- `.step-dot.active` in Onboarding should allow querying the currently active step dot via data-testid

---

## TC-015: Cypress custom command getPlayerCards works with data-testid

**Priority:** P0
**Type:** Integration

### Objective

Verify that the `cy.getPlayerCards()` custom command (defined in `cypress/support/commands.js`) can be updated to use `[data-testid="player-card"]` and returns the correct elements.

### Preconditions

- App is running
- Onboarding completed
- Custom command updated to use `[data-testid="player-card"]` selector

### Steps

1. Navigate to `/market`
   **Expected:** Player cards load in the grid

2. Execute `cy.get('[data-testid="player-card"]')` in Cypress
   **Expected:** Returns all visible player card elements with count > 0

3. Navigate to `/watchlist`, add a player, and execute `cy.get('[data-testid="player-card"]')`
   **Expected:** Returns the watchlist player cards (count matches added players)

### Test Data

- Default scenario data

### Edge Cases

- If no players match a search filter on `/market`, `[data-testid="player-card"]` should return 0 elements

---

## TC-016: Shared data-testid names across components do not collide within a single view

**Priority:** P1
**Type:** Integration

### Objective

Verify that data-testid values reused across different components (e.g., `player-name` in PlayerDetail vs. Portfolio, `search-input` in Market vs. Timeline) do not cause ambiguous selections when only one component is rendered at a time.

### Preconditions

- App is running
- Onboarding completed

### Steps

1. Navigate to `/market`; query `[data-testid="search-input"]`
   **Expected:** Exactly 1 element found (Market's search input)

2. Navigate to `/`; query `[data-testid="search-input"]`
   **Expected:** Exactly 1 element found (Timeline's search input)

3. Navigate to `/player/mahomes`; query `[data-testid="player-name"]`
   **Expected:** Exactly 1 element found (PlayerDetail's player name heading)

4. Navigate to `/portfolio`; query `[data-testid="player-name"]`
   **Expected:** Count matches the number of holdings (one per holding row) — no conflict with PlayerDetail's player-name because only Portfolio is rendered

### Test Data

- Default scenario with holdings

### Edge Cases

- On pages where PlayerCard is rendered (Market, Watchlist), `player-name` may appear inside each PlayerCard as well as potentially in a parent — verify selectors are scoped correctly with `.within()`

---

## TC-017: CSS Modules styling is not broken by adding data-testid

**Priority:** P1
**Type:** Regression

### Objective

Verify that adding data-testid attributes to elements does not interfere with CSS Modules class name application, and all visual styling remains intact.

### Preconditions

- App is running with the modified components
- Onboarding completed

### Steps

1. Navigate to `/market`
   **Expected:** Player cards display with proper styling — card backgrounds, borders, text colors, sparkline charts all render correctly

2. Navigate to `/player/mahomes`
   **Expected:** Price chart renders, trading card has styled tabs, buy/sell buttons have correct green/red colors, holdings card layout is intact

3. Navigate to `/portfolio`
   **Expected:** Summary cards display in a row with proper color-coding; holdings table has aligned columns

4. Navigate to `/mission`
   **Expected:** Selector buttons show green (up) and red (down) styling; picks columns are properly laid out side-by-side

5. Navigate to `/leaderboard`
   **Expected:** Table rows are styled with proper spacing; medals display on top 3; user row has distinct highlighting

6. Trigger a toast notification (buy a share)
   **Expected:** Toast appears with animated entrance, correct color for type, and properly styled close button

7. Clear localStorage and reload to trigger onboarding
   **Expected:** Onboarding overlay, modal, step dots, and buttons all display with proper styling and animations

### Test Data

- Default scenario data

### Edge Cases

- Verify that `data-testid` attributes do not add any unintended visual space or affect CSS specificity calculations
- Verify that elements with both `className={styles['...']}` and `data-testid="..."` render identically to the pre-change version

---

## TC-018: Leaderboard [class*] selectors are fully replaced by data-testid

**Priority:** P1
**Type:** Functional

### Objective

The Leaderboard Cypress tests currently use `[class*="leaderboard-table"]` partial-match selectors as a workaround for CSS Modules hashing. Verify that after adding data-testid attributes, these can be replaced with exact `[data-testid="..."]` selectors.

### Preconditions

- App is running
- Navigate to `/leaderboard`

### Steps

1. Query `[data-testid="leaderboard-table"]`
   **Expected:** Returns exactly 1 element (the table container `<div>`)

2. Query `[data-testid="table-row"]`
   **Expected:** Returns at least 10 elements

3. Within the first table-row, query `[data-testid="col-trader"]`
   **Expected:** Returns exactly 1 element containing the trader name

4. Within the first table-row, query `[data-testid="col-value"]`
   **Expected:** Returns exactly 1 element containing a "$" amount

5. Within the first table-row, query `[data-testid="col-gain"]`
   **Expected:** Returns exactly 1 element containing a "%" value

6. Query `[data-testid="user-rank-card"]`
   **Expected:** Returns exactly 1 element

7. Within user-rank-card, query `[data-testid="rank-badge"]`
   **Expected:** Returns exactly 1 element containing "#" followed by a number

8. Within user-rank-card, query `[data-testid="rank-value"]`
   **Expected:** Returns exactly 1 element containing a "$" amount

9. Query `[data-testid="user-row"]`
   **Expected:** Returns exactly 1 element containing "You"

### Test Data

- Default scenario with simulated league members

### Edge Cases

- The old `[class*="..."]` selectors should no longer be needed after this change; verify no Cypress test still relies on them

---

## TC-019: data-testid naming convention matches original class names

**Priority:** P1
**Type:** Functional

### Objective

Verify that every data-testid value exactly matches the original CSS class name used in the Cypress selectors (kebab-case, no prefix/suffix changes), as specified in the issue description.

### Preconditions

- Source code changes have been applied

### Steps

1. For each component file, review the added data-testid attributes
   **Expected:** The data-testid value string matches the CSS Module key name exactly. For example:
   - `styles['player-card']` → `data-testid="player-card"` (not `data-testid="playerCard"`)
   - `styles['welcome-banner']` → `data-testid="welcome-banner"` (not `data-testid="welcomeBanner"`)
   - `styles['inline-trade-widget']` → `data-testid="inline-trade-widget"`

2. Verify no data-testid uses camelCase, PascalCase, or snake_case
   **Expected:** All values are kebab-case matching the original class names

3. Cross-reference the complete list of 59 Cypress selectors against the data-testid values added
   **Expected:** Every CSS selector referenced in Cypress test files has a corresponding data-testid in the source component

### Test Data

- Full list of Cypress CSS selectors extracted from all `.cy.js` files

### Edge Cases

- `text-up` and `text-down` are global utility classes (not CSS Module classes) used in Leaderboard and Portfolio — verify whether these need data-testid attributes or if they remain as-is since they are not hashed by CSS Modules

---

## TC-020: data-testid attributes are present in production build output

**Priority:** P2
**Type:** Regression

### Objective

Verify that data-testid attributes are not stripped during the production build process (Vite), ensuring Cypress tests work against production-like builds.

### Preconditions

- Run `npm run build` (or equivalent Vite build command)
- Serve the production build locally

### Steps

1. Build the application for production
   **Expected:** Build completes successfully with no errors

2. Serve the built output and navigate to `/market`
   **Expected:** `[data-testid="market-page"]` exists in the rendered DOM

3. Navigate to `/player/mahomes`
   **Expected:** `[data-testid="player-detail-page"]` exists

4. Navigate to `/leaderboard`
   **Expected:** `[data-testid="leaderboard-table"]` exists

### Test Data

- Production build output

### Edge Cases

- If a Vite plugin or Babel transform strips data-testid in production, this test will fail — verify no such plugin is configured
- Check `vite.config.js` for any `react()` plugin options that might strip test attributes
