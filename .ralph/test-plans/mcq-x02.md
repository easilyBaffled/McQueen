# Test Plan: mcq-x02 -- Accessibility Improvements

## Summary

- **Bead:** `mcq-x02`
- **Feature:** Accessible sparkline alternative on PlayerCard, keyboard dismissal for Toast notifications, and increased Watchlist remove button touch target
- **Total Test Cases:** 15
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Sparkline chart container has descriptive aria-label

**Priority:** P0
**Type:** Functional

### Objective

Verify the sparkline chart region on each PlayerCard has an `aria-label` (or equivalent) that conveys the price trend to screen reader users.

### Preconditions

- App is running with at least one player whose `priceHistory` contains entries
- Screen reader or accessibility inspector available

### Steps

1. Navigate to the Market page.
   **Expected:** Player cards render with sparkline charts.

2. Inspect the `.card-chart` container (or the `<svg>` / `ResponsiveContainer` wrapper) of any PlayerCard.
   **Expected:** The element has an `aria-label` attribute describing the trend direction and magnitude (e.g., "7-day price trend: up 2.50%").

3. Verify the label dynamically reflects the player's actual `changePercent` and direction.
   **Expected:** A player with +2.50% shows "up 2.50%"; a player with -3.10% shows "down 3.10%".

### Test Data

- Player with positive `changePercent` (e.g., Patrick Mahomes, +2.50%)
- Player with negative `changePercent` (e.g., Joe Burrow, -3.10%)

### Edge Cases

- Player with exactly 0% change — label should indicate flat or neutral trend
- Player with no `priceHistory` (empty array) — sparkline may not render; ensure no misleading aria-label is present

---

## TC-002: Sparkline accessible text includes "Last 7 days" time context

**Priority:** P1
**Type:** Functional

### Objective

Verify the accessible alternative communicates the time range of the sparkline data, matching the visual "Last 7 days" label.

### Preconditions

- Market page loaded with player cards

### Steps

1. Inspect the sparkline chart's accessible description on a PlayerCard.
   **Expected:** The aria-label or associated text includes "7 days" or "7-day" to convey the time range.

2. Activate a screen reader (VoiceOver/NVDA) and navigate to the chart area.
   **Expected:** Screen reader announces both the time range and the trend direction/magnitude.

### Test Data

- Any player with price history data

### Edge Cases

- None specific beyond TC-001 edge cases

---

## TC-003: Sparkline SVG is hidden from screen readers when accessible alternative exists

**Priority:** P1
**Type:** Functional

### Objective

Ensure the raw SVG chart element is marked `aria-hidden="true"` or `role="presentation"` so screen readers don't attempt to parse meaningless SVG path data.

### Preconditions

- Market page loaded

### Steps

1. Inspect the `<svg>` element rendered by Recharts `LineChart` inside a PlayerCard.
   **Expected:** The SVG has `aria-hidden="true"` or `role="presentation"`.

2. Navigate through the PlayerCard with a screen reader.
   **Expected:** The screen reader reads the descriptive aria-label but does not announce SVG path elements.

### Test Data

- Any player with sparkline data

### Edge Cases

- If Recharts injects its own ARIA attributes, verify they don't conflict with the custom accessible label

---

## TC-004: Sparkline with empty price history has no misleading accessible text

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a player has no price history, the sparkline area does not present a misleading trend description.

### Preconditions

- A player exists with an empty `priceHistory` array

### Steps

1. Render a PlayerCard for a player with `priceHistory: []`.
   **Expected:** Either no sparkline chart renders, or the chart area has `aria-hidden="true"` / no trend aria-label.

2. Navigate the card with a screen reader.
   **Expected:** No trend information is announced for this player.

### Test Data

- Player with `priceHistory: []`

### Edge Cases

- Player with exactly one price history entry (only current price dot, no line) — should still provide some accessible context or be hidden

---

## TC-005: Toast notification is keyboard-focusable

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a toast appears, keyboard users can move focus to it (via Tab or automatic focus management).

### Preconditions

- App is running; user can trigger a toast (e.g., buy a share, add to watchlist)

### Steps

1. Trigger a toast notification by performing a buy action.
   **Expected:** Toast appears at the bottom of the screen.

2. Press Tab to attempt to move focus toward the toast.
   **Expected:** Focus lands on the toast's close button or the toast itself.

3. Verify the toast close button is reachable via keyboard Tab navigation.
   **Expected:** The close button receives visible focus indicator.

### Test Data

- Any action that triggers a success, error, or info toast

