# Test Plan: mcq-x8o -- Minor Polish

## Summary

- **Bead:** `mcq-x8o`
- **Feature:** Cosmetic and edge-case fixes across chart tooltips, event popups, portfolio layout, search inputs, buyback data, and welcome banner styling
- **Total Test Cases:** 20
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Chart tooltip shows full headline when ≤40 characters

**Priority:** P1
**Type:** Functional

### Objective

Verify that the PlayerDetail price chart tooltip displays the complete headline text without trailing ellipsis when the headline is 40 characters or fewer.

### Preconditions

- A player exists with at least one price history entry whose `reason.headline` is ≤40 characters (e.g., "Mahomes throws 3 TDs" — 20 chars)
- PlayerDetail page is loaded for that player

### Steps

1. Navigate to `/player/{playerId}` for a player with a short headline
   **Expected:** The Price History chart renders with data points

2. Hover over a data point that has a headline ≤40 characters
   **Expected:** Tooltip displays the full headline text without any trailing `...`

### Test Data

- Headline exactly 40 characters: `"Player scores touchdown in fourth period"` (40 chars)
- Headline shorter: `"Big play in Q3"` (14 chars)

### Edge Cases

- Headline is exactly 40 characters — no ellipsis should appear
- Headline is empty string — tooltip should fall back to "Price"
- Entry has no `reason` object — tooltip should display "Price"

---

## TC-002: Chart tooltip truncates headline at word boundary when >40 characters

**Priority:** P1
**Type:** Functional

### Objective

Verify that headlines longer than 40 characters are truncated at the nearest word boundary before the 40-character mark, with `...` appended.

### Preconditions

- A player has a price history entry with a headline exceeding 40 characters
- PlayerDetail page is loaded

### Steps

1. Navigate to `/player/{playerId}` for a player with a long headline
   **Expected:** Chart renders normally

2. Hover over the data point with a long headline (e.g., "Mahomes throws incredible game-winning touchdown pass in overtime")
   **Expected:** Tooltip truncates at the last space before character 40 and appends `...` (e.g., "Mahomes throws incredible game-winning...")

### Test Data

- Headline: `"Mahomes throws incredible game-winning touchdown pass in overtime"` (65 chars)
- Expected truncation: the substring up to the last space at or before position 40, plus `...`

### Edge Cases

- Headline is exactly 41 characters — truncation should trigger
- Headline >40 characters with no spaces (e.g., a very long single word) — should truncate at character 40 with `...`
- Headline of 41 characters where position 40 is a space — truncation should cut at that space

---

## TC-003: Chart tooltip shows date/time label

**Priority:** P1
**Type:** Functional

### Objective

Verify that the tooltip label (previously hidden via `labelStyle: { display: 'none' }`) now shows the date/time of the hovered price point.

### Preconditions

- PlayerDetail page loaded for a player with price history entries that include timestamps

### Steps

1. Navigate to `/player/{playerId}`
   **Expected:** Chart renders with data points

2. Hover over any data point on the price chart
   **Expected:** Tooltip displays a date/time label (e.g., "Jan 15, 3:30 PM") in addition to the price and headline

3. Hover over a different data point with a different timestamp
   **Expected:** The date/time label updates to reflect the new data point's timestamp

### Test Data

- Price entry with `timestamp: "2025-01-15T15:30:00Z"` should display something like "Jan 15, 3:30 PM"

### Edge Cases

- Entry with no timestamp — label should handle gracefully (show fallback or empty)
- Entry at midnight — time portion should display correctly (e.g., "12:00 AM")

---

## TC-004: EventMarkerPopup stays within chart bounds near right edge

**Priority:** P2
**Type:** Functional

### Objective

Verify that clicking an event marker near the right edge of the chart repositions the popup so it doesn't overflow the chart container.

### Preconditions

- PlayerDetail page loaded for a player with event markers on the price chart
- Chart container has a finite width (standard desktop viewport)

### Steps

1. Navigate to `/player/{playerId}` with event markers visible on the chart
   **Expected:** Event markers (dots) are rendered on the chart

2. Click an event marker positioned near the right edge of the chart (within ~260px of the right boundary)
   **Expected:** The EventMarkerPopup appears and is fully visible within the chart container. The popup shifts left so its right edge does not exceed the container's right boundary.

3. Verify popup content is readable and not clipped
   **Expected:** All popup content (headline, badge, close button, links) is visible and interactive

### Test Data

- Event marker at x-position within 260px of chart right edge (popup min-width is 260px)

### Edge Cases

