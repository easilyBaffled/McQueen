# Test Plan: mcq-8hr.6 -- Add Vitest tests for DailyMission component (0% coverage)

## Summary

- **Bead:** `mcq-8hr.6`
- **Feature:** DailyMission component – a "pick 3 risers & 3 fallers" daily game that lets users select players, reveal results, view scores, and reset
- **Total Test Cases:** 22
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Renders pick-selection UI when mission is not yet revealed

**Priority:** P0
**Type:** Functional

### Objective

Verify the component renders the initial picking state (risers column, fallers column, player selector, and reveal button) when `missionRevealed` is false.

### Preconditions

- Mock `useTrading` to return `getPlayers` with at least 3 players
- Mock `useSocial` with `missionRevealed: false`, empty `missionPicks` (`{ risers: [], fallers: [] }`)

### Steps

1. Render `<DailyMission />`
   **Expected:** The "Risers (0/3)" column heading is visible
2. Inspect the fallers column
   **Expected:** The "Fallers (0/3)" column heading is visible
3. Inspect the player selector area
   **Expected:** Text "Click a player to add them to your picks:" is visible
4. Inspect the reveal button
   **Expected:** A button with text "Select 6 more players" is visible and disabled

### Test Data

- Players list: `[{ id: 'p1', name: 'Patrick Mahomes', changePercent: 2.5 }, { id: 'p2', name: 'Josh Allen', changePercent: -1.3 }, { id: 'p3', name: 'Lamar Jackson', changePercent: 0.8 }]`

### Edge Cases

- Zero players returned from `getPlayers`: selector area should render empty, reveal button still disabled

---

## TC-002: Displays up to 12 players in the selector

**Priority:** P1
**Type:** Functional

### Objective

Verify the player selector grid only renders the first 12 players from `getPlayers()`, even if more are available.

### Preconditions

- Mock `getPlayers` to return 15 players
- `missionRevealed: false`, empty picks

### Steps

1. Render `<DailyMission />`
   **Expected:** Exactly 12 player selector chips are rendered

### Test Data

- 15 players with unique ids and names

### Edge Cases

- Fewer than 12 players: all players are shown
- Exactly 12 players: all 12 shown

---

## TC-003: Clicking riser button calls setMissionPick with correct arguments

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the ▲ button on a player chip calls `setMissionPick(playerId, 'riser')`.

### Preconditions

- Mock `useSocial` with `setMissionPick` as a spy, empty picks
- At least one player available

### Steps

1. Render `<DailyMission />`
2. Click the riser button (aria-label "Pick Patrick Mahomes as riser") for the first player
   **Expected:** `setMissionPick` was called with `('p1', 'riser')`

### Test Data

- Player: `{ id: 'p1', name: 'Patrick Mahomes', changePercent: 2.5 }`

### Edge Cases

- None (negative cases covered in TC-007)

---

## TC-004: Clicking faller button calls setMissionPick with correct arguments

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the ▼ button on a player chip calls `setMissionPick(playerId, 'faller')`.

### Preconditions

- Mock `useSocial` with `setMissionPick` as a spy, empty picks
- At least one player available

### Steps

1. Render `<DailyMission />`
2. Click the faller button (aria-label "Pick Patrick Mahomes as faller") for the first player
   **Expected:** `setMissionPick` was called with `('p1', 'faller')`

### Test Data

- Player: `{ id: 'p1', name: 'Patrick Mahomes', changePercent: 2.5 }`

### Edge Cases

- None (negative cases covered in TC-007)

---

## TC-005: Picked players appear in the risers column with remove button

**Priority:** P0
**Type:** Functional

### Objective

Verify that players added to `missionPicks.risers` appear as chips in the risers column, showing the player name and a remove (×) button.

### Preconditions

- Mock `missionPicks: { risers: ['p1'], fallers: [] }`
- Player p1: `{ id: 'p1', name: 'Patrick Mahomes', changePercent: 2.5 }`

### Steps

1. Render `<DailyMission />`
   **Expected:** "Risers (1/3)" heading is visible
2. Inspect the risers column
   **Expected:** A chip with text "Patrick Mahomes" is visible
3. Inspect remaining empty slots
   **Expected:** Two empty placeholder chips with text "Select a riser" are rendered
4. Click the × button on the "Patrick Mahomes" chip
   **Expected:** `clearMissionPick` was called with `'p1'`

### Test Data

- As above

### Edge Cases

