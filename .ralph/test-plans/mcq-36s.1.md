# Test Plan: mcq-36s.1 -- Add confirmation dialog before portfolio reset on scenario switch

## Summary

- **Bead:** `mcq-36s.1`
- **Feature:** Confirmation dialog warns users about portfolio/cash reset before switching scenarios
- **Total Test Cases:** 16
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Dialog appears on desktop tab click with non-empty portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify the core behavior: clicking a different scenario tab shows the confirmation dialog when the user holds at least one stock position.

### Preconditions

- App is loaded on a desktop viewport (≥769px)
- Current scenario is "Midweek"
- Portfolio contains at least one holding (e.g., Mahomes — 5 shares at $100 avg cost)

### Steps

1. Click the "Live Game" tab in the desktop scenario tab bar.
   **Expected:** A confirmation dialog appears with the message "Switching scenarios will reset your portfolio and cash to defaults."

2. Observe the scenario tab bar behind the dialog.
   **Expected:** The active tab is still "Midweek" — the scenario has NOT changed yet.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- Repeat with each of the other target scenarios (Playoffs, Super Bowl, ESPN Live) to confirm dialog appears for all.

---

## TC-002: Dialog does NOT appear with empty portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify the dialog is skipped entirely when the user has no holdings, allowing immediate scenario switching.

### Preconditions

- App is loaded on a desktop viewport
- Current scenario is "Midweek"
- Portfolio is empty (`{}`)

### Steps

1. Click the "Live Game" tab.
   **Expected:** No confirmation dialog appears. The scenario switches to "Live Game" immediately (`setScenario('live')` is called).

### Test Data

- Portfolio: `{}`

### Edge Cases

- Confirm behavior also applies when portfolio was previously non-empty but user sold all positions (resulting in `{}`).

---

## TC-003: Confirming the dialog switches the scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking "Switch & Reset" in the dialog proceeds with the scenario change.

### Preconditions

- App is loaded on a desktop viewport
- Current scenario is "Midweek"
- Portfolio is non-empty

### Steps

1. Click the "Live Game" tab.
   **Expected:** Confirmation dialog appears.

2. Click the "Switch & Reset" button.
   **Expected:** Dialog closes. `setScenario('live')` is called. Active scenario changes to "Live Game".

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- None.

---

## TC-004: Canceling the dialog preserves current scenario and portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking "Cancel" dismisses the dialog without changing the scenario or portfolio.

### Preconditions

- App is loaded on a desktop viewport
- Current scenario is "Midweek"
- Portfolio is non-empty

### Steps

1. Click the "Live Game" tab.
   **Expected:** Confirmation dialog appears.

2. Click the "Cancel" button.
   **Expected:** Dialog closes. `setScenario` was NOT called. Active scenario is still "Midweek". Portfolio remains unchanged.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- After canceling, click the same target tab again — dialog should reappear.

---

## TC-005: No dialog when clicking the currently active scenario

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the already-active scenario tab is a no-op — no dialog, no scenario change.

### Preconditions

- Current scenario is "Midweek"
- Portfolio is non-empty

### Steps

1. Click the "Midweek" tab (which is already active).
   **Expected:** No dialog appears. `setScenario` is NOT called. Nothing changes.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- Repeat on mobile by selecting the currently active scenario from the dropdown.

---

## TC-006: Mobile dropdown triggers confirmation dialog with non-empty portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify the confirmation dialog also appears when switching scenarios via the mobile dropdown.

### Preconditions

- App is loaded on a mobile viewport (<769px)
- Current scenario is "Midweek"
- Portfolio is non-empty

### Steps

1. Tap the mobile dropdown trigger button.
   **Expected:** Dropdown menu opens, showing all five scenarios.

2. Tap the "Live Game" option in the dropdown.
   **Expected:** Dropdown closes. Confirmation dialog appears with reset warning message.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- None.

---

## TC-007: Mobile dropdown skips dialog with empty portfolio

**Priority:** P1
**Type:** Functional

### Objective

Verify that mobile dropdown selection switches scenarios immediately when portfolio is empty.

### Preconditions

- App is loaded on a mobile viewport
- Current scenario is "Midweek"
- Portfolio is empty

### Steps

1. Tap the mobile dropdown trigger.
   **Expected:** Dropdown opens.

2. Tap the "Playoffs" option.
   **Expected:** Dropdown closes. No dialog appears. Scenario switches to "Playoffs" immediately.

### Test Data

- Portfolio: `{}`

### Edge Cases

- None.

---

## TC-008: Confirm dialog from mobile selection proceeds with switch

**Priority:** P1
**Type:** Functional

### Objective

Verify that confirming the dialog after a mobile-initiated switch completes the scenario change.

### Preconditions

- Mobile viewport, scenario is "Midweek", portfolio is non-empty

### Steps

1. Open mobile dropdown and tap "Super Bowl".
   **Expected:** Dropdown closes. Confirmation dialog appears.

2. Tap "Switch & Reset".
   **Expected:** Dialog closes. Scenario changes to "Super Bowl".

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- None.

---

## TC-009: Cancel dialog from mobile selection preserves state

**Priority:** P1
**Type:** Functional

### Objective

Verify that canceling the dialog after a mobile-initiated switch preserves scenario and portfolio.

### Preconditions

- Mobile viewport, scenario is "Midweek", portfolio is non-empty

### Steps

1. Open mobile dropdown and tap "Playoffs".
   **Expected:** Dropdown closes. Confirmation dialog appears.

