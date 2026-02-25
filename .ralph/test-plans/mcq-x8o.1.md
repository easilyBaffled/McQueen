# Test Plan: mcq-x8o.1 -- Fix PlayerDetail chart tooltip truncation and add date context

## Summary

- **Bead:** `mcq-x8o.1`
- **Feature:** Price chart tooltip conditionally truncates headlines at word boundaries and displays a formatted date label
- **Total Test Cases:** 10
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Short headline displays without truncation or ellipsis

**Priority:** P0
**Type:** Functional

### Objective

Verify that headlines at or under the max length render in full with no trailing ellipsis. This is the core bug — previously all headlines received an unconditional ellipsis.

### Preconditions

- PlayerDetail page loaded for a player with price history
- At least one chart data point has a `reason.headline` shorter than the truncation threshold (e.g., 30 characters)

### Steps

1. Hover over a chart data point whose headline is short (e.g., "Mahomes throws 3 TDs")
   **Expected:** The tooltip displays the full headline text with no "..." appended

2. Confirm the displayed headline text exactly matches the original `reason.headline` value
   **Expected:** Character-for-character match, no truncation artifacts

### Test Data

- Headline: `"Mahomes throws 3 TDs"` (21 chars — well under threshold)

### Edge Cases

- Headline exactly at the max length boundary (e.g., exactly 40 chars) — should still display without ellipsis

---

## TC-002: Long headline truncates at word boundary with ellipsis

**Priority:** P0
**Type:** Functional

### Objective

Verify that headlines exceeding the max length are truncated at the nearest preceding word boundary and have "..." appended.

### Preconditions

- PlayerDetail page loaded for a player with price history
- At least one chart data point has a `reason.headline` longer than the truncation threshold

### Steps

1. Hover over a chart data point whose headline exceeds the max length
   **Expected:** The tooltip displays a truncated headline ending with "..."

2. Verify the truncation point falls on a word boundary (no mid-word cut)
   **Expected:** The last visible word before "..." is complete — no partial words

### Test Data

- Headline: `"Patrick Mahomes leads Chiefs to stunning comeback victory over rival team"` (73 chars)
- Expected truncated result ends at a space boundary, not mid-word

### Edge Cases

- Headline that is exactly 1 character over the threshold — should truncate at nearest preceding word boundary
- Headline with no spaces (single very long word) — should hard-truncate at max length with "..."

---

## TC-003: Null or undefined headline falls back to default label

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a chart data point has no headline (null, undefined, or empty string), the tooltip displays a sensible fallback label instead of crashing or showing blank text.

### Preconditions

- PlayerDetail page loaded for a player with price history
- At least one chart data point has `reason.headline` as `null`, `undefined`, or missing `reason` entirely

### Steps

1. Hover over a chart data point with no headline
   **Expected:** The tooltip name/label displays `"Price"` (the current fallback) instead of empty or undefined text

2. Hover over a chart data point where `reason` is entirely absent
   **Expected:** The tooltip still renders correctly with the fallback label and the price value

### Test Data

- Entry with `reason: null`
- Entry with `reason: { type: 'news', headline: null }`
- Entry with `reason: { type: 'news', headline: '' }`

### Edge Cases

- `reason.headline` is an empty string `""` — should show fallback, not an empty label

---

## TC-004: Date label is visible in tooltip

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the tooltip date label is visible, not hidden. The previous implementation used `labelStyle={{ display: 'none' }}` which suppressed date context entirely.

### Preconditions

- PlayerDetail page loaded with chart data containing timestamps

### Steps

1. Hover over any data point on the price chart
   **Expected:** A date/time label is visible within the tooltip (above or near the price value)

2. Inspect that no `display: none` or `visibility: hidden` style is applied to the tooltip label element
   **Expected:** The label element is rendered and visible in the DOM

### Test Data

- Any player with at least one price history entry

### Edge Cases

- None specific to this case

---

## TC-005: Date label formats correctly from entry.timestamp

**Priority:** P1
**Type:** Functional

### Objective

Verify the tooltip date label displays a human-readable date derived from `entry.timestamp`, formatted with month, day, hour, and minute.

### Preconditions

- PlayerDetail page loaded with chart data containing valid timestamps

### Steps

1. Hover over a data point with a known timestamp (e.g., `2025-11-05T14:30:00Z`)
   **Expected:** The tooltip label shows a formatted date like `"Nov 5, 2:30 PM"` (locale-dependent but includes month, day, hour, minute)

2. Hover over a different data point with a different timestamp
   **Expected:** The label updates to reflect that data point's timestamp, not a stale value

### Test Data

- Timestamp: `"2025-11-05T14:30:00Z"` → expect `"Nov 5, 2:30 PM"` (en-US locale)
- Timestamp: `"2025-12-25T09:00:00Z"` → expect `"Dec 25, 9:00 AM"` (en-US locale)

