# Test Plan: mcq-dvn.4 -- Replace hardcoded LiveTicker fallback text

## Summary

- **Bead:** `mcq-dvn.4`
- **Feature:** LiveTicker fallback text is generic (or data-driven) instead of hardcoded to a specific game matchup
- **Total Test Cases:** 10
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Fallback text contains no hardcoded matchup references

**Priority:** P0
**Type:** Functional

### Objective

Verify that the fallback text shown when no live events exist does not contain the previously hardcoded "MNF: Chiefs vs Bills" string or any other game-specific text. This is the core requirement of the issue.

### Preconditions

- App is running with the `live` scenario selected
- No unified timeline events exist (`unifiedTimeline` is empty)
- No actionable history events exist (`history` is empty or only contains "Scenario loaded")

### Steps

1. Render the `LiveTicker` component with `scenario: 'live'`, empty `unifiedTimeline`, and empty `history`.
   **Expected:** The ticker renders with fallback text visible.

2. Inspect the rendered fallback text content.
   **Expected:** The text does NOT contain "MNF", "Chiefs", "Bills", or any other team/game-specific references.

### Test Data

- `scenario: 'live'`
- `unifiedTimeline: []`
- `history: []`
- `tick: 0`

### Edge Cases

- Verify the same absence of hardcoded text under `scenario: 'superbowl'` with empty events.

---

## TC-002: Generic static fallback text is displayed when no events exist

**Priority:** P0
**Type:** Functional

### Objective

Verify that the fallback displays a generic message (e.g., "Live game updates as they happen") when there are no events of any kind to show.

### Preconditions

- App is running with `scenario: 'live'`
- `unifiedTimeline` is empty
- `history` is empty

### Steps

1. Render `LiveTicker` with `scenario: 'live'`, `unifiedTimeline: []`, `history: []`, `tick: 0`.
   **Expected:** The ticker shows the generic fallback string (e.g., "Live game updates as they happen").

2. Confirm the fallback text is inside an element with the `ticker-event` CSS class.
   **Expected:** The fallback `<span>` has the `ticker-event` class applied.

### Test Data

- `scenario: 'live'`
- `unifiedTimeline: []`
- `history: []`

### Edge Cases

- `history` contains only `{ action: 'Scenario loaded' }` entries (these are filtered out) — fallback should still appear.

---

## TC-003: Data-driven fallback uses currentData.headline from useScenario (if implemented)

**Priority:** P1
**Type:** Functional

### Objective

If the implementation pulls the matchup description from `currentData.headline` via `useScenario()`, verify that the ticker displays that headline as the fallback when no live events exist.

### Preconditions

- App is running with `scenario: 'live'`
- `currentData` is loaded and contains `headline: "Monday Night Football: Chiefs vs. Bills - Q2"`
- `unifiedTimeline` is empty
- `history` is empty

### Steps

1. Render `LiveTicker` with the above state.
   **Expected:** The fallback text matches the `currentData.headline` value (e.g., "Monday Night Football: Chiefs vs. Bills - Q2").

2. Switch scenario to `superbowl` (which has `headline: "Super Bowl LX: Chiefs vs 49ers - Live from New Orleans"`).
   **Expected:** The fallback text updates to reflect the superbowl scenario's headline.

### Test Data

- `live.json` headline: `"Monday Night Football: Chiefs vs. Bills - Q2"`
- `superbowl.json` headline: `"Super Bowl LX: Chiefs vs 49ers - Live from New Orleans"`

### Edge Cases

- `currentData` is `null` (scenario still loading) — should fall back to the static generic string.
- `currentData.headline` is `undefined` — should fall back to the static generic string.
- `currentData.headline` is an empty string — should fall back to the static generic string or display empty (verify intended behavior).

---

## TC-004: Fallback text not shown when a displayEvent exists

**Priority:** P0
**Type:** Regression

### Objective

Verify that the fallback branch is NOT rendered when there are active events to display. This ensures the change did not break the primary event-display path.

### Preconditions

- App is running with `scenario: 'live'`
- `unifiedTimeline` contains at least one event with a headline

### Steps

1. Render `LiveTicker` with `scenario: 'live'`, `unifiedTimeline: [{ reason: { headline: 'Allen interception' } }]`, `tick: 0`.
   **Expected:** "Allen interception" is displayed in the ticker.

2. Inspect the DOM for any fallback text.
   **Expected:** The generic fallback string is NOT present in the rendered output.

### Test Data

- `unifiedTimeline: [{ reason: { headline: 'Allen interception' } }]`
- `tick: 0`

### Edge Cases

- Event headline is an empty string — verify whether fallback appears or empty event is displayed.

---

## TC-005: Fallback text shown under superbowl scenario with no events

**Priority:** P1
**Type:** Functional

### Objective

Verify the fallback works correctly for the `superbowl` scenario (the other live-type scenario), not just `live`.

### Preconditions

- `scenario: 'superbowl'`
- `unifiedTimeline` is empty
- `history` is empty

### Steps

1. Render `LiveTicker` with `scenario: 'superbowl'`, empty `unifiedTimeline`, and empty `history`.
   **Expected:** The ticker renders and shows the generic fallback text (or superbowl-specific `currentData.headline` if data-driven).

