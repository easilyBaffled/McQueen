# Test Plan: mcq-vqz -- Layout and Header Repair

## Summary

- **Bead:** `mcq-vqz`
- **Feature:** Fix sidebar sticky positioning overlapping header, Total Value clipping in header, and content appearing below the fold on all pages
- **Total Test Cases:** 16
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Market sidebar sticks below header on scroll

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the Market page sidebar does not slide under the sticky header when the user scrolls down. This was the core reported bug (M-4): `top: 16px` caused the sidebar to overlap with the 64px-tall header.

### Preconditions

- App is loaded at desktop viewport (1920x1080)
- User is on the Market page (`/market`)
- Page has enough player cards to enable scrolling

### Steps

1. Load the Market page at 1920x1080
   **Expected:** The sidebar and main player grid are both visible. The sidebar is positioned in the left column.

2. Scroll down until the sidebar reaches its sticky position
   **Expected:** The sidebar sticks in place and its top edge sits immediately below the header's bottom border — no overlap, no gap larger than ~16px.

3. Continue scrolling to the bottom of the page
   **Expected:** The sidebar remains pinned below the header throughout the entire scroll range. No part of the sidebar is hidden behind or clipped by the header.

### Test Data

- Use any scenario (Midweek, ESPN Live, or Live Game) with the default player list

### Edge Cases

- Verify with a very short player list (fewer than 5 players) where the main content area is shorter than the sidebar
- Verify with browser zoom at 125% and 150%

---

## TC-002: Sidebar sticky top value accounts for header height via CSS variable

**Priority:** P1
**Type:** Functional

### Objective

Verify that the sidebar's CSS `top` property uses a calculation based on `--header-height` (e.g., `calc(var(--header-height) + 16px)`) rather than a hardcoded pixel value, ensuring it adapts if the header height changes.

### Preconditions

- Access to browser DevTools or the built CSS source

### Steps

1. Open the Market page and inspect the `.market-sidebar` element in DevTools
   **Expected:** The computed `position` is `sticky` and the `top` value resolves to approximately 80px (64px header + 16px gap).

2. Check the declared CSS rule for `.market-sidebar`
   **Expected:** The `top` property uses `calc(var(--header-height) + 16px)` or an equivalent expression referencing `--header-height`, not a hardcoded value like `top: 16px`.

### Test Data

- None

### Edge Cases

- Temporarily override `--header-height` to `80px` in DevTools and confirm the sidebar adjusts its sticky offset accordingly

---

## TC-003: Sidebar positioning at 1200px breakpoint (tablet/small desktop)

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the sidebar transitions from sticky to static layout at the 1200px responsive breakpoint, per the existing media query in `Market.module.css`.

### Preconditions

- App is loaded on the Market page

### Steps

1. Set viewport width to 1201px
   **Expected:** Sidebar is in the left column with sticky positioning, sticking below the header on scroll.

2. Resize viewport to 1199px
   **Expected:** Sidebar switches to `position: static` and appears above the player grid (order: -1). No overlap with the header.

3. Resize back to 1201px
   **Expected:** Sidebar returns to sticky left-column layout without visual glitches.

### Test Data

- None

### Edge Cases

- Test at exactly 1200px to confirm which layout applies at the boundary

---

## TC-004: Total Value label and amount fully visible — Midweek scenario

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the "TOTAL VALUE" label and dollar amount in the header-right section are fully visible (not clipped or truncated) when the Midweek scenario is active.

### Preconditions

- App is loaded at desktop viewport (1280x800 or wider)
- Midweek scenario is selected

### Steps

1. Observe the header-right area containing the "Total Value" label and dollar amount
   **Expected:** Both the "TOTAL VALUE" label and the full dollar amount (e.g., "$100,000.00") are completely visible with no clipping, truncation, or overflow.

2. Inspect the `.header-right` element in DevTools
   **Expected:** The element has no horizontal overflow. The content fits within its bounds.

### Test Data

- Portfolio total value: use the default starting balance ($100,000.00)

### Edge Cases

- Set a very large total value (e.g., $9,999,999.99) and confirm it does not clip

---

## TC-005: Total Value fully visible — ESPN Live scenario (with badge)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the "TOTAL VALUE" label and dollar amount remain fully visible when the ESPN Live scenario is selected, which adds a "LIVE" badge to the scenario toggle tabs in header-center, expanding that section.

### Preconditions

- App is loaded at desktop viewport (1280x800)
- ESPN Live scenario is selected via the ScenarioToggle

### Steps

