# Test Plan: mcq-dvn.2 -- Add simplified live simulation indicator for non-dev users

## Summary

- **Bead:** `mcq-dvn.2`
- **Feature:** Simplified simulation indicator with play/pause toggle visible to non-dev users during live and Super Bowl scenarios, rendered as a second path within TimelineDebugger
- **Total Test Cases:** 15
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Simplified indicator renders for non-dev users in live scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `isDevMode()` returns false and the scenario is `live`, the TimelineDebugger component renders a simplified indicator instead of returning null.

### Preconditions

- `isDevMode()` returns `false`
- Scenario is set to `live`
- SimulationContext is available with `isPlaying` and `setIsPlaying`

### Steps

1. Render `TimelineDebugger` with scenario `live` and dev mode off.
   **Expected:** Component renders a visible element (not `null`). The container has child content.

2. Inspect the rendered output.
   **Expected:** A minimal div is present containing a "Live simulation" label and a play/pause button. The full debugger panel (timeline track, history list, tick badge, "Timeline Debugger" toggle) is NOT rendered.

### Test Data

- `isDevMode()` mocked to return `false`
- Scenario: `'live'`

### Edge Cases

- Ensure the simplified indicator does not contain any dev-mode-only elements (history list, timeline track, "Simulation Timeline" header, rewind hint text).

---

## TC-002: Simplified indicator renders for non-dev users in superbowl scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that the simplified indicator also appears for the `superbowl` scenario when dev mode is off.

### Preconditions

- `isDevMode()` returns `false`
- Scenario is set to `superbowl`

### Steps

1. Render `TimelineDebugger` with scenario `superbowl` and dev mode off.
   **Expected:** The simplified indicator is rendered with a "Live simulation" label and a play/pause button.

2. Confirm the full debugger panel is absent.
   **Expected:** No timeline track, history list, or expand/collapse toggle present.

### Test Data

- `isDevMode()` mocked to return `false`
- Scenario: `'superbowl'`

### Edge Cases

- None beyond TC-001 coverage.

---

## TC-003: Component returns null for non-live scenarios when dev mode is off

**Priority:** P0
**Type:** Functional

### Objective

Verify that the TimelineDebugger returns null for scenarios other than `live` and `superbowl` when dev mode is off. Non-live users should not see any indicator.

### Preconditions

- `isDevMode()` returns `false`
- Scenario is set to a non-live value

### Steps

1. Render `TimelineDebugger` with scenario `midweek` and dev mode off.
   **Expected:** Component returns `null`; container has no child elements.

2. Repeat with scenario `playoffs`.
   **Expected:** Component returns `null`.

3. Repeat with scenario `espn-live`.
   **Expected:** Component returns `null`.

### Test Data

- `isDevMode()` mocked to return `false`
- Scenarios: `'midweek'`, `'playoffs'`, `'espn-live'`

### Edge Cases

- If the scenario value is an empty string or undefined (edge case from ScenarioContext), the component should return null rather than crash.

---

## TC-004: Full debugger renders in dev mode regardless of scenario (regression)

**Priority:** P0
**Type:** Regression

### Objective

Verify that the existing full TimelineDebugger behavior is preserved when `isDevMode()` returns true. The new simplified path must not interfere with the original rendering.

### Preconditions

- `isDevMode()` returns `true`

### Steps

1. Render `TimelineDebugger` with dev mode on and scenario `live`.
   **Expected:** The full debugger renders with the "Timeline Debugger" toggle button, tick badge, and expandable panel — NOT the simplified indicator.

2. Click the "Timeline Debugger" toggle button.
   **Expected:** The debugger panel expands, showing "Simulation Timeline" header, timeline track, history list, and hint text.

3. Render `TimelineDebugger` with dev mode on and scenario `midweek`.
   **Expected:** The full debugger still renders (dev mode enables it for all scenarios).

4. Render `TimelineDebugger` with dev mode on and scenario `superbowl`.
   **Expected:** The full debugger renders, not the simplified indicator.

### Test Data

- `isDevMode()` mocked to return `true`
- Scenarios: `'live'`, `'midweek'`, `'superbowl'`

### Edge Cases

- Ensure the simplified indicator CSS classes are not applied when in dev mode.
- Confirm dev mode toggle via `?dev=true` URL param still enables the full debugger.

---

## TC-005: Play/pause button toggles simulation state

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the play/pause button on the simplified indicator calls `setIsPlaying` with the toggled value from `useSimulation()`.

### Preconditions

- `isDevMode()` returns `false`
- Scenario is `live`
- `isPlaying` is initially `true`

### Steps

1. Render `TimelineDebugger` with `isPlaying = true`.
   **Expected:** The button displays a pause icon (SVG).

2. Click the play/pause button.
   **Expected:** `setIsPlaying(false)` is called exactly once.

3. Re-render with `isPlaying = false`.
   **Expected:** The button now displays a play icon (SVG).

