# Test Plan: mcq-8hr -- Double Test Coverage

## Summary

- **Bead:** `mcq-8hr`
- **Feature:** Double Vitest line coverage from ~50% to 80%+ and Cypress line coverage from ~38% to 75%+ via shared helpers, new unit tests, data-testid attributes, and Cypress selector migration
- **Total Test Cases:** 42
- **Test Types:** Functional, Integration, Regression

---

## TC-001: renderWithProviders helper exports and wraps components

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/test/renderWithProviders.tsx` exists and its `renderWithProviders()` function correctly wraps a component in all required context providers (ScenarioContext, TradingContext, SocialContext, ToastContext) so tests can render components without boilerplate.

### Preconditions

- `src/test/renderWithProviders.tsx` has been created
- All context providers exist and are importable

### Steps

1. Import `renderWithProviders` from `src/test/renderWithProviders.tsx`
   **Expected:** Import succeeds without error

2. Call `renderWithProviders(<div data-testid="child" />)` with no custom provider overrides
   **Expected:** The child element renders and is findable via `screen.getByTestId('child')`

3. Call `renderWithProviders` with a component that reads from `useScenario()`
   **Expected:** Component renders without "missing provider" errors, receives default mock scenario data

4. Call `renderWithProviders` with a component that reads from `useTrading()`
   **Expected:** Component receives default mock trading data (cash balance, holdings, buy/sell functions)

5. Call `renderWithProviders` with a component that reads from `useSocial()`
   **Expected:** Component receives default mock social data (leaderboard rankings, watchlist)

### Test Data

- Minimal React component that consumes each context
- Default mock values for each provider

### Edge Cases

- Passing custom provider overrides (e.g., `{ tradingOverrides: { cash: 0 } }`) applies them correctly
- Passing `null` for optional contexts does not crash

---

## TC-002: mockData exports reusable fixture objects

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/test/mockData.ts` exports `mockPlayer`, `mockPlayers`, `mockPortfolio`, and `mockLeaderboardRankings` with correct shapes matching the app's TypeScript types.

### Preconditions

- `src/test/mockData.ts` has been created
- App type definitions exist in `src/types/`

### Steps

1. Import `mockPlayer` from `src/test/mockData.ts`
   **Expected:** Object has required fields: `id`, `name`, `team`, `position`, `price`, `change`, `changePercent`, `history`

2. Import `mockPlayers` from `src/test/mockData.ts`
   **Expected:** Array of at least 3 player objects, each matching the Player type

3. Import `mockPortfolio` from `src/test/mockData.ts`
   **Expected:** Object with `holdings` array, `cash` number, and `totalValue` number

4. Import `mockLeaderboardRankings` from `src/test/mockData.ts`
   **Expected:** Array of ranking objects with `rank`, `name`, `totalValue`, `gainPercent`

### Test Data

- N/A (the module itself is the test data)

### Edge Cases

- `mockPlayers` includes at least one player with negative `change` (faller) and one with positive `change` (riser)
- `mockPortfolio.holdings` includes at least one holding entry

---

## TC-003: Existing tests pass after helper refactor

**Priority:** P0
**Type:** Regression

### Objective

Verify that all 617+ existing Vitest tests still pass after the shared test helpers are created and at least one existing test is refactored to use `renderWithProviders`.

### Preconditions

- Shared helpers created (TC-001, TC-002)
- At least one existing test (e.g., `Leaderboard.test.tsx` or `PlayerCard.test.tsx`) refactored to use `renderWithProviders`

### Steps

1. Run `npm run test:run`
   **Expected:** All tests pass with 0 failures; total test count >= 617

### Test Data

- None (uses existing test suite)

### Edge Cases

- No import path breakage from the new `src/test/` module
- Refactored test produces identical assertions as the original

---

## TC-004: Market page — player grid rendering

**Priority:** P0
**Type:** Functional

### Objective

Verify that `Market.tsx` renders a grid of player cards when scenario data is available.

### Preconditions

- `src/pages/Market/__tests__/Market.test.tsx` created
- `useScenario` and `useTrading` mocked to return `mockPlayers`
- `PlayerCard`, `MiniLeaderboard`, `FirstTradeGuide`, `framer-motion` mocked