- Player id not found in `getPlayers` → chip falls back to showing the raw id string

---

## TC-006: Picked players appear in the fallers column with remove button

**Priority:** P0
**Type:** Functional

### Objective

Verify that players added to `missionPicks.fallers` appear as chips in the fallers column with a remove button.

### Preconditions

- Mock `missionPicks: { risers: [], fallers: ['p2'] }`
- Player p2: `{ id: 'p2', name: 'Josh Allen', changePercent: -1.3 }`

### Steps

1. Render `<DailyMission />`
   **Expected:** "Fallers (1/3)" heading is visible
2. Inspect the fallers column
   **Expected:** A chip with text "Josh Allen" is visible
3. Inspect remaining empty slots
   **Expected:** Two empty placeholder chips with text "Select a faller" are rendered
4. Click the × button (aria-label "Remove Josh Allen from fallers")
   **Expected:** `clearMissionPick` was called with `'p2'`

### Test Data

- As above

### Edge Cases

- Player id not found in `getPlayers` → chip falls back to showing the raw id string

---

## TC-007: Riser button is disabled when risers column is full (3 picks) and player is not already picked as riser

**Priority:** P0
**Type:** Functional

### Objective

Verify that the ▲ selector button is disabled for unpicked players once 3 risers are selected.

### Preconditions

- Mock `missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: [] }`
- 4+ players available

### Steps

1. Render `<DailyMission />`
2. Locate the ▲ button for player p4 (not in risers)
   **Expected:** The button has `disabled` attribute
3. Locate the ▲ button for player p1 (already in risers)
   **Expected:** The button does NOT have `disabled` attribute (player can toggle themselves off)

### Test Data

- Four players: p1, p2, p3, p4

### Edge Cases

- Faller buttons for the same unpicked player (p4) should NOT be disabled (fallers column is still empty)

---

## TC-008: Faller button is disabled when fallers column is full (3 picks) and player is not already picked as faller

**Priority:** P0
**Type:** Functional

### Objective

Verify that the ▼ selector button is disabled for unpicked players once 3 fallers are selected.

### Preconditions

- Mock `missionPicks: { risers: [], fallers: ['p1', 'p2', 'p3'] }`
- 4+ players available

### Steps

1. Render `<DailyMission />`
2. Locate the ▼ button for player p4 (not in fallers)
   **Expected:** The button has `disabled` attribute
3. Locate the ▼ button for player p1 (already in fallers)
   **Expected:** The button does NOT have `disabled` attribute

### Test Data

- Four players: p1, p2, p3, p4

### Edge Cases

- Riser buttons for the same unpicked player (p4) should NOT be disabled (risers column is still empty)

---

## TC-009: Reveal button shows remaining count and is disabled when picks are incomplete

**Priority:** P0
**Type:** Functional

### Objective

Verify the reveal button text dynamically shows how many more players need to be selected, and is disabled until all 6 picks are made.

### Preconditions

- Mock `missionPicks` with varying fill levels

### Steps

1. Render with `missionPicks: { risers: [], fallers: [] }`
   **Expected:** Button text is "Select 6 more players" and button is disabled
2. Re-render with `missionPicks: { risers: ['p1'], fallers: ['p2'] }`
   **Expected:** Button text is "Select 4 more players" and button is disabled
3. Re-render with `missionPicks: { risers: ['p1', 'p2'], fallers: ['p3', 'p4', 'p5'] }`
   **Expected:** Button text is "Select 1 more players" and button is disabled

### Test Data

- Sufficient player ids

### Edge Cases

- Exactly 5 picks (one short): button still disabled, text shows "Select 1 more players"

---

## TC-010: Reveal button is enabled and shows "Reveal Results!" when all 6 picks are made

**Priority:** P0
**Type:** Functional

### Objective

Verify the reveal button becomes clickable and changes text when the user has picked 3 risers and 3 fallers.

### Preconditions

- Mock `missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] }`
- `missionRevealed: false`

### Steps

1. Render `<DailyMission />`
   **Expected:** Button text is "Reveal Results!" and button is NOT disabled
2. Click the "Reveal Results!" button
   **Expected:** `revealMission` spy was called once

### Test Data

- 6 players across both categories

### Edge Cases

- None

---

## TC-011: Clicking "Reveal Results!" calls revealMission

**Priority:** P0
**Type:** Functional

### Objective

Confirm that clicking the reveal button invokes the `revealMission` function from SocialContext.

### Preconditions

