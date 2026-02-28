# Test Plan: mcq-2dq -- Onboarding and First-Run Experience

## Summary

- **Bead:** `mcq-2dq`
- **Feature:** Fix onboarding-to-FirstTradeGuide state sync and change default scenario from ESPN Live to Midweek with empty-state fallback
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Onboarding completion updates hasCompletedOnboarding without page refresh

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a user finishes onboarding, the `OnboardingProvider` context state (`hasCompletedOnboarding`) updates to `true` within the same session, without requiring a page refresh. This is the core state-sync bug being fixed.

### Preconditions

- Fresh app state (localStorage cleared, no `mcqueen-onboarded` key)
- App rendered with `OnboardingProvider` wrapping the component tree

### Steps

1. Open the app as a new user (no localStorage keys set).
   **Expected:** Onboarding modal appears after ~300ms delay.

2. Click "Next" through all 6 onboarding steps, then click "Start Trading!" on the final step.
   **Expected:** Onboarding modal dismisses. `hasCompletedOnboarding` in OnboardingProvider context is `true`. `localStorage.getItem('mcqueen-onboarded')` returns `'true'`. No page refresh occurs.

3. Inspect the OnboardingProvider context value (via React DevTools or test harness).
   **Expected:** `hasCompletedOnboarding === true`, `isNewUser === false`.

### Test Data

- localStorage key: `mcqueen-onboarded`
- localStorage key: `mcqueen-onboarding-just-completed`

### Edge Cases

- Verify the state update happens synchronously with the modal close (not deferred to next render cycle)
- Verify the old `CustomEvent('mcqueen-onboarding-complete')` dispatch is either removed or no longer the sole mechanism for state sync

---

## TC-002: FirstTradeGuide appears immediately after onboarding completion

**Priority:** P0
**Type:** Integration

### Objective

Verify that the FirstTradeGuide component becomes visible on the Market page immediately after onboarding completes, without requiring a page refresh. This is the primary user-facing symptom of the state-sync bug.

### Preconditions

- Fresh app state (all localStorage cleared)
- User has not made any trades (empty portfolio)
- App is on the Market page route

### Steps

1. Open the app as a new user.
   **Expected:** Onboarding modal appears.

2. Complete the full onboarding flow by clicking through all steps and clicking "Start Trading!".
   **Expected:** Onboarding modal closes.

3. Observe the Market page (no navigation or refresh).
   **Expected:** FirstTradeGuide component appears within ~500ms showing "Make Your First Trade!" as its first step. The guide is rendered at the top of the Market page with a sticky position.

### Test Data

- Empty portfolio (`Object.keys(portfolio).length === 0`)
- `localStorage.getItem('mcqueen-onboarding-just-completed')` should be `'true'`

### Edge Cases

- If the Market page is not the landing page after onboarding, navigate to Market and verify guide still appears
- Verify the guide does NOT appear if the user already has trades in their portfolio

---

## TC-003: showFirstTradeGuide activates in the same session as onboarding

**Priority:** P0
**Type:** Functional

### Objective

Verify that `showFirstTradeGuide` in OnboardingProvider transitions to `true` in the same React render cycle (or immediately following) as `markOnboardingComplete()` is called — not only on a subsequent page load.

### Preconditions

- Fresh app state
- Access to OnboardingProvider context values (test harness or DevTools)

### Steps

1. Render app with fresh state. Verify `showFirstTradeGuide === false`.
   **Expected:** `showFirstTradeGuide` is `false` initially.

2. Trigger `markOnboardingComplete()` (either by completing onboarding UI or calling the context method directly in a unit test).
   **Expected:** `showFirstTradeGuide` updates to `true` synchronously. `localStorage.getItem('mcqueen-onboarding-just-completed')` is `'true'`. `localStorage.getItem('mcqueen-first-trade-seen')` is still `null`.

### Test Data

- None beyond fresh localStorage state

### Edge Cases

- Call `markOnboardingComplete()` twice in succession — state should remain `true`, no errors
- Verify `showFirstTradeGuide` is `false` if `mcqueen-first-trade-seen` is already `'true'` in localStorage

