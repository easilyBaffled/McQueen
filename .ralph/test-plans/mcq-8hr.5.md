# Test Plan: mcq-8hr.5 -- Add Vitest tests for Onboarding component (0% coverage)

## Summary

- **Bead:** `mcq-8hr.5`
- **Feature:** 6-step onboarding wizard modal with navigation, dismissal, localStorage persistence, step indicators, and custom event dispatch
- **Total Test Cases:** 20
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Modal renders for new users (no localStorage key)

**Priority:** P0
**Type:** Functional

### Objective

Verify the onboarding modal appears when `mcqueen-onboarded` is not set in localStorage. This is the primary entry point for the entire onboarding flow.

### Preconditions

- localStorage does not contain `mcqueen-onboarded`
- Component is rendered inside a test harness (mock `framer-motion` or use a compatible setup)

### Steps

1. Clear localStorage of `mcqueen-onboarded`
   **Expected:** Key does not exist in localStorage

2. Render the `<Onboarding />` component and advance timers past the 300ms delay
   **Expected:** The modal overlay (`role="dialog"`) is present in the document

3. Inspect the dialog content
   **Expected:** Step 0 content is displayed — title "Welcome to McQueen", subtitle "The NFL Stock Market", icon "🏈"

### Test Data

- No special test data required

### Edge Cases

- Verify the modal does NOT appear before the 300ms delay has elapsed (use fake timers to assert at 299ms)

---

## TC-002: Modal does not render for returning users (localStorage key present)

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `mcqueen-onboarded` is already `'true'` in localStorage, the onboarding modal never appears.

### Preconditions

- localStorage contains `mcqueen-onboarded` set to `'true'`

### Steps

1. Set `localStorage.setItem('mcqueen-onboarded', 'true')`
   **Expected:** Key is set

2. Render the `<Onboarding />` component and advance timers past 300ms
   **Expected:** No dialog element is present in the document

### Test Data

- localStorage key: `mcqueen-onboarded` = `'true'`

### Edge Cases

- Set the key to other truthy-looking values like `'yes'`, `'1'`, `'completed'` — the component checks specifically for existence (any value), so these should also suppress the modal

---

## TC-003: Next button advances through all 6 steps sequentially

**Priority:** P0
**Type:** Functional

### Objective

Verify the Next button advances the wizard from step 0 through step 5 (all 6 steps), displaying the correct content at each step.

### Preconditions

- localStorage is clear
- Component is rendered and modal is visible (timers advanced)

### Steps

1. Confirm initial state shows step 0: title "Welcome to McQueen"
   **Expected:** Title text is "Welcome to McQueen", subtitle is "The NFL Stock Market"

2. Click the "Next" button
   **Expected:** Step 1 is shown — title "Your Starting Balance", subtitle "$10,000 in virtual cash", icon "💵"

3. Click the "Next" button
   **Expected:** Step 2 is shown — title "Reading the Market", subtitle "Green = up, Red = down", icon "📊"

4. Click the "Next" button
   **Expected:** Step 3 is shown — title "Build Your Portfolio", subtitle "Your collection of player investments", icon "📁"

5. Click the "Next" button
   **Expected:** Step 4 is shown — title "Daily Predictions", subtitle "Test your NFL knowledge", icon "🎯"

6. Click the "Next" button
   **Expected:** Step 5 is shown — title "Ready to Trade!", subtitle "Your first move awaits", icon "🚀"

### Test Data

- 6 steps with titles: "Welcome to McQueen", "Your Starting Balance", "Reading the Market", "Build Your Portfolio", "Daily Predictions", "Ready to Trade!"

### Edge Cases

- None (covered by other TCs for boundary behavior on first/last step)

---

## TC-004: Next button on final step completes onboarding and closes modal

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the Next button ("Start Trading!") on step 5 (the last step) closes the modal and triggers completion behavior.

### Preconditions

- Modal is visible and navigated to step 5

### Steps

1. Navigate to step 5 by clicking Next 5 times
   **Expected:** Step 5 is displayed with title "Ready to Trade!"

2. Verify the button text reads "Start Trading!" (not "Next")
   **Expected:** Button text is "Start Trading!"

3. Click the "Start Trading!" button
   **Expected:** The modal overlay is removed from the document

### Test Data

- None

### Edge Cases

- Verify calling handleNext when already past the last step does not throw (defensive — step should never exceed `steps.length - 1`)

---

## TC-005: Back button navigates to the previous step

**Priority:** P0
**Type:** Functional

### Objective

Verify the Back button decrements the step counter and shows the previous step's content.

### Preconditions

- Modal is visible and on step 2 or later

### Steps

1. Click Next twice to reach step 2 ("Reading the Market")
   **Expected:** Step 2 content is displayed

2. Click the "Back" button
   **Expected:** Step 1 content is displayed — title "Your Starting Balance"