1. Select the "ESPN Live" scenario tab in the header
   **Expected:** The scenario toggle displays with the "LIVE" badge. The "TOTAL VALUE" label and dollar amount in header-right are fully visible — no clipping.

2. Resize viewport width to 769px (just above the mobile breakpoint)
   **Expected:** Header layout adjusts but "TOTAL VALUE" and the dollar amount remain readable and unclipped.

### Test Data

- Default starting balance

### Edge Cases

- Rapidly switch between all three scenarios (Midweek, ESPN Live, Live Game) and confirm no transient clipping occurs during transitions

---

## TC-006: Total Value fully visible — Live Game scenario (with badge)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the "TOTAL VALUE" display is not clipped when the Live Game scenario is active, which may include additional badge elements that expand header-center.

### Preconditions

- App is loaded at desktop viewport (1280x800)
- Live Game scenario is selected

### Steps

1. Select the "Live Game" scenario tab
   **Expected:** The "TOTAL VALUE" label and dollar amount are fully visible. No overflow or clipping in the header.

2. Check that the LiveTicker bar appears below the header (specific to live scenario)
   **Expected:** LiveTicker renders below the header without pushing content into an unusable position. "TOTAL VALUE" in the header remains unaffected.

### Test Data

- Default starting balance

### Edge Cases

- None beyond what TC-005 covers

---

## TC-007: Header does not overflow on desktop viewports (>768px)

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the header has no horizontal overflow or content spilling outside its bounds on any desktop viewport width above the mobile breakpoint.

### Preconditions

- App loaded on any page

### Steps

1. Set viewport to 1920x1080 and inspect the `<header>` element
   **Expected:** No horizontal scrollbar. `overflow-x` on the header or its children does not cause visible clipping. All three sections (left, center, right) fit within the header width.

2. Set viewport to 1024x768
   **Expected:** Same — no overflow. Sections may be tighter but all content remains visible.

3. Set viewport to 769px wide
   **Expected:** Header sections still fit. No horizontal overflow.

### Test Data

- Use ESPN Live scenario to maximize center section width

### Edge Cases

- Test with browser default font size increased to 20px (accessibility setting)

---

## TC-008: Header mobile layout preserves balance display

**Priority:** P1
**Type:** Regression

### Objective

Verify that the existing mobile responsive behavior for the header (at <=768px) still works correctly after the flex changes — specifically that `.balance-label` is hidden and `.balance-value` shows at reduced font size.

### Preconditions

- App loaded at 768px viewport width or narrower

### Steps

1. Set viewport to 375x812 (iPhone X)
   **Expected:** The "TOTAL VALUE" label is hidden (per existing `display: none` rule). The dollar amount is visible at 14px font size. The logo tagline is hidden. The Help button shows only the icon (no "Help" text).

2. Verify header-right uses `flex: 0 0 auto` behavior at mobile
   **Expected:** The balance value does not get squeezed. The header items are spaced correctly with 8px gap.

### Test Data

- Default balance

### Edge Cases

- Test at 480px and 320px widths to cover the smallest breakpoint
- Verify the logo font size reduces to 18px at <=480px

---

## TC-009: Page content visible above the fold — Market page

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the Market page shows meaningful content (player cards or the welcome banner) within the initial viewport on a standard 1080p desktop display without requiring the user to scroll.

### Preconditions

- App loaded at 1920x1080
- Market page is active
- Any scenario selected

### Steps

1. Load the Market page fresh (or navigate to it)
   **Expected:** At least the page heading, market controls (search, sort tabs), and the top row of player cards are visible within the initial viewport. The user should not see a mostly-empty dark screen.

2. Measure the vertical space consumed by the header + nav area
   **Expected:** The combined height of header + nav + any padding is noticeably less than the previous ~120px, leaving substantially more room for content. Target: main content begins within roughly the top 100px of the page.

### Test Data

- Default player list

### Edge Cases

- Test with LiveTicker visible (live scenario) — content should still be at least partially visible above the fold even with the ticker

---

## TC-010: Page content visible above the fold — Portfolio page

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the Portfolio page shows its summary cards (Total Value, Cash Available, Invested, Gain/Loss) within the initial viewport without scrolling.

### Preconditions

- App loaded at 1920x1080
- Portfolio page is active

### Steps

1. Navigate to the Portfolio page
   **Expected:** The "Your Portfolio" heading and the four summary cards are visible in the initial viewport. The user does not need to scroll to find the primary content.

### Test Data

- User has at least one holding so the portfolio summary has non-zero values

### Edge Cases

- Test with an empty portfolio (no holdings) — the empty state message should also be visible above the fold

---