---

## TC-004: Onboarding uses context method instead of direct localStorage writes

**Priority:** P1
**Type:** Functional

### Objective

Verify that `Onboarding.tsx`'s `handleComplete` calls `markOnboardingComplete()` from the OnboardingProvider context rather than writing to localStorage directly. This is the architectural fix that enables state sync.

### Preconditions

- Access to `Onboarding.tsx` source or a spy on context methods

### Steps

1. Set up a test rendering Onboarding within OnboardingProvider and spy on `markOnboardingComplete`.
   **Expected:** Spy is configured.

2. Complete the onboarding flow.
   **Expected:** `markOnboardingComplete()` is called exactly once. Onboarding.tsx does NOT call `localStorage.setItem(ONBOARDING_KEY, ...)` directly. Onboarding.tsx does NOT call `localStorage.setItem(ONBOARDING_COMPLETED_KEY, ...)` directly.

### Test Data

- None

### Edge Cases

- Pressing Escape to dismiss onboarding should also trigger `markOnboardingComplete()` (since Escape calls `handleComplete`)
- Clicking "Skip" should also trigger `markOnboardingComplete()`

---

## TC-005: Existing onboarding tests still pass

**Priority:** P0
**Type:** Regression

### Objective

Verify that all existing onboarding unit tests and Cypress E2E tests continue to pass after the state-sync fix.

### Preconditions

- Codebase with the fix applied
- Test runner configured (Vitest for unit, Cypress for E2E)

### Steps

1. Run `src/components/Onboarding/__tests__/Onboarding.test.tsx`.
   **Expected:** All tests pass.

2. Run `src/components/Onboarding/__tests__/OnboardingProvider.test.tsx`.
   **Expected:** All tests pass.

3. Run `cypress/e2e/onboarding.cy.js`.
   **Expected:** All 5+ test cases pass (TC-OB-001 through TC-OB-005+).

### Test Data

- None

### Edge Cases

- If any test relied on the old CustomEvent-based sync mechanism, it may need updating — verify these specifically

---

## TC-006: App loads with Midweek scenario by default

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a brand-new user opens the app (no prior localStorage), the default scenario is "Midweek" — not "ESPN Live". This ensures new users see a populated market on first load.

### Preconditions

- Fresh app state (all localStorage cleared, including `mcqueen-scenario` key)

### Steps

1. Clear all localStorage and open the app.
   **Expected:** The app loads. The ScenarioProvider initializes with scenario `'midweek'`.

2. Observe the Market page.
   **Expected:** Player cards are populated with midweek data. The ScenarioToggle (if visible) shows "Midweek" as the active/selected tab. `localStorage.getItem('mcqueen-scenario')` is `'midweek'`.

3. Check the market headline area.
   **Expected:** Headline from `midweek.json` is displayed (not "Market activity" fallback).

### Test Data

- `STORAGE_KEYS.scenario` storage key
- `src/data/midweek.json` scenario data

### Edge Cases

- If `mcqueen-scenario` key exists in localStorage with value `'espn-live'` from a previous session, the app should respect that stored value (only new/fresh users get midweek default)
- If `mcqueen-scenario` contains an invalid/unknown value, verify graceful fallback behavior

---

## TC-007: ESPN Live empty-state message when no data is available

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a user manually selects the ESPN Live scenario and it returns no data or zero events, a clear, user-friendly empty-state message is displayed instead of a blank/broken page.

### Preconditions

- App is running
- ESPN Live scenario is available in the scenario toggle
- ESPN data fetch returns empty or fails (simulate via network mock or empty data)

### Steps

1. Navigate to the Market page.
   **Expected:** Market page loads with current scenario data.

2. Select "ESPN Live" from the ScenarioToggle.
   **Expected:** Scenario switches to ESPN Live. Loading state briefly appears.