- Event marker at the very last data point (rightmost edge) — popup must shift fully left
- Chart container is narrower than popup min-width (260px) — popup should not overflow on either side

---

## TC-005: EventMarkerPopup stays within chart bounds near bottom edge

**Priority:** P2
**Type:** Functional

### Objective

Verify that clicking an event marker near the bottom edge of the chart repositions the popup above the marker instead of below.

### Preconditions

- PlayerDetail page loaded with event markers on the chart
- At least one event marker is positioned in the lower portion of the chart area

### Steps

1. Click an event marker positioned near the bottom edge of the chart
   **Expected:** The popup renders above the marker (shifted upward) rather than below, so it remains within the chart container bounds

2. Verify the popup arrow/pointer still indicates the correct marker
   **Expected:** The popup's visual connection to the marker is maintained

### Test Data

- Event marker at a y-position where cy + 20 + estimated popup height (~150px) would exceed the chart container height

### Edge Cases

- Event marker in the bottom-right corner — popup must shift both left and above
- Event marker at the very top of the chart — popup should render below as normal (no shift needed)

---

## TC-006: EventMarkerPopup centered marker renders normally

**Priority:** P2
**Type:** Regression

### Objective

Verify that boundary-checking logic doesn't break popup positioning for markers that are not near any edge.

### Preconditions

- PlayerDetail page loaded with event markers

### Steps

1. Click an event marker in the center of the chart (far from any edge)
   **Expected:** Popup renders at its default position (centered below the marker, offset by ~20px) with no repositioning artifacts

### Test Data

- Event marker roughly in the center of the chart

### Edge Cases

- None — this is a regression check for the normal case

---

## TC-007: Portfolio columns use class-based hiding instead of nth-child

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the Portfolio page's responsive column hiding uses explicit CSS class names on column elements rather than `nth-child` selectors.

### Preconditions

- Portfolio page has at least one holding
- Browser DevTools or CSS inspection available

### Steps

1. Navigate to `/portfolio` with holdings present
   **Expected:** Holdings table renders with columns: Player, Shares, Avg Cost, Current, Value, Gain/Loss

2. Inspect the header `<span>` elements and row column elements in the DOM
   **Expected:** Each column span has a descriptive class name (e.g., `col-shares`, `col-avg-cost`, `col-value` or equivalent CSS module class)

3. Inspect the CSS module file
   **Expected:** Media query breakpoints reference class-based selectors (e.g., `.col-avg-cost { display: none }`) rather than `nth-child(n)` selectors

### Test Data

- Portfolio with 2+ holdings

### Edge Cases

- None

---

## TC-008: Portfolio hides Avg Cost and Value columns at 900px breakpoint

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that at viewport widths ≤900px, the "Avg Cost" and "Value" columns are hidden while other columns remain visible and aligned.

### Preconditions

- Portfolio page has at least one holding

### Steps

1. Navigate to `/portfolio` at a viewport width of 901px
   **Expected:** All 6 columns are visible (Player, Shares, Avg Cost, Current, Value, Gain/Loss)

2. Resize the viewport to 900px
   **Expected:** "Avg Cost" and "Value" columns are hidden. Remaining columns (Player, Shares, Current, Gain/Loss) are visible and properly aligned between header and rows.

3. Resize to 768px
   **Expected:** Same 4-column layout; header labels align with row data

### Test Data

- At least 2 holdings with varying avgCost and value amounts

### Edge Cases

- Viewport at exactly 900px — columns should be hidden
- Viewport at 901px — all columns should be visible (boundary check)

---

## TC-009: Portfolio hides Shares column at 600px breakpoint

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that at viewport widths ≤600px, the "Shares" column is additionally hidden (on top of Avg Cost and Value already being hidden).

### Preconditions

- Portfolio page has at least one holding

### Steps

1. Navigate to `/portfolio` at a viewport width of 601px
   **Expected:** 4 columns visible (Player, Shares, Current, Gain/Loss)

2. Resize the viewport to 600px
   **Expected:** "Shares" column is hidden. Remaining columns (Player, Current, Gain/Loss) are visible and aligned between header and rows.

### Test Data

- At least 1 holding

### Edge Cases

- Viewport at exactly 600px — Shares column should be hidden
- Viewport at 601px — Shares column should still be visible

---

## TC-010: Portfolio header and row columns stay aligned at all breakpoints

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the holdings header labels remain properly aligned with their corresponding row data cells at every responsive breakpoint.

### Preconditions

- Portfolio page has 3+ holdings with varying data lengths

### Steps