4. Click the play/pause button again.
   **Expected:** `setIsPlaying(true)` is called exactly once.

### Test Data

- `isPlaying`: `true`, then `false`
- `setIsPlaying`: mock function from `useSimulation`

### Edge Cases

- Rapid double-click: verify `setIsPlaying` is called twice with alternating values (no unexpected debounce blocking).

---

## TC-006: Simplified indicator shows "Live simulation" label

**Priority:** P1
**Type:** Functional

### Objective

Verify that the simplified indicator displays a "Live simulation" label as specified in the design notes.

### Preconditions

- `isDevMode()` returns `false`
- Scenario is `live` or `superbowl`

### Steps

1. Render `TimelineDebugger` with scenario `live` and dev mode off.
   **Expected:** Text content includes "Live simulation".

2. Render with scenario `superbowl`.
   **Expected:** Same "Live simulation" label text is displayed.

### Test Data

- Scenarios: `'live'`, `'superbowl'`

### Edge Cases

- Verify label text does not change based on `isPlaying` state (the label is static; only the button icon changes).

---

## TC-007: Play icon and pause icon render correctly based on isPlaying state

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the correct SVG icon is shown: pause icon when simulation is playing, play icon when paused.

### Preconditions

- Simplified indicator is rendered (non-dev mode, live scenario)

### Steps

1. Render with `isPlaying = true`.
   **Expected:** The button contains an SVG with the pause icon path (`M6 19h4V5H6v14zm8-14v14h4V5h-4z`).

2. Render with `isPlaying = false`.
   **Expected:** The button contains an SVG with the play icon path (`M8 5v14l11-7z`).

### Test Data

- `isPlaying`: `true` and `false`

### Edge Cases

- Verify only one SVG icon is present at a time inside the button (not both hidden/shown via CSS).

---

## TC-008: Simplified indicator uses new CSS classes from TimelineDebugger.module.css

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the simplified view uses new, distinct CSS classes defined in `TimelineDebugger.module.css`, separate from the full debugger classes.

### Preconditions

- Simplified indicator is rendered

### Steps

1. Render the simplified indicator and inspect the root element's className.
   **Expected:** The root div uses a new simplified-view CSS class from the TimelineDebugger module CSS, distinct from `timeline-debugger`.

2. Inspect the play/pause button's className.
   **Expected:** Uses a new CSS class defined for the simplified view, not `control-btn` or `debugger-toggle`.

3. Verify that `TimelineDebugger.module.css` contains new class definitions for the simplified view.
   **Expected:** At least one new CSS class exists (e.g., for the simplified container, label, and toggle button).

### Test Data

- Standard render in non-dev mode, live scenario

### Edge Cases

- Verify no classes from the full debugger panel (e.g., `debugger-panel`, `debugger-toggle`, `history-list`, `tick-badge`) are present in the simplified view's DOM.

---

## TC-009: Simplified indicator has minimal DOM structure

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the simplified indicator DOM is intentionally minimal: a container div, a label, and a play/pause button. No expandable panels, no history list, no timeline track.

### Preconditions

- Simplified indicator is rendered

### Steps

1. Render the simplified indicator and count the total number of direct child elements in the root container.
   **Expected:** The root div contains only 2–3 direct children (label/text element and button). No nested panels or lists.

2. Query for elements that belong to the full debugger: `[class*="debugger-panel"]`, `[class*="history-list"]`, `[class*="timeline-track"]`, `[class*="tick-badge"]`.
   **Expected:** None of these elements exist in the document.

### Test Data

- Standard render in non-dev mode, live scenario

### Edge Cases

- Ensure no `AnimatePresence` or `motion.div` wrappers are rendered in the simplified path.

---

## TC-010: Play/pause button has accessible aria-label

**Priority:** P1
**Type:** Functional

### Objective

Verify the play/pause button on the simplified indicator has an appropriate `aria-label` for screen readers that updates based on state.

### Preconditions

- Simplified indicator is rendered

### Steps

1. Render with `isPlaying = true`.
   **Expected:** Button is discoverable via `getByRole('button', { name: /pause simulation/i })`.

2. Render with `isPlaying = false`.
   **Expected:** Button is discoverable via `getByRole('button', { name: /play simulation/i })`.

### Test Data

- `isPlaying`: `true` and `false`

### Edge Cases

- Ensure `aria-label` dynamically reflects the current state, not a static string.

---

## TC-011: Simplified indicator reads state from useSimulation hook (not local state)

**Priority:** P1
**Type:** Integration

### Objective

Verify the simplified indicator reads `isPlaying` and calls `setIsPlaying` from the `useSimulation()` context hook, ensuring it controls the same shared simulation state as other components.

### Preconditions

- `useSimulation` is mocked to return controlled `isPlaying` and `setIsPlaying`

### Steps

