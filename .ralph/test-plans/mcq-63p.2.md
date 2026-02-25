# Test Plan: mcq-63p.2 -- Fix Layout nav link CSS module classes

## Summary

- **Bead:** `mcq-63p.2`
- **Feature:** NavLink components in Layout.tsx use CSS Module scoped class names instead of raw strings, ensuring navigation is properly styled
- **Total Test Cases:** 8
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Nav links render with CSS Module scoped class names

**Priority:** P0
**Type:** Functional

### Objective

Verify that all six NavLink components receive CSS Module hashed class names (not the raw strings `nav-link` / `active`). Without scoped classes, navigation is completely unstyled.

### Preconditions

- Application is built and running locally
- Browser DevTools are available for DOM inspection

### Steps

1. Navigate to the root URL (`/`).
   **Expected:** The page loads and the navigation bar is visible below the header.

2. Open browser DevTools and inspect the first NavLink element ("Timeline").
   **Expected:** The element's `class` attribute contains a CSS Module hashed class name (e.g., `Layout_nav-link__xxxxx`), NOT the raw string `nav-link`.

3. Repeat inspection for all remaining NavLink elements: "Market", "Portfolio", "Watchlist", "Mission", "Leaderboard".
   **Expected:** Each element has a CSS Module scoped class name matching the `.nav-link` rule from `Layout.module.css`. None contain the literal unscoped string `nav-link`.

### Test Data

- Routes to inspect: `/`, `/market`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`

### Edge Cases

- Confirm no NavLink has a duplicate class (both raw and scoped) applied simultaneously.

---

## TC-002: Active nav link receives CSS Module scoped active class

**Priority:** P0
**Type:** Functional

### Objective

Verify that the currently active NavLink receives the CSS Module scoped `active` class, not the raw string `active`.

### Preconditions

- Application is running locally

### Steps

1. Navigate to `/market`.
   **Expected:** The "Market" NavLink is visually highlighted as active.

2. Inspect the "Market" NavLink element in DevTools.
   **Expected:** The element's `class` attribute contains a CSS Module hashed active class (e.g., `Layout_active__xxxxx`), NOT the raw string `active`.

3. Inspect the other five NavLink elements ("Timeline", "Portfolio", "Watchlist", "Mission", "Leaderboard").
   **Expected:** None of the inactive NavLinks have the scoped `active` class in their `class` attribute.

### Test Data

- None

### Edge Cases

- Navigate to `/` and confirm "Timeline" is active (uses `end` prop for exact match).

---

## TC-003: Active nav link has correct background and text color

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the `.nav-link.active` CSS rule is applied: active link has `background: var(--color-primary)` and `color: white`.

### Preconditions

- Application is running locally

### Steps

1. Navigate to `/portfolio`.
   **Expected:** The "Portfolio" NavLink displays with the primary brand color background and white text.

2. Inspect computed styles on the "Portfolio" NavLink.
   **Expected:** `background-color` resolves to the value of `--color-primary`; `color` resolves to `rgb(255, 255, 255)` (white).

3. Navigate to `/leaderboard`.
   **Expected:** The "Leaderboard" NavLink now has the primary background and white text; "Portfolio" reverts to default styling.

### Test Data

- None

### Edge Cases

- Verify the active background is not transparent or inherited from a parent.

---

## TC-004: Inactive nav links have correct default styling

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify inactive NavLinks receive the `.nav-link` base styles: secondary text color, no background, proper font size and weight.

### Preconditions

- Application is running locally

### Steps

1. Navigate to `/market`.
   **Expected:** The nav bar is visible with six links.

2. Inspect the "Timeline" NavLink (inactive).
   **Expected:** Computed `color` matches `--color-text-secondary`; `background-color` is transparent; `font-size` is `14px`; `font-weight` is `600`; `padding` is `10px 20px`; `border-radius` matches `--radius-md`.

3. Inspect any other inactive NavLink (e.g., "Watchlist").
   **Expected:** Same computed styles as step 2.

### Test Data

- None

### Edge Cases

- None

---

## TC-005: Nav link hover state works correctly

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the `.nav-link:hover` rule is applied when hovering over an inactive NavLink.

### Preconditions

- Application is running locally with a pointer device (mouse)

### Steps

1. Navigate to `/`.
   **Expected:** "Timeline" is active; other links are in default state.

2. Hover the cursor over the "Market" NavLink (inactive).
   **Expected:** Background changes to `--color-bg-elevated`; text color changes to `--color-text-primary`.

3. Move the cursor away from the "Market" NavLink.
   **Expected:** Background reverts to transparent; text color reverts to `--color-text-secondary`.

### Test Data

- None

### Edge Cases

- Hover over the active NavLink — the active styles (primary background, white text) should remain; hover styles should not override them.

---

## TC-006: Active state transitions correctly when navigating between routes

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking each of the six NavLinks transitions the active class to the clicked link and removes it from the previous one.

### Preconditions

- Application is running locally

### Steps

1. Navigate to `/` (Timeline).
   **Expected:** "Timeline" has the active class and styling; all others are inactive.

2. Click the "Market" NavLink.
   **Expected:** URL changes to `/market`; "Market" gains active styling; "Timeline" loses active styling.

3. Click the "Portfolio" NavLink.
   **Expected:** URL changes to `/portfolio`; "Portfolio" gains active styling; "Market" loses active styling.

4. Click the "Watchlist" NavLink.
   **Expected:** URL changes to `/watchlist`; "Watchlist" gains active styling; "Portfolio" loses active styling.

5. Click the "Mission" NavLink.
   **Expected:** URL changes to `/mission`; "Mission" gains active styling; "Watchlist" loses active styling.

6. Click the "Leaderboard" NavLink.
   **Expected:** URL changes to `/leaderboard`; "Leaderboard" gains active styling; "Mission" loses active styling.

### Test Data

- None

### Edge Cases

- Click the already-active NavLink — it should remain active with no style flicker.

---

## TC-007: Nav link styling at mobile breakpoint (≤768px)

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that nav links retain CSS Module scoped classes and correct responsive styling at the 768px breakpoint.

### Preconditions

- Application is running locally
- Browser DevTools responsive mode or a device with ≤768px viewport width

### Steps

1. Set viewport width to 768px or below and navigate to `/`.
   **Expected:** The nav bar is visible and horizontally scrollable if needed.

2. Inspect the "Timeline" NavLink.
   **Expected:** `padding` resolves to `8px 14px`; `font-size` is `13px`; class is still a CSS Module scoped name (not raw `nav-link`).

3. Verify the active NavLink still shows the primary background and white text.
   **Expected:** Active styling is identical in visual appearance to desktop (scaled padding/font aside).

### Test Data

- Viewport: 768px width × 1024px height

### Edge Cases

- At 480px width, verify nav links still function and are scrollable within the nav bar.

---

## TC-008: Timeline NavLink uses `end` prop for exact-match active detection

**Priority:** P1
**Type:** Regression

### Objective

Verify that the "Timeline" NavLink (route `/`) only shows as active on the exact root path, not on sub-routes like `/market`.

### Preconditions

- Application is running locally

### Steps

1. Navigate to `/`.
   **Expected:** "Timeline" NavLink has the scoped active class and active styling.

2. Navigate to `/market`.
   **Expected:** "Timeline" NavLink does NOT have the active class; only "Market" does.

3. Navigate to `/portfolio`.
   **Expected:** "Timeline" NavLink does NOT have the active class; only "Portfolio" does.

### Test Data

- None

### Edge Cases

- Navigate directly to `/` via the address bar (not by clicking the NavLink) and confirm "Timeline" is active.