3. Wait for ESPN data to resolve with zero players/events.
   **Expected:** An empty-state fallback UI appears with a clear message explaining that no ESPN data is currently available. The message should be helpful (e.g., "No live ESPN data right now. Try again later or switch to another scenario."). The UI should NOT show an empty grid, broken layout, or zero counters with no explanation.

### Test Data

- Mock ESPN data endpoint to return empty `{ players: [] }` or simulate load failure

### Edge Cases

- ESPN data returns `null` or `undefined` instead of an empty array
- ESPN data endpoint times out (distinct from returning empty)
- ESPN data returns players but all have zero events/price history

---

## TC-008: ESPN refresh button shows loading and error states

**Priority:** P1
**Type:** Functional

### Objective

Verify that the ESPN refresh mechanism shows a loading indicator while fetching, and displays an error message if the fetch fails.

### Preconditions

- ESPN Live scenario is selected
- ESPN refresh functionality is available in the UI

### Steps

1. Select ESPN Live scenario.
   **Expected:** ESPN Live mode activates.

2. Trigger ESPN data refresh (click refresh button or wait for auto-refresh).
   **Expected:** A loading indicator/spinner appears while the fetch is in progress. UI remains interactive (not frozen).

3. Simulate a network failure on the ESPN fetch.
   **Expected:** Loading indicator disappears. A clear error message is displayed (e.g., from `espnError` state in SimulationContext). The error message is user-friendly, not a raw stack trace or "undefined".

4. Retry the refresh after the error.
   **Expected:** Loading indicator reappears. If the retry succeeds, data loads and error clears.

### Test Data

- Mock ESPN API to return HTTP 500 or network error
- `espnError` state in SimulationContext

### Edge Cases

- Multiple rapid clicks on refresh button — should not queue redundant requests
- Error state followed by successful retry — error message should clear completely

---

## TC-009: User can manually select ESPN Live from scenario toggle

**Priority:** P1
**Type:** Functional

### Objective

Verify that ESPN Live remains available as a scenario option and users can select it manually, even though it is no longer the default.

### Preconditions

- App loaded with Midweek as default scenario

### Steps

1. Open the app (fresh state, Midweek is default).
   **Expected:** Midweek scenario is active.

2. Locate the ScenarioToggle component.
   **Expected:** Toggle is visible. "ESPN Live" option is present with label "ESPN Live" and description "Real News".

3. Click the "ESPN Live" option.
   **Expected:** Scenario switches to `'espn-live'`. `localStorage.getItem('mcqueen-scenario')` updates to `'espn-live'`. Market page updates to show ESPN Live data (or empty state if no data).

4. Reload the page.
   **Expected:** ESPN Live remains selected (persisted via localStorage).

### Test Data

- ScenarioToggle scenario list includes `{ id: 'espn-live', label: 'ESPN Live' }`

### Edge Cases

- Switch from ESPN Live back to Midweek — should restore midweek data cleanly
- Rapid toggling between scenarios — no stale data or race conditions (ScenarioContext uses cancellation flag)

---

## TC-010: FirstTradeGuide does NOT appear for returning users

**Priority:** P1
**Type:** Regression

### Objective

Verify that FirstTradeGuide does not appear for users who have already completed onboarding and have previously seen or dismissed the guide.

### Preconditions

- `localStorage.getItem('mcqueen-onboarded')` is `'true'`
- `localStorage.getItem('mcqueen-first-trade-seen')` is `'true'`
- `localStorage.getItem('mcqueen-onboarding-just-completed')` is `null` (removed)

### Steps

1. Set the localStorage keys as described in preconditions, then load the Market page.
   **Expected:** No onboarding modal appears. No FirstTradeGuide appears. Market page renders normally with player data.

### Test Data

- Pre-set localStorage keys simulating a returning user

### Edge Cases

- User who completed onboarding but `mcqueen-onboarding-just-completed` is lingering as `'true'` and `mcqueen-first-trade-seen` is also `'true'` — guide should NOT appear
- User who has trades in portfolio — guide should NOT appear regardless of other flags

---

## TC-011: FirstTradeGuide auto-dismisses when user makes first trade

**Priority:** P1
**Type:** Functional