3. Click the "Back" button again
   **Expected:** Step 0 content is displayed — title "Welcome to McQueen"

### Test Data

- None

### Edge Cases

- Navigate forward and backward multiple times in succession to verify step state is consistent

---

## TC-006: Back button is hidden on step 0

**Priority:** P0
**Type:** Functional

### Objective

Verify the Back button is not rendered when the user is on the first step (step 0), preventing backward navigation past the beginning.

### Preconditions

- Modal is visible, on step 0

### Steps

1. Render the component and advance timers so modal appears on step 0
   **Expected:** Modal is visible with step 0 content

2. Query for a button with text "Back"
   **Expected:** No Back button is found in the document

### Test Data

- None

### Edge Cases

- Advance to step 1, then go back to step 0 — Back button should disappear again

---

## TC-007: Back button appears on step 1 and beyond

**Priority:** P1
**Type:** Functional

### Objective

Verify the Back button is rendered once the user advances past step 0.

### Preconditions

- Modal is visible on step 0

### Steps

1. Click the Next button to advance to step 1
   **Expected:** Step 1 content is displayed

2. Query for a button with text "Back"
   **Expected:** Back button is present and visible

### Test Data

- None

### Edge Cases

- Also verify Back button remains visible on steps 2–5

---

## TC-008: Skip button closes the modal

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Skip button triggers `handleComplete`, closing the modal and persisting state to localStorage.

### Preconditions

- Modal is visible on any step

### Steps

1. Render the component, advance timers, modal is visible
   **Expected:** Modal dialog is in the document

2. Click the "Skip" button
   **Expected:** Modal overlay is removed from the document

### Test Data

- None

### Edge Cases

- Click Skip from step 0 (first step)
- Click Skip from step 3 (middle step)
- Click Skip from step 5 (last step)
- All three should produce the same completion behavior

---

## TC-009: Escape key closes the modal

**Priority:** P0
**Type:** Functional

### Objective

Verify pressing the Escape key triggers `handleComplete` and closes the onboarding modal.

### Preconditions

- Modal is visible

### Steps

1. Render the component, advance timers, modal is visible
   **Expected:** Modal dialog is present

2. Fire a `keydown` event on `document` with `key: 'Escape'`
   **Expected:** Modal overlay is removed from the document

### Test Data

- KeyboardEvent with `key: 'Escape'`

### Edge Cases

- Press Escape when modal is NOT visible (e.g., after it was already dismissed) — no error should be thrown, no event listener should be active
- Press other keys (e.g., `Enter`, `Tab`, `a`) while modal is visible — modal should remain open

---

## TC-010: Escape key does not fire when modal is not visible

**Priority:** P1
**Type:** Functional

### Objective

Verify the keydown listener for Escape is removed when the modal becomes invisible, preventing stale handlers.

### Preconditions

- Modal was visible but has been dismissed (via Skip or completion)

### Steps

1. Render the component, advance timers, modal appears
   **Expected:** Modal is visible

2. Click "Skip" to dismiss the modal
   **Expected:** Modal is removed

3. Fire a `keydown` event with `key: 'Escape'`
   **Expected:** No error is thrown, no additional localStorage writes occur, no custom event is dispatched

### Test Data

- None

### Edge Cases

- None

---

## TC-011: localStorage `mcqueen-onboarded` is set to 'true' on completion

**Priority:** P0
**Type:** Functional

### Objective

Verify that `handleComplete` writes `'true'` to `localStorage` under the key `mcqueen-onboarded`.

### Preconditions

- localStorage is clear
- Modal is visible

### Steps

1. Click the "Skip" button (or navigate to step 5 and click "Start Trading!")
   **Expected:** `localStorage.getItem('mcqueen-onboarded')` returns `'true'`

### Test Data

- localStorage key: `mcqueen-onboarded`

### Edge Cases

- None

---

## TC-012: localStorage `mcqueen-onboarding-just-completed` is set to 'true' on completion

**Priority:** P0
**Type:** Functional

### Objective

Verify that `handleComplete` also sets the `mcqueen-onboarding-just-completed` key, which downstream components (like OnboardingProvider) use to trigger the first-trade guide.

### Preconditions

- localStorage is clear
- Modal is visible

### Steps

1. Click the "Skip" button
   **Expected:** `localStorage.getItem('mcqueen-onboarding-just-completed')` returns `'true'`

### Test Data

- localStorage key: `mcqueen-onboarding-just-completed`

### Edge Cases

- Verify both keys are set regardless of which completion path is taken (Skip, Escape, or final Next)

---

## TC-013: Custom event `mcqueen-onboarding-complete` is dispatched on completion

**Priority:** P0
**Type:** Integration

### Objective

Verify that a `CustomEvent` with type `mcqueen-onboarding-complete` is dispatched on `window` when the onboarding completes, allowing other parts of the app to react.

### Preconditions

- Modal is visible
- A spy/listener is attached to `window` for `mcqueen-onboarding-complete`