### Steps

1. Render `<Market />` with `mockPlayers` (5 players)
   **Expected:** 5 `PlayerCard` components rendered inside a players-grid container

2. Render `<Market />` with empty players array
   **Expected:** No player cards rendered; grid container may be empty or show a fallback

### Test Data

- `mockPlayers` from shared test data (5 entries)
- Empty array `[]`

### Edge Cases

- Single player in array renders exactly 1 card
- Players with missing optional fields (e.g., no `moveReason`) render without error

---

## TC-005: Market page — sort tab switching (4 modes)

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking each of the 4 sort tabs (Biggest Risers, Biggest Fallers, Most Active, Highest Price) updates the active tab and reorders the player grid.

### Preconditions

- Market test file with mocked players having varied `change`, `volume`, and `price` values

### Steps

1. Render Market page; check default active tab
   **Expected:** "Biggest Risers" tab has active styling

2. Click "Biggest Fallers" tab
   **Expected:** Tab becomes active; first visible player card has the most negative change

3. Click "Most Active" tab
   **Expected:** Tab becomes active; players sorted by volume descending

4. Click "Highest Price" tab
   **Expected:** Tab becomes active; players sorted by price descending

### Test Data

- Players: A (change: +15, volume: 100, price: 50), B (change: -10, volume: 500, price: 80), C (change: +5, volume: 200, price: 120)

### Edge Cases

- Clicking the already-active tab does not change order or cause re-render issues
- All players having the same value for a sort field produces a stable order

---

## TC-006: Market page — search filtering

**Priority:** P0
**Type:** Functional

### Objective

Verify the search input filters players by partial, case-insensitive name match.

### Preconditions

- Market test with mocked players: "Patrick Mahomes", "Tyreek Hill", "Travis Kelce"

### Steps

1. Type "mah" into the search input
   **Expected:** Only "Patrick Mahomes" card visible

2. Type "HILL" into the search input
   **Expected:** Only "Tyreek Hill" card visible (case-insensitive match)

3. Type "xyz_no_match" into the search input
   **Expected:** No player cards rendered

4. Clear the search input
   **Expected:** All player cards visible again

### Test Data

- 3 mock players with distinct names

### Edge Cases

- Single-character search returns all partial matches
- Search with leading/trailing spaces still matches

---

## TC-007: Market page — welcome banner dismiss with localStorage

**Priority:** P1
**Type:** Functional

### Objective

Verify the welcome banner appears for new users and persists dismissal in localStorage.

### Preconditions

- localStorage `mcqueen-welcome-dismissed` is not set

### Steps

1. Render Market page with no dismiss flag in localStorage
   **Expected:** Welcome banner is visible

2. Click the dismiss button on the banner
   **Expected:** Banner disappears from DOM; `localStorage.getItem('mcqueen-welcome-dismissed')` returns `'true'`

3. Re-render Market page (simulating page reload) with the dismiss flag set
   **Expected:** Welcome banner is not rendered

### Test Data

- Mock localStorage

### Edge Cases

- Banner does not reappear after navigation away and back

---

## TC-008: Market page — loading skeleton state

**Priority:** P1
**Type:** Functional

### Objective

Verify Market page shows a loading skeleton before player data resolves.

### Preconditions

- Mock scenario context initially returns loading state

### Steps

1. Render Market with loading state
   **Expected:** Skeleton loader elements visible, no player cards

2. Resolve player data
   **Expected:** Skeleton replaced by player grid

### Test Data

- Delayed mock resolution for player data

### Edge Cases

- N/A

---

## TC-009: Watchlist page — empty state rendering

**Priority:** P0
**Type:** Functional

### Objective

Verify Watchlist shows the empty state illustration and "Track Your Favorites" message when the watchlist is empty.

### Preconditions

- `src/pages/Watchlist/__tests__/Watchlist.test.tsx` created
- `useTrading` mocked with empty watchlist

### Steps

1. Render `<Watchlist />` with empty watchlist
   **Expected:** Empty state container visible with "Track Your Favorites" text and illustration

2. Verify "Browse All Players" link is present
   **Expected:** Link with `href="/market"` exists

### Test Data

- Empty watchlist array

