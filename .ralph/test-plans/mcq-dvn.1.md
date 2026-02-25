# Test Plan: mcq-dvn.1 -- Fix Timeline time filters to use scenario-relative dates

## Summary

- **Bead:** `mcq-dvn.1`
- **Feature:** Timeline "Today" and "This Week" time filters derive their reference date from the latest event timestamp in the current scenario data instead of the browser's `new Date()`
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: "Today" filter shows only events sharing the latest event's calendar day

**Priority:** P0
**Type:** Functional

### Objective

Verify that selecting the "Today" time filter shows only events whose timestamp falls on the same calendar day as the newest event in the scenario, regardless of the actual browser date.

### Preconditions

- App loaded with the Midweek scenario (events span Nov 25 through Dec 4, 2024)
- Timeline page is open; default filter is "All Time"

### Steps

1. Observe the Timeline with the default "All Time" filter
   **Expected:** All events across all dates are displayed (events from Nov 25, Dec 1, Dec 3, Dec 4, etc.)

2. Select "Today" from the Time filter dropdown
   **Expected:** Only events dated Dec 4 are shown (the calendar day of the latest event timestamp, `2024-12-04T16:30:00Z`). Events from Nov 25, Dec 1, and Dec 3 are hidden.

3. Verify the event count in the stats bar decreases to match only Dec 4 events
   **Expected:** The "Events" stat reflects the count of Dec-4-only events

### Test Data

