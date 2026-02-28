# Test Plan: mcq-2dq.1 -- Sync Onboarding completion with OnboardingProvider state

## Summary

- **Bead:** `mcq-2dq.1`
- **Feature:** Onboarding completion triggers OnboardingProvider state update so FirstTradeGuide appears without page refresh
- **Total Test Cases:** 10
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Completing onboarding via final step calls markOnboardingComplete

**Priority:** P0
**Type:** Functional

### Objective

Verify that advancing through all onboarding steps and clicking "Start Trading!" on the last step calls `markOnboardingComplete` from the OnboardingProvider context rather than writing to localStorage directly.

### Preconditions

- localStorage is clear (new user, no `mcqueen-onboarded` key)
- App is rendered inside `OnboardingProvider`
- Onboarding modal is visible

### Steps

1. Wait for onboarding overlay to appear (300ms delay).
   **Expected:** Onboarding modal is visible with step 1 ("Welcome to McQueen").

2. Click "Next" through all 6 steps until reaching the final step ("Ready to Trade!").
   **Expected:** The button text changes to "Start Trading!" on step 6.

3. Click "Start Trading!".
   **Expected:** The onboarding modal closes. `markOnboardingComplete` is invoked on the provider context. Provider state `hasCompletedOnboarding` is `true`, `isNewUser` is `false`, and `showFirstTradeGuide` is `true` — all without a page refresh.

### Test Data

- No specific test data required beyond clean localStorage.

### Edge Cases

- Verify no direct `localStorage.setItem(ONBOARDING_KEY, ...)` call originates from `Onboarding.tsx` (code-level assertion or spy check).

---

## TC-002: Completing onboarding via Skip button calls markOnboardingComplete

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking "Skip" at any step triggers `markOnboardingComplete` from the provider, not a direct localStorage write.

### Preconditions

- localStorage is clear (new user)
- Onboarding modal is visible

### Steps

1. Wait for onboarding overlay to appear.
   **Expected:** Onboarding modal is visible on step 1.

2. Click the "Skip" button in the header.
   **Expected:** The onboarding modal closes. Provider state updates: `hasCompletedOnboarding` becomes `true`, `isNewUser` becomes `false`, `showFirstTradeGuide` becomes `true`.

### Test Data

- None.

### Edge Cases

- Click "Skip" on a middle step (e.g., step 3) and verify the same provider state transition occurs.

---

## TC-003: Completing onboarding via Escape key calls markOnboardingComplete

**Priority:** P0
**Type:** Functional

### Objective

Verify that pressing Escape while onboarding is visible triggers `markOnboardingComplete` from the provider.

### Preconditions

- localStorage is clear (new user)
- Onboarding modal is visible

### Steps

1. Wait for onboarding overlay to appear.
   **Expected:** Onboarding modal is visible.

2. Press the `Escape` key.
   **Expected:** The onboarding modal closes. Provider state updates identically to TC-001: `hasCompletedOnboarding` is `true`, `showFirstTradeGuide` is `true`.

### Test Data

- None.

### Edge Cases

- Press Escape on the last step — should behave the same as on the first step.

---

## TC-004: FirstTradeGuide appears immediately after onboarding completion (no refresh)

**Priority:** P0
**Type:** Integration

### Objective

Verify that when onboarding completes, the `FirstTradeGuide` component renders without requiring a page refresh. This is the core user-facing bug described in the issue.

### Preconditions

- localStorage is clear (new user)
- Both `Onboarding` and `FirstTradeGuide` are rendered within the same `OnboardingProvider`
- `hasCompletedFirstTrade` prop on `FirstTradeGuide` is `false`

### Steps

1. Wait for onboarding overlay to appear.
   **Expected:** Onboarding modal is visible. FirstTradeGuide is NOT visible.

2. Complete onboarding (via any path: final step, Skip, or Escape).
   **Expected:** Onboarding modal closes.

3. Wait 500ms (FirstTradeGuide has a delayed appearance).
   **Expected:** FirstTradeGuide component becomes visible with step 1 ("Make Your First Trade!").

### Test Data

- None.

### Edge Cases

- If `hasCompletedFirstTrade` is `true`, FirstTradeGuide should NOT appear even after onboarding completes.

---

## TC-005: Provider state is consistent with localStorage after completion

**Priority:** P1
**Type:** Functional

### Objective

Verify that after onboarding completion, both React state and localStorage are in sync: `mcqueen-onboarded` is `"true"`, `mcqueen-onboarding-just-completed` is `"true"`, and the provider context reflects matching values.

### Preconditions

- localStorage is clear (new user)
- Onboarding modal is visible

### Steps

1. Complete onboarding via any path.
   **Expected:** `localStorage.getItem('mcqueen-onboarded')` returns `"true"`. `localStorage.getItem('mcqueen-onboarding-just-completed')` returns `"true"`. Provider context: `hasCompletedOnboarding === true`, `isNewUser === false`, `showFirstTradeGuide === true`.