### Edge Cases

- N/A

---

## TC-010: Watchlist page — quick-add popular players

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking a quick-add button adds that player to the watchlist and triggers a toast notification.

### Preconditions

- Watchlist test with mocked `addToWatchlist` and `useToast`

### Steps

1. Render Watchlist in empty state; click the first quick-add player button
   **Expected:** `addToWatchlist` called with correct player ID; success toast triggered

2. After adding, verify grid replaces empty state
   **Expected:** Watchlist grid visible with 1 player card

### Test Data

- Quick-add player suggestions from mock data

### Edge Cases

- Adding a player that is already on the watchlist is a no-op or shows an informational toast

---

## TC-011: Watchlist page — remove from watchlist with toast

**Priority:** P0
**Type:** Functional

### Objective

Verify removing a player from the watchlist removes the card and shows a toast.

### Preconditions

- Watchlist rendered with 1 player on the list

### Steps

1. Click the remove button on a watchlist card
   **Expected:** `removeFromWatchlist` called; toast notification shown; watchlist reverts to empty state if last player removed

### Test Data

- Single-player watchlist

### Edge Cases

- Removing the last player shows empty state again
- Removing from a multi-player list updates count correctly

---

## TC-012: Watchlist page — grid rendering and navigation

**Priority:** P1
**Type:** Functional

### Objective

Verify watchlist grid renders player cards and card links navigate to player detail.

### Preconditions

- Watchlist with 3 players

### Steps

1. Render watchlist with 3 players
   **Expected:** 3 player cards visible in the watchlist grid

2. Verify each card has a link to `/player/{id}`
   **Expected:** Anchor tags with correct href present

### Test Data

- 3 mock players on watchlist

### Edge Cases

- N/A

---

## TC-013: Mission page — page rendering with DailyMission

**Priority:** P0
**Type:** Functional

### Objective

Verify Mission page renders with "Daily Predictions" title and embeds the DailyMission component.

### Preconditions

- `src/pages/Mission/__tests__/Mission.test.tsx` created
- `DailyMission` component mocked

### Steps

1. Render `<Mission />`
   **Expected:** Page renders with "Daily Predictions" heading; mocked DailyMission present

### Test Data

- None

### Edge Cases

- N/A

---

## TC-014: Mission page — help panel toggle with localStorage

**Priority:** P0
**Type:** Functional

### Objective

Verify the help panel opens/closes on toggle click and persists the "seen" state in localStorage.

### Preconditions

- localStorage `mcqueen-mission-help-seen` not set

### Steps

1. Render Mission page; click the help toggle button
   **Expected:** Help panel becomes visible with instructional content ("Pick Your Predictions")

2. Click the help toggle again
   **Expected:** Help panel closes (not in DOM)

3. Verify localStorage
   **Expected:** `mcqueen-mission-help-seen` is set to `'true'`

4. Re-render with the flag set
   **Expected:** Help panel is initially hidden

### Test Data

- Mock localStorage

### Edge Cases

- Help panel defaults to visible on first-ever visit (when localStorage key absent)

---

## TC-015: Onboarding — 6-step wizard navigation

**Priority:** P0
**Type:** Functional

### Objective

Verify the onboarding wizard progresses through all 6 steps via the Next button.

### Preconditions

- `src/components/Onboarding/__tests__/Onboarding.test.tsx` created
- `framer-motion` mocked
- localStorage `mcqueen-onboarded` not set

### Steps

1. Render `<Onboarding />` (not yet onboarded)
   **Expected:** Overlay and modal visible; step 0 content shown

2. Click "Next" 5 times
   **Expected:** Content updates for each step (steps 1-5); step indicators update

3. Click "Next" on the final step (step 5)
   **Expected:** Onboarding closes; `localStorage.getItem('mcqueen-onboarded')` returns `'true'`

### Test Data

- Unset `mcqueen-onboarded`

### Edge Cases

- Rapid double-click on Next does not skip a step or crash

---

## TC-016: Onboarding — back button navigation

**Priority:** P1
**Type:** Functional

### Objective

Verify the Back button navigates to the previous step and is hidden on step 0.

### Preconditions

- Onboarding test at step 0

### Steps