2. Tap "Cancel".
   **Expected:** Dialog closes. Scenario remains "Midweek". Portfolio unchanged.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- None.

---

## TC-010: Dialog warning message content

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the dialog displays an accurate, user-friendly warning about data loss.

### Preconditions

- Non-empty portfolio, trigger a scenario switch to show the dialog

### Steps

1. Trigger the confirmation dialog (click a different scenario tab with non-empty portfolio).
   **Expected:** Dialog text reads: "Switching scenarios will reset your portfolio and cash to defaults."

2. Observe dialog buttons.
   **Expected:** Two buttons are present — "Cancel" and "Switch & Reset".

### Test Data

- N/A

### Edge Cases

- Confirm the message does not mention specific portfolio contents (it's a generic warning).

---

## TC-011: Dialog overlay styling and layout

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify the confirmation dialog renders with correct visual styling per the CSS specification.

### Preconditions

- Non-empty portfolio, trigger a scenario switch

### Steps

1. Trigger the confirmation dialog.
   **Expected:** A semi-transparent dark overlay covers the full viewport (`position: fixed; inset: 0; background: rgba(0,0,0,0.6)`).

2. Observe the dialog panel.
   **Expected:** Dialog is centered on screen. Max width is 400px, width is 90% of viewport. Background matches `var(--color-surface)`. Has 1px border and 12px border-radius. 24px padding.

3. Observe the action buttons.
   **Expected:** Buttons are right-aligned with 12px gap. "Cancel" has a muted surface background. "Switch & Reset" has an accent/red background (`var(--color-accent, #d00)`) with white text.

### Test Data

- N/A

### Edge Cases

- Test on narrow viewports (320px) — dialog should not overflow.

---

## TC-012: Dialog has data-testid attribute for test automation

**Priority:** P2
**Type:** Integration

### Objective

Verify the dialog's container has the `data-testid="scenario-confirm-dialog"` attribute for automated test targeting.

### Preconditions

- Non-empty portfolio, trigger a scenario switch

### Steps

1. Trigger the confirmation dialog and inspect the DOM.
   **Expected:** The overlay `div` has `data-testid="scenario-confirm-dialog"`.

### Test Data

- N/A

### Edge Cases

- Attribute should NOT be present in the DOM when the dialog is not shown.

---

## TC-013: Portfolio with multiple holdings triggers dialog

**Priority:** P1
**Type:** Functional

### Objective

Verify the dialog appears when the portfolio contains multiple holdings (not just a single holding).

### Preconditions

- Portfolio contains 3+ different player holdings
- Current scenario is "Midweek"

### Steps

1. Click a different scenario tab (e.g., "Playoffs").
   **Expected:** Confirmation dialog appears.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 }, kelce: { shares: 3, avgCost: 80 }, allen: { shares: 10, avgCost: 50 } }`

### Edge Cases

- Portfolio with a single holding of 1 share should also trigger the dialog.

---

## TC-014: Rapid sequential scenario clicks while dialog is open

**Priority:** P2
**Type:** Regression

### Objective

Verify that clicking another scenario tab while the confirmation dialog is already open does not cause unexpected behavior (double dialogs, wrong target scenario, etc.).

### Preconditions

- Non-empty portfolio, current scenario is "Midweek"

### Steps

1. Click "Live Game" tab.
   **Expected:** Confirmation dialog appears (pending scenario = "live").

2. Without closing the dialog, click "Playoffs" tab (if the tab bar is still interactive behind the overlay).
   **Expected:** Either the click is blocked by the overlay, or the pending scenario updates to "playoffs". No duplicate dialogs appear.

3. Click "Switch & Reset".
   **Expected:** Scenario switches to whichever target was last set. Dialog closes cleanly.

### Test Data

- Portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`

### Edge Cases

- None.

---

## TC-015: Cancel button hover state

**Priority:** P3
**Type:** UI/Visual

### Objective

Verify the Cancel button changes background on hover as defined in CSS.

### Preconditions

- Confirmation dialog is visible

### Steps

1. Hover over the "Cancel" button.
   **Expected:** Background changes to `var(--color-border, #333)`.

2. Hover over the "Switch & Reset" button.
   **Expected:** Opacity changes to 0.9.

### Test Data

- N/A

### Edge Cases

- None.

---

## TC-016: Portfolio reset actually occurs after confirming switch

**Priority:** P0
**Type:** Integration

### Objective

Verify end-to-end that after confirming the dialog, the portfolio is actually reset (via `TradingContext`'s `scenarioVersion` effect) and cash returns to defaults.

### Preconditions

- Full app with TradingContext wired up (not mocked)
- Non-empty portfolio with custom cash balance
- Current scenario is "Midweek"

### Steps

1. Navigate to Portfolio page and confirm holdings are visible with modified cash.
   **Expected:** Portfolio shows at least one holding. Cash differs from initial default.

2. Click a different scenario tab (e.g., "Live Game").
   **Expected:** Confirmation dialog appears.

3. Click "Switch & Reset".
   **Expected:** Scenario changes. Portfolio page now shows the starting portfolio for the new scenario (or empty). Cash resets to the initial default ($10,000).

### Test Data

- Initial portfolio: `{ mahomes: { shares: 5, avgCost: 100 } }`, cash: $9,500
- Expected after reset: starting portfolio for "live" scenario, cash: $10,000

### Edge Cases

- If the new scenario has a `startingPortfolio` defined, verify those holdings appear instead of an empty portfolio.
