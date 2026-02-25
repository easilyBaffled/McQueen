# Test Plan: mcq-36s.2 -- Add tooltip explanation to disabled Sell tab

## Summary

- **Bead:** `mcq-36s.2`
- **Feature:** Disabled Sell tab on PlayerDetail displays a tooltip explaining that the user needs to own shares before they can sell
- **Total Test Cases:** 7
- **Test Types:** Functional, UI/Visual, Accessibility, Regression

---

## TC-001: Disabled Sell tab shows tooltip text when user has no holding

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the user does not own shares of a player, the Sell tab button renders with a `title` attribute containing the explanation text. This is the core requirement of the bead.

### Preconditions

- User is logged in with a portfolio that does **not** contain any shares of the target player
- Navigate to the PlayerDetail page for that player

### Steps

1. Locate the Sell tab button in the trading tabs section
   **Expected:** The Sell tab button is present and has `disabled` attribute set

2. Inspect the Sell tab button's `title` attribute
   **Expected:** The `title` attribute value is exactly `"You need to own shares to sell"`

3. Hover over the disabled Sell tab button
   **Expected:** The browser's native tooltip appears displaying "You need to own shares to sell"

### Test Data

- Any player the user does not currently hold shares of (e.g., a player with `portfolio[playerId]` being `undefined`)

### Edge Cases

- Verify the tooltip text is not an empty string or `undefined` when `!holding`

---

## TC-002: Sell tab has no tooltip when user owns shares

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the user owns shares of a player, the Sell tab does not display the explanatory tooltip (the `title` attribute should be absent or `undefined`), since the tab is enabled and clickable.

### Preconditions

- User is logged in and holds at least 1 share of the target player
- Navigate to the PlayerDetail page for that player

### Steps

1. Locate the Sell tab button in the trading tabs section
   **Expected:** The Sell tab button is present and is **not** disabled

2. Inspect the Sell tab button's `title` attribute
   **Expected:** The `title` attribute is not present (or is `undefined`)

3. Hover over the enabled Sell tab button
   **Expected:** No tooltip text appears; the button behaves as a normal clickable tab

### Test Data

- A player the user currently holds shares of (e.g., buy 1 share first, then verify)

### Edge Cases

- User owns exactly 1 share (minimum holding)

---

## TC-003: Sell tab is visually disabled when user has no holding

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the disabled Sell tab has proper visual styling to indicate it is not interactive, complementing the tooltip explanation.

### Preconditions

- User does not hold any shares of the target player
- Navigate to the PlayerDetail page for that player

### Steps

1. Observe the Sell tab button appearance
   **Expected:** The button has reduced opacity (0.5 per the `.trading-tab:disabled` CSS rule)

2. Move the cursor over the disabled Sell tab
   **Expected:** The cursor changes to `not-allowed` (per the CSS rule), and the button does **not** get the hover highlight that enabled tabs receive

3. Click the disabled Sell tab
   **Expected:** Nothing happens; the active tab does not change to "sell"

### Test Data

- Any player not in the user's portfolio

### Edge Cases

- None

---

## TC-004: Tooltip disappears after buying shares (transition from no holding to holding)

**Priority:** P1
**Type:** Functional

### Objective

Verify that if the user buys shares while on the PlayerDetail page, the Sell tab dynamically transitions from disabled-with-tooltip to enabled-without-tooltip without requiring a page refresh.

### Preconditions

- User does not hold any shares of the target player
- Navigate to the PlayerDetail page; confirm Sell tab is disabled with tooltip

### Steps

1. Confirm the Sell tab is disabled and has `title="You need to own shares to sell"`
   **Expected:** Tooltip text is present; button is disabled

2. Use the Buy tab to purchase 1 share of the player
   **Expected:** Buy transaction completes successfully

3. Inspect the Sell tab button again
   **Expected:** The Sell tab is now **enabled**, `disabled` attribute is removed, and the `title` attribute is no longer present

4. Click the Sell tab
   **Expected:** The tab switches to the Sell form; the sell interface is displayed

### Test Data

- A player with a price the user can afford
- Buy amount: 1 share

### Edge Cases

- None

---

## TC-005: Tooltip reappears after selling all shares (transition from holding to no holding)

**Priority:** P1
**Type:** Functional

### Objective

Verify that if the user sells all their shares of a player, the Sell tab becomes disabled again with the tooltip, and the active tab automatically switches back to Buy.

### Preconditions

- User holds exactly 1 share of the target player
- Navigate to the PlayerDetail page; the Sell tab should be enabled

### Steps

1. Click the Sell tab and sell the 1 remaining share
   **Expected:** Sale completes successfully

2. Observe the active tab
   **Expected:** The active tab automatically switches to "Buy" (per the `useEffect` that resets the tab when `!holding`)

3. Inspect the Sell tab button
   **Expected:** The Sell tab is now disabled, with `title="You need to own shares to sell"` present

### Test Data

- A player the user owns exactly 1 share of

### Edge Cases

- None

---

## TC-006: Accessibility — disabled Sell tab has correct ARIA attributes alongside tooltip

**Priority:** P1
**Type:** Accessibility

### Objective

Verify that the disabled Sell tab maintains proper accessibility semantics: it has `role="tab"`, `aria-selected="false"`, a negative `tabIndex`, and the `title` attribute provides screen-reader-accessible context.

### Preconditions

- User does not hold shares of the target player
- Navigate to the PlayerDetail page

### Steps

1. Inspect the Sell tab button's ARIA attributes
   **Expected:** `role="tab"` is present, `aria-selected="false"`, `tabIndex="-1"`

2. Verify the button has `disabled` attribute
   **Expected:** The `disabled` attribute is set on the HTML button element

3. Verify the `title` attribute is set to `"You need to own shares to sell"`
   **Expected:** `title` attribute is present with the correct text — this is accessible to screen readers as the button's advisory description

4. Use keyboard navigation (Arrow keys within the tablist) to move focus
   **Expected:** The disabled Sell tab does not receive focus via keyboard navigation (per `tabIndex="-1"` and native disabled behavior)

### Test Data

- Any player not in the user's portfolio

### Edge Cases

- Screen reader announces the title text when the disabled button is encountered via virtual cursor navigation

---

## TC-007: Tooltip text content is correct and matches spec

**Priority:** P0
**Type:** Functional

### Objective

Verify the exact wording of the tooltip matches the specification. Incorrect or misspelled text would confuse users.

### Preconditions

- User does not hold shares of the target player
- Navigate to the PlayerDetail page

### Steps

1. Inspect the Sell tab's `title` attribute value
   **Expected:** The value is exactly `"You need to own shares to sell"` — no extra whitespace, no typos, no trailing period, correct capitalization (sentence case with capital "Y")

### Test Data

- Any player not in the user's portfolio

### Edge Cases

- Verify no localization or interpolation issues (e.g., no `{playerName}` placeholder leaking into the text)
