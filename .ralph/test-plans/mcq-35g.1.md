# Test Plan: mcq-35g.1 -- Create ErrorBoundary component

## Summary

- **Bead:** `mcq-35g.1`
- **Feature:** Shared ErrorBoundary component that catches per-page rendering errors and displays a retry-capable fallback UI
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Catches a synchronous rendering error in a child component

**Priority:** P0
**Type:** Functional

### Objective

Verify that ErrorBoundary catches a thrown error during the render phase of a child component and does not propagate it further up the tree.

### Preconditions

- ErrorBoundary component is rendered wrapping a child component that throws during render

### Steps

1. Render `<ErrorBoundary>` wrapping a child component that unconditionally throws `new Error('render failure')` during render
   **Expected:** The ErrorBoundary catches the error; no unhandled error crashes the app

2. Inspect the rendered output
   **Expected:** The error fallback UI is displayed instead of the broken child component

### Test Data

- A minimal `ThrowingChild` component: `function ThrowingChild() { throw new Error('render failure'); }`

### Edge Cases

- Child throws a non-Error object (e.g., a string) — ErrorBoundary should still catch it
- Child throws `null` or `undefined` — ErrorBoundary should handle gracefully

---

## TC-002: Renders children normally when no error occurs

**Priority:** P0
**Type:** Functional

### Objective

Verify that ErrorBoundary is transparent when children render without errors — it should render the child tree as-is with no visual or behavioral side effects.

### Preconditions

- ErrorBoundary component is rendered wrapping a healthy child component

### Steps

1. Render `<ErrorBoundary><div data-testid="child">Hello</div></ErrorBoundary>`
   **Expected:** The child `<div>` with text "Hello" is rendered in the DOM

2. Inspect the DOM for any fallback UI elements
   **Expected:** No fallback UI is present; only the child content is visible

### Test Data

- A simple functional child component that renders static content

### Edge Cases

- Child returns `null` — ErrorBoundary should render nothing without triggering fallback
- Child returns a Fragment with multiple elements — all should render normally

---

## TC-003: Displays a user-friendly error fallback message

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the fallback UI shown after an error is user-friendly: it communicates that something went wrong in non-technical language, without exposing stack traces or internal error details.

### Preconditions

- ErrorBoundary has caught a rendering error from a child

### Steps

1. Render ErrorBoundary wrapping a child that throws during render
   **Expected:** Fallback UI is displayed

2. Read the visible text in the fallback UI
   **Expected:** Contains a user-friendly message (e.g., "Something went wrong") that does not include raw stack traces, error class names, or component internals

3. Verify visual styling of the fallback
   **Expected:** The fallback is styled consistently with the app (not unstyled raw text), is centered or prominently placed, and is clearly readable

### Test Data

- Child throws `new Error('TypeError: Cannot read properties of undefined')`

### Edge Cases

- Verify the technical error message from the thrown error is NOT displayed to the user

---

## TC-004: Retry button is present and visible in the fallback UI

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the error fallback includes a clearly labeled action that allows the user to retry / recover from the error state.

### Preconditions

- ErrorBoundary has caught a rendering error and is showing the fallback UI

### Steps

1. Render ErrorBoundary wrapping a throwing child
   **Expected:** Fallback UI is displayed

2. Locate a retry button or link in the fallback
   **Expected:** A button labeled "Retry", "Try Again", or equivalent is visible and enabled

3. Verify the button is keyboard-focusable
   **Expected:** The retry button can receive focus via Tab key

### Test Data

- None specific

### Edge Cases

- Verify the retry action is a `<button>` element (not just a styled `<div>`) for accessibility

---

## TC-005: Clicking retry re-renders children and clears the error state

**Priority:** P0
**Type:** Functional

### Objective

Verify that activating the retry option resets the ErrorBoundary's internal error state and attempts to re-render the children.

### Preconditions

- ErrorBoundary is showing the fallback UI after catching an error
- The child component's error condition has been resolved (e.g., a toggle controls whether the child throws)

### Steps

1. Render ErrorBoundary wrapping a child whose throwing behavior is controlled by a flag
   **Expected:** Child throws; fallback UI is displayed

2. Set the flag so the child will render successfully on next attempt

3. Click the "Retry" / "Try Again" button in the fallback UI
   **Expected:** The fallback UI disappears and the child component renders normally

### Test Data

- A controllable child component: throws when `shouldThrow` is true, renders content when false

### Edge Cases

- If the child still throws after retry, the fallback should be displayed again (not an infinite loop or crash)
- Rapidly clicking retry multiple times should not cause issues

---

## TC-006: Error in one page does not crash other pages or the app shell

**Priority:** P0
**Type:** Integration

### Objective

Verify that ErrorBoundary provides per-page isolation: an error in one route's component does not affect navigation, the Layout shell, or other routes.

### Preconditions

- App is rendered with routes, each wrapped in its own ErrorBoundary (per refactor-spec section 3.6)
- At least two page routes are available (e.g., Market and Portfolio)

### Steps

1. Navigate to a page whose component throws a rendering error (e.g., Market)
   **Expected:** The Market page shows the error fallback; the Layout shell (header, nav) remains functional

2. Navigate to a different page (e.g., Portfolio) using the app navigation
   **Expected:** Portfolio page loads and renders correctly; no error state carries over

3. Navigate back to the erroring page
   **Expected:** ErrorBoundary for that page shows the fallback (or re-attempts render)

