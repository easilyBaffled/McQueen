# Test Plan: mcq-c51.1 -- Add search/filter and expand player selector in DailyMission

## Summary

- **Bead:** `mcq-c51.1`
- **Feature:** Search/filter input and expanded scrollable player selector in the DailyMission component
- **Total Test Cases:** 14
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: All players are displayed in selector (no 12-player limit)

**Priority:** P0
**Type:** Functional

### Objective

Verify that the player selector renders every player returned by `getPlayers()` instead of truncating to the first 12.

### Preconditions

- DailyMission component is rendered with mission not yet revealed
- `getPlayers()` returns more than 12 players

### Steps

1. Render the DailyMission component with a player list of 30+ players.
   **Expected:** The `.selector-chips` container contains one `.selector-chip` element for each player (30+), not capped at 12.

2. Count the rendered `.selector-chip` elements.
   **Expected:** Count equals the total number of players from `getPlayers()`.

### Test Data

- Mock `getPlayers()` to return at least 30 player objects with distinct ids, names, and teams.

### Edge Cases

- Exactly 12 players: all 12 should render (boundary of old limit).
- Exactly 13 players: all 13 should render (first value beyond old limit).
- 0 players: handled by TC-008 (empty state).

---

## TC-002: Search input is rendered above selector chips

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a text input for searching players appears above the player selector chip grid.

### Preconditions

- DailyMission component is rendered with mission not yet revealed.

### Steps

1. Locate the `[data-testid="player-selector"]` container.
   **Expected:** Container is present in the DOM.

2. Within that container, locate an `<input type="text">` element.
   **Expected:** Input element exists with `placeholder` attribute set to `"Search by name or team..."`.

3. Verify DOM order: the input appears before the `.selector-chips` container.
   **Expected:** The search input is a preceding sibling of `.selector-chips` in the DOM tree.

### Test Data

- N/A

### Edge Cases

- When `collapsible=true` and panel is collapsed, input should not be visible (content is hidden).

---

## TC-003: Filtering players by name

**Priority:** P0
**Type:** Functional

### Objective

Verify that typing a player's name into the search input filters the selector to show only matching players.

### Preconditions

- DailyMission component is rendered.
- Player list includes players named "Patrick Mahomes", "Tyreek Hill", "Travis Kelce".

### Steps

1. Type `"Mahomes"` into the search input.
   **Expected:** Only players whose name contains "Mahomes" are displayed (e.g., "Patrick Mahomes"). Other players like "Tyreek Hill" are not rendered.

2. Clear the input and type `"Patrick"`.
   **Expected:** Only players whose name contains "Patrick" are displayed.

### Test Data

- Mock players: Patrick Mahomes (KC), Tyreek Hill (MIA), Travis Kelce (KC), Patrick Surtain II (DEN).

### Edge Cases

- Typing a name that matches multiple players (e.g., "Patrick") should show all matches.
- Typing the full name "Patrick Mahomes" should still match.

---

## TC-004: Filtering players by team

**Priority:** P0
**Type:** Functional

### Objective

Verify that typing a team abbreviation or name into the search input filters players by their team field.

### Preconditions

- DailyMission component is rendered.
- Player list includes players on teams "KC", "MIA", "DEN".

### Steps

1. Type `"KC"` into the search input.
   **Expected:** All players with `team` containing "KC" are displayed (e.g., Patrick Mahomes, Travis Kelce). Players on other teams are hidden.

2. Clear the input and type `"MIA"`.
   **Expected:** Only players on MIA are displayed (e.g., Tyreek Hill).

### Test Data

- Mock players: Patrick Mahomes (KC), Travis Kelce (KC), Tyreek Hill (MIA), Tua Tagovailoa (MIA), Patrick Surtain II (DEN).

### Edge Cases