- 6 picks made (`canReveal` is true), `revealMission` is a spy

### Steps

1. Render `<DailyMission />`
2. Click "Reveal Results!"
   **Expected:** `revealMission` called exactly once

### Test Data

- Same as TC-010

### Edge Cases

- None

---

## TC-012: Results view displays score correctly after reveal

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `missionRevealed` is true, the results view shows the correct score from `getMissionScore()`.

### Preconditions

- `missionRevealed: true`
- `getMissionScore` returns `{ correct: 4, total: 6, percentile: 83 }`
- `missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] }`

### Steps

1. Render `<DailyMission />`
   **Expected:** The score display shows "4" as the correct count and "6" as the total
2. Inspect the percentile text
   **Expected:** Text "You beat 83% of traders!" is visible

### Test Data

- Score: `{ correct: 4, total: 6, percentile: 83 }`

### Edge Cases

- Score of 0 correct: shows "0" and "6", percentile 50%
- Perfect score (6/6): shows "6" and "6", percentile 100%

---

## TC-013: Results view shows correct/incorrect status for each riser pick

**Priority:** P0
**Type:** Functional

### Objective

Verify each riser pick in the results view shows ✓ or ✗ based on whether the player's `changePercent` is positive.

### Preconditions

- `missionRevealed: true`
- Risers: p1 (changePercent +2.5, correct), p2 (changePercent -1.3, incorrect), p3 (changePercent +0.8, correct)

### Steps

1. Render `<DailyMission />`
2. Inspect the "Your Risers" column
   **Expected:** p1 shows ✓, p2 shows ✗, p3 shows ✓
3. Inspect the change percent display for p1
   **Expected:** Shows "▲ 2.5%"
4. Inspect the change percent display for p2
   **Expected:** Shows "▼ 1.3%"

### Test Data

- p1: `{ changePercent: 2.5 }`, p2: `{ changePercent: -1.3 }`, p3: `{ changePercent: 0.8 }`

### Edge Cases

- Player with `changePercent: 0` → treated as incorrect for a riser (condition is `> 0`, not `>= 0`)

---

## TC-014: Results view shows correct/incorrect status for each faller pick

**Priority:** P0
**Type:** Functional

### Objective

Verify each faller pick in the results view shows ✓ or ✗ based on whether the player's `changePercent` is negative.

### Preconditions

- `missionRevealed: true`
- Fallers: p4 (changePercent -3.1, correct), p5 (changePercent +0.5, incorrect), p6 (changePercent -2.0, correct)

### Steps

1. Render `<DailyMission />`
2. Inspect the "Your Fallers" column
   **Expected:** p4 shows ✓, p5 shows ✗, p6 shows ✓
3. Inspect the change percent display for p4
   **Expected:** Shows "▼ 3.1%"
4. Inspect the change percent display for p5
   **Expected:** Shows "▲ 0.5%"

### Test Data

- p4: `{ changePercent: -3.1 }`, p5: `{ changePercent: 0.5 }`, p6: `{ changePercent: -2.0 }`

### Edge Cases

- Player with `changePercent: 0` → treated as incorrect for a faller (condition is `< 0`, not `<= 0`)

---

## TC-015: "Play Again" button calls resetMission

**Priority:** P0
**Type:** Functional

### Objective

Verify the "Play Again" button in the results view calls `resetMission`.

### Preconditions

- `missionRevealed: true`, `resetMission` is a spy

### Steps

1. Render `<DailyMission />`
   **Expected:** A "Play Again" button is visible
2. Click "Play Again"
   **Expected:** `resetMission` was called exactly once

### Test Data

- Any valid revealed state with picks and score

### Edge Cases

- None

---

## TC-016: Collapsible mode renders header with expand/collapse toggle

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `collapsible={true}`, the component renders a clickable header with title, subtitle, and chevron icon, and that clicking it toggles the content.

### Preconditions

- Render `<DailyMission collapsible />`
- `missionRevealed: false`, empty picks

### Steps

1. Render `<DailyMission collapsible />`
   **Expected:** A button with role header is visible containing "Today's Mission" and "Pick 3 risers and 3 fallers"
2. Inspect the chevron icon
   **Expected:** SVG expand icon is visible
3. Inspect `aria-expanded` on the header button
   **Expected:** `aria-expanded="true"` (starts expanded)
4. Click the header button
   **Expected:** `aria-expanded` changes to `"false"`, and the mission content is hidden (AnimatePresence exit)