### Edge Cases

- Multiple toasts visible simultaneously — Tab should cycle through all dismissable toasts
- Toast appearing while a modal is open — focus management should not conflict

---

## TC-006: Toast dismisses on Escape key press

**Priority:** P0
**Type:** Functional

### Objective

Verify that pressing the Escape key dismisses the currently displayed toast notification.

### Preconditions

- A toast notification is visible on screen

### Steps

1. Trigger a toast notification (e.g., buy a share).
   **Expected:** Toast appears.

2. Press the Escape key.
   **Expected:** The toast is removed from the DOM immediately (or animates out).

3. Verify the toast container is empty after dismissal.
   **Expected:** No toast elements remain in the `.toast-container`.

### Test Data

- Success toast, error toast, and info toast (test each type)

### Edge Cases

- Pressing Escape when no toast is visible — should have no effect and not throw errors
- Pressing Escape with multiple toasts visible — should dismiss the most recent (or all); document chosen behavior
- Pressing Escape while toast is mid-animation (entering) — should still dismiss cleanly

---

## TC-007: Toast close button dismisses via Enter/Space key

**Priority:** P0
**Type:** Functional

### Objective

Verify that the toast close button (already present in the DOM) can be activated with keyboard Enter or Space.

### Preconditions

- A toast is visible and the close button is focused

### Steps

1. Trigger a toast notification.
   **Expected:** Toast appears with a close button.

2. Tab to the close button of the toast.
   **Expected:** Close button receives focus.

3. Press Enter.
   **Expected:** Toast is dismissed.

4. Trigger another toast, tab to close button, and press Space.
   **Expected:** Toast is dismissed.

### Test Data

- Any toast type

### Edge Cases

- Rapidly pressing Enter/Space should not cause errors after the toast is already removed

---

## TC-008: Toast retains auto-dismiss when keyboard dismissal is added

**Priority:** P1
**Type:** Regression

### Objective

Verify the existing auto-dismiss behavior (3-second timeout) still works correctly after adding keyboard dismissal support.

### Preconditions

- Toast provider is configured with default 3000ms duration

### Steps

1. Trigger a toast notification.
   **Expected:** Toast appears.

2. Wait 3 seconds without any keyboard interaction.
   **Expected:** Toast auto-dismisses after the timeout.

3. Trigger another toast and dismiss it via Escape before the timeout.
   **Expected:** Toast is dismissed immediately; no errors from the timeout callback trying to remove an already-removed toast.

### Test Data

- Default duration toast (3000ms)

### Edge Cases

- Custom duration toasts should also still auto-dismiss at their configured time
- Dismissing via keyboard then having the timeout fire should not cause a double-removal error or console warning

---

## TC-009: Toast ARIA attributes preserved after keyboard changes

**Priority:** P1
**Type:** Regression

### Objective

Verify existing ARIA attributes (`role="status"`, `aria-live="polite"`, `aria-label="Dismiss notification"` on close button) remain intact after the keyboard dismissal feature is added.

### Preconditions

- Toast notification is visible

### Steps

1. Trigger a toast notification.
   **Expected:** Toast appears.

2. Inspect the toast container element.
   **Expected:** Has `role="status"` and `aria-live="polite"`.

3. Inspect the toast close button.
   **Expected:** Has `aria-label="Dismiss notification"`.

4. Inspect toast icon SVGs.
   **Expected:** Have `aria-hidden="true"`.

### Test Data

- All three toast types: success, error, info

### Edge Cases

- None

---

## TC-010: Watchlist remove button meets minimum 44x44px touch target

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the remove button on watchlist cards has a minimum touch target of 44x44 CSS pixels, meeting WCAG 2.5.8 (Target Size) guidelines. Current size is 28x28px which is too small.

### Preconditions

- At least one player is on the watchlist
- Watchlist page is loaded

### Steps

1. Navigate to the Watchlist page.
   **Expected:** Watchlist cards render with remove (X) buttons.

2. Inspect the `.remove-button` element's computed dimensions.
   **Expected:** Width and height are each at least 44px (either via direct sizing or padding that expands the touch target).

3. On a mobile viewport (375px wide), verify the button is comfortably tappable.
   **Expected:** The button's tappable area is at least 44x44px; fingers don't accidentally hit the underlying card link.

### Test Data

- Watchlist with 1 player, with 3+ players

### Edge Cases

- Very long player names should not push the remove button out of the tappable zone
- On the smallest supported viewport, the button should not overlap other interactive elements

