# Test Plan: mcq-8hr.4 -- Add Vitest tests for Mission page (0% coverage)

## Summary

- **Bead:** `mcq-8hr.4`
- **Feature:** Mission page wrapper that renders the DailyMission component, displays a help/tips panel with toggle button, and persists the user's help-seen state via localStorage
- **Total Test Cases:** 14
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Mission page renders without crashing

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Mission component mounts successfully when DailyMission and framer-motion are mocked, producing a visible page with no runtime errors.

### Preconditions

- `DailyMission` component is mocked (e.g., `vi.mock('../../components/DailyMission/DailyMission')`) to render a simple placeholder
- `framer-motion` is mocked so `motion.div` and `AnimatePresence` render their children without animation logic
- `localStorage` is cleared before the test

### Steps

1. Render the `<Mission />` component
   **Expected:** No errors thrown; the component mounts and the page container element (`.mission-page`) is in the document

### Test Data

- None specific

### Edge Cases

- Rendering with no prior localStorage state should not throw

---

## TC-002: Page title and subtitle are displayed

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the page header renders the correct title and subtitle text so users understand the page purpose.

### Preconditions

- DailyMission and framer-motion are mocked
- localStorage is cleared

### Steps

1. Render the `<Mission />` component
   **Expected:** An `h1` element with text "Daily Predictions" is visible in the document

2. Query for the subtitle paragraph
   **Expected:** Text "Test your NFL knowledge by predicting player price movements" is visible in the document

### Test Data

- None

### Edge Cases

- None

---

## TC-003: DailyMission child component renders

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Mission page renders the mocked `DailyMission` component, confirming the parent-child integration point exists.

### Preconditions

- `DailyMission` is mocked to render a `<div data-testid="daily-mission-mock">DailyMission</div>`
- framer-motion is mocked

### Steps

