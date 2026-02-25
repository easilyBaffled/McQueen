# Test Plan: mcq-c51.3 -- Rename Weekly Gain column header to Gain

## Summary

- **Bead:** `mcq-c51.3`
- **Feature:** Leaderboard table column header renamed from "Weekly Gain" to "Gain"
- **Total Test Cases:** 6
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Column header reads "Gain" instead of "Weekly Gain"

**Priority:** P0
**Type:** Functional

### Objective

Verify that the leaderboard table header displays "Gain" as the fourth column header, not "Weekly Gain". This is the core change described in the acceptance criteria.

### Preconditions

- App is running and the Leaderboard page is accessible

### Steps

1. Navigate to the Leaderboard page
   **Expected:** The leaderboard table renders with a header row

2. Inspect the table header row (`.table-header`)
   **Expected:** The fourth column header (`span.col-gain`) contains the text "Gain"

3. Verify the header does not contain the old text
   **Expected:** No element in the table header contains "Weekly Gain"

### Test Data

- None required; uses default leaderboard data

### Edge Cases

- Confirm that partial matches like "Weekly" alone do not appear in the header row
- Confirm the text is exactly "Gain" with no leading/trailing whitespace

---

## TC-002: No other column headers changed

**Priority:** P0
**Type:** Regression

### Objective

Verify that renaming the Gain column did not alter any other column headers in the leaderboard table.

### Preconditions

- App is running and the Leaderboard page is accessible

### Steps

1. Navigate to the Leaderboard page
   **Expected:** The leaderboard table renders with a header row

2. Read all four column headers in the `.table-header` element
   **Expected:** Headers are, in order: "Rank", "Trader", "Portfolio Value", "Gain"

### Test Data

- None required

### Edge Cases

- Verify header count is exactly 4 (no extra or missing columns)

---

## TC-003: Gain column data cells are unaffected

**Priority:** P1
**Type:** Regression

### Objective

Verify that the gain percentage values displayed in each table row remain unchanged — only the header text was modified, not cell content or formatting.

### Preconditions

- App is running with mock leaderboard data containing traders with both positive and negative gains

### Steps

1. Navigate to the Leaderboard page
   **Expected:** Table rows render for all traders

2. Inspect the gain cell (`[data-testid="col-gain"]`) for a trader with a positive gain
   **Expected:** Cell displays an up arrow and positive percentage (e.g., "▲ +8.2%")

3. Inspect the gain cell for a trader with a negative gain
   **Expected:** Cell displays a down arrow and negative percentage (e.g., "▼ 1.2%")

4. Verify `aria-label` attributes on gain cells
   **Expected:** Labels follow the pattern "Up X.X percent" or "Down X.X percent"

### Test Data

- Mock leaderboard rankings including at least one trader with positive gain and one with negative gain

### Edge Cases

- Trader with exactly 0.0% gain should display "▲ +0.0%" (non-negative path)

---

## TC-004: User rank card gain display unaffected

**Priority:** P1
**Type:** Regression

### Objective

Verify that the user's rank card at the top of the page still shows the gain percentage correctly and was not inadvertently changed by the header rename.

### Preconditions

- App is running with the current user present in leaderboard rankings

### Steps

1. Navigate to the Leaderboard page
   **Expected:** User rank card (`[data-testid="user-rank-card"]`) is visible at the top

2. Inspect the rank-change element in the user rank card
   **Expected:** Displays the user's gain percentage with the correct arrow indicator and `aria-label`

### Test Data

- Default user with 0.0% gain (no trades scenario)

### Edge Cases

- If user has no trades, gain should show "▲ +0.0%" (defaults to zero, non-negative)

---

## TC-005: CSS class and styling preserved on Gain column

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the `.col-gain` CSS class is still applied to the header and that the column retains its expected styling (font-weight: 700, correct alignment).

### Preconditions

- App is running and the Leaderboard page is accessible

### Steps

1. Navigate to the Leaderboard page
   **Expected:** The leaderboard table renders

2. Inspect the Gain header element
   **Expected:** Element has a class matching `col-gain` from the CSS module

3. Verify computed styles on the Gain header
   **Expected:** `font-weight` is 700; column aligns consistently with the gain data cells below it

4. Verify gain data cells also retain `col-gain` class and color-coding classes (`text-up` / `text-down`)
   **Expected:** Positive gains have class `text-up`, negative gains have class `text-down`

### Test Data

- None required

### Edge Cases

- Resize viewport to mobile width; verify column header does not overflow or truncate to empty

---

## TC-006: Accessibility — screen reader reads "Gain" header correctly

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that assistive technologies correctly announce the column header as "Gain" and that no stale references to "Weekly Gain" remain in ARIA attributes or semantic markup.

### Preconditions

- App is running and the Leaderboard page is accessible

### Steps

1. Navigate to the Leaderboard page using a screen reader or accessibility inspection tool
   **Expected:** The table header announces "Rank", "Trader", "Portfolio Value", "Gain"

2. Search the rendered DOM for any `aria-label`, `aria-describedby`, `title`, or `alt` attribute containing "Weekly Gain"
   **Expected:** No attribute anywhere in the Leaderboard component references "Weekly Gain"

3. Tab or navigate to individual gain cells
   **Expected:** Each cell announces its `aria-label` (e.g., "Up 8.2 percent") without mentioning "Weekly"

### Test Data

- None required

### Edge Cases

- Verify that the page subtitle ("Top traders in your league this week") is unchanged — the word "week" in the subtitle is not part of this change scope
