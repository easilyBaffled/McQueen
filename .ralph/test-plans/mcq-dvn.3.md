# Test Plan: mcq-dvn.3 -- Add loading state to ScenarioToggle during scenario switches

## Summary

- **Bead:** `mcq-dvn.3`
- **Feature:** Visual loading indicator on the active ScenarioToggle tab while scenario data is being fetched
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Active tab shows loading indicator when scenarioLoading is true

**Priority:** P0
**Type:** Functional

### Objective

Verify the core requirement: when `scenarioLoading` is true from `useScenario()`, the active tab receives the `loading` CSS class that produces a visual loading indicator.

### Preconditions

- ScenarioToggle component is rendered within providers
- `useScenario()` is mocked or configured to return `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with scenario set to `midweek` and `scenarioLoading: true`
   **Expected:** The active tab (Midweek) has the `loading` CSS module class applied

2. Inspect the active tab's class list
   **Expected:** The class list includes the hashed equivalent of `styles['loading']`

### Test Data

- Scenario: `midweek`
- `scenarioLoading: true`

### Edge Cases

- Verify the loading class is on the active tab only, not on inactive tabs

---

## TC-002: Loading indicator clears when data finishes loading

**Priority:** P0
**Type:** Functional

### Objective

Verify AC #2: the loading state clears once scenario data has finished loading (i.e., `scenarioLoading` transitions from `true` to `false`).

### Preconditions

- ScenarioToggle is rendered with `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with `scenarioLoading: true` and scenario `midweek`
   **Expected:** Active tab has the `loading` class

2. Re-render or update the mock so `scenarioLoading` becomes `false`
   **Expected:** Active tab no longer has the `loading` class

### Test Data

- Scenario: `midweek`
- Toggle `scenarioLoading` from `true` to `false`

### Edge Cases

- Verify that the tab remains visually active (has `active` class) after loading completes — only the loading indicator is removed

---

## TC-003: Loading indicator appears on the correct tab after switching scenarios

**Priority:** P0
**Type:** Functional

### Objective

When a user clicks a different scenario tab, the newly selected tab should show the loading indicator while data loads, not the previously active tab.

### Preconditions

- ScenarioToggle is rendered with scenario `midweek`, `scenarioLoading: false`

### Steps

1. Click the "Live Game" tab
   **Expected:** `setScenario` is called with `'live'`

2. Re-render with scenario `live` and `scenarioLoading: true`
   **Expected:** The "Live Game" tab has the `loading` class; the "Midweek" tab does not

3. Update `scenarioLoading` to `false`
   **Expected:** The "Live Game" tab no longer has the `loading` class, but still has the `active` class

### Test Data

- Initial scenario: `midweek`
- Target scenario: `live`

### Edge Cases

- Repeat for every scenario pair (midweek→playoffs, live→superbowl, etc.) to confirm no scenario-specific bugs

---

## TC-004: Quick successive scenario switches do not cause visual glitches

**Priority:** P1
**Type:** Functional

### Objective

Verify AC #3: rapidly switching between scenarios does not leave stale loading indicators or cause the loading class to stick on the wrong tab.

### Preconditions

- ScenarioToggle is rendered with scenario `midweek`, `scenarioLoading: false`

### Steps

1. Click "Live Game" tab, immediately click "Playoffs" tab, then immediately click "Super Bowl" tab (three rapid clicks)
   **Expected:** `setScenario` is called three times with `'live'`, `'playoffs'`, `'superbowl'` in order

2. Re-render with scenario `superbowl` and `scenarioLoading: true`
   **Expected:** Only the "Super Bowl" tab has the `loading` class; no other tab shows loading

3. Set `scenarioLoading` to `false`
   **Expected:** "Super Bowl" tab loses the `loading` class cleanly; no residual loading indicator on any tab

### Test Data

- Rapid scenario sequence: `midweek` → `live` → `playoffs` → `superbowl`