2. Confirm no hardcoded "Chiefs vs Bills" or "MNF" text appears.
   **Expected:** Fallback is generic or scenario-appropriate, not the old hardcoded string.

### Test Data

- `scenario: 'superbowl'`
- `unifiedTimeline: []`
- `history: []`

### Edge Cases

- None beyond what TC-001 covers.

---

## TC-006: LiveTicker still returns null for non-live scenarios

**Priority:** P1
**Type:** Regression

### Objective

Ensure the change did not affect the guard clause that hides the ticker for non-live scenarios (`midweek`, `playoffs`).

### Preconditions

- App is running

### Steps

1. Render `LiveTicker` with `scenario: 'midweek'`.
   **Expected:** Component returns `null`; nothing is rendered.

2. Render `LiveTicker` with `scenario: 'playoffs'`.
   **Expected:** Component returns `null`; nothing is rendered.

### Test Data

- `scenario: 'midweek'`
- `scenario: 'playoffs'`

### Edge Cases

- `scenario: 'espn-live'` — verify it also returns null (not in the `isLiveScenario` check).

---

## TC-007: Fallback text transitions correctly via AnimatePresence

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the fallback text renders inside the `AnimatePresence` block and that transitions from fallback to a live event (and vice versa) animate smoothly.

### Preconditions

- `scenario: 'live'`
- Initially no events (fallback displayed)
- Then events arrive (simulated by updating `unifiedTimeline`)

### Steps

1. Render `LiveTicker` with empty events.
   **Expected:** Fallback text is visible within the `ticker-content` area.

2. Update `unifiedTimeline` to include an event with a headline, triggering a re-render.
   **Expected:** The fallback text exits with the `exit` animation (`opacity: 0, y: -10`) and the new event text enters with the `initial → animate` transition (`opacity: 0, y: 10` → `opacity: 1, y: 0`).

3. Remove all events (reset to empty timeline).
   **Expected:** The event text exits and the fallback text reappears.

### Test Data

- Start: `unifiedTimeline: []`
- Transition to: `unifiedTimeline: [{ reason: { headline: 'Mahomes throws TD' } }]`

### Edge Cases

- Rapid toggling between events and no-events state — verify no animation glitches.

---

## TC-008: Fallback text styling matches ticker-event class (no current class)

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the fallback `<span>` has the `ticker-event` class but NOT the `current` class. The `current` class (green, bold) is reserved for active event headlines.

### Preconditions

- `scenario: 'live'`
- No events (fallback is displayed)

### Steps

1. Render `LiveTicker` with empty events.
   **Expected:** Fallback text renders in a `<span>`.

2. Inspect the fallback `<span>` element's CSS classes.
   **Expected:** It has the `ticker-event` class. It does NOT have the `current` class.

3. Verify visual appearance: the text should be `color: var(--color-text-secondary)`, `font-size: 13px`, normal weight.
   **Expected:** Text appears in the secondary text color, not the green/bold style used for live events.

### Test Data

- `scenario: 'live'`
- `unifiedTimeline: []`
- `history: []`

### Edge Cases

- On mobile viewport (< 600px), font-size should be `12px` per the media query.

---

## TC-009: Fallback text truncates with ellipsis on narrow viewports

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the fallback text respects the `text-overflow: ellipsis`, `white-space: nowrap`, and `overflow: hidden` CSS rules when the container is narrow.

### Preconditions

- `scenario: 'live'`
- No events (fallback displayed)
- Viewport is narrow enough that fallback text would overflow

### Steps

1. Render `LiveTicker` in a container narrower than the fallback text width.
   **Expected:** The text does not wrap. It truncates with an ellipsis ("...").

2. Expand the container to full width.
   **Expected:** The full fallback text is visible without truncation.

### Test Data

- Viewport width: ~200px (narrow), then ~800px (wide)
- Fallback text: "Live game updates as they happen" (or data-driven headline)

### Edge Cases

- If using a data-driven headline that is very long (e.g., "Super Bowl LX: Chiefs vs 49ers - Live from New Orleans"), verify it truncates gracefully.

---

## TC-010: History fallback still works when unified timeline is empty but history has events

**Priority:** P1
**Type:** Regression

### Objective

Ensure the change did not break the existing fallback chain: `currentEvent` → `recentEvents[0].headline` → `historyEvents[0].action` → generic fallback. Specifically, verify the history-based fallback still takes precedence over the generic fallback when history events exist.

### Preconditions

- `scenario: 'live'`
- `unifiedTimeline` is empty
- `history` contains actionable entries (not just "Scenario loaded")

### Steps

1. Render `LiveTicker` with `unifiedTimeline: []` and `history: [{ action: 'Scenario loaded', tick: 0 }, { action: 'Player price updated', tick: 1 }]`.
   **Expected:** The ticker displays "Player price updated" (from the history fallback), NOT the generic fallback text.

2. Render with `history: [{ action: 'Scenario loaded', tick: 0 }]` only.
   **Expected:** "Scenario loaded" is filtered out. The generic fallback text is shown instead.

### Test Data

- `history: [{ action: 'Scenario loaded', tick: 0 }, { action: 'Player price updated', tick: 1 }]`
- `unifiedTimeline: []`

### Edge Cases

- `history` contains multiple non-"Scenario loaded" entries — the most recent one (last after `.reverse()`) should display, not the generic fallback.