### Test Data

- Market page configured to throw, Portfolio page renders normally

### Edge Cases

- Multiple pages throwing simultaneously — each should show its own independent fallback
- Error in a deeply nested child of a page — the page-level ErrorBoundary should still catch it

---

## TC-007: ErrorBoundary accepts a custom fallback prop

**Priority:** P1
**Type:** Functional

### Objective

Verify that ErrorBoundary supports a `fallback` prop (as shown in the refactor spec) allowing consumers to provide a custom fallback component instead of the default error UI.

### Preconditions

- ErrorBoundary component supports a `fallback` prop

### Steps

1. Render `<ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error</div>}>` wrapping a throwing child
   **Expected:** The custom fallback `<div>` with text "Custom Error" is rendered

2. Verify the default fallback is NOT shown
   **Expected:** Only the custom fallback content is visible

### Test Data

- Custom fallback: `<div data-testid="custom-fallback">Custom Error</div>`

### Edge Cases

- `fallback` prop is `undefined` or not provided — should use the default fallback UI
- `fallback` prop is `null` — should render nothing (or default fallback, depending on implementation)

---

## TC-008: ErrorBoundary is reusable as a shared component

**Priority:** P1
**Type:** Functional

### Objective

Verify that ErrorBoundary can be imported and used across multiple pages and components, functioning correctly in each location.

### Preconditions

- ErrorBoundary is exported from the shared components directory

### Steps

1. Import ErrorBoundary in two separate test wrappers, each wrapping a different child
   **Expected:** Both instances mount without conflicts

2. Trigger an error in one instance's child only
   **Expected:** Only that instance shows the fallback; the other continues rendering its child normally

### Test Data

- Two independent ErrorBoundary instances wrapping different children

### Edge Cases

- Nesting ErrorBoundary inside another ErrorBoundary — the inner one should catch the error first

---

## TC-009: ErrorBoundary does not catch event handler errors

**Priority:** P1
**Type:** Functional

### Objective

Verify that ErrorBoundary only catches errors during rendering, lifecycle methods, and constructors — not errors thrown inside event handlers (this is a React limitation; the component should not falsely advertise catching these).

### Preconditions

- ErrorBoundary wraps a child with a button whose click handler throws

### Steps

1. Render ErrorBoundary wrapping a child that has a button click handler which throws an error
   **Expected:** Child renders normally (no error during render)

2. Click the button that triggers the throwing event handler
   **Expected:** ErrorBoundary does NOT catch the error; the fallback is NOT displayed (the error propagates as an unhandled exception, per React's design)

### Test Data

- Child component with `<button onClick={() => { throw new Error('click error'); }}>Click</button>`

### Edge Cases

- Errors in async event handlers (e.g., inside a `setTimeout` in an onClick) — also not caught by ErrorBoundary

---

## TC-010: ErrorBoundary handles errors during component update/re-render

**Priority:** P1
**Type:** Functional

### Objective

Verify that ErrorBoundary catches errors that occur not just on initial render but also on subsequent re-renders triggered by state or prop changes.

### Preconditions

- ErrorBoundary wraps a child that renders successfully initially but throws on a subsequent re-render

### Steps

1. Render ErrorBoundary wrapping a child that renders normally on first render
   **Expected:** Child content is displayed; no fallback

2. Trigger a state or prop change that causes the child to throw during re-render
   **Expected:** ErrorBoundary catches the error and displays the fallback UI

3. Click retry
   **Expected:** ErrorBoundary resets and attempts to re-render the child

### Test Data

- Child component that throws when a counter prop exceeds a threshold

### Edge Cases

- Error thrown during `useEffect` cleanup — should not be caught (React behavior)

---

## TC-011: Fallback UI layout does not break the page structure

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the error fallback UI integrates well within the app Layout — it should not overflow, break the nav bar, or cause scroll issues.

### Preconditions

- App is rendered with Layout shell and a page-level ErrorBoundary in the error state

### Steps

1. Navigate to a page that triggers an error, showing the fallback
   **Expected:** Fallback UI is contained within the page content area

2. Verify the Layout header and bottom navigation remain visible and functional
   **Expected:** Header and nav are unaffected by the error fallback

3. Resize the viewport to a small mobile width (375px)
   **Expected:** Fallback UI is responsive and does not overflow or get clipped

### Test Data

- Viewport sizes: 375px (mobile), 768px (tablet), 1280px (desktop)

### Edge Cases

- Very long error messages — fallback should truncate or wrap gracefully

---

## TC-012: Multiple consecutive errors and retries cycle correctly

**Priority:** P2
**Type:** Functional

### Objective

Verify that ErrorBoundary handles a cycle of error → retry → error → retry without memory leaks, stale state, or degraded behavior.

### Preconditions

- ErrorBoundary wrapping a child whose throw behavior is toggled by external state

### Steps

1. Render ErrorBoundary with a child that throws
   **Expected:** Fallback UI displayed

2. Click retry (child still throws)
   **Expected:** Fallback UI displayed again

3. Fix the child (stop throwing) and click retry
   **Expected:** Child renders successfully

4. Trigger another error in the child
   **Expected:** Fallback UI displayed again

5. Click retry (child is fixed again)
   **Expected:** Child renders successfully

### Test Data

- Controllable child with externally toggled `shouldThrow` flag

### Edge Cases

- Rapid retry clicks in succession should not cause double-renders or React warnings