### Edge Cases

- Verify that the `loadIdRef` race-condition guard in ScenarioContext correctly discards stale loads (integration-level concern)
- Verify no flash of loading on intermediate tabs that were briefly active

---

## TC-005: Loading class is absent when scenarioLoading is false (default state)

**Priority:** P1
**Type:** Regression

### Objective

Ensure that under normal non-loading conditions, no tab has the `loading` class applied. This guards against a broken conditional that always applies the class.

### Preconditions

- ScenarioToggle rendered with `scenarioLoading: false`

### Steps

1. Render ScenarioToggle with scenario `midweek` and `scenarioLoading: false`
   **Expected:** No tab element has the `loading` class

2. Check each of the 5 scenario tabs individually
   **Expected:** None have the `loading` class in their className

### Test Data

- Scenario: `midweek`
- `scenarioLoading: false`

### Edge Cases

- Verify for every scenario value (`midweek`, `live`, `playoffs`, `superbowl`, `espn-live`)

---

## TC-006: CSS `.loading` class defines a subtle pulse animation

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that `ScenarioToggle.module.css` contains a `.loading` class with a pulse or similar animation that is visually subtle and non-disruptive.

### Preconditions

- Access to `ScenarioToggle.module.css`

### Steps

1. Inspect `.loading` class definition in `ScenarioToggle.module.css`
   **Expected:** Class exists and defines an `animation` property referencing a pulse-style keyframe

2. Verify the animation is subtle (short duration, low-contrast opacity or scale change)
   **Expected:** Animation uses `opacity` or `background` transitions, not jarring color changes or large scale transforms. Duration should be in the range of 1–3 seconds.

3. Verify the animation loops (`infinite` or similar)
   **Expected:** Animation repeats while the class is applied

### Test Data

- N/A (CSS inspection)

### Edge Cases

- Ensure the animation does not conflict with the existing `pulse` keyframe used by `.live-dot`
- Ensure the keyframe name is unique or scoped by CSS Modules

---

## TC-007: Loading indicator works on mobile dropdown active item

**Priority:** P1
**Type:** Functional

### Objective

The design notes mention modifying the active tab class. Verify that the mobile dropdown's active item also reflects the loading state, since mobile uses a different rendering path (dropdown vs. tabs).

### Preconditions

- Viewport simulates mobile (≤768px) or test targets the mobile dropdown DOM
- `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with scenario `midweek` and `scenarioLoading: true`
   **Expected:** Mobile dropdown trigger or active mobile item has a visual loading indicator

2. Open the mobile dropdown
   **Expected:** The active item (Midweek) shows a loading state or the trigger button itself indicates loading

3. Set `scenarioLoading` to `false`
   **Expected:** Loading indicator is removed from the mobile view

### Test Data

- Scenario: `midweek`
- `scenarioLoading: true`

### Edge Cases

- If the implementation only targets desktop tabs, this test documents a gap to flag for design review

---

## TC-008: Loading indicator does not break tab accessibility attributes

**Priority:** P1
**Type:** Regression

### Objective

Adding a conditional `loading` class must not interfere with existing ARIA attributes (`role="tab"`, `aria-selected`, `tabIndex`).

### Preconditions

- ScenarioToggle rendered with `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with scenario `midweek` and `scenarioLoading: true`
   **Expected:** Active tab still has `role="tab"`, `aria-selected="true"`, and `tabIndex="0"`

2. Check inactive tabs
   **Expected:** Inactive tabs still have `aria-selected="false"` and `tabIndex="-1"`

3. Verify `tablist` role on parent container
   **Expected:** Parent div still has `role="tablist"` and `aria-label="Demo scenarios"`

### Test Data

- Scenario: `midweek`
- `scenarioLoading: true`

### Edge Cases

- Verify keyboard navigation (ArrowLeft/ArrowRight) still works during loading state

---

## TC-009: Loading animation on ESPN Live tab does not conflict with existing ESPN styles