### Objective

Verify that FirstTradeGuide automatically hides when the user completes their first trade, and sets the appropriate localStorage flags.

### Preconditions

- FirstTradeGuide is currently visible (user just completed onboarding, has no trades)

### Steps

1. Verify FirstTradeGuide is visible on the Market page.
   **Expected:** Guide is visible with "Make Your First Trade!" content.

2. Navigate to a player detail page and execute a buy trade (purchase at least 1 share).
   **Expected:** Trade completes successfully. Portfolio is no longer empty.

3. Return to the Market page (or observe if already on Market).
   **Expected:** FirstTradeGuide is no longer visible. `localStorage.getItem('mcqueen-first-trade-seen')` is `'true'`. `localStorage.getItem('mcqueen-onboarding-just-completed')` has been removed.

### Test Data

- Any player available in the current scenario
- Buy 1 share at market price

### Edge Cases

- Guide dismisses mid-step (user was on step 2 of 3 in the guide when they made the trade)
- User sells the share immediately after buying — guide should NOT reappear

---

## TC-012: FirstTradeGuide manual dismiss via close button

**Priority:** P1
**Type:** Functional

### Objective

Verify that the user can manually dismiss the FirstTradeGuide using the close button, and that it does not reappear.

### Preconditions

- FirstTradeGuide is visible (post-onboarding, no trades)

### Steps

1. Verify FirstTradeGuide is visible.
   **Expected:** Guide shows with close (X) button in the header.

2. Click the close button (aria-label="Close guide").
   **Expected:** Guide disappears with exit animation. `localStorage.getItem('mcqueen-first-trade-seen')` is `'true'`. `localStorage.getItem('mcqueen-onboarding-just-completed')` is removed.

3. Reload the page.
   **Expected:** FirstTradeGuide does not reappear.

### Test Data

- None

### Edge Cases

- Dismiss on step 1, then on a fresh session with the flag set — still does not reappear
- Click "Let's Trade!" on the final step (step 3) — should also dismiss permanently via `handleDismiss`

---

## TC-013: Skipping onboarding also triggers FirstTradeGuide

**Priority:** P1
**Type:** Integration

### Objective

Verify that pressing "Skip" during onboarding still triggers `markOnboardingComplete()`, which means the FirstTradeGuide should appear afterward (since the user is still a new user who hasn't traded).

### Preconditions

- Fresh app state, no localStorage keys

### Steps

1. Open the app. Onboarding modal appears.
   **Expected:** Onboarding modal is visible on step 1.

2. Click the "Skip" button.
   **Expected:** Onboarding modal closes. `hasCompletedOnboarding` updates to `true`. `showFirstTradeGuide` updates to `true`.

3. Observe the Market page.
   **Expected:** FirstTradeGuide appears within ~500ms (same behavior as completing all steps).

### Test Data

- None

### Edge Cases

- Press Escape key instead of clicking Skip — should have the same effect

---

## TC-014: ScenarioContext graceful handling of unknown scenario in localStorage

**Priority:** P2
**Type:** Regression

### Objective

Verify that if localStorage contains an invalid scenario value (e.g., from a corrupted or outdated session), the app handles it gracefully without crashing.

### Preconditions

- `localStorage.setItem('mcqueen-scenario', 'nonexistent-scenario')` before app load

### Steps

1. Set localStorage scenario key to an invalid value, then open the app.
   **Expected:** The ScenarioProvider attempts to load the scenario. `scenarioLoaders['nonexistent-scenario']` returns `undefined`. `scenarioLoading` transitions to `false`. `currentData` remains `null`. `players` is an empty array `[]`.

2. Observe the Market page.
   **Expected:** No crash or white screen. The page renders with an empty player grid or a suitable fallback. User can select a valid scenario from the toggle to recover.

### Test Data

- Invalid scenario key: `'nonexistent-scenario'`

### Edge Cases

- Empty string as scenario value
- `null` stored in localStorage for the scenario key
- Scenario loader exists but the JSON import fails (e.g., corrupted data file)