1. On step 0, check for back button
   **Expected:** Back button is not rendered

2. Click Next to go to step 1; click Back
   **Expected:** Returns to step 0; back button disappears again

3. Navigate to step 3; click Back
   **Expected:** Returns to step 2; step indicator reflects step 2

### Test Data

- None

### Edge Cases

- N/A

---

## TC-017: Onboarding — skip button closes modal

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking "Skip" closes the onboarding and persists completion in localStorage.

### Preconditions

- Onboarding open at any step

### Steps

1. Click the "Skip" button
   **Expected:** Overlay and modal removed from DOM; `localStorage.getItem('mcqueen-onboarded')` is `'true'`

### Test Data

- None

### Edge Cases

- Skip from step 0 and skip from step 3 both produce the same result

---

## TC-018: Onboarding — Escape key closes modal

**Priority:** P1
**Type:** Functional

### Objective

Verify pressing the Escape key closes the onboarding modal.

### Preconditions

- Onboarding modal open

### Steps

1. Press the Escape key
   **Expected:** Onboarding overlay closes; `mcqueen-onboarded` set in localStorage

### Test Data

- Keyboard event: `{ key: 'Escape' }`

### Edge Cases

- Pressing Escape when modal is already closed is a no-op

---

## TC-019: Onboarding — step indicators update

**Priority:** P1
**Type:** Functional

### Objective

Verify the step dot indicators reflect the current step.

### Preconditions

- Onboarding open

### Steps

1. On step 0, check step dots
   **Expected:** 6 dots rendered; first dot has active styling

2. Navigate to step 3
   **Expected:** Fourth dot has active styling; others do not

### Test Data

- None

### Edge Cases

- N/A

---

## TC-020: Onboarding — custom event on completion

**Priority:** P1
**Type:** Functional

### Objective

Verify that completing onboarding (via Next on final step) dispatches the `mcqueen-onboarding-complete` custom event.

### Preconditions

- Event listener attached to `window` for `mcqueen-onboarding-complete`

### Steps

1. Complete all 6 steps
   **Expected:** Custom event `mcqueen-onboarding-complete` fired on window

### Test Data

- Spy/mock on `window.dispatchEvent`

### Edge Cases

- Skipping onboarding may or may not fire the event (verify actual behavior)

---

## TC-021: Onboarding — does not render when already onboarded

**Priority:** P0
**Type:** Regression

### Objective

Verify onboarding does not display if `mcqueen-onboarded` is already set in localStorage.

### Preconditions

- `localStorage.setItem('mcqueen-onboarded', 'true')` before render

### Steps

1. Render `<Onboarding />`
   **Expected:** No overlay or modal in the DOM

### Test Data

- Pre-set localStorage flag

### Edge Cases

- N/A

---

## TC-022: DailyMission — pick selection for risers column

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking the "up" selector button on a player adds them to the risers picks column.

### Preconditions

- `src/components/DailyMission/__tests__/DailyMission.test.tsx` created
- `useTrading` and `useSocial` mocked with player data

### Steps

1. Render DailyMission; click the up button on 3 different players
   **Expected:** Risers column shows 3 non-empty pick chips with player names

2. Click up on a 4th player
   **Expected:** Risers column capped at 3; 4th click is rejected or replaces oldest

### Test Data

- `mockPlayers` with at least 6 players

### Edge Cases

- Clicking up on a player already picked as a riser deselects them
- Clicking up on a player already picked as a faller moves them to risers

---

## TC-023: DailyMission — pick selection for fallers column

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking the "down" selector button adds players to the fallers picks column.

### Preconditions

- DailyMission rendered with player data

### Steps

1. Click down button on 3 different players
   **Expected:** Fallers column shows 3 non-empty pick chips

### Test Data

- `mockPlayers`

### Edge Cases

- Same player cannot appear in both risers and fallers simultaneously

---

## TC-024: DailyMission — reveal results

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking the reveal button after selecting 6 picks (3 risers + 3 fallers) shows the results panel with a score.

### Preconditions

- 6 picks made (3 up, 3 down)

### Steps

1. Click the reveal button
   **Expected:** Results panel visible; score displayed as a number; player selector hidden or replaced

### Test Data

- Pre-selected 6 picks