**Priority:** P2
**Type:** UI/Visual

### Objective

The ESPN Live tab has its own gradient background and loading spinner for ESPN news refresh. Verify that the scenario loading indicator coexists cleanly with ESPN-specific styling.

### Preconditions

- Scenario set to `espn-live`
- `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with scenario `espn-live` and `scenarioLoading: true`
   **Expected:** The ESPN Live tab shows the scenario loading indicator (pulse animation from `.loading` class)

2. Also set `espnLoading: true` (ESPN news is also loading)
   **Expected:** Both the scenario loading pulse and the ESPN refresh spinner are visible without visual collision

3. Set `scenarioLoading: false` but keep `espnLoading: true`
   **Expected:** Scenario loading pulse stops; ESPN spinner continues independently

### Test Data

- Scenario: `espn-live`
- `scenarioLoading: true`, `espnLoading: true`

### Edge Cases

- Verify the ESPN tab gradient background (`linear-gradient(135deg, #cc0000, #990000)`) still renders through the pulse animation

---

## TC-010: Loading indicator on Super Bowl tab coexists with LIVE badge

**Priority:** P2
**Type:** UI/Visual

### Objective

The Super Bowl tab shows a "LIVE" indicator with a pulsing dot when active. Verify the loading class animation does not conflict visually with the LIVE dot pulse.

### Preconditions

- Scenario set to `superbowl`
- `scenarioLoading: true`

### Steps

1. Render ScenarioToggle with scenario `superbowl` and `scenarioLoading: true`
   **Expected:** "Super Bowl" tab shows both the LIVE badge and the loading indicator

2. Verify the two animations are distinguishable
   **Expected:** The loading pulse (on the tab background/container) and the LIVE dot pulse (on the dot element) are separate and do not merge into a confusing visual

3. Set `scenarioLoading: false`
   **Expected:** Loading pulse stops; LIVE dot pulse continues

### Test Data

- Scenario: `superbowl`
- `scenarioLoading: true`

### Edge Cases

- Same check for the `live` scenario which also has a LIVE indicator

---

## TC-011: Tab click during loading state still triggers scenario switch

**Priority:** P1
**Type:** Functional

### Objective

The loading indicator should be purely visual; it must not prevent user interaction. Clicking a different tab while loading should still call `setScenario`.

### Preconditions

- ScenarioToggle rendered with `scenarioLoading: true`, scenario `midweek`

### Steps

1. While `scenarioLoading` is `true`, click the "Playoffs" tab
   **Expected:** `setScenario` is called with `'playoffs'`

2. Verify the click is not blocked or swallowed
   **Expected:** The tab `onClick` handler fires normally

### Test Data

- Current scenario: `midweek` (loading)
- Target scenario: `playoffs`

### Edge Cases

- Verify the same behavior for keyboard activation (pressing Enter/Space on a focused tab while loading)

---

## TC-012: Conditional class string is well-formed (no "undefined" or "false" in className)

**Priority:** P1
**Type:** Regression

### Objective

The design specifies `${scenarioLoading ? styles['loading'] : ''}`. Verify the template literal does not inject the string `"undefined"` or `"false"` into the DOM className when not loading.

### Preconditions

- ScenarioToggle rendered with `scenarioLoading: false`

### Steps

1. Render ScenarioToggle with scenario `midweek` and `scenarioLoading: false`
   **Expected:** Active tab's `className` does not contain the literal strings `"undefined"`, `"false"`, or `"null"`

2. Render with `scenarioLoading: true`
   **Expected:** Active tab's `className` does not contain `"undefined"`, `"false"`, or `"null"` — only valid class names

### Test Data

- Both `scenarioLoading: true` and `scenarioLoading: false`

### Edge Cases

- Verify for a scenario where `styles['loading']` might not be defined in the CSS module yet (returns `undefined` from the import) — the className should not contain the string "undefined"
