# Test Plan: mcq-c51 -- Mission and Leaderboard Improvements

## Summary

- **Bead:** `mcq-c51`
- **Feature:** Expand DailyMission player selector beyond 12 players, fix Leaderboard trader column alignment, and rename misleading "Weekly Gain" header to "Gain"
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: All players accessible in DailyMission selector (not limited to 12)

**Priority:** P0
**Type:** Functional

### Objective

Verify that the player selector in DailyMission shows all available players rather than truncating at 12 via `players.slice(0, 12)`.

### Preconditions

- App is loaded with a scenario that has more than 12 players (default has ~30+)
- DailyMission has not been revealed yet

### Steps

1. Navigate to DailyMission (e.g., via `/social` or the Dashboard widget)
   **Expected:** The player selector section renders with a hint "Click a player to add them to your picks:"

2. Count the number of player chips visible or accessible (scroll if needed)
   **Expected:** All available players from `getPlayers()` are present — not capped at 12

3. Scroll through the player list
   **Expected:** Players beyond the 12th are visible and selectable within a scrollable container

### Test Data

- Use a scenario with at least 15 players to confirm the cap is removed

### Edge Cases

- Exactly 12 players available: all 12 should render, no scroll needed
- Fewer than 12 players (e.g., 5): all 5 render, no empty slots or errors
- Very large player set (30+): list remains scrollable and performant, no layout overflow

---

## TC-002: Search/filter input filters players by name

**Priority:** P0
**Type:** Functional

### Objective

Verify that a search input exists in the player selector and filters players by name as the user types.

### Preconditions

- DailyMission is in pick-selection mode (not yet revealed)
- Multiple players are available

### Steps

1. Locate the search/filter input in the player selector area
   **Expected:** A text input is visible above the player chips

2. Type a partial player name (e.g., "Mah" for Mahomes) into the search input
   **Expected:** Only players whose name matches the query are shown; non-matching players are hidden

3. Clear the search input
   **Expected:** The full list of players is shown again (or the initial default view)

### Test Data

- Player name: "Mahomes" — search "mah" should match
- Player name: "Allen" — search "all" should match

### Edge Cases

- Search query that matches no players: selector shows an empty state or "no results" message, no crash
- Single character query: filters immediately (or waits for minimum characters — verify behavior)
- Search is case-insensitive: "mahomes", "MAHOMES", and "Mahomes" all return the same result

---

## TC-003: Search/filter input filters players by team

**Priority:** P1
**Type:** Functional

### Objective

Verify that the search input also matches against team name, not just player name.

### Preconditions

- DailyMission is in pick-selection mode
- Players from multiple teams are available

### Steps

1. Type a team name or abbreviation (e.g., "KC" or "Chiefs") into the search input
   **Expected:** All players belonging to that team appear in the filtered results

2. Clear and type a different team
   **Expected:** Results update to show only that team's players

### Test Data

- Search "KC" or "Chiefs" — expect Kansas City players to appear

### Edge Cases

- Team name substring that partially matches multiple teams: all partial matches shown
- Combined name+team search where the query matches a team but not a name: team-matched players still appear

---

## TC-004: Player selector is scrollable when showing many results

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the `.selector-chips` container has a constrained max-height and scrolls when content overflows.

### Preconditions

- DailyMission is in pick-selection mode
- Enough players are present to exceed the visible area (~12+)

### Steps

1. Open DailyMission with all players visible (no search filter, or a filter matching many players)
   **Expected:** The player chip area has a visible max-height (approximately 300px per spec)

2. Scroll within the player selector area
   **Expected:** The container scrolls vertically; the rest of the DailyMission UI (pick slots, reveal button) stays in place

3. Resize the browser window to a narrow width
   **Expected:** Scrollable behavior is preserved; chips reflow within the container

### Test Data

- Scenario with 20+ players

### Edge Cases

- Only 3 players: no scrollbar appears, container fits content naturally
- Exactly at the boundary height: scrollbar may or may not appear — no layout break

