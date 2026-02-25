# Test Plan: mcq-c51.2 -- Fix Leaderboard trader column alignment

## Summary

- **Bead:** `mcq-c51.2`
- **Feature:** Trader column in the leaderboard table uses flex layout for consistent vertical alignment of avatar and name
- **Total Test Cases:** 7
- **Test Types:** UI/Visual, Regression

---

## TC-001: Trader column applies flex layout

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that `.col-trader` has `display: flex`, `align-items: center`, and `gap: 8px` so the avatar emoji and trader name are laid out horizontally with consistent vertical centering.

### Preconditions

- Application is running and Leaderboard page is accessible
- At least one trader row is visible in the leaderboard table

### Steps

1. Navigate to the Leaderboard page.
   **Expected:** The leaderboard table renders with at least one trader row.

2. Inspect the computed styles of any `[data-testid="col-trader"]` element.
   **Expected:** `display` is `flex`, `align-items` is `center`, `gap` is `8px`.

### Test Data

- Any populated leaderboard state (default mock data is sufficient)

### Edge Cases

- None; this is a baseline structural check.

---

## TC-002: Avatar and name are vertically centered within a row

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the avatar emoji and the trader name text share the same vertical midpoint, eliminating the misalignment described in audit issue M-6.

### Preconditions

- Leaderboard page is loaded with multiple trader rows

### Steps

1. Navigate to the Leaderboard page.
   **Expected:** Table rows render with avatar and name side by side.

2. For a row in the top-three (medal rows) and a row outside the top-three, visually confirm that the avatar (`.trader-avatar`) and name (`.trader-name`) are vertically centered on the same baseline.
   **Expected:** The vertical midpoints of the avatar and name text are aligned; no visible offset between them.

3. Use browser DevTools to compare the `getBoundingClientRect().top` offset of `.trader-avatar` and `.trader-name` within the same row.
   **Expected:** The vertical centers (top + height/2) of both elements differ by no more than 1px.

### Test Data

- Default leaderboard with at least 4 traders (to cover both medal and numbered rows)

### Edge Cases

- Rows with medal emoji avatars (🥇, 🥈, 🥉 in the rank column) may have different line heights; verify alignment is still correct in those rows.

---

## TC-003: Consistent 8px gap between avatar and name

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the horizontal spacing between the avatar and the trader name is exactly 8px, provided by the `gap` property.

### Preconditions

- Leaderboard page is loaded

### Steps

1. Navigate to the Leaderboard page.
   **Expected:** Trader rows are visible.

2. Inspect a `[data-testid="col-trader"]` element's computed `gap` value.
   **Expected:** `gap` is `8px`.

3. Measure the horizontal distance between the right edge of `.trader-avatar` and the left edge of `.trader-name`.
   **Expected:** The distance is 8px.

### Test Data

- Default leaderboard data

### Edge Cases

- Verify the gap is consistent across all rows, not just the first.

---

## TC-004: Alignment holds for long trader names

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that a long trader name does not break the flex alignment or push the avatar out of vertical center.

### Preconditions

- Leaderboard includes a trader with a long display name (e.g., 30+ characters)

### Steps

1. Load the Leaderboard page with a trader whose name is long enough to potentially wrap or overflow (e.g., "Alexander Bartholomew III").
   **Expected:** The trader row renders without layout breakage.

2. Inspect the trader column for that row.
   **Expected:** The avatar remains vertically centered relative to the (possibly wrapped) name text. The flex container does not collapse or overflow the grid cell.

### Test Data

- Mock or inject a trader with name "Alexander Bartholomew III" or similarly long string

### Edge Cases

- Name that wraps to two lines: avatar should still be vertically centered against the full text block.
- Name that is a single very long word without spaces: should be truncated or contained, not overflow.

---

## TC-005: Alignment holds on mobile viewport (≤768px)

**Priority:** P1
**Type:** UI/Visual / Regression

### Objective

Verify that the flex alignment fix remains correct under the responsive breakpoint where the grid template changes to `60px 1fr 100px` and the value column is hidden.

### Preconditions

- Browser viewport is set to ≤768px width (or device emulation)

### Steps

1. Set the browser viewport width to 375px (iPhone SE size).
   **Expected:** The leaderboard table re-layouts to the mobile grid.

2. Inspect any `[data-testid="col-trader"]` element.
   **Expected:** `display: flex`, `align-items: center`, and `gap: 8px` are still applied (these are not overridden by the media query).

3. Visually confirm the avatar and name are vertically centered in the narrower layout.
   **Expected:** No vertical misalignment between avatar and name.

### Test Data

- Default leaderboard data

### Edge Cases

- Viewport exactly at 768px boundary (breakpoint edge).
- Very narrow viewport (320px) to confirm no overflow or clipping.

---

## TC-006: User's own row alignment matches other rows

**Priority:** P1
**Type:** Regression

### Objective

Verify that the current user's highlighted row (`.user-row`) has the same trader column alignment as non-user rows, since the row has a different background style.

### Preconditions

- The logged-in user appears in the leaderboard rankings

### Steps

1. Navigate to the Leaderboard page.
   **Expected:** A row with `data-user="true"` is present.

2. Compare the vertical alignment of avatar and name in the user's row versus a non-user row.
   **Expected:** Both rows show identical vertical centering of the avatar and name within the trader column.

3. Inspect the user row's `.col-trader` computed styles.
   **Expected:** Same flex properties (`display: flex`, `align-items: center`, `gap: 8px`) as any other row.

### Test Data

- Default state where the current user is included in rankings

### Edge Cases

- User's display name shows as "You" — confirm "You" text is still centered with the avatar.

---

## TC-007: Avatar shrink behavior preserves alignment

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the `.trader-avatar` element's `flex-shrink: 0` prevents the avatar from being compressed when the trader column is squeezed, maintaining alignment.

### Preconditions

- Leaderboard page is loaded

### Steps

1. Navigate to the Leaderboard page at a standard desktop viewport.
   **Expected:** Avatar emojis display at their natural size (font-size 20px).

2. Inspect a `.trader-avatar` element's computed `flex-shrink` value.
   **Expected:** `flex-shrink` is `0`.

3. Gradually reduce viewport width toward the 768px breakpoint.
   **Expected:** The avatar does not shrink or distort; only the name text reflows or truncates as needed.

### Test Data

- Default leaderboard data

### Edge Cases

- At exactly 769px (just above the mobile breakpoint), the desktop grid is still active — confirm avatar is not compressed even in the tightest desktop layout.