5. Click the header button again
   **Expected:** `aria-expanded` changes back to `"true"`, content is visible again

### Test Data

- Default empty state

### Edge Cases

- None

---

## TC-017: Non-collapsible mode does not render header, always shows content

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `collapsible` is not set (default false), the header toggle is not rendered and content is always visible.

### Preconditions

- Render `<DailyMission />` (collapsible defaults to false)

### Steps

1. Render `<DailyMission />`
   **Expected:** No element with text "Today's Mission" (the header) is rendered
2. Inspect the mission content area
   **Expected:** Picks grid and player selector are visible

### Test Data

- Default empty state with a few players

### Edge Cases

- None

---

## TC-018: Collapsible header shows score badge when mission is revealed

**Priority:** P1
**Type:** Functional

### Objective

Verify that in collapsible mode, the header displays a score badge (e.g. "4/6 correct") once the mission is revealed.

### Preconditions

- `collapsible={true}`, `missionRevealed: true`
- `getMissionScore` returns `{ correct: 4, total: 6, percentile: 83 }`

### Steps

1. Render `<DailyMission collapsible />`
   **Expected:** The header section shows text "4/6 correct" in the score badge

### Test Data

- Score: `{ correct: 4, total: 6, percentile: 83 }`

### Edge Cases

- Score is null (unrevealed): badge should NOT be rendered
- Score with 0 correct: shows "0/6 correct"

---

## TC-019: Picked player chip in selector shows "picked" styling

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that a player already picked (as riser or faller) gets the `picked` CSS class on their selector chip.

### Preconditions

- `missionPicks: { risers: ['p1'], fallers: ['p2'] }`

### Steps

1. Render `<DailyMission />`
2. Locate selector chip for player p1
   **Expected:** The chip's className includes the `picked` style
3. Locate selector chip for player p3 (not picked)
   **Expected:** The chip's className does NOT include the `picked` style

### Test Data

- Players: p1 (riser), p2 (faller), p3 (unpicked)

### Edge Cases

- None

---

## TC-020: Active riser/faller button shows "active" styling

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the ▲ button shows `active` class when the player is picked as a riser, and ▼ shows `active` when picked as a faller.

### Preconditions

- `missionPicks: { risers: ['p1'], fallers: ['p2'] }`

### Steps

1. Render `<DailyMission />`
2. Locate the ▲ button for p1
   **Expected:** Button has the `active` CSS class
3. Locate the ▼ button for p1
   **Expected:** Button does NOT have the `active` CSS class
4. Locate the ▼ button for p2
   **Expected:** Button has the `active` CSS class
5. Locate the ▲ button for p2
   **Expected:** Button does NOT have the `active` CSS class

### Test Data

- Players: p1 (riser), p2 (faller), p3 (neither)

### Edge Cases

- None

---

## TC-021: Player change percent display in selector shows sign and formatted value

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify each player selector chip shows their `changePercent` with a `+`/`-` prefix and 1 decimal place, and uses the correct up/down style class.

### Preconditions

- Players with positive and negative `changePercent`

### Steps

1. Render `<DailyMission />`
2. Locate selector chip for player with `changePercent: 2.5`
   **Expected:** Text "+2.5%" is visible, change span has the `up` CSS class
3. Locate selector chip for player with `changePercent: -1.3`
   **Expected:** Text "-1.3%" is visible, change span has the `down` CSS class

### Test Data

- p1: `{ changePercent: 2.5 }`, p2: `{ changePercent: -1.3 }`

### Edge Cases

- Player with `changePercent: 0` → shows "+0.0%" with `up` class (condition is `>= 0`)

---

## TC-022: Results view falls back to player id when player not found

**Priority:** P2
**Type:** Functional

### Objective

Verify that in the results view, if a picked player id cannot be found via `getPlayerById`, the component gracefully falls back to displaying the raw id and a 0.0% change.

### Preconditions

- `missionRevealed: true`
- `missionPicks: { risers: ['unknown-id'], fallers: [] }`
- `getPlayers` does not include a player with id `'unknown-id'`

### Steps

1. Render `<DailyMission />`
2. Inspect the "Your Risers" column
   **Expected:** A result chip displays "unknown-id" as the name text
3. Inspect the change display for that chip
   **Expected:** Shows "▲ 0.0%" (since `player?.changePercent` is undefined, falls back to 0)

### Test Data

- Picks include an id not present in the players list

### Edge Cases

- Same behavior applies to fallers column with unknown ids
