# Test Plan: mcq-63p.4 -- Fix DailyMission result-chip status CSS module classes

## Summary

- **Bead:** `mcq-63p.4`
- **Feature:** Result chips in DailyMission use proper CSS module class references for correct/incorrect status styling
- **Total Test Cases:** 8
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Correct riser prediction renders green result-chip

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a riser pick whose player actually rose in value gets the CSS-module-scoped `.correct` class, rendering the green background and border.

### Preconditions

- DailyMission component is mounted with mocked TradingContext and SocialContext
- At least one riser pick exists where the player's `changePercent > 0` (prediction correct)
- `missionRevealed` is `true`

### Steps

1. Render DailyMission in the revealed state with a correct riser prediction.
   **Expected:** The result-chip `div` for that player has a `className` containing the CSS-module-hashed version of `correct` (i.e., `styles['correct']`), not the raw string `"correct"`.

2. Inspect the computed styles of the result-chip element.
   **Expected:** `background` resolves to `var(--color-up-bg)` and `border-color` resolves to `var(--color-up)`, confirming green feedback renders.

3. Inspect the `.result-status` span inside the chip.
   **Expected:** Displays "✓" and its `color` resolves to `var(--color-up)`.

### Test Data

- Player: `{ id: "p1", name: "Patrick Mahomes", changePercent: 2.5 }`
- Mission picks: `{ risers: ["p1"], fallers: [] }`

### Edge Cases

- Player `changePercent` is exactly `0` — should be treated as **not** rising, so prediction is incorrect for a riser pick.

---

## TC-002: Incorrect riser prediction renders red result-chip

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a riser pick whose player actually fell in value gets the CSS-module-scoped `.incorrect` class, rendering the red background and border.

### Preconditions

- DailyMission component is mounted with mocked contexts
- At least one riser pick exists where the player's `changePercent < 0` (prediction incorrect)
- `missionRevealed` is `true`

### Steps

1. Render DailyMission in the revealed state with an incorrect riser prediction.
   **Expected:** The result-chip `div` has a `className` containing the CSS-module-hashed version of `incorrect`.

2. Inspect computed styles of the result-chip element.
   **Expected:** `background` resolves to `var(--color-down-bg)` and `border-color` resolves to `var(--color-down)`, confirming red feedback renders.

3. Inspect the `.result-status` span inside the chip.
   **Expected:** Displays "✗" and its `color` resolves to `var(--color-down)`.

### Test Data

- Player: `{ id: "p2", name: "Josh Allen", changePercent: -1.3 }`
- Mission picks: `{ risers: ["p2"], fallers: [] }`

### Edge Cases

- Player `changePercent` is a very small negative like `-0.1` — should still be incorrect.

---

## TC-003: Correct faller prediction renders green result-chip

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a faller pick whose player actually fell in value gets the CSS-module-scoped `.correct` class.

### Preconditions

- DailyMission component is mounted with mocked contexts
- At least one faller pick exists where the player's `changePercent < 0` (prediction correct)
- `missionRevealed` is `true`

### Steps

1. Render DailyMission in the revealed state with a correct faller prediction.
   **Expected:** The result-chip `div` for that player in the "Your Fallers" column has a `className` containing the CSS-module-hashed version of `correct`.

2. Inspect computed styles.
   **Expected:** Green background (`var(--color-up-bg)`) and border (`var(--color-up)`).

### Test Data

- Player: `{ id: "p3", name: "Jalen Hurts", changePercent: -3.0 }`
- Mission picks: `{ risers: [], fallers: ["p3"] }`

### Edge Cases

- Player `changePercent` is exactly `0` — should be treated as **not** falling, so prediction is incorrect for a faller pick.

---

## TC-004: Incorrect faller prediction renders red result-chip

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a faller pick whose player actually rose in value gets the CSS-module-scoped `.incorrect` class.

### Preconditions

- DailyMission component is mounted with mocked contexts
- At least one faller pick exists where the player's `changePercent > 0` (prediction incorrect)
- `missionRevealed` is `true`

### Steps

1. Render DailyMission in the revealed state with an incorrect faller prediction.
   **Expected:** The result-chip `div` in the "Your Fallers" column has a `className` containing the CSS-module-hashed version of `incorrect`.

2. Inspect computed styles.
   **Expected:** Red background (`var(--color-down-bg)`) and border (`var(--color-down)`).

### Test Data

- Player: `{ id: "p4", name: "Lamar Jackson", changePercent: 4.2 }`
- Mission picks: `{ risers: [], fallers: ["p4"] }`

### Edge Cases

- None beyond the primary scenario.

---

## TC-005: No raw `correct` or `incorrect` strings appear in DOM class attributes

**Priority:** P0
**Type:** Regression

### Objective

Confirm the bug is fixed: the raw strings `"correct"` and `"incorrect"` must NOT appear as literal class names in any result-chip element. Only CSS-module-scoped (hashed) class names should be present.

### Preconditions

