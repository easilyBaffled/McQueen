# Test Plan: mcq-x8o.3 -- Make Portfolio responsive column hiding class-based instead of nth-child

## Summary

- **Bead:** `mcq-x8o.3`
- **Feature:** Replace fragile nth-child CSS selectors with class-based selectors for responsive column hiding on the Portfolio page
- **Total Test Cases:** 10
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: No nth-child selectors remain in Portfolio CSS

**Priority:** P0
**Type:** Functional

### Objective

Verify that the CSS module file contains zero nth-child selectors, confirming the fragile pattern has been fully removed.

### Preconditions

- Access to `src/pages/Portfolio/Portfolio.module.css`

### Steps

1. Read the contents of `Portfolio.module.css`.
   **Expected:** The file contains no occurrences of `nth-child`.

2. Search for any `nth-of-type` or other positional pseudo-selectors used for column hiding.
   **Expected:** No positional pseudo-selectors are used for responsive column visibility.

### Test Data

- File: `src/pages/Portfolio/Portfolio.module.css`

### Edge Cases

- Ensure nth-child is not just commented out but fully removed.

---

## TC-002: Every header column span has a class name

**Priority:** P0
**Type:** Functional

### Objective

Verify that each `<span>` in the holdings header row carries a unique, descriptive CSS module class (e.g., `col-player`, `col-shares`, `col-avg-cost`, `col-current`, `col-value`, `col-gain`).

### Preconditions

- Portfolio page loaded with at least one holding in the portfolio.

### Steps

1. Inspect the `.holdings-header` element in the DOM.
   **Expected:** It contains exactly 6 child `<span>` elements.

2. Check the class attribute of the "Player" header span.
   **Expected:** Class contains the CSS-module-hashed form of `col-player`.

3. Check the class attribute of the "Shares" header span.
   **Expected:** Class contains the CSS-module-hashed form of `col-shares`.

4. Check the class attribute of the "Avg Cost" header span.
   **Expected:** Class contains the CSS-module-hashed form of `col-avg-cost`.

5. Check the class attribute of the "Current" header span.
   **Expected:** Class contains the CSS-module-hashed form of `col-current`.

6. Check the class attribute of the "Value" header span.
   **Expected:** Class contains the CSS-module-hashed form of `col-value`.

7. Check the class attribute of the "Gain/Loss" header span.
   **Expected:** Class contains the CSS-module-hashed form of `col-gain`.

### Test Data

- Any portfolio with at least one holding so the table renders.

### Edge Cases

- None — this is a structural requirement.

---

## TC-003: Every data-row cell has a class name

**Priority:** P0
**Type:** Functional

### Objective

Verify that each cell within a holding row carries the appropriate CSS module class (`holding-player`, `holding-shares`, `holding-cost`, `holding-current`, `holding-value`, `holding-gain`).

### Preconditions

- Portfolio page loaded with at least one holding.

### Steps

1. Inspect the first `.holding-row` element in the DOM.
   **Expected:** It contains child elements for player info, shares, avg cost, current price, value, and gain/loss.

2. Verify the player info cell has the `holding-player` class.
   **Expected:** Class attribute contains the hashed form of `holding-player`.

3. Verify the shares cell has the `holding-shares` class.
   **Expected:** Class attribute contains the hashed form of `holding-shares`.

4. Verify the avg cost cell has the `holding-cost` class.
   **Expected:** Class attribute contains the hashed form of `holding-cost`.

5. Verify the current price cell has the `holding-current` class.
   **Expected:** Class attribute contains the hashed form of `holding-current`.

6. Verify the value cell has the `holding-value` class.
   **Expected:** Class attribute contains the hashed form of `holding-value`.

7. Verify the gain/loss cell has the `holding-gain` class.
   **Expected:** Class attribute contains the hashed form of `holding-gain`.

### Test Data

- Any portfolio with at least one holding.

### Edge Cases

- Verify across multiple holding rows (first and last) to ensure consistency.

---

## TC-004: CSS media query at <=900px hides "Avg Cost" and "Value" columns via class selectors

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that at viewport widths of 900px or below, the "Avg Cost" and "Value" columns (both header and data cells) are hidden using class-based selectors (`.col-avg-cost`, `.col-value`, `.holding-cost`, `.holding-value`), not nth-child.

### Preconditions

- Portfolio page loaded with at least one holding.
- Browser or test environment supports viewport resizing.

### Steps

1. Set viewport width to 901px.
   **Expected:** All 6 columns are visible: Player, Shares, Avg Cost, Current, Value, Gain/Loss.

2. Set viewport width to 900px.
   **Expected:** "Avg Cost" header and data cells are hidden. "Value" header and data cells are hidden. Remaining 4 columns (Player, Shares, Current, Gain/Loss) are visible.

3. Inspect computed styles of the hidden header spans (`.col-avg-cost`, `.col-value`).
   **Expected:** `display: none` is applied.

4. Inspect computed styles of the hidden data cells (`.holding-cost`, `.holding-value`).
   **Expected:** `display: none` is applied.

### Test Data

- Viewport widths: 901px, 900px, 800px

### Edge Cases

- Test at exactly 900px (boundary value).
- Verify the grid-template-columns changes from 6-column to 4-column layout.

---

## TC-005: CSS media query at <=600px hides "Shares" column via class selector

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that at viewport widths of 600px or below, the "Shares" column (header and data cell) is additionally hidden using class-based selectors (`.col-shares`, `.holding-shares`).

### Preconditions

- Portfolio page loaded with at least one holding.
- Browser or test environment supports viewport resizing.

### Steps

1. Set viewport width to 601px.
   **Expected:** "Shares" column is visible (along with Player, Current, Gain/Loss; "Avg Cost" and "Value" already hidden at this width).