- Midweek scenario test players: Patrick Mahomes (events on Nov 25, Dec 1, Dec 3, Dec 4) and Josh Allen (events on Dec 4)
- Latest event timestamp: `2024-12-04T16:30:00Z` (Josh Allen's second entry)

### Edge Cases

- If all events in a scenario share the same calendar day, "Today" should show all events
- Events at 00:00:00 on Dec 4 vs 23:59:59 on Dec 3 must be correctly split across days

---

## TC-002: "This Week" filter shows events within 7 days of the latest timestamp

**Priority:** P0
**Type:** Functional

### Objective

Verify that the "This Week" filter computes a 7-day window ending at the latest event timestamp (not the browser's current date), and excludes events older than 7 days.

### Preconditions

- App loaded with the Midweek scenario
- Timeline page is open; default filter is "All Time"

### Steps

1. Note the total event count with "All Time" selected
   **Expected:** All 6 events across both players are visible

2. Select "This Week" from the Time filter dropdown
   **Expected:** Events within 7 days of the latest timestamp (`2024-12-04T16:30:00Z`) are shown. The Nov 25 event (`2024-11-25T10:00:00Z`, which is ~9 days before Dec 4) is excluded. The Dec 1 event (`2024-12-01T12:00:00Z`, which is ~3 days before Dec 4) is included.

3. Verify the Nov 25 "Week start baseline" event is not visible
   **Expected:** No event with headline "Week start baseline" appears in the list

4. Verify the Dec 1 "Midweek news update" event is still visible
   **Expected:** Event with headline "Midweek news update" appears in the list

### Test Data

- Mahomes event on Nov 25 (>7 days before latest) — should be excluded
- Mahomes event on Dec 1 (~3 days before latest) — should be included
- `weekAgo` computed as `2024-11-27T16:30:00Z` (Dec 4 minus 7 days)

### Edge Cases

- An event timestamped exactly 7 × 24 × 60 × 60 × 1000 ms before the latest timestamp falls exactly on the boundary — should be included (the code uses `eventDate < weekAgo`, so equal timestamps pass)
- An event 1 millisecond beyond the 7-day boundary — should be excluded

---

## TC-003: "All Time" filter shows every event regardless of date

**Priority:** P0
**Type:** Regression

### Objective

Confirm the "All Time" filter is unaffected by the scenario-relative date changes and continues to display all events.

### Preconditions

- Timeline page open with the Midweek scenario

### Steps

1. Note the total event count with default "All Time" filter
   **Expected:** All events are shown (6 in default Midweek test data)

2. Select "Today" to narrow the list
   **Expected:** A reduced subset of events is shown

3. Select "All Time" again
   **Expected:** The full set of events is restored, matching the count from step 1

### Test Data

- Any scenario with events across multiple days

### Edge Cases

- Rapidly toggling between "All Time", "Today", and "This Week" should always return correct counts without stale state

---

## TC-004: scenarioNow is derived from allEvents[0] (newest-first sort order)

**Priority:** P0
**Type:** Functional

### Objective

Verify that the reference date (`scenarioNow`) is taken from `allEvents[0].timestamp`, which is the most recent event after the list is sorted newest-first. This ensures the filter reference tracks the actual data, not a hardcoded date.

### Preconditions

- Timeline data contains events across multiple days from multiple players
- Events are sorted newest-first by the `useMemo` sort

### Steps

1. Load the Timeline with two players: Player A's latest event is Dec 4 16:30, Player B's latest event is Dec 4 16:00
   **Expected:** `allEvents[0]` is the Dec 4 16:30 event (Player A's latest, since it has the newest timestamp)

2. Select "Today" filter
   **Expected:** All events on Dec 4 are shown, confirming `scenarioNow` is Dec 4 (from the 16:30 event)

3. Now load a scenario where Player B has a newer timestamp (e.g., Dec 5 09:00) than Player A's Dec 4 16:30
   **Expected:** `scenarioNow` shifts to Dec 5, and "Today" shows only Dec 5 events

### Test Data

- Two players with different latest-event dates to prove `scenarioNow` tracks the global maximum, not a single player's data

### Edge Cases

- A single player with a single event — `scenarioNow` equals that event's timestamp
- Players with interleaved timestamps — the overall newest across all players is used

---

## TC-005: Empty event list falls back to Date.now() without errors

**Priority:** P1
**Type:** Functional

### Objective

When no players have price history (empty `allEvents`), the `scenarioNow` fallback `new Date()` is used, and no JavaScript errors occur.

### Preconditions

- Timeline loaded with a player whose `priceHistory` is an empty array

### Steps

1. Load the Timeline with an empty-history player
   **Expected:** "No events match your filters" empty state is shown; no console errors

2. Select "Today" from the Time filter dropdown
   **Expected:** Still shows empty state; no `TypeError` from accessing `allEvents[0]?.timestamp`

3. Select "This Week" from the Time filter dropdown
   **Expected:** Still shows empty state; no errors

### Test Data

- Single player: `{ id: 'p3', priceHistory: [], ... }`

### Edge Cases

- `allEvents[0]?.timestamp` evaluates to `undefined` — the `|| Date.now()` fallback inside the ternary prevents errors (note: the actual code uses a ternary `allEvents.length > 0 ? ... : new Date()`)

---

## TC-006: "Today" filter combined with type filter correctly intersects results

**Priority:** P1
**Type:** Integration

### Objective

Verify that applying "Today" and a type filter simultaneously produces the correct intersection — only events matching both the day and the event type.

### Preconditions

- Timeline loaded with the Midweek test data
- Multiple event types exist on Dec 4 (game_event, league_trade) but no "news" events on Dec 4

### Steps

1. Select "Today" from the Time filter dropdown
   **Expected:** Only Dec 4 events are shown (TD, INT, general game stats, league trade)

2. Select "News" from the Type filter dropdown (while "Today" is still active)
   **Expected:** "No events match your filters" empty state is displayed, because there are no news events on Dec 4 in the test data

3. Switch Type filter back to "All Events"
   **Expected:** Dec 4 events reappear

### Test Data

- Dec 4 events include: game_event (TD), game_event (INT), game_event (stats) — but no news events on that day
- News events exist on earlier days (Nov 25, Dec 1)

### Edge Cases

- If a scenario has news events on the latest day, the intersection should include them

---

## TC-007: "This Week" filter combined with magnitude filter correctly intersects results

**Priority:** P1
**Type:** Integration

### Objective

Verify that "This Week" and magnitude filters can be combined, producing only events within 7 days that also meet the magnitude threshold.

### Preconditions

- Timeline loaded with the Midweek test data

### Steps

1. Select "This Week" from the Time filter dropdown
   **Expected:** Events within 7 days of the latest timestamp are shown

2. Select "Major (>5%)" from the Magnitude filter dropdown
   **Expected:** Only events within the last 7 days AND with |priceChange| > 5% are shown. If no events meet both criteria, the empty state is displayed.

3. Select "Significant (>2%)" from the Magnitude filter dropdown
   **Expected:** Events within the last 7 days AND with |priceChange| > 2% are shown

### Test Data

- Midweek test data price changes: Mahomes TD event (~4.3% from base), Allen INT event (−6.25%)
- The Allen INT event exceeds both 2% and 5% thresholds

### Edge Cases

- An event at exactly 2.00% change with "Significant (>2%)" filter — should be excluded (code uses `absChange < 2`, so 2.0 passes)

---

## TC-008: Time filter works correctly across different scenarios

**Priority:** P1
**Type:** Integration

### Objective

Verify scenario-relative time filters adapt when the user switches scenarios, since each scenario has a different date range.

### Preconditions

- App loaded with scenario switching capability

### Steps

1. Load the Live Game scenario (events around Dec 9, 2025); select "Today" filter
   **Expected:** Only events from Dec 9, 2025 are shown

2. Switch to the Super Bowl scenario (events around Feb 8, 2026); observe the "Today" filter
   **Expected:** The filter now references Feb 8, 2026 as "today" — only Feb 8 events are shown

3. Switch to the Midweek scenario (events around early Dec 2024); observe the "Today" filter
   **Expected:** The filter shifts to reference that scenario's latest event date

### Test Data

- Live: latest event ~`2025-12-09T21:xx:xx`
- Super Bowl: latest event ~`2026-02-08Txx:xx:xx`
- Midweek: latest event ~`2024-12-04Txx:xx:xx` (in test fixture)

### Edge Cases

- A scenario where all events are on a single day — "Today" and "This Week" should return identical results

---

## TC-009: "Today" comparison uses toDateString() for calendar-day matching

**Priority:** P1
**Type:** Functional

### Objective

Verify that the "Today" filter compares calendar days using `toDateString()` (which ignores time-of-day), not strict timestamp equality. Events at any hour on the same day should be included.

### Preconditions

- Scenario contains multiple events on the same calendar day but at different times

### Steps

1. Load scenario data where the latest event is at `2024-12-04T16:30:00Z` and other events on Dec 4 are at `2024-12-04T15:00:00Z` and `2024-12-04T16:00:00Z`
   **Expected:** All three Dec 4 events are shown when "Today" is selected

2. Verify an event at `2024-12-04T00:00:01Z` would also be included
   **Expected:** Early-morning events on the same calendar day are included

### Test Data

- Three events on Dec 4 at different times of day: 00:01, 15:00, and 16:30

### Edge Cases

- Timezone sensitivity: `toDateString()` uses the browser's local timezone. An event at `2024-12-04T23:59:00Z` might map to Dec 5 in timezones east of UTC — this is a known limitation, not a bug in the implementation

---

## TC-010: Time filter dropdown UI reflects the selected value

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the Time filter dropdown visually indicates the currently selected option and that all three options ("All Time", "Today", "This Week") are available.

### Preconditions

- Timeline page is open

### Steps

1. Inspect the Time filter dropdown in its default state
   **Expected:** "All Time" is the selected option; the dropdown is labeled "Time"

2. Open the dropdown
   **Expected:** Three options are listed: "All Time", "Today", "This Week"

3. Select "Today"
   **Expected:** The dropdown displays "Today" as the current selection

4. Select "This Week"
   **Expected:** The dropdown displays "This Week" as the current selection

### Test Data

- N/A — UI-only check

### Edge Cases

- Dropdown should be keyboard-accessible (navigable with arrow keys, selectable with Enter)

---

## TC-011: scenarioNow does not use browser's real date for filtering

**Priority:** P0
**Type:** Functional

### Objective

This is the core regression guard: confirm that `new Date()` (the browser's real clock) is NOT used as the reference date. The scenario data from Dec 2024 or Dec 2025 must still produce correct filter results even when run in Feb 2026 (or any future date).

### Preconditions

- Browser's real date is Feb 2026 (or any date far from the scenario dates)
- Timeline loaded with the Midweek scenario (Dec 2024 events)

### Steps

1. Select "Today" from the Time filter dropdown
   **Expected:** Events from Dec 4, 2024 are shown — NOT zero results. If the filter used `new Date()` (Feb 2026), no Dec 2024 events would match "today", yielding an incorrectly empty list.

2. Select "This Week"
   **Expected:** Events from late Nov/early Dec 2024 are shown — NOT zero results. If the filter used `new Date()` (Feb 2026), the 7-day window would be in Feb 2026, yielding an incorrectly empty list.

### Test Data

- Midweek scenario with Dec 2024 timestamps, run on a browser in Feb 2026

### Edge Cases

- This test should pass on any date in the future, not just today — that's the whole point of scenario-relative dating

---

## TC-012: Empty state message displays when all events are filtered out

**Priority:** P2
**Type:** UI/Visual

### Objective

When the combination of time filter and other filters yields zero matching events, the empty state message "No events match your filters" is displayed.

### Preconditions

- Timeline page loaded with events

### Steps

1. Select "Today" from the Time filter
   **Expected:** Only events from the latest day are shown

2. Apply a type filter that excludes all events on that day (e.g., "News" when no news events exist on the latest day)
   **Expected:** The event list is replaced by the text "No events match your filters"

3. Remove the type filter (set to "All Events")
   **Expected:** The events from the latest day reappear

### Test Data

- Midweek test data where Dec 4 has no news-type events

### Edge Cases

- The empty state should appear cleanly with no layout shift or broken styling
- Switching from empty state back to populated state should render events with correct animation