### Edge Cases

- N/A

---

## TC-025: DailyMission — reveal button disabled until 6 picks

**Priority:** P0
**Type:** Functional

### Objective

Verify the reveal button is disabled when fewer than 6 total picks are made.

### Preconditions

- DailyMission rendered with 0 picks

### Steps

1. Check reveal button with 0 picks
   **Expected:** Button is disabled

2. Add 2 risers and 1 faller (3 total)
   **Expected:** Button still disabled

3. Add 1 more riser and 2 more fallers (6 total)
   **Expected:** Button enabled

### Test Data

- None

### Edge Cases

- Removing a pick after reaching 6 disables the button again

---

## TC-026: DailyMission — reset mission

**Priority:** P1
**Type:** Functional

### Objective

Verify the reset/Play Again button clears results and returns to the player selector.

### Preconditions

- Results revealed after 6 picks

### Steps

1. Click the reset button
   **Expected:** Results panel removed; player selector visible; all pick chips empty; reveal button disabled

### Test Data

- None

### Edge Cases

- N/A

---

## TC-027: DailyMission — score calculation and display

**Priority:** P1
**Type:** Functional

### Objective

Verify the score is calculated correctly based on pick accuracy and displayed prominently.

### Preconditions

- Mock player data with known price changes after reveal

### Steps

1. Pick 3 risers whose prices did rise and 3 fallers whose prices did fall
   **Expected:** Score reflects 6/6 correct picks

2. Pick 3 risers whose prices actually fell
   **Expected:** Score reflects 0/3 correct for risers portion

### Test Data

- Players with predetermined `change` values for scoring

### Edge Cases

- All picks wrong yields minimum score
- All picks correct yields maximum score

---

## TC-028: PlayoffAnnouncementModal — show and dismiss with localStorage

**Priority:** P1
**Type:** Functional

### Objective

Verify the playoff modal displays on first visit and persists dismissal in localStorage.

### Preconditions

- `src/components/PlayoffAnnouncementModal/__tests__/PlayoffAnnouncementModal.test.tsx` created
- localStorage dismiss key not set

### Steps

1. Render the modal (no dismiss flag)
   **Expected:** Modal visible with playoff announcement content

2. Dismiss the modal (close button or click)
   **Expected:** Modal removed from DOM; localStorage key set

3. Re-render with flag set
   **Expected:** Modal does not appear

### Test Data

- Mock localStorage

### Edge Cases

- N/A

---

## TC-029: MiniLeaderboard — top-3 medals and user position

**Priority:** P1
**Type:** Functional

### Objective

Verify MiniLeaderboard renders top 3 entries with medal indicators and highlights the user's position.

### Preconditions

- `src/components/MiniLeaderboard/__tests__/MiniLeaderboard.test.tsx` created
- Mock leaderboard rankings with 10+ entries

### Steps

1. Render with `mockLeaderboardRankings`
   **Expected:** Top 3 rows show gold/silver/bronze medal indicators

2. Verify user position is highlighted
   **Expected:** Row containing "You" has distinct styling

3. Verify gap calculation
   **Expected:** Gap to next rank displayed correctly

### Test Data

- `mockLeaderboardRankings` with user at rank 7

### Edge Cases

- User is rank 1 (no gap to show)
- Empty leaderboard shows fallback/empty state

---

## TC-030: LiveTicker — conditional render for live scenario only

**Priority:** P1
**Type:** Functional

### Objective

Verify LiveTicker only renders when the active scenario is "live" and shows event data.

### Preconditions

- `src/components/LiveTicker/__tests__/LiveTicker.test.tsx` created

### Steps

1. Render with scenario set to "live"
   **Expected:** Ticker visible with at least one event

2. Render with scenario set to "midweek"
   **Expected:** Ticker not rendered

3. Render with scenario "live" but no events
   **Expected:** Ticker falls back to history display

### Test Data

- Mock scenario context switching between "live" and "midweek"
- Empty events array for fallback case

### Edge Cases

- Scenario changes from "midweek" to "live" at runtime triggers ticker appearance

---

## TC-031: Portfolio — expand coverage for holdings list and summary cards

**Priority:** P1
**Type:** Functional

### Objective