---

## TC-005: Existing pick functionality works after selector expansion

**Priority:** P0
**Type:** Regression

### Objective

Verify that the riser/faller pick buttons continue to work correctly after the selector is expanded beyond 12 players.

### Preconditions

- DailyMission is in pick-selection mode
- All players are visible in the expanded selector

### Steps

1. Click the "▲" (riser) button on any player chip
   **Expected:** Player is added to the Risers pick list; chip shows `picked` styling (opacity 0.5)

2. Click the "▼" (faller) button on a different player
   **Expected:** Player is added to the Fallers pick list; chip shows `picked` styling

3. Pick 3 risers and 3 fallers (total of 6)
   **Expected:** The "Reveal Results" button becomes enabled; counter shows "Risers (3/3)" and "Fallers (3/3)"

4. Try to pick a 4th riser
   **Expected:** The "▲" button on unpicked players is disabled when 3 risers are already selected

5. Remove a riser pick by clicking the "×" button on the pick chip
   **Expected:** Pick is removed; the player's selector chip returns to normal styling; "▲" buttons re-enable

6. Pick a player that was only accessible via scrolling (beyond original 12)
   **Expected:** Pick works identically — player appears in pick slots with correct name and change percentage

### Test Data

- Pick players at positions 1, 7, and 15 (to test across the former boundary)

### Edge Cases

- Rapidly clicking riser then faller on the same player: only the last action persists
- Picking a player found via search, then clearing search: picked player remains in pick slots

---

## TC-006: Leaderboard trader column — avatar and name are vertically centered

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the `.col-trader` cell uses flex layout so the avatar emoji and trader name are vertically centered and consistently aligned across all rows.

### Preconditions

- Navigate to `/leaderboard`
- At least 3 trader rows are visible

### Steps

1. Inspect the trader column in any row
   **Expected:** The avatar emoji and name text are vertically centered on the same line with consistent spacing (8px gap per spec)

2. Compare alignment across the top-3 medal rows and regular rows
   **Expected:** Vertical alignment is identical regardless of whether the row has a medal emoji in the rank column

3. Check the user's own row (highlighted row)
   **Expected:** Avatar and "You" label are aligned consistently with other rows

### Test Data

- Default leaderboard with 5+ AI traders and the user

### Edge Cases

- Trader with a long name: name truncates with ellipsis, avatar stays aligned
- Trader with no avatar (empty/undefined): layout does not collapse or misalign — empty space or fallback renders

---

## TC-007: Leaderboard trader column alignment across browsers

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the flex alignment fix for `.col-trader` renders consistently across Chrome, Firefox, and Safari.

### Preconditions

- Leaderboard page loaded in each target browser

### Steps

1. Open `/leaderboard` in Chrome
   **Expected:** Avatar and name are vertically centered with ~8px gap

2. Open `/leaderboard` in Firefox
   **Expected:** Same alignment as Chrome

3. Open `/leaderboard` in Safari
   **Expected:** Same alignment as Chrome

### Test Data

- Default scenario data

### Edge Cases

- Zoom levels (90%, 100%, 125%): alignment holds at different zoom levels

---

## TC-008: "Weekly Gain" header renamed to "Gain"

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Leaderboard table header previously reading "Weekly Gain" now reads "Gain" (or "Session Gain"), accurately reflecting that the data is not time-windowed.

### Preconditions

- Navigate to `/leaderboard`

### Steps

1. Locate the table header row in the leaderboard
   **Expected:** Four columns are visible: "Rank", "Trader", "Portfolio Value", and "Gain"

2. Confirm the last column header text
   **Expected:** Text reads exactly "Gain" — not "Weekly Gain", "Weekly", or any other variant

### Test Data

- N/A — purely UI text verification

### Edge Cases

- Check that aria-labels or other accessibility attributes referencing "Weekly Gain" are also updated if they exist

---

