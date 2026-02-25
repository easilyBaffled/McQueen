# Test Plan: mcq-dvn.6 -- Filter out future-dated events relative to scenario date

## Summary

- **Bead:** `mcq-dvn.6`
- **Feature:** Price history chart and timeline filter out events dated after the derived scenario date to maintain demo immersion
- **Total Test Cases:** 10
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Future-dated entries excluded from price chart

**Priority:** P0
**Type:** Functional

### Objective

Verify that price history entries with timestamps after the derived scenario date do not appear as data points on the LineChart. In the Midweek scenario (Wed Dec 4), entries dated Dec 6 must be absent from the chart.

### Preconditions

- App is loaded with the "midweek" scenario selected
- Navigate to a player detail page for a player whose `priceHistory` contains entries dated 2025-12-06 (e.g., Mahomes or Hill)

### Steps

1. Open the PlayerDetail page for "Patrick Mahomes" (`/player/mahomes`)
   **Expected:** The Price History chart renders without errors

2. Inspect the chart's X-axis date labels and data points
   **Expected:** No date label shows "Dec 6" or any date after the derived scenario date. The last visible data point corresponds to a timestamp on or before Dec 4 (approximately)

3. Hover over the rightmost data point on the chart to trigger the Tooltip
   **Expected:** The tooltip timestamp shows a date on or before the scenario date, not Dec 6

### Test Data

- Player: Patrick Mahomes (id: `mahomes`)
- Future entry: `2025-12-06T09:00:00` — "Fantasy experts bullish on Chiefs passing game…"
- Scenario narrative date: Wed Dec 4

### Edge Cases

- Verify with Tyreek Hill (id: `hill`) who has a Dec 6 entry as well — same filtering must apply

---

## TC-002: Future-dated entries excluded from Price Changes timeline

**Priority:** P0
**Type:** Functional

### Objective

Verify that the "Price Changes" timeline list (below the chart) also omits entries dated after the scenario date, since both the chart and the timeline consume the same filtered `chartData`.

### Preconditions

- App is loaded with the "midweek" scenario selected
- Navigate to PlayerDetail for a player with future-dated entries

### Steps

1. Open `/player/mahomes` and scroll down to the "Price Changes" section (`data-testid="timeline-card"`)
   **Expected:** The timeline card is visible

2. Read the first (most recent) entry in the timeline list
   **Expected:** The most recent entry's timestamp badge shows a date on or before the scenario date (e.g., "Dec 3" or "Dec 4"), NOT "Dec 6"

3. Count all timeline entries displayed
   **Expected:** The count matches the number of `priceHistory` entries with timestamps <= scenario date (for Mahomes: 9 entries, not 10)

### Test Data

- Player: Patrick Mahomes (id: `mahomes`)
- Expected excluded entry: `2025-12-06T09:00:00`

### Edge Cases

- Verify that the price diff calculation on the newest visible entry uses the correct preceding entry (not the filtered-out Dec 6 entry)

---

## TC-003: scenarioNow derived as median of per-player max timestamps

**Priority:** P0
**Type:** Functional

### Objective

Verify that the scenario date (`scenarioNow`) is computed as the median of the maximum timestamps across all players, not from a single player or hardcoded value. This ensures one player having outlier future data does not shift the scenario date for everyone.

### Preconditions

- App is loaded with the "midweek" scenario
- Multiple players have `priceHistory` with varying max timestamps

### Steps

1. Open any PlayerDetail page (e.g., `/player/mahomes`)
   **Expected:** Page loads with filtered chart data

2. Verify the derived scenario date by checking the filtering threshold: most players' max timestamps cluster around Dec 3–4; the median should land in that range
   **Expected:** The computed `scenarioNow` is approximately 2025-12-04 (the median of per-player max timestamps). Entries on Dec 6 — which only appear for a subset of players — are beyond this median and thus filtered out

### Test Data

- Midweek scenario data with ~12 players, most having max timestamps around Dec 3–4
- Outlier players (Mahomes, Hill) with entries on Dec 6

### Edge Cases

- If all players happen to have the same max timestamp, `scenarioNow` equals that timestamp exactly
- If only one player exists, `scenarioNow` equals that player's max timestamp

---

## TC-004: Entries exactly at the scenario date boundary are included

**Priority:** P1
**Type:** Functional

### Objective

Verify that the filtering uses `<=` (less than or equal), so entries whose timestamp exactly equals `scenarioNow` are included, not excluded.

### Preconditions

- App is loaded with the "midweek" scenario
- At least one player has an entry whose timestamp exactly matches the derived `scenarioNow`

### Steps

1. Open PlayerDetail for a player whose latest non-future entry timestamp equals the median scenario date
   **Expected:** That entry appears in both the chart and the Price Changes timeline

2. Confirm the entry is the last data point on the chart
   **Expected:** The entry is present; it is NOT filtered out

### Test Data

- A player whose max timestamp is exactly the median value computed from all players

### Edge Cases

- Timestamps with sub-second precision: if `scenarioNow` is derived at second granularity, an entry at the exact same second must still be included

---

## TC-005: Player with no future-dated entries is unaffected

**Priority:** P1
**Type:** Regression

### Objective

Verify that players whose entire `priceHistory` falls on or before the scenario date display all their entries without any being incorrectly filtered.

### Preconditions

- App is loaded with the "midweek" scenario
- Select a player whose max price history timestamp is well before Dec 6

### Steps

