# Test Plan: mcq-vqz.3 -- Reduce header/nav vertical footprint to show content above the fold

## Summary

- **Bead:** `mcq-vqz.3`
- **Feature:** Reduce vertical space consumed by header, nav bar, and main-content padding so page content appears above the fold
- **Total Test Cases:** 14
- **Test Types:** UI/Visual, Regression, Integration

---

## TC-001: Header height reduced via --header-height custom property

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the CSS custom property `--header-height` in `:root` (src/index.css) is changed from `64px` to approximately `52px`, and the `.header` element renders at the new height.

### Preconditions

- Application is running at desktop viewport (1280×800 or larger)
- Navigate to any page (e.g., `/`)

### Steps

1. Inspect the computed value of `--header-height` on `:root`.
   **Expected:** Value is `52px` (or the target value, no longer `64px`).

2. Inspect the computed height of the `<header>` element (`.header`).
   **Expected:** Rendered height matches the new `--header-height` value (~52px).

3. Verify the header still contains the logo, ScenarioToggle, Help button, and balance display.
   **Expected:** All header children are visible and not clipped or overflowing.

### Test Data

- None specific; any scenario/balance state will suffice.

### Edge Cases

- Long balance values (e.g., `$1,000,000.00`) should still fit without overflow at the reduced height.
- Logo tagline ("NFL Stock Market") should still be visible on desktop.

---

## TC-002: Nav bar vertical padding reduced

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the `.nav` element's vertical padding is reduced from `12px` top/bottom to `8px` top/bottom (horizontal padding remains `24px`).

### Preconditions

- Application is running at desktop viewport (1280×800)
- Navigate to any page within the Layout

### Steps

1. Inspect the computed padding of the `<nav>` element (`.nav`).
   **Expected:** Padding is `8px 24px` (previously `12px 24px`). Note: current CSS already shows `6px 24px`; verify the final intended value matches the design note target or is reduced from the pre-change baseline.

2. Measure the total rendered height of the nav bar.
   **Expected:** Nav bar height is visibly shorter than before the change.

3. Verify all 6 nav links (Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard) remain fully visible and clickable.
   **Expected:** No nav link text or icon is clipped or hidden.

### Test Data

- None specific.

### Edge Cases

- Active nav link highlight (`.nav-link.active`) should still render correctly at the reduced padding.
- Hover state on nav links should still be visually distinct.

---

## TC-003: Main content top padding reduced

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the `.main-content` top padding is reduced from `24px` to `16px` so content renders closer to the nav bar.

### Preconditions

- Application is running at desktop viewport (1280×800)
- Navigate to any page within the Layout

### Steps

1. Inspect the computed padding of the `<main>` element (`.main-content`).
   **Expected:** Padding is `16px 24px` (top reduced from `24px` to `16px`).

2. Visually confirm page content starts closer to the nav bar than before.
   **Expected:** Visible reduction in whitespace between nav bar bottom edge and first content element.

### Test Data

- None specific.

### Edge Cases

- If the padding value was already `16px 24px` in the current CSS, confirm it has not regressed. The design notes specify reducing from `24px` to `16px`.

---

## TC-004: Content visible above the fold on Timeline page

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that meaningful page content on the Timeline page (`/`) is visible in the initial viewport without scrolling.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/` (Timeline)

### Steps

1. Load the Timeline page and do not scroll.
   **Expected:** At least the page heading and first content card/section are visible above the fold.

2. Measure total vertical offset of header + nav + padding.
   **Expected:** Combined vertical footprint is noticeably less than the previous ~136px (64 + 48 + 24), now approximately ~100px (52 + ~32 + 16).

### Test Data

- Default scenario data loaded.

### Edge Cases

- With the LiveTicker visible (scenario = `live` or `superbowl`), the ticker adds additional height; content should still be partially visible above the fold.

---

## TC-005: Content visible above the fold on Market page

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the Market page (`/market`) shows meaningful content above the fold after the vertical footprint reduction.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/market`

### Steps

1. Load the Market page without scrolling.
   **Expected:** The market grid header, filter controls, or at least the first row of player cards are visible above the fold.

2. Verify the sidebar (`.market-sidebar`) is correctly positioned.
   **Expected:** Sidebar's sticky `top` value (`calc(var(--header-height) + 16px)`) recalculates correctly with the new `--header-height`, so the sidebar does not overlap the header/nav or leave excessive gap.

### Test Data

- Default player data loaded.

### Edge Cases

- Sidebar sticky behavior when scrolling: sidebar should stick at the correct offset matching the new header height.

---

## TC-006: Content visible above the fold on Portfolio page

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the Portfolio page (`/portfolio`) renders content above the fold.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/portfolio`

### Steps

1. Load the Portfolio page without scrolling.
   **Expected:** Portfolio summary or holdings table header is visible above the fold.

### Test Data

- User has at least one holding to display content.

### Edge Cases

- Empty portfolio state: the "no holdings" message should also appear above the fold.

---

## TC-007: Content visible above the fold on Watchlist page

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the Watchlist page (`/watchlist`) renders content above the fold.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/watchlist`

### Steps

1. Load the Watchlist page without scrolling.
   **Expected:** Watchlist heading and at least the first item (or empty-state message) are visible above the fold.