### Steps

1. Add an event listener (or vi.fn() spy) on `window` for `'mcqueen-onboarding-complete'`
   **Expected:** Listener is registered

2. Click the "Skip" button to complete onboarding
   **Expected:** The spy/listener was called exactly once

### Test Data

- Event type: `mcqueen-onboarding-complete`

### Edge Cases

- Verify the event fires when completing via Escape key
- Verify the event fires when completing via "Start Trading!" on the last step
- All three completion paths (Skip, Escape, final Next) should dispatch the event

---

## TC-014: Step indicators show 6 dots

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that exactly 6 step indicator dots are rendered, corresponding to the 6 wizard steps.

### Preconditions

- Modal is visible

### Steps

1. Render the component and advance timers
   **Expected:** Modal appears

2. Query all elements with the step-dot class (within the step-indicators container)
   **Expected:** Exactly 6 step dot elements are found

### Test Data

- None

### Edge Cases

- None

---

## TC-015: Active step indicator reflects current step

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the step dot for the current step has the `active` CSS class, and this updates as the user navigates.

### Preconditions

- Modal is visible on step 0

### Steps

1. On step 0, query step dots
   **Expected:** The first dot (index 0) has the `active` class; no other dot has `active`

2. Click Next to go to step 1
   **Expected:** The second dot (index 1) has the `active` class; the first dot no longer has `active`

3. Click Next to go to step 2
   **Expected:** The third dot (index 2) has the `active` class

### Test Data

- None

### Edge Cases

- Navigate to the last step (5) and verify the 6th dot has `active`
- Navigate back from step 2 to step 1 and verify the active indicator moves backward

---

## TC-016: Completed step indicators reflect visited steps

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that step dots for steps before the current step have the `completed` CSS class.

### Preconditions

- Modal is visible

### Steps

1. On step 0, check all dots
   **Expected:** No dots have the `completed` class

2. Click Next to go to step 1
   **Expected:** Dot at index 0 has the `completed` class

3. Click Next to go to step 2
   **Expected:** Dots at index 0 and 1 have the `completed` class; dot at index 2 has `active`

4. Click Next twice more to reach step 4
   **Expected:** Dots at indices 0–3 have `completed`; dot at index 4 has `active`

### Test Data

- None

### Edge Cases

- Navigate back from step 3 to step 2 — dots at indices 0 and 1 should have `completed`, dot 2 should have `active`, dots 3–5 should have neither

---

## TC-017: Final step button text changes to "Start Trading!"

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the Next button's label changes from "Next" to "Start Trading!" on the final step, and the button gains the `final` CSS class.

### Preconditions

- Modal is visible

### Steps

1. On step 0, inspect the Next button
   **Expected:** Button text is "Next"

2. Navigate to step 5 (click Next 5 times)
   **Expected:** Button text is "Start Trading!" (not "Next")

### Test Data

- None

### Edge Cases

- Verify button text reverts to "Next" if the user navigates back from step 5 to step 4

---

## TC-018: Step 1 renders balance demo widget

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that step 1 ("Your Starting Balance") renders the balance demo showing "$10,000.00" and the note "Play money to start trading".

### Preconditions

- Modal is visible, navigated to step 1

### Steps

1. Click Next to reach step 1
   **Expected:** Step 1 content is displayed

2. Query for the balance demo elements
   **Expected:** Text "$10,000.00" is present. Text "Play money to start trading" is present.

### Test Data

- None

### Edge Cases

- Verify the balance demo is NOT rendered on other steps (e.g., step 0, step 2)

---

## TC-019: Step 2 renders color demo widget (green up / red down)

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that step 2 ("Reading the Market") renders the price direction demo with "Going Up" / "▲ +5.2%" and "Going Down" / "▼ -3.1%".

### Preconditions

- Modal is visible, navigated to step 2

### Steps

1. Click Next twice to reach step 2
   **Expected:** Step 2 content is displayed

2. Query for the demo elements
   **Expected:** "Going Up" label and "▲ +5.2%" value are present. "Going Down" label and "▼ -3.1%" value are present.

### Test Data

- None

### Edge Cases

- Verify the color demo is NOT rendered on other steps (e.g., step 1, step 3)

---

## TC-020: Accessibility — modal has correct ARIA attributes

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the modal has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="onboarding-title"` for screen reader support.

### Preconditions

- Modal is visible

### Steps

1. Render the component and advance timers
   **Expected:** Modal is visible

2. Query the dialog element
   **Expected:** Element has `role="dialog"`, attribute `aria-modal` is `"true"`, and `aria-labelledby` is `"onboarding-title"`

3. Query for the element with `id="onboarding-title"`
   **Expected:** The `<h2>` with the step title has `id="onboarding-title"`

### Test Data

- None

### Edge Cases

- Verify `aria-labelledby` target updates its text content when navigating between steps (the `id` stays the same but the text changes)