1. View Portfolio at full desktop width (>900px)
   **Expected:** Header "Player" aligns with player name column, "Shares" with share counts, "Avg Cost" with cost values, "Current" with current prices, "Value" with value amounts, "Gain/Loss" with gain/loss figures

2. Resize to 900px (4-column layout)
   **Expected:** Header labels align with their corresponding row values; no column offset or mismatch

3. Resize to 600px (3-column layout)
   **Expected:** Header labels align with their corresponding row values; no column offset or mismatch

### Test Data

- Holdings with varying name lengths, share counts, and price values

### Edge Cases

- Holding with very long player name — should not push other columns out of alignment
- Holding with 0 shares (if possible) — alignment should still hold

---

## TC-011: Timeline search input uses type="search"

**Priority:** P2
**Type:** Functional

### Objective

Verify that the Timeline page search input uses `type="search"` matching the Market page for consistent browser behavior.

### Preconditions

- Timeline page is accessible

### Steps

1. Navigate to `/timeline`
   **Expected:** The search input field is visible with placeholder text "Search players or headlines..."

2. Inspect the search input element's `type` attribute
   **Expected:** `type="search"` (not `type="text"`)

3. In Safari or Chrome, type text into the search field
   **Expected:** A native clear (×) button appears in the input (browser-provided for `type="search"`)

### Test Data

- Any search query, e.g., "Mahomes"

### Edge Cases

- None

---

## TC-012: Market search input still uses type="search"

**Priority:** P2
**Type:** Regression

### Objective

Verify the Market page search input retains `type="search"` and was not inadvertently changed.

### Preconditions

- Market page is accessible

### Steps

1. Navigate to `/market`
   **Expected:** The search input field is visible

2. Inspect the search input element's `type` attribute
   **Expected:** `type="search"`

### Test Data

- None

### Edge Cases

- None

---

## TC-013: Search functionality unchanged on Timeline after type change

**Priority:** P1
**Type:** Regression

### Objective

Verify that changing the Timeline input type from "text" to "search" does not break search/filter behavior.

### Preconditions

- Timeline page loaded with events/entries

### Steps

1. Navigate to `/timeline`
   **Expected:** Timeline entries are displayed

2. Type a player name (e.g., "Mahomes") into the search input
   **Expected:** Timeline entries filter to show only those matching "Mahomes"

3. Clear the search input (via native × button or by selecting all and deleting)
   **Expected:** All timeline entries reappear

4. Type a headline fragment (e.g., "touchdown")
   **Expected:** Entries matching the headline fragment are shown

### Test Data

- Known player name present in timeline
- Known headline keyword present in timeline

### Edge Cases

- Empty search query — all entries should be visible
- Search query with no matches — empty state or "no results" message

---

## TC-014: Buyback modal shows actual user holdings for eliminated-team players

**Priority:** P1
**Type:** Functional

### Objective

Verify that the PlayoffAnnouncementModal displays the user's real portfolio holdings (from TradingContext) for eliminated-team players, not hardcoded mock data.

### Preconditions

- Scenario is set to "playoffs"
- User has previously bought shares of players who are flagged as `isBuyback` in the playoffs scenario
- `playoffDilutionApplied` is `false`

### Steps

1. Buy 10 shares of a player who will become a buyback player in the playoffs scenario
   **Expected:** Portfolio reflects the purchase (10 shares)

2. Switch to the "playoffs" scenario
   **Expected:** The PlayoffAnnouncementModal appears with the buyback step

3. Verify the buyback table shows the player with 10 shares (matching actual portfolio)
   **Expected:** Share count matches what the user actually holds (10), not a hardcoded value

4. Verify the buyback price matches the player's current/last price in the playoffs data
   **Expected:** Buyback price reflects the actual player price

5. Verify proceeds = buyback price × actual shares
   **Expected:** Proceeds are calculated correctly from real data

### Test Data

- User portfolio: `{ 'diggs-s': { shares: 10, avgCost: 90 } }`
- Player `diggs-s` should be a buyback player in playoffs scenario

### Edge Cases

- User holds shares of a buyback player not in the hardcoded mock list — should now appear correctly
- User holds a different number of shares than the old mock (e.g., 2 instead of 5) — display should reflect actual count

---

## TC-015: Buyback modal handles user with no eliminated-team holdings

**Priority:** P1
**Type:** Functional

### Objective

Verify that if the user has no holdings for any eliminated-team (buyback) players, the modal displays a "No holdings to buy back" message.

### Preconditions

- Scenario set to "playoffs"
- User's portfolio contains zero shares of any buyback-flagged player
- `playoffDilutionApplied` is `false`

### Steps