Expand Portfolio.tsx coverage from ~33% to 80%+ by testing holdings list, summary cards, empty state, and trade navigation.

### Preconditions

- Existing Portfolio tests expanded or new test file augmented

### Steps

1. Render Portfolio with 3 holdings
   **Expected:** Holdings list renders 3 rows with player name, shares, cost, value, and gain

2. Render Portfolio with 0 additional holdings (only scenario starters)
   **Expected:** Starting holdings from scenario data shown

3. Verify 4 summary cards (Total Value, Cash, Holdings Value, P/L)
   **Expected:** Each card has a label and a dollar-formatted value

4. Click a holding row
   **Expected:** Navigation to `/player/{id}` triggered

### Test Data

- `mockPortfolio` with 3 holdings at known values

### Edge Cases

- Holding with negative gain shows loss styling
- Holding with 0 shares (sold all) does not appear in list

---

## TC-032: PlayerDetail — expand coverage for buy/sell flows

**Priority:** P1
**Type:** Functional

### Objective

Expand PlayerDetail.tsx coverage from ~47% to 75%+ by testing buy/sell flows, quantity validation, watchlist toggle, and error state.

### Preconditions

- Existing PlayerDetail tests expanded

### Steps

1. Render PlayerDetail for a valid player; click Buy
   **Expected:** Trade executes; holdings card appears; toast shown

2. Enter quantity 0 in the form input; click Buy
   **Expected:** Buy rejected or button disabled for invalid quantity

3. Enter quantity exceeding cash balance; click Buy
   **Expected:** Error toast shown; trade does not execute

4. Switch to Sell tab; sell shares
   **Expected:** Sell executes; holdings updated; toast shown

5. Sell tab is disabled when user owns 0 shares
   **Expected:** Sell tab has disabled attribute

6. Toggle watchlist button
   **Expected:** Text toggles between "Add to Watchlist" and "Watching"

7. Render with invalid/nonexistent player ID
   **Expected:** Error state visible with "Player Not Found"

### Test Data

- Valid player from `mockPlayers`; nonexistent player ID "invalid-xyz"

### Edge Cases

- Selling more shares than owned is prevented
- Buying exactly the amount affordable succeeds

---

## TC-033: ScenarioToggle — switching and active state

**Priority:** P2
**Type:** Functional

### Objective

Expand ScenarioToggle coverage from ~48% to 80%+ by testing scenario switching and active indicator.

### Preconditions

- ScenarioToggle test with mocked `useScenario`

### Steps

1. Render with "midweek" as active scenario
   **Expected:** Midweek option has active styling

2. Click "live" option
   **Expected:** `setScenario('live')` called; active styling moves to live

3. Click "playoffs" option
   **Expected:** `setScenario('playoffs')` called; active styling moves to playoffs

### Test Data

- Three scenario options: midweek, live, playoffs

### Edge Cases

- Clicking the already-active scenario is a no-op

---

## TC-034: Glossary — open/close and search

**Priority:** P2
**Type:** Functional

### Objective

Expand Glossary coverage from ~48% to 80%+ by testing modal open/close and term search.

### Preconditions

- Glossary test with term data

### Steps

1. Open glossary modal
   **Expected:** Modal visible with list of trading terms

2. Type a search term (e.g., "bull")
   **Expected:** List filters to matching terms

3. Clear search
   **Expected:** All terms visible again

4. Close modal (Escape or close button)
   **Expected:** Modal removed from DOM

### Test Data

- Glossary terms fixture

### Edge Cases

- Search with no matches shows empty/no-results state

---

## TC-035: SkeletonLoader — all variants render

**Priority:** P2
**Type:** Functional

### Objective

Expand SkeletonLoader coverage from ~11% to 80%+ by testing all skeleton variants.

### Preconditions

- SkeletonLoader test

### Steps

1. Render `<SkeletonLoader variant="card" />`
   **Expected:** Card-shaped skeleton with animation class

2. Render `<SkeletonLoader variant="text" />`
   **Expected:** Text-line skeleton

3. Render `<SkeletonLoader variant="chart" />`
   **Expected:** Chart-area skeleton

4. Render with `count={3}`
   **Expected:** 3 skeleton elements rendered