### Edge Cases

- Midnight timestamp (`T00:00:00Z`) — should display `"12:00 AM"`, not omit the time
- Entry with missing or invalid timestamp — label should gracefully show empty string, not crash

---

## TC-006: Tooltip displays price formatted as currency

**Priority:** P1
**Type:** Regression

### Objective

Ensure the existing price formatting in the tooltip still works correctly after the truncation and date label changes.

### Preconditions

- PlayerDetail page loaded with chart data

### Steps

1. Hover over a data point with price `45.678`
   **Expected:** Tooltip displays `"$45.68"` (two decimal places, dollar sign)

2. Hover over a data point with price `100`
   **Expected:** Tooltip displays `"$100.00"`

### Test Data

- Price values: `45.678`, `100`, `0.50`, `99.999`

### Edge Cases

- Price value of `0` — should display `"$0.00"`

---

## TC-007: Tooltip styling and layout with both headline and date visible

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the tooltip is visually coherent with both the date label and headline/price content visible simultaneously. The dark-themed tooltip should not overflow or clip content.

### Preconditions

- PlayerDetail page loaded with chart data

### Steps

1. Hover over a data point with a moderate-length headline
   **Expected:** Tooltip renders with dark background (`#1A1A1A`), rounded corners, visible border (`#333`), and displays both the date label and price/headline without overlap

2. Hover over a data point with a long headline that triggers truncation
   **Expected:** Truncated headline with "..." fits within the tooltip without causing overflow or line-wrapping issues

3. Resize the browser to a narrow viewport and hover over a data point
   **Expected:** Tooltip remains readable and does not overflow the chart container

### Test Data

- Short headline: `"TD pass"` (7 chars)
- Long headline: `"Patrick Mahomes leads Chiefs to stunning comeback victory over rival team"` (73 chars)

### Edge Cases

- Very narrow viewport (320px width) — tooltip should still be usable

---

## TC-008: Tooltip on data point with no event (baseline entry)

**Priority:** P2
**Type:** Functional

### Objective

Verify the tooltip behavior on data points that represent baseline/initial prices with no associated news event or reason.

### Preconditions

- PlayerDetail page loaded with chart data that includes baseline entries (no `reason` or reason with no headline)

### Steps

1. Hover over the first data point in the chart (often the baseline price)
   **Expected:** Tooltip shows the price value (`$XX.XX`), the date label from the timestamp, and the fallback headline label (`"Price"`)

2. Confirm no JavaScript errors in the console
   **Expected:** No errors related to accessing properties of undefined/null

### Test Data

- Baseline entry: `{ time: 0, price: 50.00, timestamp: "2025-11-01T00:00:00Z", reason: null }`

### Edge Cases

- Entry where `reason` exists but `reason.headline` is `undefined`

---

## TC-009: Headline at exact truncation boundary

**Priority:** P2
**Type:** Functional

### Objective

Verify correct behavior at the exact boundary of the max length (default 40 characters), including off-by-one correctness.

### Preconditions

- PlayerDetail page loaded with chart data containing headlines of precisely controlled lengths

### Steps

1. Hover over a data point with a headline of exactly 39 characters
   **Expected:** Full headline displayed without "..."

2. Hover over a data point with a headline of exactly 40 characters
   **Expected:** Full headline displayed without "..." (40 is the threshold, not exceeded)

3. Hover over a data point with a headline of exactly 41 characters
   **Expected:** Headline is truncated at a word boundary with "..." appended

### Test Data

- 39 chars: `"Short passes lead to a big win today!"` (pad/adjust to exact length)
- 40 chars: `"Short passes lead to a big win today!!!"` (pad/adjust to exact length)
- 41 chars: `"Short passes lead to a big win today!!!!"` (pad/adjust to exact length)

### Edge Cases

- Headline of exactly `maxLen` characters ending with a space — no truncation should occur

---

## TC-010: Tooltip interaction does not regress active dot or chart behavior

**Priority:** P2
**Type:** Regression

### Objective

Verify that tooltip changes do not break the chart's active dot highlighting, event marker click behavior, or other interactive chart features.

### Preconditions

- PlayerDetail page loaded with chart data and event markers

### Steps

1. Hover over various data points along the chart line
   **Expected:** Active dot (radius 6, color matching up/down state) appears at the hovered point and the tooltip follows the cursor

2. Move the cursor away from the chart
   **Expected:** Tooltip disappears and active dot is no longer shown

3. Click on an event marker on the chart
   **Expected:** Event marker click behavior (e.g., navigation or detail display) still functions as before

### Test Data

- Player with both positive and negative price changes in history

### Edge Cases

- Rapidly hovering across multiple data points — tooltip should update smoothly without flicker or stale data
