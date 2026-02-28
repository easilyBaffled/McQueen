# Test Plan: mcq-vqz.2 -- Fix header Total Value clipping on scenarios with badges

## Summary

- **Bead:** `mcq-vqz.2`
- **Feature:** Prevent header Total Value label and dollar amount from being clipped when scenario tabs display LIVE or ESPN badges
- **Total Test Cases:** 10
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Total Value fully visible when Live Game scenario is active (LIVE badge shown)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the "Total Value" label and dollar amount in the header-right section are not clipped or truncated when the Live Game scenario tab is selected and its LIVE badge is rendered.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)
- User has a portfolio with a non-zero total value

### Steps

1. Click the "Live Game" scenario tab in the header center.
   **Expected:** The Live Game tab becomes active and displays a pulsing green LIVE badge next to the tab label.

2. Observe the "Total Value" label (`data-testid="balance-label"`) in the header-right section.
   **Expected:** The full text "Total Value" is visible without clipping, truncation, or overflow.

3. Observe the dollar amount (`data-testid="balance-value"`) below the label.
   **Expected:** The full dollar amount (e.g., "$100,000.00") is visible without clipping, truncation, or overflow.

### Test Data

- Default starting cash balance (any value that produces a multi-digit dollar amount)

### Edge Cases

- Verify with a large total value such as $1,234,567.89 to stress-test horizontal space

---

## TC-002: Total Value fully visible when Super Bowl scenario is active (LIVE badge shown)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the Super Bowl scenario—which also renders a LIVE badge—does not cause clipping of the Total Value display.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)
- User has a portfolio with a non-zero total value

### Steps

1. Click the "Super Bowl" scenario tab in the header center.
   **Expected:** The Super Bowl tab becomes active and displays a LIVE badge (since `isLive: true`).

2. Observe the "Total Value" label and dollar amount in header-right.
   **Expected:** Both are fully visible with no clipping, truncation, or text overflow.

### Test Data

- Default starting balance

### Edge Cases

- None beyond TC-001 edge cases

---

## TC-003: Total Value fully visible when ESPN Live scenario is active (ESPN badge shown)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the ESPN Live scenario—which renders an ESPN badge with potential loading/error states—does not cause clipping of the Total Value display.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)
- User has a portfolio with a non-zero total value

### Steps

1. Click the "ESPN Live" scenario tab in the header center.
   **Expected:** The ESPN Live tab becomes active and displays an ESPN indicator badge.

2. Observe the "Total Value" label and dollar amount in header-right.
   **Expected:** Both are fully visible with no clipping, truncation, or text overflow.

3. If ESPN feed is loading, observe the ESPN tab showing the loading spinner (⟳).
   **Expected:** The Total Value remains fully visible even with the loading indicator in the center section.

### Test Data

- Default starting balance

### Edge Cases

- ESPN error state (badge shows "!" icon): verify Total Value is still not clipped
- ESPN loading state (badge shows spinner): verify Total Value is still not clipped

---

## TC-004: Total Value visible for scenarios without badges (Midweek, Playoffs)

**Priority:** P1
**Type:** Regression

### Objective

Verify the fix does not introduce any regressions for scenarios that do not display LIVE or ESPN badges. The Total Value should remain fully visible.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)

### Steps

1. Click the "Midweek" scenario tab.
   **Expected:** The tab becomes active with no badge. Total Value label and amount are fully visible.

2. Click the "Playoffs" scenario tab.
   **Expected:** The tab becomes active with no badge. Total Value label and amount are fully visible.

### Test Data

- Default starting balance

### Edge Cases

- None

---

## TC-005: header-right does not shrink (CSS flex property validation)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the `.header-right` element has `flex: 0 0 auto` and `min-width: fit-content`, ensuring it never shrinks regardless of center content size.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)
- A scenario with a badge (Live Game or ESPN Live) is active

### Steps

1. Open browser DevTools and inspect the `.header-right` element.
   **Expected:** Computed style shows `flex-grow: 0`, `flex-shrink: 0`, `flex-basis: auto`.

2. Verify the `min-width` computed value.
   **Expected:** `min-width` is `fit-content` (or the browser-resolved equivalent), preventing the element from being squeezed below its intrinsic content width.

3. Resize the browser window gradually narrower while observing the header-right section.
   **Expected:** The header-right section retains its full intrinsic width; the header-center section shrinks first.

### Test Data

- N/A

### Edge Cases

- At very narrow widths (near 768px breakpoint), confirm header-right still does not shrink before the responsive breakpoint takes effect

---

