# Test Plan: mcq-dvn.3 -- Add loading state to ScenarioToggle during scenario switches

## Summary

- **Bead:** `mcq-dvn.3`
- **Feature:** Visual loading indicator (pulse animation) on the active ScenarioToggle tab while scenario data is loading
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Active tab receives loading class when scenarioLoading is true

**Priority:** P0
**Type:** Functional

### Objective

Verify that the active scenario tab gains the `.loading` CSS class when `scenarioLoading` is `true`, ensuring the user receives visual feedback during a scenario switch.

### Preconditions

- ScenarioToggle is rendered with a known active scenario (e.g., `midweek`)
- `scenarioLoading` is set to `true` in the ScenarioContext

### Steps

1. Render ScenarioToggle with `scenario: 'live'` and `scenarioLoading: true`
   **Expected:** The active tab (Live Game) has both `active` and `loading` in its class list

2. Inspect the DOM element for the active tab button
   **Expected:** `element.className` matches the pattern `/loading/`

### Test Data

- Scenario override: `{ scenario: 'live', scenarioLoading: true }`

### Edge Cases

- Verify the loading class is present on the very first render (initial scenario load), not only on subsequent switches

---

## TC-002: Loading class is removed when scenarioLoading becomes false

**Priority:** P0
**Type:** Functional

### Objective

Verify that once scenario data finishes loading, the `.loading` class is removed from the active tab so the pulse animation stops.

### Preconditions

- ScenarioToggle is rendered with `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with `scenario: 'live'` and `scenarioLoading: true`
   **Expected:** Active tab has the `loading` class

2. Re-render with `scenarioLoading: false`
   **Expected:** Active tab no longer has the `loading` class

### Test Data

- Initial: `{ scenario: 'live', scenarioLoading: true }`
- Updated: `{ scenario: 'live', scenarioLoading: false }`

### Edge Cases

- Verify removal happens even if the scenario value itself hasn't changed (only the loading flag toggled)

---

## TC-003: Only the active tab receives the loading class

**Priority:** P0
**Type:** Functional

### Objective

Ensure that inactive tabs never receive the `.loading` class, even when `scenarioLoading` is true. Only the currently selected tab should pulse.

### Preconditions

- ScenarioToggle is rendered with a specific active scenario and `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with `scenario: 'midweek'` and `scenarioLoading: true`
   **Expected:** The Midweek tab has the `loading` class

2. Query all tab buttons that are NOT the active tab
   **Expected:** None of the inactive tabs (Live Game, Playoffs, Super Bowl, ESPN Live) have the `loading` class in their className

### Test Data

- `{ scenario: 'midweek', scenarioLoading: true }`

### Edge Cases

- Repeat the check for each scenario id (`live`, `playoffs`, `superbowl`, `espn-live`) as the active scenario to confirm the condition is always scoped to the active tab only

---

## TC-004: Loading class not applied when scenarioLoading is false

**Priority:** P1
**Type:** Functional

### Objective

Confirm that when `scenarioLoading` is `false`, no tab has the `.loading` class — the normal idle state is clean.

### Preconditions

- ScenarioToggle rendered in steady state

### Steps

1. Render ScenarioToggle with `scenario: 'midweek'` and `scenarioLoading: false`
   **Expected:** No tab element on the page has `loading` in its class list

2. Query all `[role="tab"]` elements and inspect each className
   **Expected:** Zero matches for `/loading/`

### Test Data

- `{ scenario: 'midweek', scenarioLoading: false }`

### Edge Cases

- None

---

## TC-005: Pulse animation CSS keyframes exist in the stylesheet

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the `.loading` class and the `tab-pulse` keyframe animation are correctly defined in `ScenarioToggle.module.css`.

### Preconditions

- Access to `ScenarioToggle.module.css`

### Steps

1. Open `src/components/ScenarioToggle/ScenarioToggle.module.css`
   **Expected:** A rule `.scenario-tab.loading .scenario-tab-bg` exists with `animation: tab-pulse 1s ease-in-out infinite`

2. Verify the `@keyframes tab-pulse` block is defined
   **Expected:** Keyframes animate opacity from `1` at 0%/100% to `0.6` at 50%

### Test Data

- N/A (static CSS inspection)

### Edge Cases

- Confirm the animation is `infinite` (loops continuously while loading persists)
- Confirm timing function is `ease-in-out` for a smooth/subtle effect

---

## TC-006: Pulse animation targets the tab background element

**Priority:** P1
**Type:** UI/Visual

### Objective

Confirm the pulse animation applies to `.scenario-tab-bg` (the background layer) rather than the entire tab or its text content, keeping text readable during loading.

### Preconditions