1. Render the `<Mission />` component
   **Expected:** The element with `data-testid="daily-mission-mock"` (or the mock's placeholder text "DailyMission") is present in the document

2. Verify the mock was called / rendered exactly once
   **Expected:** The mocked DailyMission appears once in the DOM

### Test Data

- None

### Edge Cases

- DailyMission should be rendered with no explicit props (it receives no props from Mission page; `collapsible` defaults to `false` inside DailyMission)

---

## TC-004: Help panel is visible by default for new users (no localStorage key)

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `localStorage` has no `mcqueen-mission-help-seen` key, the help panel is expanded on initial render so first-time users see the tips.

### Preconditions

- `localStorage.getItem('mcqueen-mission-help-seen')` returns `null`
- framer-motion is mocked to render children immediately (no animation gating)

### Steps

1. Clear localStorage entirely, then render `<Mission />`
   **Expected:** The help content section is visible in the DOM

2. Query for the help step headings: "Pick Your Predictions", "Use the News", "Compete & Climb"
   **Expected:** All three headings are present and visible

3. Query for the Pro Tip text
   **Expected:** Text containing "Pro Tip:" and "Look for players with recent news" is visible

### Test Data

- localStorage: empty (no `mcqueen-mission-help-seen` key)

### Edge Cases

- If localStorage itself throws (e.g., in private browsing mode), the component should still render (though this may be out of scope for unit tests)

---

## TC-005: Help panel is hidden by default for returning users (localStorage key set)

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `localStorage` already has `mcqueen-mission-help-seen` set to `'true'`, the help panel is collapsed on initial render.

### Preconditions

- `localStorage.setItem('mcqueen-mission-help-seen', 'true')` is called before rendering
- framer-motion is mocked

### Steps

1. Set `localStorage.setItem('mcqueen-mission-help-seen', 'true')`, then render `<Mission />`
   **Expected:** The help content section is NOT present in the DOM

2. Query for any of the help step headings ("Pick Your Predictions", "Use the News", "Compete & Climb")
   **Expected:** None of the help step headings are in the document

### Test Data

- localStorage: `{ 'mcqueen-mission-help-seen': 'true' }`

### Edge Cases

- Any truthy string value in localStorage (not just `'true'`) should cause the panel to be hidden, since the code checks `!hasSeen`

---

## TC-006: Help toggle button shows "How It Works" when panel is collapsed

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the toggle button displays the correct label when the help panel is hidden, guiding users to discover the tips.

### Preconditions

- localStorage has `mcqueen-mission-help-seen` set to `'true'` (panel starts collapsed)
- framer-motion is mocked

### Steps

1. Render `<Mission />` with localStorage pre-set
   **Expected:** A button with text "How It Works" is visible

2. Verify the button does NOT contain the text "Hide Tips"
   **Expected:** "Hide Tips" is not present in the button

### Test Data

- localStorage: `{ 'mcqueen-mission-help-seen': 'true' }`

### Edge Cases

- The button should also contain an SVG icon (help/question-mark icon) — verify the SVG element exists within the button

---

## TC-007: Help toggle button shows "Hide Tips" when panel is expanded

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the toggle button displays the correct label when the help panel is visible, allowing users to dismiss it.

### Preconditions

- localStorage is clear (panel starts expanded for new users)
- framer-motion is mocked

### Steps

1. Render `<Mission />` with no localStorage set
   **Expected:** A button with text "Hide Tips" is visible

2. Verify the button does NOT contain the text "How It Works"
   **Expected:** "How It Works" is not present in the button

### Test Data

- localStorage: empty

### Edge Cases

- None

---

## TC-008: Clicking toggle button hides the help panel

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the toggle button when the help panel is open collapses it and updates the button text.

### Preconditions

- localStorage is clear (panel starts expanded)
- framer-motion is mocked to render children synchronously (AnimatePresence exit should remove children immediately)

### Steps

1. Render `<Mission />` with empty localStorage
   **Expected:** Help content (e.g., "Pick Your Predictions") is visible; button reads "Hide Tips"

2. Click the toggle button ("Hide Tips")
   **Expected:** Help content is no longer in the document

3. Query the toggle button text
   **Expected:** Button now reads "How It Works"

### Test Data

- localStorage: empty at start

### Edge Cases

- Rapid double-click should toggle open → closed → open without errors

---

## TC-009: Clicking toggle button shows the help panel

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the toggle button when the help panel is closed expands it and updates the button text.

### Preconditions

- localStorage has `mcqueen-mission-help-seen` set to `'true'` (panel starts collapsed)
- framer-motion is mocked

### Steps

1. Render `<Mission />` with localStorage pre-set
   **Expected:** Help content is NOT in the document; button reads "How It Works"

2. Click the toggle button ("How It Works")
   **Expected:** Help content appears — "Pick Your Predictions", "Use the News", and "Compete & Climb" headings are now visible

3. Query the toggle button text
   **Expected:** Button now reads "Hide Tips"

### Test Data

- localStorage: `{ 'mcqueen-mission-help-seen': 'true' }`

### Edge Cases

- None

---

## TC-010: Closing help panel for the first time persists to localStorage

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a new user closes the help panel for the first time, `localStorage.setItem('mcqueen-mission-help-seen', 'true')` is called, so the panel stays collapsed on future visits.

### Preconditions

- localStorage is clear (simulating a first-time user)
- `localStorage.setItem` is spied on (e.g., `vi.spyOn(Storage.prototype, 'setItem')`)
- framer-motion is mocked

### Steps

1. Render `<Mission />` with empty localStorage
   **Expected:** Panel is expanded (new user default)

2. Click the "Hide Tips" button to collapse the panel
   **Expected:** `localStorage.setItem` is called with arguments `('mcqueen-mission-help-seen', 'true')`

3. Verify `localStorage.getItem('mcqueen-mission-help-seen')` now returns `'true'`
   **Expected:** The value `'true'` is stored

### Test Data

- localStorage: empty at start

### Edge Cases

- If the user re-opens and re-closes the panel, `localStorage.setItem` should NOT be called again (since `hasSeen` is already `'true'` on subsequent closes — the code checks `if (!hasSeen)` before setting)

---

## TC-011: Closing help panel a second time does not re-write localStorage

**Priority:** P1
**Type:** Functional

### Objective

Verify that the useEffect guard `if (!hasSeen)` prevents redundant localStorage writes when a returning user toggles the panel closed again.

### Preconditions

- localStorage has `mcqueen-mission-help-seen` set to `'true'`
- `localStorage.setItem` is spied on
- framer-motion is mocked

### Steps

1. Render `<Mission />` with localStorage pre-set (panel starts collapsed)
   **Expected:** Panel is hidden

2. Click "How It Works" to expand, then click "Hide Tips" to collapse
   **Expected:** `localStorage.setItem` was NOT called with `'mcqueen-mission-help-seen'` during this toggle cycle

### Test Data

- localStorage: `{ 'mcqueen-mission-help-seen': 'true' }`

### Edge Cases

- None

---

## TC-012: Help panel contains all three instructional steps

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the help panel renders exactly three help steps with the correct icons, titles, and descriptive text, ensuring the onboarding content is complete.

### Preconditions

- localStorage is clear (panel starts expanded)
- framer-motion is mocked

### Steps

1. Render `<Mission />` and query all help step containers
   **Expected:** Exactly 3 help step elements exist

2. Verify step 1: icon "🎯", heading "Pick Your Predictions", text includes "UP" and "DOWN" and mentions "risers" and "fallers"
   **Expected:** All content present within the first step

3. Verify step 2: icon "📰", heading "Use the News", text mentions "Injuries, big games, and trade rumors"
   **Expected:** All content present within the second step

4. Verify step 3: icon "🏆", heading "Compete & Climb", text mentions "leaderboard"
   **Expected:** All content present within the third step

5. Verify the Pro Tip section: contains "💡 Pro Tip:" and advice text about recent news
   **Expected:** Pro Tip content is present

### Test Data

- None

### Edge Cases

- The UP/DOWN text uses `<span>` elements with class names `text-up` and `text-down` for styling — verify these spans exist (though CSS module class mapping may differ in test env)

---

## TC-013: Help panel renders with AnimatePresence wrapping

**Priority:** P2
**Type:** Functional

### Objective

Verify that the help panel content is wrapped in framer-motion's `AnimatePresence` and `motion.div`, ensuring the animation integration point is correctly structured (even though animations are mocked in tests).

### Preconditions

- framer-motion is mocked so `AnimatePresence` renders children and `motion.div` renders as a plain `div`
- localStorage is clear (panel expanded)

### Steps

1. Render `<Mission />` and verify the help content is a child of the mocked AnimatePresence wrapper
   **Expected:** The help content renders inside the AnimatePresence boundary (i.e., the mock's passthrough renders children correctly)

2. Toggle the panel closed
   **Expected:** The help content is removed from the DOM (AnimatePresence mock allows immediate removal)

3. Toggle the panel open again
   **Expected:** The help content re-appears in the DOM

### Test Data

- None

### Edge Cases

- If AnimatePresence is not mocked (integration scenario), animations may prevent content from being removed synchronously — this test assumes mocked framer-motion

---

## TC-014: Multiple toggle cycles work correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that the help panel can be toggled open and closed multiple times in succession without state corruption or rendering errors.

### Preconditions

- localStorage is clear (panel starts expanded)
- framer-motion is mocked

### Steps

1. Render `<Mission />` — panel is expanded
   **Expected:** Help content is visible; button reads "Hide Tips"

2. Click toggle (close) — first cycle
   **Expected:** Help content removed; button reads "How It Works"

3. Click toggle (open)
   **Expected:** Help content visible; button reads "Hide Tips"

4. Click toggle (close) — second cycle
   **Expected:** Help content removed; button reads "How It Works"

5. Click toggle (open)
   **Expected:** Help content visible; button reads "Hide Tips"

### Test Data

- localStorage: empty at start

### Edge Cases

- After multiple cycles, `localStorage.setItem` should have been called exactly once (on the very first close, per TC-010/TC-011 logic)
