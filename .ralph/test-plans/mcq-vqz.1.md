# Test Plan: mcq-vqz.1 -- Fix Market sidebar sticky positioning to account for header

## Summary

- **Bead:** `mcq-vqz.1`
- **Feature:** Market sidebar sticky positioning correctly offsets below the 64px sticky header on scroll
- **Total Test Cases:** 7
- **Test Types:** UI/Visual, Functional, Regression

---

## TC-001: Sidebar does not overlap sticky header on scroll

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the Market sidebar remains fully visible below the sticky header when the page is scrolled. This is the core bug being fixed — previously the sidebar slid under the header because `top` was only `16px`.

### Preconditions

- App is running in a browser with viewport width > 1200px (so the sidebar is in sticky mode)
- Navigate to the Market page (`/`)
- Enough player cards are rendered to make the page scrollable

### Steps

1. Load the Market page at a viewport width of 1400px or wider.
   **Expected:** The sidebar (MiniLeaderboard) appears to the left of the player grid in a two-column layout.

2. Scroll the page down until the sidebar reaches its sticky position.
   **Expected:** The top edge of the sidebar stops at exactly `calc(64px + 16px)` = `80px` from the top of the viewport. No part of the sidebar is hidden behind or overlapping the sticky header.

3. Continue scrolling to the bottom of the page.
   **Expected:** The sidebar remains pinned at 80px from the viewport top for the entire scroll. It never slides under the header.

### Test Data

- Default scenario with enough players to produce a scrollable page

### Edge Cases

- Verify with a very tall sidebar (many leaderboard entries) — it should still stick at the correct offset

---

## TC-002: CSS `top` value uses `var(--header-height)` instead of a hardcoded value

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the implementation uses the CSS variable `--header-height` so that if the header height changes globally, the sidebar offset updates automatically.

### Preconditions

- Access to the built CSS or browser DevTools

### Steps

1. Open the Market page and inspect the `.market-sidebar` element in DevTools.
   **Expected:** The computed `position` is `sticky`.

2. Check the `top` property value on `.market-sidebar`.
   **Expected:** The value is `calc(var(--header-height) + 16px)`. The resolved computed value is `80px` (since `--header-height` is `64px`).

3. In DevTools, temporarily change the `:root` `--header-height` variable to `100px`.
   **Expected:** The sidebar's computed `top` updates to `116px` (`100px + 16px`), confirming the sidebar dynamically derives its offset from the variable.

### Test Data

- None required beyond DevTools

### Edge Cases

- If `--header-height` is unset or removed from `:root`, verify the `calc()` expression degrades gracefully (browser falls back — sidebar may not position perfectly, but should not crash rendering)

---

## TC-003: 16px gap is preserved between header bottom and sidebar top

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the original 16px visual padding between the header's bottom edge and the sidebar's top edge is maintained after the fix.

### Preconditions

- Viewport width > 1200px
- Market page loaded with scrollable content

### Steps

1. Scroll the page until the sidebar reaches its sticky position.
   **Expected:** The sidebar is pinned at 80px from the viewport top.

2. Measure the gap between the bottom edge of the sticky header (at 64px) and the top edge of the sidebar.
   **Expected:** The gap is exactly 16px. The sidebar is not flush against the header and not floating with excessive whitespace.

### Test Data

- None

### Edge Cases

- None

---

## TC-004: Sidebar reverts to static positioning on narrow viewports (≤ 1200px)

**Priority:** P1
**Type:** Functional / Regression

### Objective

Verify the responsive breakpoint at `max-width: 1200px` still works correctly — the sidebar should become `position: static` and appear above the player grid, unaffected by the sticky `top` change.

### Preconditions

- Market page loaded

### Steps

1. Set viewport width to 1200px or narrower (e.g., 1024px).
   **Expected:** The sidebar is rendered above the player grid (single-column layout) with `position: static` and `order: -1`.

2. Scroll the page down.
   **Expected:** The sidebar scrolls with the rest of the page content — it does not stick.

3. Resize the viewport back to wider than 1200px (e.g., 1400px).
   **Expected:** The sidebar returns to the left column with `position: sticky` and the correct `top: calc(var(--header-height) + 16px)`.

### Test Data

- None

### Edge Cases

- Test at exactly 1200px to verify the breakpoint boundary
- Test at 1201px to confirm sticky behavior is active just above the breakpoint

---

## TC-005: Sidebar sticky positioning works correctly during loading skeleton state

**Priority:** P2
**Type:** Functional

### Objective

Verify the sidebar uses the correct sticky offset even when the LeaderboardSkeleton placeholder is shown during the initial 300ms loading phase.

### Preconditions

- Market page navigated to (or scenario changed to trigger loading state)
- Viewport width > 1200px
- Page is scrollable (or pre-scrolled before scenario change)

### Steps

1. Navigate to the Market page or switch the scenario to trigger the loading state.
   **Expected:** The sidebar area shows the `LeaderboardSkeleton` component.

2. If the page is already scrolled, observe the skeleton sidebar position.
   **Expected:** The skeleton sidebar sticks at 80px from the viewport top, same as the fully loaded sidebar. It does not slide under the header.

3. Wait for loading to complete (~300ms).
   **Expected:** The `MiniLeaderboard` replaces the skeleton and remains at the same sticky offset.

### Test Data

- Any scenario that produces a loading transition

### Edge Cases

- Rapid scenario switching — the sidebar should maintain correct positioning throughout transitions

---

## TC-006: Sidebar does not overlap header when browser zoom is applied

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify the sidebar sticky offset remains correct under non-default browser zoom levels, since `calc()` and CSS variables resolve at computed-value time.

### Preconditions

- Market page loaded at viewport width > 1200px
- Page has scrollable content

### Steps

1. Set browser zoom to 125% and scroll the page.
   **Expected:** The sidebar sticks below the header with a visible gap. No overlap occurs.

2. Set browser zoom to 75% and scroll the page.
   **Expected:** The sidebar sticks below the header with a visible gap. No overlap occurs.

3. Set browser zoom to 150% and scroll the page.
   **Expected:** The sidebar sticks below the header with a visible gap. No overlap occurs. (Note: at 150% the viewport effective width may drop below 1200px, triggering the responsive breakpoint — in that case, the sidebar should become static, which is also correct.)

### Test Data

- None

### Edge Cases

- At zoom levels where the effective viewport crosses the 1200px breakpoint, confirm the sidebar correctly switches between sticky and static

---

## TC-007: Sidebar z-index does not conflict with header z-index

**Priority:** P2
**Type:** UI/Visual / Regression

### Objective

Verify the sidebar does not render on top of the sticky header. The header has `z-index: 100`; the sidebar should layer below it so that when scrolling, content passes under the header cleanly.

### Preconditions

- Market page loaded at viewport width > 1200px
- Page has enough content to scroll

### Steps

1. Scroll the page slowly and observe the layering between the header and the sidebar.
   **Expected:** The header always renders on top. The sidebar appears below (behind) the header in z-order and sticks at its offset below the header.

2. Inspect the `z-index` of `.market-sidebar` in DevTools.
   **Expected:** The sidebar either has no explicit `z-index` or has a `z-index` lower than the header's `100`.

3. Scroll so that a tall sidebar would conceptually extend into the header area (if the sidebar content is taller than the viewport minus 80px).
   **Expected:** The sidebar content that extends above the sticky point is clipped or scrolls naturally — it does not paint over the header.

### Test Data

- None

### Edge Cases

- If dropdown menus or modals are open from the header, they should render above the sidebar