### Test Data

- None.

### Edge Cases

- Verify no stale or extra localStorage keys are set (e.g., no duplicate writes or orphaned CustomEvent-related side effects).

---

## TC-006: No redundant direct localStorage writes in Onboarding.tsx handleComplete

**Priority:** P1
**Type:** Regression

### Objective

Verify that `Onboarding.tsx`'s `handleComplete` does NOT call `localStorage.setItem` directly for the onboarding key. All persistence must be delegated to `markOnboardingComplete` in the provider.

### Preconditions

- Spy/mock on `localStorage.setItem`
- Onboarding modal is visible

### Steps

1. Complete onboarding via "Start Trading!" button.
   **Expected:** `localStorage.setItem` is called only from within `markOnboardingComplete` (provider). No direct `localStorage.setItem('mcqueen-onboarded', ...)` call originates from the Onboarding component's own code path.

2. Inspect the call log of the `localStorage.setItem` spy.
   **Expected:** Exactly two calls: one for `mcqueen-onboarded` and one for `mcqueen-onboarding-just-completed`, both from the provider's `markOnboardingComplete`.

### Test Data

- None.

### Edge Cases

- Verify the same for the "Skip" and "Escape" completion paths.

---

## TC-007: No CustomEvent dispatch from Onboarding.tsx on completion

**Priority:** P1
**Type:** Regression

### Objective

Verify that `Onboarding.tsx` does not dispatch a `CustomEvent` on completion. The provider's state update mechanism replaces the need for event-based communication.

### Preconditions

- Spy/listener on `window.dispatchEvent` or `document.dispatchEvent`
- Onboarding modal is visible

### Steps

1. Complete onboarding via any path.
   **Expected:** No `CustomEvent` related to onboarding completion is dispatched. The only coordination mechanism is the provider's React state.

### Test Data

- None.

### Edge Cases

- None.

---

## TC-008: Returning user does not see onboarding or trigger state changes

**Priority:** P1
**Type:** Regression

### Objective

Verify that a user who has already completed onboarding (`mcqueen-onboarded` is `"true"` in localStorage) does not see the onboarding modal and no provider state mutations occur.

### Preconditions

- `localStorage.setItem('mcqueen-onboarded', 'true')` before render
- App renders with `OnboardingProvider`

### Steps

1. Render the app and wait 500ms.
   **Expected:** Onboarding overlay does NOT appear. Provider state: `hasCompletedOnboarding` is `true`, `isNewUser` is `false`.

2. Verify `markOnboardingComplete` is never called.
   **Expected:** No state transitions or localStorage writes occur.

### Test Data

- `mcqueen-onboarded: "true"` in localStorage.

### Edge Cases

- If `mcqueen-onboarding-just-completed` is also `"true"` (returning before dismissing FirstTradeGuide), the FirstTradeGuide should still show based on provider initialization — but onboarding itself must not re-trigger.

---

## TC-009: markOnboardingComplete called with optional chaining guard

**Priority:** P2
**Type:** Functional

### Objective

Verify that the `handleComplete` function uses optional chaining (`markOnboardingComplete?.()`) so it degrades gracefully if the component is rendered outside an `OnboardingProvider` (where `markOnboardingComplete` would be `undefined`).

### Preconditions

- Render `Onboarding` component outside of `OnboardingProvider` (using default context)

### Steps

1. Render `Onboarding` without wrapping in `OnboardingProvider`.
   **Expected:** Onboarding modal appears for a new user (localStorage empty).

2. Click "Skip" or complete all steps.
   **Expected:** No runtime error is thrown. The modal closes. `markOnboardingComplete` is `undefined` on the default context, but the optional chaining prevents a crash.

### Test Data

- None.

### Edge Cases

- Verify the onboarding overlay still closes (via `setIsVisible(false)`) even when `markOnboardingComplete` is undefined.

---

## TC-010: Completing onboarding updates isNewUser flag immediately

**Priority:** P1
**Type:** Functional

### Objective

Verify that after onboarding completion, the `isNewUser` flag in the provider transitions from `true` to `false` in the same render cycle, so any downstream components relying on `isNewUser` update without a page refresh.

### Preconditions

- localStorage is clear (new user)
- A consumer component reads `isNewUser` from `useOnboarding()`

### Steps

1. Render app with OnboardingProvider. Verify `isNewUser` is `true`.
   **Expected:** `isNewUser` reads as `true`.

2. Complete onboarding via any path.
   **Expected:** `isNewUser` immediately reads as `false` without a page refresh. Any UI gated on `isNewUser` (e.g., new-user badges or prompts) updates accordingly.

### Test Data

- None.

### Edge Cases

- Verify `isNewUser` remains `false` on subsequent re-renders after completion.