### Test Data

- Each variant string

### Edge Cases

- Invalid variant prop uses a default fallback
- `count={0}` renders nothing

---

## TC-036: InfoTooltip — hover behavior

**Priority:** P2
**Type:** Functional

### Objective

Expand InfoTooltip coverage from ~45% to 80%+ by testing hover show/hide.

### Preconditions

- InfoTooltip test

### Steps

1. Render `<InfoTooltip content="Help text" />`
   **Expected:** Tooltip trigger icon visible; tooltip content hidden

2. Hover over the trigger
   **Expected:** Tooltip content "Help text" becomes visible

3. Move mouse away
   **Expected:** Tooltip content hidden

### Test Data

- Tooltip content string

### Edge Cases

- Very long tooltip text does not break layout
- Tooltip with HTML/JSX content renders correctly

---

## TC-037: data-testid attributes — all 59 attributes present across ~20 components

**Priority:** P0
**Type:** Regression

### Objective

Verify all 59 `data-testid` attributes have been added to the correct elements in the source components, and that the build and existing tests are not broken.

### Preconditions

- All data-testid attributes added per the bead description

### Steps

1. Run `npm run build`
   **Expected:** Build succeeds with 0 errors

2. Run `npm run test:run`
   **Expected:** All 617+ Vitest tests still pass

3. Grep source files for each required `data-testid` value (spot check per component):
   - Market.tsx: `players-grid`, `sort-tab`, `search-input`, `welcome-banner`, `welcome-dismiss`, `market-page`, `market-sidebar`
   - PlayerDetail.tsx: `player-detail-page`, `player-name`, `player-price`, `price-change`, `chart-card`, `trading-card`, `error-state`, `chart-container`, `trading-tab`, `order-total`, `trade-button-buy`, `holdings-card`, `form-input`
   - Timeline.tsx: `timeline-event`, `timeline-event-content`, `filter-select`, `search-input`, `timeline-track`
   - Watchlist.tsx: `empty-state`, `quick-add-player`, `watchlist-grid`, `remove-button`, `watchlist-card-wrapper`, `watchlist-button`
   - Portfolio.tsx: `holdings-list`, `holding-row`, `portfolio-summary`, `summary-card`, `summary-label`, `summary-value`, `trade-button-buy`
   - Mission.tsx: `mission-page`, `help-toggle`, `mission-help`
   - DailyMission.tsx: `daily-mission`, `selector-btn-up`, `selector-btn-down`, `picks-column-risers`, `picks-column-fallers`, `pick-chip`, `reveal-button`, `mission-results`, `reset-button`, `player-selector`
   - Onboarding.tsx: `onboarding-overlay`, `onboarding-modal`, `next-button`, `back-button`, `step-dot`, `skip-button`
   - PlayerCard.tsx: `player-card`
   - Toast.tsx / ToastProvider.tsx: `toast`, `toast-success`, `toast-close`
   **Expected:** Each `data-testid` found in the correct component file

### Test Data

- N/A

### Edge Cases

- `data-testid` on dynamically rendered elements (e.g., within `.map()`) correctly applied to each instance

---

## TC-038: Cypress selector migration — commands.js getPlayerCards

**Priority:** P0
**Type:** Regression

### Objective

Verify `cypress/support/commands.js` `getPlayerCards()` command uses `[data-testid="player-card"]` instead of `.player-card`.

### Preconditions

- `commands.js` updated

### Steps

1. Inspect `getPlayerCards` command source
   **Expected:** Uses `cy.get('[data-testid="player-card"]')`

2. Run any Cypress spec that calls `cy.getPlayerCards()`
   **Expected:** Player cards found via the new selector

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-039: Cypress selector migration — all 10 spec files updated

**Priority:** P0
**Type:** Regression

### Objective

Verify all Cypress spec files replace every `.class-name` selector with the corresponding `[data-testid="..."]` selector.

### Preconditions

- All 10 spec files + `commands.js` updated

### Steps

1. Grep all `cypress/e2e/*.cy.js` files for `.class-name` CSS selectors (e.g., `.players-grid`, `.sort-tab`, `.player-card`, `.daily-mission`, etc.)
   **Expected:** Zero remaining CSS class selectors for elements that have been migrated to data-testid