## TC-006: header-center shrinks before header-right (flex priority validation)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that `.header-center` has `flex: 1 1 auto`, `min-width: 0`, and `overflow: hidden`, so it absorbs space reduction before header-right is affected.

### Preconditions

- App is loaded at a wide desktop viewport (≥1280px)
- A scenario with a badge (e.g., ESPN Live) is active

### Steps

1. Open browser DevTools and inspect the `.header-center` element.
   **Expected:** Computed style shows `flex-grow: 1`, `flex-shrink: 1`, `flex-basis: auto`, `min-width: 0`, `overflow: hidden`.

2. Gradually reduce viewport width from 1280px toward 768px.
   **Expected:** The scenario tabs in header-center compress or overflow-clip before the Total Value in header-right loses any space.

3. At each intermediate width (1100px, 1000px, 900px, 800px), verify the Total Value label and dollar amount.
   **Expected:** Fully visible at every width above the 768px mobile breakpoint.

### Test Data

- N/A

### Edge Cases

- If scenario tabs overflow, they should be hidden gracefully (not spill outside the header)

---

## TC-007: Help button remains visible alongside Total Value

**Priority:** P1
**Type:** Regression

### Objective

Verify the Help button in header-right is not pushed off-screen or clipped by the fix, since it shares the header-right container with Total Value.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)
- Any scenario with a badge is active

### Steps

1. Observe the Help button (`data-testid="help-button"`) in the header-right section.
   **Expected:** The Help button is fully visible with its icon and "Help" text label.

2. Click the Help button.
   **Expected:** The Glossary modal opens, confirming the button is interactive and not obscured.

### Test Data

- N/A

### Edge Cases

- At 601–768px widths, the "Help" text hides (per existing media query) but the icon button should remain visible and clickable

---

## TC-008: Responsive behavior at 768px breakpoint

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the header layout remains correct at the 768px mobile breakpoint where responsive overrides take effect.

### Preconditions

- App is loaded and viewport set to exactly 768px wide
- A scenario with a badge is active

### Steps

1. Set viewport width to 768px.
   **Expected:** Header switches to compact layout: reduced padding (0 12px), smaller gap (8px).

2. Observe header-right at 768px.
   **Expected:** `flex: 0 0 auto` is applied (per responsive override). Balance label hides, balance value shows at 14px font size, fully visible and not clipped.

3. Observe header-center at 768px.
   **Expected:** `flex: 1` is applied. Scenario tabs remain centered and usable.

4. Set viewport to 769px (just above breakpoint).
   **Expected:** Desktop layout rules apply. Total Value label reappears. No clipping.

### Test Data

- N/A

### Edge Cases

- At exactly 768px, both breakpoint rules and base rules may interact—verify no style conflicts

---

## TC-009: Responsive behavior at 480px breakpoint

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the header layout at the narrowest supported breakpoint (480px) does not clip the Total Value.

### Preconditions

- App is loaded and viewport set to 480px wide
- A scenario with a badge is active

### Steps

1. Set viewport width to 480px.
   **Expected:** Header padding reduces to 0 8px. Logo font shrinks to 18px.

2. Observe the balance value in header-right.
   **Expected:** The dollar amount is fully visible (14px font, no label). Not clipped or overflowing.

3. Observe header-center scenario tabs.
   **Expected:** Tabs are constrained to available space; they do not push header-right off-screen.

### Test Data

- N/A

### Edge Cases

- Very small viewports (320px, e.g., iPhone SE): verify the header doesn't break entirely, even if not a primary target

---

## TC-010: Large dollar amounts do not clip

**Priority:** P1
**Type:** Functional

### Objective

Verify that unusually large Total Value amounts (many digits) remain fully visible and are not truncated by the header-right container.

### Preconditions

- App is loaded at desktop viewport (≥1024px wide)
- A scenario with a badge is active (e.g., Live Game)

### Steps

1. Manipulate portfolio state (via dev tools or context) to set total value to $9,999,999.99.
   **Expected:** The dollar amount "$9,999,999.99" renders fully in header-right without clipping.

2. Observe that header-center scenario tabs shrink to accommodate the wider header-right.
   **Expected:** The center section compresses; header-right remains at its full intrinsic width.

3. Set total value to $0.00 (zero balance edge case).
   **Expected:** "$0.00" renders correctly, no extra whitespace or layout shift.

### Test Data

- Total value: $9,999,999.99
- Total value: $0.00

### Edge Cases

- Negative display edge: if portfolio value calculation could theoretically produce a negative number, verify no layout issues with a minus sign