### Test Data

- User has at least one watchlist item, or test empty state.

### Edge Cases

- Empty watchlist: empty-state message should be above the fold.

---

## TC-008: Content visible above the fold on Mission page

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the Mission page (`/mission`) renders content above the fold.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/mission`

### Steps

1. Load the Mission page without scrolling.
   **Expected:** Mission heading and at least the first mission card are visible above the fold.

### Test Data

- Default mission data.

### Edge Cases

- None specific.

---

## TC-009: Content visible above the fold on Leaderboard page

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the Leaderboard page (`/leaderboard`) renders content above the fold.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/leaderboard`

### Steps

1. Load the Leaderboard page without scrolling.
   **Expected:** Leaderboard heading and at least the first row of rankings are visible above the fold.

### Test Data

- Default leaderboard data.

### Edge Cases

- None specific.

---

## TC-010: Responsive layout — tablet (768px) header and nav

**Priority:** P1
**Type:** Regression

### Objective

Verify the reduced vertical footprint does not break the responsive layout at the 768px breakpoint.

### Preconditions

- Viewport width: 768px (height: ~1024px)
- Navigate to `/`

### Steps

1. Inspect the header at 768px width.
   **Expected:** Header renders at the reduced height. Responsive overrides (smaller logo, hidden tagline, hidden balance label) still apply correctly. No overflow or clipping.

2. Inspect the nav at 768px width.
   **Expected:** Nav bar uses its responsive padding (`4px 16px`) and horizontal scroll behavior. All 6 nav links are accessible via scroll.

3. Inspect `.main-content` padding.
   **Expected:** Responsive padding (`16px`) is applied; the reduction to top padding does not conflict with the responsive override.

### Test Data

- None specific.

### Edge Cases

- Nav overflow-x scrolling still works correctly at reduced padding.

---

## TC-011: Responsive layout — mobile (480px) header and nav

**Priority:** P1
**Type:** Regression

### Objective

Verify the reduced vertical footprint does not break the responsive layout at the 480px breakpoint.

### Preconditions

- Viewport width: 480px (height: ~844px, typical mobile)
- Navigate to `/`

### Steps

1. Inspect the header at 480px width.
   **Expected:** Header renders at the reduced height. Additional mobile overrides (smaller padding `0 8px`, smaller logo `18px`) still apply. Logo and balance are not clipped.

2. Inspect the nav at 480px width.
   **Expected:** Nav links are scrollable horizontally. Icons and text are not clipped despite reduced vertical padding.

3. Content is visible above the fold on mobile.
   **Expected:** At least the first meaningful content element is visible without scrolling.

### Test Data

- None specific.

### Edge Cases

- Very small viewports (320px width): header elements should not overlap or wrap unexpectedly.

---

## TC-012: Sticky header behavior preserved

**Priority:** P0
**Type:** Regression

### Objective

Verify the header remains sticky at the top of the viewport when scrolling, and its reduced height does not break the sticky positioning.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to a page with enough content to scroll (e.g., `/market` with many players)

### Steps

1. Scroll down the page past several screens of content.
   **Expected:** The header remains fixed at the top of the viewport (`position: sticky; top: 0`). It does not scroll away.

2. Verify content does not disappear behind the header.
   **Expected:** The first content below the header/nav is not obscured; the sticky header occupies only ~52px.

3. Scroll back to the top.
   **Expected:** The header seamlessly remains in place; no visual jump or flicker.

### Test Data

- Page with sufficient content to trigger scrolling.

### Edge Cases

- Fast scrolling should not cause header to flicker or detach.

---

## TC-013: Market sidebar sticky offset adapts to new --header-height

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Market page sidebar (`.market-sidebar`) which uses `top: calc(var(--header-height) + 16px)` correctly recalculates its sticky position with the new `--header-height` value.

### Preconditions

- Desktop viewport: 1280×800
- Navigate to `/market`
- Enough player cards to scroll

### Steps

1. Scroll down the Market page.
   **Expected:** The sidebar becomes sticky and its top edge aligns just below the header (approximately 52px + 16px = 68px from viewport top).

2. Verify the sidebar does not overlap the header or nav bar.
   **Expected:** Clear visual separation between the bottom of the sticky header area and the top of the sidebar.

3. Verify the sidebar does not leave an excessive gap below the header.
   **Expected:** The gap is ~16px below the header bottom, not the old ~80px (64 + 16).

### Test Data

- Market page with enough data to scroll.

### Edge Cases

- Resizing the viewport while the sidebar is stuck: sidebar should re-stick correctly.

---

## TC-014: Skip-to-main-content link still works

**Priority:** P2
**Type:** Regression

### Objective

Verify the accessibility skip-to-main-content link still functions correctly after the layout height changes.

### Preconditions

- Desktop viewport
- Navigate to any page

### Steps

1. Press Tab to focus the "Skip to main content" link.
   **Expected:** The link becomes visible at `top: 8px; left: 8px` with proper styling. It is not obscured by the header.

2. Press Enter to activate the link.
   **Expected:** Focus moves to `#main-content` (the `<main>` element). The page scrolls (if needed) so main content is visible.

### Test Data

- None specific.

### Edge Cases

- On pages where content is already above the fold, the skip link should still function without visual disruption.
