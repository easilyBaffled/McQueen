# QA Test Plans -- McQueen

## Executive Summary

McQueen is a fantasy football stock market simulator built with React 19 + Vite. Players buy/sell shares in NFL players whose prices fluctuate based on news sentiment. The app has 8 pages, a shared layout with navigation, an onboarding flow, and a toast notification system.

**Testing Objectives:**

- Verify all user-facing pages render correctly and handle interactions
- Validate portfolio trading logic (buy/sell/balance)
- Confirm scenario switching works across all pages
- Ensure data persistence via localStorage
- Test edge cases: empty states, error states, boundary values

**Key Risks:**

- Financial calculation accuracy (price, P/L, portfolio value)
- State consistency across pages when trading
- localStorage persistence and corruption handling
- Scenario switching mid-session

---

## Test Environment

- **Browsers:** Chrome (latest), Firefox (latest), Safari (latest)
- **Devices:** Desktop (1440px), Tablet (768px), Mobile (375px)
- **Dev Server:** `npm run dev` at `http://localhost:5173`
- **Scenarios:** midweek, live, playoffs (data in `src/data/`)
- **Precondition for all tests:** Clear localStorage, fresh page load unless noted

---

## Page 1: Layout and Navigation

**Route:** All pages (wraps `/` outlet)
**File:** `src/components/Layout.jsx`

### TC-NAV-001: Bottom Navigation Renders All Links

**Priority:** P0 | **Type:** Functional

1. Navigate to `/`
   **Expected:** Bottom nav shows 6 links: Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard
2. Each link has correct `href` attribute
   **Expected:** `/`, `/market`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`

### TC-NAV-002: Active Route Highlighting

**Priority:** P1 | **Type:** UI

1. Navigate to `/market`
   **Expected:** Market nav link has active styling (highlighted)
2. Navigate to `/portfolio`
   **Expected:** Portfolio link active, Market link no longer active

### TC-NAV-003: Header Shows Portfolio Value

**Priority:** P1 | **Type:** Functional

1. Load app with default state (fresh localStorage)
   **Expected:** Header displays total value = $10,000.00 (starting cash)
2. Buy shares of a player
   **Expected:** Header value updates to reflect cash + portfolio value

### TC-NAV-004: Scenario Toggle

**Priority:** P0 | **Type:** Functional

1. Click scenario toggle in header
   **Expected:** Scenario switcher is visible
2. Switch from "midweek" to "live"
   **Expected:** All pages reflect new scenario data; LiveTicker appears in header

### TC-NAV-005: Help Button Opens Glossary

**Priority:** P2 | **Type:** UI

1. Click help/glossary button
   **Expected:** Glossary modal opens with trading terms
2. Close glossary
   **Expected:** Modal dismisses, page returns to normal

### TC-NAV-006: Scroll to Top on Route Change

**Priority:** P2 | **Type:** UI

1. Scroll down on Timeline page
2. Click Market nav link
   **Expected:** Market page loads scrolled to top

---

## Page 2: Timeline (`/`)

**File:** `src/pages/Timeline.jsx`

### TC-TL-001: Timeline Loads with Events

**Priority:** P0 | **Type:** Functional

1. Navigate to `/`
   **Expected:** Timeline displays events from all players' price histories, sorted chronologically (newest first)
2. Each event shows: timestamp, player name/team/position, headline, price, change %
   **Expected:** All fields populated and formatted correctly

### TC-TL-002: Filter by Event Type

**Priority:** P1 | **Type:** Functional

1. Click "News" filter tab
   **Expected:** Only news-type events displayed
2. Click "Trades" filter tab
   **Expected:** Only trade-type events displayed
3. Click "All Events"
   **Expected:** All events restored

### TC-TL-003: Filter by Magnitude

**Priority:** P1 | **Type:** Functional

1. Select "Major (>5%)" magnitude filter
   **Expected:** Only events with |changePercent| > 5% shown
2. Select "Significant (>2%)"
   **Expected:** Only events with |changePercent| > 2% shown

### TC-TL-004: Search Players or Headlines

**Priority:** P1 | **Type:** Functional

1. Type "Mahomes" in search box
   **Expected:** Only events mentioning Mahomes displayed
2. Clear search
   **Expected:** All events restored

### TC-TL-005: Expand Event to Trade

**Priority:** P0 | **Type:** Functional

1. Click an event card
   **Expected:** Event expands to show trade widget with +/- quantity buttons and Buy/Sell buttons
2. Click same event again
   **Expected:** Event collapses

### TC-TL-006: Buy Shares from Timeline

**Priority:** P0 | **Type:** Functional

1. Expand an event, set quantity to 2, click "Buy"
   **Expected:** Toast shows success, cash decreases by (price \* 2), portfolio updates
2. Navigate to Portfolio page
   **Expected:** Newly purchased player appears in holdings

### TC-TL-007: Sell Shares from Timeline

**Priority:** P0 | **Type:** Functional

**Precondition:** Own shares of a player

1. Find that player's event, expand it, set quantity to 1, click "Sell"
   **Expected:** Toast shows success, cash increases, holdings updated

### TC-TL-008: Empty State

**Priority:** P2 | **Type:** UI

1. Apply filters that match no events (e.g., search for "ZZZZZ")
   **Expected:** Empty state message displayed

### TC-TL-009: Player Badge Navigation

**Priority:** P1 | **Type:** Functional

1. Click a player name/badge in an event
   **Expected:** Navigates to `/player/:playerId` detail page

---

## Page 3: Market (`/market`)

**File:** `src/pages/Market.jsx`

### TC-MKT-001: Market Page Loads with Player Cards

**Priority:** P0 | **Type:** Functional

1. Navigate to `/market`
   **Expected:** Grid of PlayerCard components displayed with player data from current scenario

### TC-MKT-002: Sorting Tabs

**Priority:** P1 | **Type:** Functional

1. Click "Biggest Risers"
   **Expected:** Players sorted by changePercent descending (positive first)
2. Click "Biggest Fallers"
   **Expected:** Players sorted by changePercent ascending (negative first)
3. Click "Most Active"
   **Expected:** Players sorted by absolute changePercent descending
4. Click "Highest Price"
   **Expected:** Players sorted by currentPrice descending

### TC-MKT-003: Search Filter

**Priority:** P1 | **Type:** Functional

1. Type "KC" in search box
   **Expected:** Only Kansas City players shown
2. Type "quarterback" or player name
   **Expected:** Matching players shown

### TC-MKT-004: Welcome Banner

**Priority:** P2 | **Type:** UI

1. Clear localStorage, load Market page
   **Expected:** Welcome banner visible with scenario intro
2. Dismiss banner
   **Expected:** Banner hidden
3. Reload page
   **Expected:** Banner stays hidden (localStorage persistence)

### TC-MKT-005: Click Player Card Navigates to Detail

**Priority:** P0 | **Type:** Functional

1. Click any PlayerCard
   **Expected:** Navigates to `/player/:playerId`

### TC-MKT-006: First Trade Guide

**Priority:** P2 | **Type:** UI

**Precondition:** Complete onboarding, never traded

1. Navigate to Market
   **Expected:** FirstTradeGuide overlay visible, pointing to a player
2. Click "Let's Trade!" or close
   **Expected:** Guide dismisses

### TC-MKT-007: Loading Skeleton

**Priority:** P2 | **Type:** UI

1. Load Market page (first load)
   **Expected:** Skeleton placeholders shown briefly before real cards render

### TC-MKT-008: MiniLeaderboard Sidebar

**Priority:** P1 | **Type:** Functional

1. Check right sidebar on Market page
   **Expected:** Top 3 leaderboard entries shown with rank, name, portfolio value
2. Click "View All"
   **Expected:** Navigates to `/leaderboard`

---

## Page 4: Portfolio (`/portfolio`)

**File:** `src/pages/Portfolio.jsx`

### TC-PF-001: Empty Portfolio State

**Priority:** P1 | **Type:** UI

1. Clear localStorage, navigate to `/portfolio`
   **Expected:** Empty state with animated illustration, trending player suggestions, "Browse Market" CTA

### TC-PF-002: Summary Cards Display

**Priority:** P0 | **Type:** Functional

1. Navigate to `/portfolio` with starting balance
   **Expected:**
   - Total Value = $10,000.00
   - Cash Available = $10,000.00
   - Invested = $0.00
   - Total Gain/Loss = $0.00 (0.00%)

### TC-PF-003: Summary After Trading

**Priority:** P0 | **Type:** Functional

**Precondition:** Buy 5 shares of a player at $50.00

1. Navigate to Portfolio
   **Expected:**
   - Total Value = cash + (5 \* currentPrice)
   - Cash Available = $10,000 - $250
   - Invested = 5 \* currentPrice
   - Gain/Loss = (currentPrice - 50) \* 5

### TC-PF-004: Holdings Table

**Priority:** P0 | **Type:** Functional

**Precondition:** Own shares of 2+ players

1. Navigate to Portfolio
   **Expected:** Holdings list shows each player with: name, team, position, shares, avg cost, current price, value, gain/loss ($ and %)

### TC-PF-005: Holdings Row Navigation

**Priority:** P1 | **Type:** Functional

1. Click a row in holdings table
   **Expected:** Navigates to `/player/:playerId`

### TC-PF-006: Gain/Loss Color Coding

**Priority:** P1 | **Type:** UI

1. Check holding with positive gain
   **Expected:** Green color styling
2. Check holding with negative gain
   **Expected:** Red color styling

### TC-PF-007: Trending Players in Empty State

**Priority:** P2 | **Type:** Functional

1. View empty portfolio state
   **Expected:** "Trending" section shows top movers from current scenario
2. Click a trending player
   **Expected:** Navigates to player detail page

### TC-PF-008: InfoTooltip Hovers

**Priority:** P2 | **Type:** UI

1. Hover over "Total Value" label
   **Expected:** Tooltip shows definition
2. Hover over "Avg Cost" label
   **Expected:** Tooltip shows explanation

---

## Page 5: Watchlist (`/watchlist`)

**File:** `src/pages/Watchlist.jsx`

### TC-WL-001: Empty Watchlist State

**Priority:** P1 | **Type:** UI

1. Clear localStorage, navigate to `/watchlist`
   **Expected:** Empty state with animated heart icon, "Popular Players" suggestions

### TC-WL-002: Add Player via Quick Add

**Priority:** P1 | **Type:** Functional

1. In empty state, click a "Popular Players" quick add button
   **Expected:** Player added to watchlist, card appears, toast confirms

### TC-WL-003: Remove Player from Watchlist

**Priority:** P1 | **Type:** Functional

**Precondition:** Watchlist has at least 1 player

1. Click X button on a watchlist card
   **Expected:** Player removed, card disappears, toast confirms

### TC-WL-004: Watchlist Cards Link to Detail

**Priority:** P1 | **Type:** Functional

1. Click a watchlist player card
   **Expected:** Navigates to `/player/:playerId`

### TC-WL-005: "Browse All Players" CTA

**Priority:** P2 | **Type:** Functional

1. Click "Browse All Players" in empty state
   **Expected:** Navigates to `/market`

### TC-WL-006: Watchlist Persists Across Reload

**Priority:** P1 | **Type:** Functional

1. Add 2 players to watchlist
2. Reload the page
   **Expected:** Same 2 players still in watchlist (localStorage persistence)

---

## Page 6: Leaderboard (`/leaderboard`)

**File:** `src/pages/Leaderboard.jsx`

### TC-LB-001: Leaderboard Table Renders

**Priority:** P0 | **Type:** Functional

1. Navigate to `/leaderboard`
   **Expected:** Ranked list of traders with name, portfolio value, weekly gain %

### TC-LB-002: Top 3 Medal Icons

**Priority:** P2 | **Type:** UI

1. Check top 3 rows
   **Expected:** Gold, silver, bronze medal emojis for ranks 1, 2, 3

### TC-LB-003: User Rank Card

**Priority:** P1 | **Type:** Functional

1. View leaderboard
   **Expected:** User's own rank card shown at top with current rank, portfolio value, weekly gain

### TC-LB-004: User Not in Top 10

**Priority:** P1 | **Type:** UI

1. View leaderboard with low portfolio value
   **Expected:** User row shown below main table with divider separator

### TC-LB-005: Tip Banner for New Users

**Priority:** P2 | **Type:** UI

**Precondition:** No trades made

1. View leaderboard
   **Expected:** Tip banner shown: "Start trading to climb the ranks"
2. Click "Start Trading"
   **Expected:** Navigates to `/market`

### TC-LB-006: Gain/Loss Color Coding

**Priority:** P2 | **Type:** UI

1. Check traders with positive weekly gain
   **Expected:** Green text/styling
2. Check traders with negative weekly gain
   **Expected:** Red text/styling

---

## Page 7: Mission (`/mission`)

**File:** `src/pages/Mission.jsx`, `src/components/DailyMission.jsx`

### TC-MS-001: Mission Page Loads

**Priority:** P0 | **Type:** Functional

1. Navigate to `/mission`
   **Expected:** Mission page with title, help panel, and DailyMission component

### TC-MS-002: Help Panel Toggle

**Priority:** P2 | **Type:** UI

1. First visit: help panel expanded by default
   **Expected:** "How It Works" panel visible with 3 steps and pro tip
2. Collapse help panel
   **Expected:** Panel collapses, state persisted in localStorage
3. Reload page
   **Expected:** Help panel stays collapsed

### TC-MS-003: Select Risers

**Priority:** P0 | **Type:** Functional

1. Click player buttons to select 3 risers
   **Expected:** Selected players appear in "Risers" section as chips, buttons disabled after 3

### TC-MS-004: Select Fallers

**Priority:** P0 | **Type:** Functional

1. Click player buttons to select 3 fallers
   **Expected:** Selected players appear in "Fallers" section as chips, buttons disabled after 3

### TC-MS-005: Remove Pick

**Priority:** P1 | **Type:** Functional

1. Click X on a selected chip
   **Expected:** Player removed from picks, slot opens back up

### TC-MS-006: Reveal Results

**Priority:** P0 | **Type:** Functional

**Precondition:** 3 risers + 3 fallers selected (6 total)

1. Click "Reveal Results"
   **Expected:** Results view shows score, each pick shows actual performance (correct/incorrect)

### TC-MS-007: Reveal Button Disabled Until 6 Picks

**Priority:** P1 | **Type:** Functional

1. Select only 4 picks
   **Expected:** "Reveal" button is disabled
2. Select 6 picks
   **Expected:** "Reveal" button becomes enabled

### TC-MS-008: Play Again

**Priority:** P1 | **Type:** Functional

1. After revealing results, click "Play Again"
   **Expected:** Picks cleared, back to selection view

---

## Page 8: Player Detail (`/player/:playerId`)

**File:** `src/pages/PlayerDetail.jsx`

### TC-PD-001: Player Detail Loads

**Priority:** P0 | **Type:** Functional

1. Navigate to `/player/valid-player-id`
   **Expected:** Player header (name, team, position, price, change %), chart, and trade form rendered

### TC-PD-002: Invalid Player ID

**Priority:** P1 | **Type:** Functional

1. Navigate to `/player/nonexistent-id`
   **Expected:** Error state shown ("Player not found")

### TC-PD-003: Price Chart Renders

**Priority:** P0 | **Type:** Functional

1. View player detail page
   **Expected:** Line chart shows price history with event markers (TD, INT, News, etc.)
2. Hover over chart
   **Expected:** Tooltip shows price and timestamp

### TC-PD-004: Click Event Marker on Chart

**Priority:** P1 | **Type:** Functional

1. Click a marker (star, X, etc.) on the chart
   **Expected:** EventMarkerPopup appears with event details (headline, price change)

### TC-PD-005: Buy Shares

**Priority:** P0 | **Type:** Functional

1. Select "Buy" tab, set quantity to 3
   **Expected:** Cost preview shows (price \* 3)
2. Click "Buy"
   **Expected:** Toast confirms purchase, cash decreases, holdings card appears/updates

### TC-PD-006: Buy More Than Affordable

**Priority:** P0 | **Type:** Functional

1. Set buy quantity to an amount exceeding cash balance
   **Expected:** Buy button disabled or error shown, transaction prevented

### TC-PD-007: Sell Shares

**Priority:** P0 | **Type:** Functional

**Precondition:** Own shares of this player

1. Select "Sell" tab, set quantity to 1
   **Expected:** Proceeds preview shows (price \* 1)
2. Click "Sell"
   **Expected:** Toast confirms sale, cash increases, holdings updated

### TC-PD-008: Sell More Than Owned

**Priority:** P0 | **Type:** Functional

**Precondition:** Own 2 shares

1. Set sell quantity to 5
   **Expected:** Sell button disabled or error, transaction prevented

### TC-PD-009: Sell Tab Disabled When No Holdings

**Priority:** P1 | **Type:** UI

1. View a player you do not own
   **Expected:** Sell tab or sell button is disabled

### TC-PD-010: Watchlist Toggle

**Priority:** P1 | **Type:** Functional

1. Click watchlist button (star icon) when not watching
   **Expected:** Player added to watchlist, button state changes to "watching"
2. Click again
   **Expected:** Player removed from watchlist, button state reverts

### TC-PD-011: Holdings Card

**Priority:** P1 | **Type:** Functional

**Precondition:** Own shares

1. View holdings card sidebar
   **Expected:** Shows shares, average cost, market value, P/L ($ and %)

### TC-PD-012: "Why Did This Move?" Section

**Priority:** P2 | **Type:** UI

1. View player with `moveReason`
   **Expected:** Card shows reason text
2. View player without `moveReason`
   **Expected:** Section not rendered

### TC-PD-013: Price History Timeline

**Priority:** P1 | **Type:** Functional

1. Scroll to price history section
   **Expected:** Chronological list of price changes with badges, headlines, and price diffs

### TC-PD-014: Content Tiles / External Links

**Priority:** P2 | **Type:** Functional

1. View player with content tiles
   **Expected:** Article/video tiles shown with source and title
2. Click a tile
   **Expected:** Opens external URL

### TC-PD-015: League Owners Section

**Priority:** P2 | **Type:** Functional

1. View player owned by league members
   **Expected:** League owners list shows member names, avatars, and gain/loss %

### TC-PD-016: Back Button Navigation

**Priority:** P1 | **Type:** Functional

1. Click back button on player detail
   **Expected:** Returns to previous page

### TC-PD-017: Player Headshot with Fallback

**Priority:** P2 | **Type:** UI

1. View player with valid headshot
   **Expected:** Image rendered
2. View player with broken/missing image
   **Expected:** Placeholder SVG icon shown

---

## Page 9: Scenario Inspector (`/inspector`)

**File:** `src/pages/ScenarioInspector.jsx`

### TC-SI-001: Inspector Loads

**Priority:** P1 | **Type:** Functional

1. Navigate to `/inspector`
   **Expected:** Split-pane view with JSON editor (left) and formatted view (right)

### TC-SI-002: Scenario Selection

**Priority:** P1 | **Type:** Functional

1. Select "midweek" scenario
   **Expected:** JSON and formatted view update with midweek data
2. Select "live" scenario
   **Expected:** Data updates to live scenario

### TC-SI-003: View Mode Toggle

**Priority:** P1 | **Type:** Functional

1. Click "Full Scenario"
   **Expected:** Shows metadata + all players
2. Click "Single Player"
   **Expected:** Dropdown appears, shows selected player detail
3. Click "Timeline"
   **Expected:** Shows unified timeline with event stats

### TC-SI-004: JSON Editing

**Priority:** P1 | **Type:** Functional

1. Edit JSON text in editor
   **Expected:** Formatted view updates in real-time
2. Enter invalid JSON
   **Expected:** Error message shown, formatted view unchanged

### TC-SI-005: Save Scenario

**Priority:** P0 | **Type:** Functional

**Precondition:** Dev server running

1. Make an edit and click Save
   **Expected:** Saving overlay shown, then success toast; file saved to `src/data/`

### TC-SI-006: Add Event Modal

**Priority:** P1 | **Type:** Functional

1. Click "Add Event" button
   **Expected:** Modal opens with player selection and event fields
2. Fill in event details and submit
   **Expected:** Event added to scenario JSON, formatted view updated

### TC-SI-007: Copy to Clipboard

**Priority:** P2 | **Type:** Functional

1. Click copy button on a template/entry
   **Expected:** Content copied to clipboard, confirmation shown

### TC-SI-008: Panel Divider Drag

**Priority:** P2 | **Type:** UI

1. Drag divider between editor and formatted view
   **Expected:** Panels resize proportionally

---

## Cross-Cutting: Onboarding

**File:** `src/components/Onboarding.jsx`

### TC-OB-001: Onboarding Shows for New Users

**Priority:** P0 | **Type:** Functional

1. Clear localStorage, load app
   **Expected:** Onboarding modal appears with Step 1

### TC-OB-002: Step Progression

**Priority:** P0 | **Type:** Functional

1. Click "Next" through all 6 steps
   **Expected:** Each step shows correct content/icon, step indicators update

### TC-OB-003: Back Button

**Priority:** P1 | **Type:** Functional

1. Advance to Step 3, click "Back"
   **Expected:** Returns to Step 2
2. On Step 1
   **Expected:** Back button not visible

### TC-OB-004: Skip Onboarding

**Priority:** P1 | **Type:** Functional

1. Click "Skip" at any step
   **Expected:** Onboarding dismissed, localStorage set to `mcqueen-onboarded: true`

### TC-OB-005: Does Not Show Again

**Priority:** P1 | **Type:** Functional

1. Complete onboarding, reload page
   **Expected:** Onboarding does not appear

---

## Cross-Cutting: Playoff Announcement Modal

**File:** `src/components/PlayoffAnnouncementModal.jsx`

### TC-PO-001: Modal Shows in Playoffs Scenario

**Priority:** P0 | **Type:** Functional

1. Switch to "playoffs" scenario (fresh, dilution not applied)
   **Expected:** Two-step modal appears: Step 1 = Buyback, Step 2 = Dilution

### TC-PO-002: Step Progression and Dilution

**Priority:** P0 | **Type:** Functional

1. View Step 1 (Buyback): shows eliminated players
2. Click "Continue" to Step 2 (Dilution): shows playoff players with dilution impact
3. Click "Got It"
   **Expected:** Modal closes, `playoffDilutionApplied` set to true, prices adjusted

### TC-PO-003: Does Not Show If Already Applied

**Priority:** P1 | **Type:** Functional

1. Switch to playoffs after dilution was already applied
   **Expected:** Modal does not appear

---

## Cross-Cutting: Toast Notifications

### TC-TOAST-001: Success Toast

**Priority:** P1 | **Type:** UI

1. Perform a successful action (buy shares)
   **Expected:** Green success toast appears with message, auto-dismisses after ~3 seconds

### TC-TOAST-002: Error Toast

**Priority:** P1 | **Type:** UI

1. Trigger an error condition
   **Expected:** Red error toast appears with message

### TC-TOAST-003: Dismiss Toast Manually

**Priority:** P2 | **Type:** UI

1. Click close button on toast
   **Expected:** Toast dismisses immediately

---

## Test Case Summary

| Section             | P0     | P1     | P2     | Total  |
| ------------------- | ------ | ------ | ------ | ------ |
| Layout/Navigation   | 2      | 2      | 2      | 6      |
| Timeline            | 4      | 3      | 2      | 9      |
| Market              | 2      | 3      | 3      | 8      |
| Portfolio           | 3      | 3      | 2      | 8      |
| Watchlist           | 0      | 4      | 2      | 6      |
| Leaderboard         | 1      | 2      | 3      | 6      |
| Mission             | 4      | 3      | 1      | 8      |
| Player Detail       | 5      | 6      | 6      | 17     |
| Scenario Inspector  | 1      | 5      | 2      | 8      |
| Onboarding          | 2      | 3      | 0      | 5      |
| Playoff Modal       | 2      | 1      | 0      | 3      |
| Toast Notifications | 0      | 2      | 1      | 3      |
| **Totals**          | **26** | **37** | **24** | **87** |

---

## Entry Criteria

- [ ] Dev server running (`npm run dev`)
- [ ] localStorage cleared for fresh-state tests
- [ ] All 3 scenario JSON files present in `src/data/`
- [ ] Node 20.x environment

## Exit Criteria

- [ ] All P0 test cases executed and passed
- [ ] 90%+ P1 test cases passed
- [ ] No critical or high-severity bugs open
- [ ] Trading math verified across buy/sell/portfolio flows

## Risk Assessment

| Risk                                 | Probability | Impact | Mitigation                                  |
| ------------------------------------ | ----------- | ------ | ------------------------------------------- |
| Calculation errors in portfolio P/L  | Medium      | High   | Dedicated P0 tests for trading math         |
| localStorage corruption              | Low         | High   | Test clearing and reloading states          |
| Scenario switching breaks page state | Medium      | Medium | Test switching mid-interaction              |
| Missing/malformed player data        | Low         | Medium | Test with invalid player IDs and empty data |