2. Verify each file uses `[data-testid="..."]` pattern:
   - `market.cy.js`: 8 selectors migrated (players-grid, sort-tab, search-input, welcome-banner, welcome-dismiss, market-page, market-sidebar, player-detail-page)
   - `player-detail.cy.js`: 14 selectors migrated
   - `timeline.cy.js`: 5 selectors migrated
   - `watchlist.cy.js`: 7 selectors migrated
   - `portfolio.cy.js`: 8 selectors migrated
   - `mission.cy.js`: 13 selectors migrated
   - `onboarding.cy.js`: 6 selectors migrated
   - `toasts.cy.js`: 6 selectors migrated
   - `leaderboard.cy.js`: ~3 selectors migrated
   - `navigation.cy.js`: ~2 selectors migrated
   **Expected:** All selector counts match expected migration counts

### Test Data

- N/A

### Edge Cases

- Selectors using `[class*="..."]` pattern (e.g., in leaderboard.cy.js) are also migrated to data-testid
- Compound selectors like `.trade-button.buy` become `[data-testid="trade-button-buy"]`

---

## TC-040: Cypress E2E — at least 70 of 80 tests pass post-migration

**Priority:** P0
**Type:** Integration

### Objective

Verify the migrated Cypress test suite achieves at least 70/80 passing tests when run against the instrumented app.

### Preconditions

- All data-testid attributes added to components (TC-037)
- All Cypress selectors migrated (TC-039)
- App running at `http://localhost:5173` with `CYPRESS_COVERAGE=true`

### Steps

1. Run `npm run cy:run`
   **Expected:** At least 70 tests pass; no more than 10 failures

2. Review any failing tests
   **Expected:** Failures are documented with specific selector or timing issues, not wholesale breakage

### Test Data

- Full app with scenario data

### Edge Cases

- Flaky timeout-based tests may need `{ timeout: 10000 }` adjustments
- Tests relying on animation completion may need `framer-motion` to be disabled in test mode

---

## TC-041: Vitest coverage target — 80%+ line coverage

**Priority:** P0
**Type:** Regression

### Objective

Verify the final Vitest line coverage meets the 80%+ target and HTML report is generated.

### Preconditions

- All new unit tests written (TC-004 through TC-036)

### Steps

1. Run `npm run test:coverage`
   **Expected:** Overall line coverage >= 80% printed in terminal summary

2. Check `coverage/vitest/index.html` exists
   **Expected:** File exists and is a valid HTML coverage report

3. Verify per-file coverage for targeted files:
   - Market.tsx >= 80%
   - Watchlist.tsx >= 80%
   - Mission.tsx >= 80%
   - Onboarding.tsx >= 80%
   - DailyMission.tsx >= 80%
   - PlayoffAnnouncementModal.tsx >= 80%
   - MiniLeaderboard.tsx >= 80%
   - LiveTicker.tsx >= 80%
   - Portfolio.tsx >= 80%
   - PlayerDetail.tsx >= 75%
   - ScenarioToggle.tsx >= 80%
   - Glossary.tsx >= 80%
   - SkeletonLoader.tsx >= 80%
   - InfoTooltip.tsx >= 80%
   **Expected:** All files meet their individual targets

### Test Data

- N/A

### Edge Cases

- Files excluded from coverage config (test files, build files) are correctly excluded

---

## TC-042: Cypress coverage target — 75%+ line coverage

**Priority:** P0
**Type:** Regression

### Objective

Verify the final Cypress line coverage meets the 75%+ target and HTML report is generated.

### Preconditions

- All Cypress tests passing (TC-040)
- Istanbul instrumentation enabled via `CYPRESS_COVERAGE=true`

### Steps

1. Run `npm run cy:coverage`
   **Expected:** Overall line coverage >= 75% printed in terminal summary

2. Check `coverage/cypress/lcov-report/index.html` exists
   **Expected:** File exists and is a valid HTML coverage report

### Test Data

- N/A

### Edge Cases

- Coverage instrumentation includes all `src/*` files except test files and `node_modules`
- Pages that Cypress doesn't navigate to may drag down overall coverage; verify those are covered by Vitest