- ScenarioToggle rendered with `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with `scenario: 'live'` and `scenarioLoading: true`
   **Expected:** The active tab has the `loading` class on the `<button>` element

2. Inspect the `.scenario-tab-bg` motion div inside the active tab
   **Expected:** The CSS rule `.scenario-tab.loading .scenario-tab-bg` applies the `tab-pulse` animation to this child element, not the tab button itself

3. Verify the tab label text (e.g., "Live Game") remains at full opacity
   **Expected:** Text content within `.scenario-tab-content` is not affected by the pulse animation since `.scenario-tab-content` has `z-index: 1` above the background

### Test Data

- `{ scenario: 'live', scenarioLoading: true }`

### Edge Cases

- None

---

## TC-007: Loading state works correctly for the ESPN Live tab

**Priority:** P1
**Type:** Functional

### Objective

Verify that the ESPN Live tab, which has special styling (red gradient background), still correctly shows the loading pulse when `scenarioLoading` is true.

### Preconditions

- ScenarioToggle rendered with `espn-live` scenario

### Steps

1. Render ScenarioToggle with `scenario: 'espn-live'` and `scenarioLoading: true`
   **Expected:** The ESPN Live tab has both `active`, `espn-tab`, and `loading` classes

2. Verify the `tab-pulse` animation still applies despite the ESPN-specific background gradient
   **Expected:** The `.scenario-tab.loading .scenario-tab-bg` rule activates regardless of the `.espn-tab.active .scenario-tab-bg` gradient override

### Test Data

- `{ scenario: 'espn-live', scenarioLoading: true }`

### Edge Cases

- Confirm ESPN indicator badge and refresh button remain visible and functional during loading

---

## TC-008: ScenarioContext sets scenarioLoading to true on scenario switch

**Priority:** P0
**Type:** Integration

### Objective

Verify that the ScenarioContext provider sets `scenarioLoading` to `true` immediately when `setScenario` is called, then back to `false` after the scenario data loads.

### Preconditions

- ScenarioProvider wrapping a test component that reads `scenarioLoading`

### Steps

1. Render a component within ScenarioProvider, initial scenario is `midweek`
   **Expected:** After initial load completes, `scenarioLoading` is `false`

2. Call `setScenario('live')` via the context
   **Expected:** `scenarioLoading` immediately becomes `true`

3. Wait for the dynamic import of `live.json` to resolve
   **Expected:** `scenarioLoading` transitions back to `false`

### Test Data

- Default scenario: `midweek`
- Target scenario: `live`

### Edge Cases

- Verify that if the scenario loader fails (e.g., invalid scenario ID with no loader), `scenarioLoading` is still set back to `false`
- Verify the cancelled flag prevents stale loads from clearing a newer loading state

---

## TC-009: Rapid scenario switching shows loading for the latest selection only

**Priority:** P1
**Type:** Integration

### Objective

Verify that when a user clicks multiple scenario tabs in quick succession, only the final selected scenario shows the loading indicator, and stale loads are cancelled.

### Preconditions

- ScenarioToggle rendered with empty portfolio (no confirmation dialog)

### Steps

1. Render ScenarioToggle with `scenario: 'midweek'` and empty portfolio
   **Expected:** Midweek tab is active, no loading class

2. Click the "Live Game" tab
   **Expected:** `setScenario('live')` is called

3. Immediately click the "Playoffs" tab before Live Game finishes loading
   **Expected:** `setScenario('playoffs')` is called; the active tab moves to Playoffs

4. Wait for data to finish loading
   **Expected:** The Playoffs tab is active and loading resolves; the Live Game load is cancelled and does not flash a loading indicator

### Test Data

- Portfolio: `{}`

### Edge Cases

- Repeat with three or more rapid consecutive clicks across different tabs

---

## TC-010: Clicking the already-active tab does not trigger loading

**Priority:** P2
**Type:** Functional

### Objective

Verify that clicking a tab that is already selected does not re-trigger `setScenario` or cause a spurious loading state.

### Preconditions

- ScenarioToggle rendered with `scenario: 'midweek'`, `scenarioLoading: false`

### Steps

1. Click the already-active "Midweek" tab
   **Expected:** `setScenario` is NOT called (the `requestScenarioSwitch` function returns early when `id === scenario`)

2. Verify the tab's class list
   **Expected:** No `loading` class is applied; the tab remains in its normal active state

### Test Data

- `{ scenario: 'midweek', scenarioLoading: false }`

### Edge Cases

- Also verify via the mobile dropdown: selecting the already-active item should have no effect

---

## TC-011: Mobile dropdown does not show loading indicator

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the mobile dropdown trigger and menu do not display the pulse loading animation (the loading class is only applied to the desktop tab bar). The mobile UX relies on the dropdown closing as confirmation.

### Preconditions

- ScenarioToggle rendered at mobile viewport (< 768px) with `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with `scenario: 'live'` and `scenarioLoading: true`
   **Expected:** The mobile dropdown trigger button does not have a `loading` class

2. Open the mobile dropdown and inspect all dropdown items
   **Expected:** No dropdown item has a `loading` class or pulse animation

### Test Data

- `{ scenario: 'live', scenarioLoading: true }`

### Edge Cases

- Verify that the mobile dropdown trigger still shows the correct current scenario label during loading (e.g., "Live Game")

---

## TC-012: Loading state and confirmation dialog do not conflict

**Priority:** P2
**Type:** Functional

### Objective

Verify that when a user switches scenarios with a non-empty portfolio, the confirmation dialog appears and the loading state only begins after the user confirms the switch.

### Preconditions

- ScenarioToggle rendered with a non-empty portfolio

### Steps

1. Render ScenarioToggle with `scenario: 'midweek'` and portfolio `{ mahomes: { shares: 5, avgCost: 100 } }`
   **Expected:** No loading class on any tab

2. Click the "Live Game" tab
   **Expected:** Confirmation dialog appears; `setScenario` has NOT been called yet; no loading class appears

3. Click "Switch & Reset" in the dialog
   **Expected:** `setScenario('live')` is called; at this point `scenarioLoading` transitions to `true` and the active tab (now Live Game) should display the loading class

4. Wait for scenario data to load
   **Expected:** `scenarioLoading` becomes `false`; loading class is removed

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- Click "Cancel" instead of "Switch & Reset" — verify no loading state is triggered and the original tab remains active without any loading class