1. Ensure the user has not purchased any eliminated-team players (or has sold all shares)
   **Expected:** Portfolio has no entries for buyback player IDs

2. Switch to "playoffs" scenario
   **Expected:** PlayoffAnnouncementModal appears

3. Check the buyback step content
   **Expected:** The modal displays "No holdings to buy back" or equivalent empty-state message instead of a player table

4. Verify total buyback proceeds shows $0.00 or is omitted
   **Expected:** No misleading financial figures are displayed

### Test Data

- Empty portfolio or portfolio with only non-buyback players

### Edge Cases

- User previously held buyback players but sold all before switching scenario — should show empty state

---

## TC-016: Buyback proceeds calculated from actual shares and prices

**Priority:** P1
**Type:** Functional

### Objective

Verify the total buyback proceeds displayed in the modal summary are correctly computed from the user's actual portfolio data.

### Preconditions

- User holds shares of multiple buyback players
- Playoffs scenario is active

### Steps

1. Set up portfolio with known holdings:
   - Player A (buyback): 5 shares, buyback price $70
   - Player B (buyback): 3 shares, buyback price $100
   **Expected:** Portfolio reflects these holdings

2. Switch to playoffs scenario and view the buyback modal
   **Expected:** Modal shows Player A: 5 shares × $70 = $350, Player B: 3 shares × $100 = $300

3. Verify total buyback proceeds
   **Expected:** Total shows $650 (sum of individual proceeds)

### Test Data

- Multiple buyback players with known share counts and prices

### Edge Cases

- User holds shares of only one buyback player — total should equal that single player's proceeds
- Buyback player with a price of $0 — proceeds should be $0

---

## TC-017: MOCK_BUYBACK_HOLDINGS constant is removed

**Priority:** P2
**Type:** Regression

### Objective

Verify that the hardcoded `MOCK_BUYBACK_HOLDINGS` constant has been removed from the codebase.

### Preconditions

- Access to `PlayoffAnnouncementModal.tsx` source code

### Steps

1. Search the codebase for `MOCK_BUYBACK_HOLDINGS`
   **Expected:** No references found in any source file

2. Inspect `PlayoffAnnouncementModal.tsx` imports
   **Expected:** Component imports `useTrading` (or equivalent) from TradingContext to access the user's actual portfolio

### Test Data

- None

### Edge Cases

- None

---

## TC-018: Welcome banner border uses subtle color

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the Market page welcome banner border uses `var(--color-border)` (or similarly subtle color) instead of the prominent `var(--color-primary)` red.

### Preconditions

- Market page loaded for a new user (welcome banner not yet dismissed)

### Steps

1. Navigate to `/market` as a new user (or clear localStorage to reset welcome dismissal)
   **Expected:** The welcome banner is visible at the top of the page

2. Inspect the welcome banner's border style
   **Expected:** Border color is `var(--color-border)` (`#333333`) or another subtle, non-red color — not `var(--color-primary)` (`#d00`)

3. Visually assess the banner
   **Expected:** The banner looks intentional and polished, not like a debug artifact with a bright red outline

### Test Data

- None

### Edge Cases

- None

---

## TC-019: Welcome banner blends with app design system

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify the welcome banner's overall appearance is consistent with the app's design system (dark theme, muted borders, appropriate contrast).

### Preconditions

- Welcome banner is visible on the Market page

### Steps

1. View the welcome banner alongside other UI elements (cards, headers, controls)
   **Expected:** The banner's border, background gradient, and text colors are visually consistent with adjacent UI components

2. If an accent border-left was added (optional per design notes), verify it uses `var(--color-primary)` for a subtle accent
   **Expected:** A left-side accent border (if present) provides visual interest without making the entire banner look like a debug element

3. Check that the dismiss button is visible and appropriately styled
   **Expected:** Dismiss button remains functional and visually consistent

### Test Data

- None

### Edge Cases

- Dark mode only (app is dark-themed) — ensure sufficient contrast between border and background

---

## TC-020: Welcome banner dismiss still works after border change

**Priority:** P1
**Type:** Regression

### Objective

Verify that changing the border styling doesn't interfere with the welcome banner's dismiss functionality.

### Preconditions

- Market page loaded with welcome banner visible

### Steps

1. Navigate to `/market` with the welcome banner displayed
   **Expected:** Banner is visible with dismiss (×) button

2. Click the dismiss button
   **Expected:** Banner animates out and disappears

3. Refresh the page
   **Expected:** Banner does not reappear (dismissal persisted in localStorage)

### Test Data

- None

### Edge Cases

- None