1. Open PlayerDetail for a player with no Dec 6 entries
   **Expected:** All price history entries appear in the chart and timeline

2. Count chart data points and timeline entries
   **Expected:** Count matches the total number of `priceHistory` entries for that player (no entries lost)

### Test Data

- Any midweek player without a Dec 6 entry (check scenario data for candidates)

### Edge Cases

- A player with only one price history entry (the baseline) — that single entry must still display

---

## TC-006: Player with empty priceHistory renders gracefully

**Priority:** P1
**Type:** Functional

### Objective

Verify that if a player has an empty or undefined `priceHistory`, the chart and timeline sections render without errors.

### Preconditions

- A player record exists with `priceHistory: []` or `priceHistory` omitted entirely

### Steps

1. Navigate to the PlayerDetail page for a player with no price history
   **Expected:** The Price History chart renders with no data points (empty chart area). No JavaScript errors in the console

2. Scroll to the Price Changes timeline section
   **Expected:** The timeline section is present but contains zero entries. No crash or error state

### Test Data

- A player with `priceHistory` set to `[]`

### Edge Cases

- `priceHistory` is `undefined` (field missing from JSON) — the code guards with `if (!player.priceHistory) return []`

---

## TC-007: Event markers on chart only show for filtered (non-future) entries

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the Customized event markers (star for TD, X for INT, etc.) only render for entries within the filtered `chartData`, not for any future-dated entry.

### Preconditions

- App is loaded with the "midweek" scenario
- Navigate to a player with significant events (TDs, INTs) that span both before and after the scenario date

### Steps

1. Open PlayerDetail for a player with event markers in their price history
   **Expected:** Event markers appear on the chart for significant events

2. Count the event markers visible on the chart
   **Expected:** No marker corresponds to any future-dated entry. Markers only align with chart data points within the scenario date range

3. Click on the rightmost event marker on the chart
   **Expected:** The `EventMarkerPopup` shows a timestamp on or before the scenario date

### Test Data

- A player with at least one TD or INT event before the scenario date, and ideally a significant event among the filtered-out Dec 6 entries

### Edge Cases

- If the only significant event is in the future-dated range, no event markers should render at all

---

## TC-008: Chart tooltip does not reference future-dated entries

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that hovering anywhere on the chart (including the rightmost edge) never shows tooltip content from a future-dated entry.

### Preconditions

- App is loaded with the "midweek" scenario
- Navigate to a player with future-dated entries in the raw data

### Steps

1. Open PlayerDetail for Patrick Mahomes (`/player/mahomes`)
   **Expected:** Chart renders with filtered data

2. Hover over the rightmost data point on the chart
   **Expected:** Tooltip shows the headline from the last included entry (e.g., "Week opens with Mahomes at baseline value" on Dec 3), NOT "Fantasy experts bullish on Chiefs passing game…" (Dec 6)

3. Move the mouse across the entire chart from left to right
   **Expected:** At no point does the tooltip display content from a Dec 6 entry

### Test Data

- Player: Mahomes, filtered-out headline: "Fantasy experts bullish on Chiefs passing game…"

### Edge Cases

- Rapidly mousing across the chart boundary — tooltip should never flicker to show future content

---

## TC-009: Source data files are not modified

**Priority:** P0
**Type:** Regression

### Objective

Verify that the filtering is applied at render time in `PlayerDetail.tsx`, and that no `src/data/*.json` files have been altered. The design notes explicitly state: "Do not modify src/data/*.json files."

### Preconditions

- Access to the source code repository

### Steps

1. Check git status or diff for any changes to `src/data/*.json` files
   **Expected:** No modifications to `src/data/midweek.json`, `src/data/live.json`, `src/data/playoffs.json`, `src/data/superbowl.json`, `src/data/leagueMembers.json`, or `src/data/espnPlayers.json`

2. Open `src/data/midweek.json` and search for the Dec 6 entries (e.g., Mahomes' "Fantasy experts bullish…")
   **Expected:** The future-dated entries are still present in the raw JSON — they have not been deleted or altered

3. Open `src/pages/PlayerDetail/PlayerDetail.tsx` and verify the filter is applied in the `chartData` useMemo
   **Expected:** The filter `new Date(entry.timestamp).getTime() <= scenarioNow` exists in the code, implementing runtime filtering

### Test Data

- Git diff of `src/data/` directory

### Edge Cases

- Ensure other scenario JSON files (live, playoffs, superbowl) are also unmodified

---

## TC-010: Filtering works consistently across scenario switches

**Priority:** P2
**Type:** Integration

### Objective

Verify that switching away from the midweek scenario and back correctly recomputes `scenarioNow` and re-applies the filter, without stale data leaking through.

### Preconditions

- App is loaded with any scenario

### Steps

1. Select the "Live Game" scenario from the scenario toggle
   **Expected:** Scenario switches; player data reflects the live scenario

2. Navigate to any player's detail page
   **Expected:** Chart and timeline show all appropriate data for the live scenario (filtering applies based on that scenario's median timestamps)

3. Switch back to the "Midweek" scenario via the scenario toggle
   **Expected:** Scenario reloads midweek data

4. Navigate to `/player/mahomes`
   **Expected:** The Dec 6 entries are again filtered out. The chart shows the same filtered set as in TC-001. No stale data from the live scenario appears

### Test Data

- Scenario switches: midweek → live → midweek

### Edge Cases

- Rapid scenario toggling (switch multiple times quickly) — final state must be consistent with the last-selected scenario