- Team code that is a substring of a player name (e.g., if a player's name coincidentally contains "KC") — both name and team matches should appear.

---

## TC-005: Search is case-insensitive

**Priority:** P1
**Type:** Functional

### Objective

Verify that the search filter matches regardless of letter casing in the input or player data.

### Preconditions

- DailyMission component is rendered.
- Player named "Patrick Mahomes" on team "KC" exists.

### Steps

1. Type `"mahomes"` (all lowercase) into the search input.
   **Expected:** "Patrick Mahomes" is displayed.

2. Clear and type `"MAHOMES"` (all uppercase).
   **Expected:** "Patrick Mahomes" is displayed.

3. Clear and type `"mAhOmEs"` (mixed case).
   **Expected:** "Patrick Mahomes" is displayed.

4. Clear and type `"kc"` (lowercase team).
   **Expected:** All KC players are displayed.

### Test Data

- Mock players: Patrick Mahomes (KC).

### Edge Cases

- N/A (covered by mixed-case step above).

---

## TC-006: Clearing search restores full player list

**Priority:** P0
**Type:** Functional

### Objective

Verify that clearing the search input (empty string or whitespace-only) shows all players again.

### Preconditions

- DailyMission component is rendered with 20+ players.

### Steps

1. Type `"Mahomes"` into the search input.
   **Expected:** Filtered list shows only matching players.

2. Select all text in the input and delete it (empty string).
   **Expected:** All players are displayed again; count matches total player count.

3. Type `"   "` (spaces only) into the search input.
   **Expected:** All players are still displayed (whitespace-only query is treated as empty).

### Test Data

- Mock `getPlayers()` with 20+ players.

### Edge Cases

- Single space character should not trigger filtering.

---

## TC-007: Partial match filtering

**Priority:** P1
**Type:** Functional

### Objective

Verify that partial substrings match player names and teams correctly.

### Preconditions

- DailyMission component is rendered.

### Steps

1. Type `"Pat"` into the search input.
   **Expected:** All players whose name contains "Pat" are shown (e.g., "Patrick Mahomes", "Patrick Surtain II").

2. Clear and type `"omes"`.
   **Expected:** "Patrick Mahomes" is shown (substring match within the name).

3. Clear and type `"K"`.
   **Expected:** All players whose name or team contains "K" are shown.

### Test Data

- Mock players: Patrick Mahomes (KC), Patrick Surtain II (DEN), Tyreek Hill (MIA).

### Edge Cases

- Single character query should still filter.

---

## TC-008: Empty state when no players match search

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the search query matches no players, a "No players found" message is displayed instead of an empty grid.

### Preconditions

- DailyMission component is rendered with players loaded.

### Steps

1. Type `"xyznonexistent"` into the search input.
   **Expected:** No `.selector-chip` elements are rendered. A message reading "No players found" is visible within the `.selector-chips` container.

2. Verify the message has the `.selector-empty` CSS class applied.
   **Expected:** The "No players found" paragraph uses the `selector-empty` style.

### Test Data

- Any mock player list (the query is deliberately non-matching).

### Edge Cases

- Search for special characters (e.g., `"@#$"`): should show "No players found" message, not crash.

---

## TC-009: Scrollable selector container (max-height and overflow)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the `.selector-chips` container has `max-height: 300px` and `overflow-y: auto` so that a large player list scrolls rather than expanding the page.

### Preconditions

- DailyMission component is rendered with enough players to exceed 300px of chip height.

### Steps

1. Inspect the computed styles of the `.selector-chips` element.
   **Expected:** `max-height` is `300px` and `overflow-y` is `auto`.

2. Render with 50+ players and verify the container's rendered height.
   **Expected:** The container does not exceed 300px in height. A vertical scrollbar is present or the container is scrollable.

3. Scroll the container to the bottom.
   **Expected:** The last player chip is reachable by scrolling. All players are accessible.

### Test Data

- Mock `getPlayers()` with 50+ players.

### Edge Cases

- With fewer players that fit within 300px, no scrollbar should appear (`overflow-y: auto` shows scrollbar only when needed).

---

## TC-010: Search input focus styling

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the search input shows appropriate focus styling when selected.

### Preconditions

- DailyMission component is rendered.

### Steps

1. Locate the `.selector-search` input element.
   **Expected:** Input has `background` matching `var(--color-bg-elevated)`, a `1px solid` border matching `var(--color-border)`, and `border-radius` matching `var(--radius-md)`.

2. Click on / focus the search input.
   **Expected:** Border color changes to `var(--color-primary)`. No browser default outline ring is visible (`outline: none`).

3. Verify the placeholder text styling.
   **Expected:** Placeholder text reads "Search by name or team..." and is styled with `var(--color-text-muted)`.

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-011: Responsive layout — single-column chips on mobile

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the `.selector-chips` grid switches to a single column at viewport widths ≤ 600px.

### Preconditions

- DailyMission component is rendered with players loaded.

### Steps

1. Set viewport width to 601px.
   **Expected:** `.selector-chips` uses `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` (multi-column).

2. Set viewport width to 600px.
   **Expected:** `.selector-chips` uses `grid-template-columns: 1fr` (single column per the media query).

3. Set viewport width to 375px (typical mobile).
   **Expected:** Single column layout persists; chips stack vertically and remain scrollable within the 300px max-height container.

### Test Data

- Mock players: 10+ players.

### Edge Cases

- Verify the search input remains full-width (`width: 100%`) at all breakpoints.

---

## TC-012: Search + pick interaction — can search and select a player

**Priority:** P0
**Type:** Integration

### Objective

Verify that a user can search for a specific player, then pick them as a riser or faller, and the pick is registered correctly.

### Preconditions

- DailyMission component is rendered with no prior picks.
- Player "Patrick Mahomes" exists in the player list.

### Steps

1. Type `"Mahomes"` into the search input.
   **Expected:** "Patrick Mahomes" chip appears in the filtered list.

2. Click the ▲ (riser) button on the "Patrick Mahomes" chip.
   **Expected:** "Patrick Mahomes" appears in the Risers picks column. The selector chip gets the `.picked` class (opacity 0.5). Risers count updates to "(1/3)".

3. Clear the search input.
   **Expected:** All players are shown. "Patrick Mahomes" chip still has the `.picked` class.

### Test Data

- Mock players including Patrick Mahomes (KC).

### Edge Cases

- Pick a player while filtered, then change search query — the pick should persist in the picks column even if the player is no longer in the filtered view.

---

## TC-013: Existing picks persist across search queries

**Priority:** P1
**Type:** Regression

### Objective

Verify that changing the search query does not reset or remove previously made picks.

### Preconditions

- DailyMission component is rendered.
- Player "Patrick Mahomes" has already been picked as a riser.

### Steps

1. Verify "Patrick Mahomes" appears in the Risers column with count "(1/3)".
   **Expected:** Pick is visible.

2. Type `"Hill"` into the search input.
   **Expected:** Filtered list shows "Tyreek Hill" (and any other "Hill" matches). "Patrick Mahomes" may not be visible in the selector, but still appears in the Risers picks column.

3. Clear the search input.
   **Expected:** "Patrick Mahomes" chip in the selector has the `.picked` class. Risers column still shows "Patrick Mahomes" with count "(1/3)".

4. Type `"Mahomes"` into the search input.
   **Expected:** "Patrick Mahomes" chip appears with `.picked` class and its ▲ button shows `.active` style.

### Test Data

- Mock players: Patrick Mahomes (KC), Tyreek Hill (MIA).

### Edge Cases

- Pick 3 risers, search for a non-picked player, verify the ▲ button is disabled for that player (max risers reached).

---

## TC-014: Search with special and unicode characters does not crash

**Priority:** P2
**Type:** Functional

### Objective

Verify the component handles non-alphanumeric input gracefully without errors.

### Preconditions

- DailyMission component is rendered.

### Steps

1. Type `"."` (period) into the search input.
   **Expected:** Players whose name or team contains a literal period are shown (or "No players found" if none match). No JavaScript error.

2. Clear and type `"O'Brien"` (apostrophe).
   **Expected:** Filters correctly for any name containing "O'Brien". No error.

3. Clear and type `"émile"` (accented character).
   **Expected:** Filters correctly. No error.

4. Clear and type a very long string (200+ characters).
   **Expected:** Input accepts the text. Filtering runs. "No players found" is likely shown. No performance degradation or crash.

### Test Data

- Standard mock player list. Optionally include a player with an apostrophe in the name (e.g., "Ja'Marr Chase").

### Edge Cases

- Pasting emoji characters into the search field should not crash the component.