## TC-011: Page content visible above the fold — Leaderboard page

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the Leaderboard page shows its header and at least the top few leaderboard entries within the initial viewport.

### Preconditions

- App loaded at 1920x1080
- Leaderboard page is active

### Steps

1. Navigate to the Leaderboard page
   **Expected:** The page title, summary stats, and at least the top 3 leaderboard entries are visible without scrolling.

### Test Data

- Default leaderboard data

### Edge Cases

- None

---

## TC-012: Page content visible above the fold — 768px viewport (tablet)

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that content is visible above the fold on a tablet-sized viewport, where the header and nav use their responsive compact styles.

### Preconditions

- App loaded at 768x1024

### Steps

1. Navigate to the Market page
   **Expected:** Player cards or market controls are visible in the initial viewport.

2. Navigate to the Portfolio page
   **Expected:** Summary cards are visible in the initial viewport.

### Test Data

- Default data

### Edge Cases

- Test at 1366x768 (common laptop resolution) — this is a critical viewport where the old layout was most problematic

---

## TC-013: All header elements remain accessible after compacting

**Priority:** P0
**Type:** Functional

### Objective

Verify that reducing the header/nav vertical footprint does not break any header functionality — logo, scenario toggle, Help button, and Total Value display must all remain interactive and readable.

### Preconditions

- App loaded at 1920x1080

### Steps

1. Click the McQUEEN logo area
   **Expected:** Logo is visible and properly styled (display font, red color). No functional click handler expected, but it should not be clipped.

2. Click each scenario tab in the ScenarioToggle (Midweek, ESPN Live, Live Game)
   **Expected:** Each tab is clickable and the scenario switches. Tabs are not truncated or overlapping.

3. Click the Help button
   **Expected:** The Glossary modal opens. The button icon and "Help" text (on desktop) are visible.

4. Read the Total Value display
   **Expected:** The "TOTAL VALUE" label and dollar amount are legible. The color indicates gain (green) or loss (red) correctly.

### Test Data

- Default state

### Edge Cases

- Verify the skip-to-main-content link still works (Tab to it, press Enter, focus moves to main content)

---

## TC-014: Nav bar compactness and link functionality

**Priority:** P1
**Type:** Regression

### Objective

Verify that the navigation bar remains fully functional with reduced padding/height. All nav links must be clickable and the active state must display correctly.

### Preconditions

- App loaded at 1920x1080

### Steps

1. Observe the nav bar below the header
   **Expected:** Nav links (Market, Portfolio, Watchlist, Leaderboard, Timeline) are displayed in a single horizontal row with adequate spacing. The nav bar is visually more compact than the original 48px height.

2. Click each nav link in sequence
   **Expected:** Each link navigates to the correct page. The active link has the red primary-color background. The previously active link returns to its default style.

3. Verify hover states on nav links
   **Expected:** Hovering a non-active link shows an elevated background and primary text color.

### Test Data

- None

### Edge Cases

- On mobile (375px), verify the nav is horizontally scrollable and all links are accessible by scrolling

---

## TC-015: Main content padding reduction

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the main content area's top padding has been reduced to reclaim vertical space, while maintaining adequate visual separation from the nav bar.

### Preconditions

- App loaded at 1920x1080

### Steps

1. Inspect the `.main-content` element on any page
   **Expected:** The top padding is reduced from the original 24px to approximately 16px (or a similarly reduced value). Left/right padding may remain at 24px.

2. Visually confirm that content does not feel cramped against the nav bar
   **Expected:** There is a visible but compact gap between the nav bottom border and the first content element.

### Test Data

- None

### Edge Cases

- On mobile (<=768px), verify the main content padding is still appropriate (was 16px, should remain reasonable)

---

## TC-016: No layout regression on Player Detail page

**Priority:** P1
**Type:** Regression

### Objective

Verify that the Player Detail page — which has its own complex layout with a sticky sidebar (player info), charts, and content tiles — is not adversely affected by the global header/nav height changes.

### Preconditions

- App loaded at 1920x1080
- Navigate to any player's detail page from the Market

### Steps

1. Load a player detail page (e.g., click on Patrick Mahomes from Market)
   **Expected:** The player header, price chart, and content sections render correctly. No overlap between the global header and the player detail content.

2. Scroll down through the player detail page
   **Expected:** The global header remains sticky at the top. The player detail content scrolls normally beneath it. If the player detail page has its own sticky elements, they do not conflict with the global header.

### Test Data

- Any player with active content tiles (articles, videos, stats)

### Edge Cases

- Test on the Scenario Inspector page (`/scenarios`) which also has a complex layout with sticky elements