2. Set viewport width to 600px.
   **Expected:** "Shares" header and data cells are hidden. Only 3 columns remain: Player, Current, Gain/Loss.

3. Inspect computed styles of `.col-shares` header span.
   **Expected:** `display: none` is applied.

4. Inspect computed styles of `.holding-shares` data cell.
   **Expected:** `display: none` is applied.

### Test Data

- Viewport widths: 601px, 600px, 375px

### Edge Cases

- Test at exactly 600px (boundary value).
- Verify the grid-template-columns changes from 4-column to 3-column layout.

---

## TC-006: Full desktop layout shows all 6 columns

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that at wide viewport widths (above 900px), all 6 columns are visible and properly laid out.

### Preconditions

- Portfolio page loaded with at least one holding.
- Viewport width set to 1200px or wider.

### Steps

1. Load the Portfolio page at 1200px viewport width.
   **Expected:** The holdings table is visible with all 6 columns: Player, Shares, Avg Cost, Current, Value, Gain/Loss.

2. Verify the grid layout of `.holdings-header`.
   **Expected:** Grid template columns is `2fr 1fr 1fr 1fr 1fr 1.5fr`.

3. Verify the grid layout of `.holding-row`.
   **Expected:** Grid template columns matches the header: `2fr 1fr 1fr 1fr 1fr 1.5fr`.

4. Verify column header text alignment matches data cell alignment for all 6 columns.
   **Expected:** Each header aligns visually above its corresponding data column.

### Test Data

- Viewport width: 1200px

### Edge Cases

- None.

---

## TC-007: Grid template columns update correctly at each breakpoint

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the CSS grid column definitions adjust appropriately at each responsive breakpoint so the remaining visible columns fill the available space.

### Preconditions

- Portfolio page loaded with at least one holding.

### Steps

1. At viewport width > 900px, inspect `.holdings-header` computed grid-template-columns.
   **Expected:** 6 column tracks matching `2fr 1fr 1fr 1fr 1fr 1.5fr`.

2. At viewport width = 900px, inspect `.holdings-header` computed grid-template-columns.
   **Expected:** 4 column tracks matching `1.5fr 1fr 1fr 1fr`.

3. At viewport width = 600px, inspect `.holdings-header` computed grid-template-columns.
   **Expected:** 3 column tracks matching `1fr 1fr 1fr`.

4. Verify `.holding-row` grid-template-columns matches the header at each breakpoint.
   **Expected:** Row and header grid definitions match at every breakpoint.

### Test Data

- Viewport widths: 1200px, 900px, 600px

### Edge Cases

- Rapidly resize between breakpoints to confirm no transient layout breakage.

---

## TC-008: Visual regression — column hiding matches previous behavior

**Priority:** P1
**Type:** Regression

### Objective

Verify that the new class-based implementation produces the exact same visual result as the previous nth-child implementation. No columns should appear or disappear differently than before.

### Preconditions

- Screenshots or visual reference of the previous nth-child-based behavior at 1200px, 900px, and 600px viewports.
- Portfolio with multiple holdings (2+) to verify consistency across rows.

### Steps

1. Load Portfolio at 1200px and compare against baseline screenshot.
   **Expected:** All 6 columns visible, layout identical to baseline.

2. Resize to 900px and compare against baseline screenshot.
   **Expected:** "Avg Cost" and "Value" columns hidden, layout identical to baseline.

3. Resize to 600px and compare against baseline screenshot.
   **Expected:** "Shares" additionally hidden, layout identical to baseline.

4. Check that row hover styling still works at each breakpoint.
   **Expected:** Hover highlights the full row at every width.

### Test Data

- Portfolio with 3+ holdings of varying gain/loss states.

### Edge Cases

- Verify no extra whitespace or collapsed columns where hidden columns were.

---

## TC-009: Empty portfolio state unaffected by changes

**Priority:** P2
**Type:** Regression

### Objective

Verify that the empty state (no holdings) renders correctly and is not broken by column class changes, since the holdings table is not rendered in this case.

### Preconditions

- Portfolio is empty (no holdings).

### Steps

1. Load Portfolio page with an empty portfolio.
   **Expected:** The empty state illustration and "Start Your Trading Journey" message render correctly. No holdings table or header row is present in the DOM.

2. Resize viewport to 900px.
   **Expected:** Empty state remains intact, no layout errors.

3. Resize viewport to 600px.
   **Expected:** Empty state remains intact, no layout errors.

### Test Data

- Empty portfolio (zero holdings).

### Edge Cases

- None — this confirms no side effects from the CSS changes.

---

## TC-010: CSS class selectors are properly scoped within media queries

**Priority:** P2
**Type:** Functional

### Objective

Verify that the class-based hiding selectors only apply inside their respective `@media` blocks and do not accidentally hide columns at wider viewports.

### Preconditions

- Access to `src/pages/Portfolio/Portfolio.module.css`.

### Steps

1. Inspect CSS: verify `.col-avg-cost` and `.col-value` `display: none` rules exist only within the `@media (max-width: 900px)` block.
   **Expected:** These selectors do not have `display: none` outside the 900px media query.

2. Inspect CSS: verify `.col-shares` and `.holding-shares` `display: none` rules exist only within the `@media (max-width: 600px)` block.
   **Expected:** These selectors do not have `display: none` outside the 600px media query.

3. Verify no global (non-media-query) rule sets `display: none` on any column class.
   **Expected:** All column classes default to visible (no `display: none` outside media queries).

### Test Data

- File: `src/pages/Portfolio/Portfolio.module.css`

### Edge Cases

- Verify that class names used for hiding are not reused elsewhere with conflicting `display` rules.