1. Mock `useSimulation` to return `{ isPlaying: true, setIsPlaying: mockFn }`.
   **Expected:** The indicator reflects playing state (pause icon shown).

2. Click the toggle button.
   **Expected:** The mock `setIsPlaying` from `useSimulation` is called with `false`.

3. Change mock to return `{ isPlaying: false, setIsPlaying: mockFn }` and re-render.
   **Expected:** The indicator reflects paused state (play icon shown).

### Test Data

- Mocked `useSimulation` return values

### Edge Cases

- Ensure no `useState` within the simplified path manages play/pause independently of context.

---

## TC-012: Simplified indicator requires scenario from useScenario hook

**Priority:** P1
**Type:** Integration

### Objective

The current `TimelineDebugger` does not import `useScenario`. The implementation must add this dependency to check whether the scenario is `live` or `superbowl`. Verify the component correctly reads the scenario from context.

### Preconditions

- `ScenarioContext` provides `scenario` value
- `isDevMode()` returns `false`

### Steps

1. Render `TimelineDebugger` with `ScenarioContext` providing `scenario = 'live'`.
   **Expected:** Simplified indicator is rendered.

2. Change `ScenarioContext` to provide `scenario = 'midweek'` and re-render.
   **Expected:** Component returns `null`.

3. Render without `ScenarioContext` available (missing provider).
   **Expected:** Component either throws a context error or gracefully returns `null` (depending on hook implementation).

### Test Data

- ScenarioContext: `{ scenario: 'live' }`, `{ scenario: 'midweek' }`

### Edge Cases

- Verify the component does not hardcode scenario checks but reads from context dynamically.

---

## TC-013: No conflicting duplication with existing SimulationIndicator component

**Priority:** P1
**Type:** Integration

### Objective

The existing `SimulationIndicator` component already renders for non-dev users in live/superbowl scenarios (it returns `null` when `isDevMode()` is true OR scenario is not live/superbowl). Verify the two components do not create confusing duplication in the UI.

### Preconditions

- Non-dev mode, live scenario
- Both `TimelineDebugger` and `SimulationIndicator` are rendered in the component tree

### Steps

1. Render a test harness containing both `TimelineDebugger` and `SimulationIndicator` with scenario `live` and dev mode off.
   **Expected:** Either only one indicator is visible (if one component defers to the other), or if both render, they are in distinct locations without overlapping controls.

2. Count the number of play/pause toggle buttons in the DOM.
   **Expected:** At most one play/pause toggle is rendered, OR if two exist, they both control the same shared `isPlaying` state from `useSimulation` and are visually distinct.

3. Click a play/pause toggle.
   **Expected:** `setIsPlaying` is called once (not twice from two listeners on the same click).

### Test Data

- Full layout render with both components in the tree

### Edge Cases

- If the implementation intention is to replace `SimulationIndicator` with the new TimelineDebugger path, verify `SimulationIndicator` is either removed from the tree or conditionally hidden.
- If both co-exist, verify clicking one updates the displayed state in the other (since they share `useSimulation` context).

---

## TC-014: Simplified indicator visual styling and layout

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify the simplified indicator's visual styling: it should appear as a compact, non-intrusive element consistent with the app's design language.

### Preconditions

- New CSS classes for the simplified view are defined in `TimelineDebugger.module.css`

### Steps

1. Render the simplified indicator and inspect computed styles of the root container.
   **Expected:** The container uses flex layout with centered alignment, appropriate padding and gap. Styling is consistent with the app's design tokens (uses `var(--color-*)`, `var(--radius-*)` variables).

2. Inspect the play/pause button's computed styles.
   **Expected:** Button has appropriate size (at least 24x24px for tap targets), border-radius, hover state, and `cursor: pointer`.

3. Verify the label text styling.
   **Expected:** Font size is small (12–13px), weight is semibold or bold, and color uses a theme variable.

### Test Data

- Standard render

### Edge Cases

- Verify the simplified indicator does not overlap with the full debugger's fixed positioning (`position: fixed; bottom: 24px; right: 24px`) or other fixed UI elements.

---

## TC-015: Responsive behavior on narrow viewports

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify the simplified indicator remains usable on small screens. The full debugger's CSS already has a `@media (max-width: 500px)` breakpoint; the simplified view should also handle narrow viewports.

### Preconditions

- Viewport width set to 375px or narrower
- Non-dev mode, live scenario

### Steps

1. Render the simplified indicator at 375px viewport width.
   **Expected:** The indicator is fully visible, not clipped or overflowing. Label text and button are both accessible and readable.

2. Click the play/pause button at narrow viewport.
   **Expected:** Button is tappable (sufficient hit target, at least 24x24px) and `setIsPlaying` is called.

### Test Data

- Viewport: 375px width

### Edge Cases

- Verify at 320px width (smallest common device width) the indicator still renders without horizontal overflow.
- Verify the indicator does not interfere with primary page content on mobile.