## TC-009: Gain column data still renders correctly after header rename

**Priority:** P1
**Type:** Regression

### Objective

Verify that renaming the header has no side effects on the gain percentage values displayed in each row.

### Preconditions

- Leaderboard loaded with traders that have both positive and negative gains

### Steps

1. Navigate to `/leaderboard`
   **Expected:** Each trader row displays a gain percentage under the "Gain" column

2. Verify a row with positive gain
   **Expected:** Shows "▲ +X.X%" with appropriate green/up styling and aria-label "Up X.X percent"

3. Verify a row with negative gain
   **Expected:** Shows "▼ -X.X%" with appropriate red/down styling and aria-label "Down X.X percent"

4. Verify the user row gain matches TradingContext data
   **Expected:** Gain percentage is consistent with `getPortfolioValue().gainPercent`

### Test Data

- Default scenario where AI traders have varying gains

### Edge Cases

- Trader with `gainPercent` of `undefined` or `null`: displays "▲ +0.0%" via the `?? 0` fallback

---

## TC-010: No `.trader-avatar` style conflicts after flex fix

**Priority:** P2
**Type:** Regression

### Objective

Verify that adding `display: flex; align-items: center; gap: 8px;` to `.col-trader` does not conflict with existing `.trader-avatar` styles in the Leaderboard page CSS.

### Preconditions

- Leaderboard page loaded

### Steps

1. Inspect `.trader-avatar` element in browser dev tools
   **Expected:** Avatar emoji renders at expected size without being stretched, squished, or repositioned unexpectedly

2. Inspect `.col-trader` element
   **Expected:** Has `display: flex`, `align-items: center`, `gap: 8px` applied; no competing `display` or `align-items` from other rules

3. Compare with MiniLeaderboard's `.trader-info` styling (which already uses flex)
   **Expected:** Visual parity — the full Leaderboard trader cells look consistent with the MiniLeaderboard's flex-based layout

### Test Data

- Default scenario

### Edge Cases

- If `.trader-avatar` already had `display: inline-flex` or `display: flex`, verify no double-flex nesting issues

---

## TC-011: DailyMission selector initial view with no search query

**Priority:** P1
**Type:** Functional

### Objective

Per the design notes, the initial view (empty search query) should show the first 12 players but allow scrolling or searching to access all. Verify this hybrid behavior.

### Preconditions

- DailyMission in pick-selection mode with 20+ players available
- Search input is empty (default state)

### Steps

1. Open DailyMission without typing in the search field
   **Expected:** The selector shows a manageable initial set of players (may show first 12 or all with scroll)

2. Scroll within the selector area
   **Expected:** If initially limited to 12, scrolling reveals more; OR if all are shown, the container is scrollable

3. Type a search query to find a player beyond position 12
   **Expected:** Player appears in the filtered results and is selectable

### Test Data

- Player at position 15+ in the list

### Edge Cases

- Immediately after page load: selector is responsive and doesn't flash/reflow
- Search then clear: returns to initial state cleanly

---

## TC-012: Responsive layout of expanded player selector on mobile viewports

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the expanded player selector with scrollable container and search input renders correctly on narrow (mobile) viewports.

### Preconditions

- DailyMission in pick-selection mode
- Browser viewport set to 375px width (iPhone SE) or similar

### Steps

1. View DailyMission at 375px viewport width
   **Expected:** Search input spans the available width; player chips reflow to fit (grid auto-fill with minmax handles this)

2. Scroll the player list on mobile
   **Expected:** Touch scrolling works within the selector container; page does not scroll simultaneously

3. Pick a riser and faller on mobile
   **Expected:** Tap targets for "▲" and "▼" buttons are large enough to tap accurately (at least 24×24px per existing styles)

### Test Data

- Default scenario, 20+ players

### Edge Cases

- Very narrow viewport (320px): chips stack to single column, no horizontal overflow
- Landscape orientation on phone: layout adapts without breaking