- DailyMission is rendered in revealed state with a mix of correct and incorrect predictions

### Steps

1. Render DailyMission with 3 risers and 3 fallers, some correct and some incorrect.
   **Expected:** Component renders the results view.

2. Query all `[data-testid="mission-results"]` descendant `div` elements that have `result-chip` in their class.
   **Expected:** Each chip's `className` string does NOT contain the plain substring `" correct"` or `" incorrect"` (with leading space, indicating a raw class). The module-hashed equivalents (e.g., `_correct_abc12`) are present instead.

3. Verify no unscoped class appears in the document's class list for any result-chip.
   **Expected:** `element.classList` does not include `"correct"` or `"incorrect"` as standalone entries.

### Test Data

- 6 players with a mix of positive and negative `changePercent`
- All 3 riser slots and 3 faller slots filled

### Edge Cases

- None; this is a direct regression guard.

---

## TC-006: Result-chip with null status applies no status class

**Priority:** P1
**Type:** Functional

### Objective

Verify the ternary guard `status ? styles[status] : ''` — when `getPredictionStatus` returns `null` (mission not yet revealed or player not found), no status class is appended.

### Preconditions

- DailyMission rendered in **un-revealed** state (`missionRevealed = false`), OR
- A pick references a player ID not found in the players list

### Steps

1. Render DailyMission in un-revealed state.
   **Expected:** The picks view (not results) is shown; no result-chips exist at all.

2. Render DailyMission in revealed state where one pick references an unknown player ID (e.g., `"unknown-player"`).
   **Expected:** The result-chip for that ID has only the `result-chip` base class — no `correct` or `incorrect` class is appended. The chip renders with default/neutral styling (gray background via `var(--color-bg-elevated)`).

### Test Data

- Mission picks: `{ risers: ["unknown-player"], fallers: [] }`
- Players list does not contain `"unknown-player"`

### Edge Cases

- Empty player list (`getPlayers()` returns `[]`) — all chips should render with neutral styling.

---

## TC-007: CSS module defines both `.correct` and `.incorrect` classes

**Priority:** P1
**Type:** Functional

### Objective

Verify that `DailyMission.module.css` contains the `.correct` and `.incorrect` class definitions with the expected styling properties, ensuring `styles['correct']` and `styles['incorrect']` resolve to valid hashed class names.

### Preconditions

- Access to the `DailyMission.module.css` source file

### Steps

1. Parse or inspect `DailyMission.module.css`.
   **Expected:** A `.result-chip.correct` rule exists with `background: var(--color-up-bg)` and `border-color: var(--color-up)`.

2. Continue inspection.
   **Expected:** A `.result-chip.incorrect` rule exists with `background: var(--color-down-bg)` and `border-color: var(--color-down)`.

3. Import the CSS module in a test and check that `styles.correct` and `styles.incorrect` are defined (truthy strings).
   **Expected:** Both `styles['correct']` and `styles['incorrect']` are non-empty strings.

### Test Data

- N/A (static file analysis)

### Edge Cases

- Ensure `.result-chip.correct .result-status` also defines `color: var(--color-up)` for the check/cross icon coloring.
- Ensure `.result-chip.incorrect .result-status` defines `color: var(--color-down)`.

---

## TC-008: Mixed results — full 6-pick mission shows correct styling per chip

**Priority:** P1
**Type:** Integration

### Objective

End-to-end rendering of a full mission (3 risers + 3 fallers) with a realistic mix of correct and incorrect predictions. Validates that each chip independently receives the right status class.

### Preconditions

- DailyMission component mounted with full mock data
- `missionRevealed` is `true`

### Steps

1. Set up 6 players: 3 with positive `changePercent`, 3 with negative `changePercent`.
   **Expected:** Data is ready.

2. Configure picks: risers = [2 actually rising, 1 actually falling], fallers = [2 actually falling, 1 actually rising].
   **Expected:** Should yield 4 correct and 2 incorrect predictions.

3. Render DailyMission.
   **Expected:** Score displays "4/6 Correct".

4. Inspect the 3 result-chips in the "Your Risers" column.
   **Expected:** 2 chips have the module-scoped `correct` class (green); 1 chip has the module-scoped `incorrect` class (red).

5. Inspect the 3 result-chips in the "Your Fallers" column.
   **Expected:** 2 chips have the module-scoped `correct` class (green); 1 chip has the module-scoped `incorrect` class (red).

6. Verify the check/cross icons align: "✓" on correct chips, "✗" on incorrect chips.
   **Expected:** Icons match status on all 6 chips.

### Test Data

- Risers: `["p1", "p2", "p3"]` where p1 (+3.0%), p2 (+1.5%) are rising and p3 (-2.0%) is falling
- Fallers: `["p4", "p5", "p6"]` where p4 (-4.0%), p5 (-0.5%) are falling and p6 (+1.0%) is rising

### Edge Cases

- All 6 correct (score 6/6): every chip should be green.
- All 6 incorrect (score 0/6): every chip should be red.