---

## TC-011: Watchlist remove button visual appearance after resize

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the enlarged touch target maintains the same visual design — circular icon button with the X icon centered — and does not look oversized or misaligned.

### Preconditions

- Watchlist page with players

### Steps

1. Navigate to the Watchlist page.
   **Expected:** Remove buttons are visible on each card.

2. Visually inspect the button.
   **Expected:** The X icon is centered within the button. The button appears as a small circle (visual size can be smaller than the touch target if padding is used to expand the hit area).

3. Hover over the button on desktop.
   **Expected:** The existing hover style (red background, white icon) still applies correctly.

4. Check the button at multiple viewport widths (375px, 768px, 1200px).
   **Expected:** Button position (top-right of card) and styling are consistent across viewports.

### Test Data

- Multiple watchlist cards

### Edge Cases

- Cards in single-column vs. multi-column grid layouts

---

## TC-012: Watchlist remove button click still prevents navigation

**Priority:** P0
**Type:** Regression

### Objective

Verify that clicking the remove button still calls `preventDefault()` to prevent navigating to the player detail page (since the button overlays a `<Link>`).

### Preconditions

- Watchlist page with at least one player

### Steps

1. Click the remove button on a watchlist card.
   **Expected:** The player is removed from the watchlist (info toast appears) and the page does NOT navigate to `/player/:id`.

2. Verify the URL in the browser has not changed.
   **Expected:** User remains on the Watchlist page.

### Test Data

- Any watched player

### Edge Cases

- Rapidly clicking the remove button multiple times should not cause errors or navigation

---

## TC-013: Watchlist remove button retains aria-label

**Priority:** P1
**Type:** Regression

### Objective

Verify that the remove button still has its `aria-label` of `"Remove {playerName} from watchlist"` after the touch target increase.

### Preconditions

- Watchlist with players

### Steps

1. Navigate to the Watchlist page.
   **Expected:** Remove buttons render.

2. Inspect the remove button element for a specific player (e.g., Patrick Mahomes).
   **Expected:** `aria-label` is `"Remove Patrick Mahomes from watchlist"`.

3. Tab to the button via keyboard.
   **Expected:** Screen reader announces "Remove Patrick Mahomes from watchlist" button.

### Test Data

- Players with varying name lengths

### Edge Cases

- None

---

## TC-014: Screen reader end-to-end flow across all three improvements

**Priority:** P1
**Type:** Integration

### Objective

Verify that a screen reader user can experience all three accessibility improvements in a single workflow: understand the sparkline trend, dismiss a toast via keyboard, and remove a watchlist player with an adequately sized button.

### Preconditions

- VoiceOver (macOS) or NVDA (Windows) active
- At least one player on the watchlist

### Steps

1. Navigate to Market page and focus on a PlayerCard.
   **Expected:** Screen reader announces the sparkline trend (e.g., "7-day price trend: up 2.50%").

2. Activate the Buy action on a player.
   **Expected:** A success toast appears; screen reader announces the toast message via `aria-live` region.

3. Press Escape to dismiss the toast.
   **Expected:** Toast is dismissed; screen reader announces nothing further from the toast region.

4. Navigate to the Watchlist page.
   **Expected:** Screen reader reads the page content including watched players.

5. Tab to a remove button on a watchlist card.
   **Expected:** Screen reader announces "Remove {playerName} from watchlist" button.

6. Press Enter to activate the remove button.
   **Expected:** Player is removed; info toast appears and screen reader announces it.

### Test Data

- A player in the watchlist with price history data

### Edge Cases

- None beyond individual TC edge cases

---

## TC-015: No accessibility regressions in PlayerCard price-change indicators

**Priority:** P2
**Type:** Regression

### Objective

Verify that the existing `aria-label` on the price-change element (e.g., "Up 2.50 percent") is not broken or duplicated by the sparkline accessibility additions.

### Preconditions

- Market page with player cards

### Steps

1. Inspect a PlayerCard with a positive change.
   **Expected:** The `.price-change` span has `aria-label="Up 2.50 percent"` and shows the `▲` icon.

2. Inspect a PlayerCard with a negative change.
   **Expected:** The `.price-change` span has `aria-label="Down 3.10 percent"` and shows the `▼` icon.

3. Run a screen reader through the card.
   **Expected:** The price change is announced separately from the sparkline trend; there is no confusing duplication.

### Test Data

- Players with positive and negative price changes

### Edge Cases

- Player with 0% change — verify label says something like "No change" or "0 percent"
