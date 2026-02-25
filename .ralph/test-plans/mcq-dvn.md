# Test Plan: mcq-dvn -- Timeline and Scenario Improvements

## Summary

- **Bead:** `mcq-dvn`
- **Feature:** Fix timeline time filters for scenario-relative dates, add live simulation indicator, scenario loading state, LiveTicker fallback text, event type display labels, and future-dated event handling
- **Total Test Cases:** 22
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: "Today" filter returns events from the scenario's latest event day

**Priority:** P0
**Type:** Functional

### Objective

Verify the "Today" time filter uses the latest event timestamp in the scenario data as "now" rather than the browser's `new Date()`, so it returns events from the same calendar day as that latest timestamp.

### Preconditions

- App loaded with the Midweek scenario (timestamps around Dec 4)
- Timeline page is open with events visible

### Steps

1. Navigate to the Timeline page
   **Expected:** Events are displayed in reverse chronological order

2. Click the "Today" time filter button
   **Expected:** Only events whose timestamp falls on the same calendar day as the newest event in the scenario are shown (e.g., Dec 4 events for Midweek)

3. Verify that events from other days within the scenario are hidden
   **Expected:** Events dated Dec 3 or earlier are not shown

### Test Data

- Midweek scenario (latest event ≈ Dec 4, 2024)
- Scenario contains events across multiple days

### Edge Cases

- If all events share the same day, "Today" filter should show all events
- If the latest event timestamp is midnight (00:00), boundary events from 23:59 the prior day should be excluded

---

## TC-002: "This Week" filter returns events from the 7 days up to the scenario's latest timestamp

**Priority:** P0
**Type:** Functional

### Objective

Verify "This Week" computes a 7-day window ending at the scenario's latest event timestamp, not the real current date.

### Preconditions

- App loaded with a scenario whose events span more than 7 days
- Timeline page is open

### Steps

1. Navigate to the Timeline page
   **Expected:** All events are displayed (default "All Time" filter)

2. Click the "This Week" time filter button
   **Expected:** Only events from the 7-day window ending at the scenario's latest event timestamp are shown

3. Verify an event dated 8+ days before the latest timestamp is hidden
   **Expected:** The older event is filtered out

### Test Data

- Use a scenario with events spanning > 7 days (e.g., Midweek with events from late November through Dec 4)

### Edge Cases

- Event exactly 7 days (168 hours) before the latest timestamp — should be included
- Event 7 days and 1 second before — should be excluded

---

## TC-003: "All Time" filter continues to show all events

**Priority:** P0
**Type:** Regression

### Objective

Ensure the "All Time" filter remains unaffected by the scenario-relative date changes and still shows every event.

### Preconditions

- App loaded with any scenario
- Timeline page is open

### Steps

1. Click the "Today" filter to narrow the event list
   **Expected:** A subset of events is shown

2. Click the "All Time" filter
   **Expected:** All events in the scenario are displayed, matching the total event count

### Test Data

- Any scenario with events across multiple days

### Edge Cases

- Switching rapidly between filters should always return the correct counts

---

## TC-004: Time filters work correctly across all demo scenarios

**Priority:** P1
**Type:** Integration

### Objective

Verify that scenario-relative time filtering works in each scenario (Midweek, Live Game, Playoffs, Super Bowl) since each has different date ranges.

### Preconditions

- App is loaded and ScenarioToggle is accessible

### Steps

1. Switch to the Midweek scenario; open Timeline; click "Today"
   **Expected:** Events filtered relative to Midweek's latest timestamp

2. Switch to the Live Game scenario; open Timeline; click "Today"
   **Expected:** Events filtered relative to Live Game's latest timestamp

3. Switch to the Playoffs scenario; open Timeline; click "Today"
   **Expected:** Events filtered relative to Playoffs' latest timestamp

4. Switch to the Super Bowl scenario; open Timeline; click "Today"
   **Expected:** Events filtered relative to Super Bowl's latest timestamp

5. For each scenario, also verify "This Week" filter
   **Expected:** Each scenario uses its own latest event timestamp as the reference

### Test Data

- All four core demo scenarios

### Edge Cases

- A scenario where all events fall within a single day — "This Week" and "Today" should return identical results
- Scenario with zero events — filters should show empty state gracefully

---

## TC-005: Scenario-relative "Today" with no events yields empty state

**Priority:** P2
**Type:** Functional

### Objective

When the "Today" filter is applied and no events match the latest event's calendar day, verify the empty state message appears.

### Preconditions

- A scenario where the latest event is the only event on its day, and all other events are on prior days — or a mocked/edge scenario

### Steps

1. Open Timeline with a scenario where only one event falls on the latest day
   **Expected:** Events are shown

2. Add a type filter that excludes that one event, while "Today" is also active
   **Expected:** "No events match your filters" empty state is displayed

### Test Data

- Combination of time filter + type filter that produces zero results

### Edge Cases

- Verify the empty state text is correct and not a blank page

---

## TC-006: Live simulation indicator is visible in Live Game scenario for non-dev users

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a non-dev user loads the Live Game scenario, a simplified simulation indicator is visible (not the full TimelineDebugger).

### Preconditions

- Dev mode is OFF (non-developer user)
- App loaded with Live Game scenario

### Steps

1. Load the app in Live Game scenario with dev mode disabled
   **Expected:** A simplified indicator (e.g., "Simulation playing" badge) is visible on the page

2. Verify the indicator contains a play/pause toggle button
   **Expected:** A button with play or pause iconography is present and clickable

3. Click the play/pause toggle
   **Expected:** The simulation playback state toggles (e.g., from playing to paused), and the button icon updates accordingly

### Test Data

- Non-dev user context (isDevMode() returns false)

### Edge Cases

- If simulation is already paused on load, the indicator should show a "play" affordance

---

## TC-007: Live simulation indicator is visible in Super Bowl scenario for non-dev users

**Priority:** P1
**Type:** Functional

### Objective

The simplified indicator should also appear in the Super Bowl scenario, which is flagged as a live scenario.

### Preconditions

- Dev mode is OFF
- App loaded with Super Bowl scenario

### Steps

1. Switch to Super Bowl scenario
   **Expected:** The simplified simulation indicator is visible

2. Verify play/pause toggle works
   **Expected:** Toggle changes simulation state and updates icon

### Test Data

- Super Bowl scenario with isDevMode() returning false

### Edge Cases

- None beyond the standard toggle behavior

---

## TC-008: Full TimelineDebugger remains dev-only

**Priority:** P0
**Type:** Regression

### Objective

Ensure the full TimelineDebugger (with scrubbing, rewind, tick badge, history list) is only shown when `isDevMode()` returns true. The simplified indicator must not expose these controls.

### Preconditions

- App loaded with Live Game or Super Bowl scenario

### Steps

1. With dev mode OFF, inspect the page for TimelineDebugger elements (scrubbing track, history list, "Timeline Debugger" label, tick badge)
   **Expected:** None of these full-debugger elements are rendered

2. Enable dev mode and reload
   **Expected:** The full TimelineDebugger panel (with scrubbing track, history list, and tick badge) is now visible

### Test Data

- Toggle isDevMode() between true and false

### Edge Cases

- Ensure the simplified indicator and the full debugger do not render simultaneously in dev mode — or if they do, that it's intentional

---

## TC-009: Simulation indicator does not appear in non-live scenarios

**Priority:** P1
**Type:** Functional

### Objective

The simplified simulation indicator should not render in Midweek or Playoffs scenarios, which are not live simulations.

### Preconditions

- Dev mode is OFF

### Steps

1. Load the Midweek scenario
   **Expected:** No simulation indicator is visible

2. Switch to the Playoffs scenario
   **Expected:** No simulation indicator is visible

3. Switch to Live Game scenario
   **Expected:** The simulation indicator appears

### Test Data

- Midweek, Playoffs (non-live), Live Game (live)

### Edge Cases

- Switching from Live Game to Midweek — indicator should disappear immediately

---

## TC-010: ScenarioToggle shows loading indicator during scenario switch

**Priority:** P1
**Type:** UI/Visual

### Objective

When a user clicks a scenario tab, the active tab should show a subtle loading indicator (e.g., pulse animation) while scenario data is being loaded.

### Preconditions

- App is loaded with any scenario
- ScenarioToggle is visible in the header

### Steps

1. Click a different scenario tab (e.g., switch from Midweek to Playoffs)
   **Expected:** The newly active tab shows a visible loading indicator (pulse animation or spinner) while `scenarioLoading` is true

2. Wait for scenario data to finish loading
   **Expected:** The loading indicator disappears, and the tab shows its normal active state

### Test Data

- Any scenario switch (e.g., Midweek → Live Game)

### Edge Cases

- Network throttling or slow import — loading state should persist until data resolves

---

## TC-011: ScenarioToggle loading state clears after data loads

**Priority:** P1
**Type:** Functional

### Objective

Confirm the loading indicator is removed once `scenarioLoading` becomes false in ScenarioContext.

### Preconditions

- App is mid-scenario-switch

### Steps

1. Trigger a scenario switch
   **Expected:** Loading indicator appears on the active tab

2. Observe the tab after data loads (scenarioLoading transitions from true to false)
   **Expected:** The loading class/animation is removed; tab displays normally

### Test Data

- Any scenario switch

### Edge Cases

- If scenario load fails (e.g., missing JSON), loading should still clear (not spin forever)

---

## TC-012: Rapid scenario switching does not cause visual glitches

**Priority:** P1
**Type:** Functional

### Objective

Quickly switching between multiple scenarios should not cause stale loading indicators, flickering, or mismatched active states.

### Preconditions

- App is loaded with any scenario

### Steps

1. Click Midweek tab, then immediately click Live Game tab, then immediately click Playoffs tab
   **Expected:** Only the Playoffs tab (final selection) shows as active after all transitions complete

2. Verify no lingering loading indicators on previously clicked tabs
   **Expected:** Only the final active tab might briefly show loading; no other tabs show loading artifacts

3. Verify the displayed data matches the Playoffs scenario
   **Expected:** Player list and timeline correspond to Playoffs data

### Test Data

- Three rapid scenario switches in quick succession

### Edge Cases

- Race condition: if Midweek data resolves after Playoffs data, it should not overwrite the current scenario (ScenarioContext already uses a cancellation flag)

---

## TC-013: LiveTicker fallback text does not reference specific teams

**Priority:** P1
**Type:** Functional

### Objective

The hardcoded string "MNF: Chiefs vs Bills - Live updates as they happen" must be replaced with a generic fallback that does not mention specific team names.

### Preconditions

- App loaded with Live Game scenario
- No events have been published yet (tick 0, empty unified timeline, no history actions)

### Steps

1. Load the Live Game scenario in a state where `displayEvent` is null/undefined (no unified timeline events, no history events)
   **Expected:** The LiveTicker renders a fallback string

2. Read the fallback text
   **Expected:** Text is generic (e.g., "Live game updates as they happen") and does NOT contain "Chiefs", "Bills", "MNF", or any specific team/matchup name

### Test Data

- Live scenario with empty unified timeline and no history events (or mock useSimulation to return empty data)

### Edge Cases

- Verify the fallback also does not reference "49ers", "Eagles", or any other team name that might have been hardcoded

---

## TC-014: LiveTicker shows dynamic event text when events exist

**Priority:** P1
**Type:** Regression

### Objective

When timeline events are available, the LiveTicker should display the current event headline rather than the fallback text.

### Preconditions

- App loaded with Live Game scenario
- Unified timeline has at least one event

### Steps

1. Load the Live Game scenario with events in the unified timeline
   **Expected:** The ticker shows the current event's headline text (e.g., "Mahomes throws 40-yard TD")

2. Advance the simulation tick
   **Expected:** The ticker updates to show the next event's headline with an animation transition

### Test Data

- Live scenario with populated unified timeline

### Edge Cases

- When tick exceeds the unified timeline length, the ticker should fall back to recent event headlines or history actions — not the hardcoded string

---

## TC-015: `league_trade` displays as "Trade" in timeline event badges

**Priority:** P1
**Type:** Functional

### Objective

The `getEventTypeLabel` function must map the raw `league_trade` reason type to the human-readable label "Trade".

### Preconditions

- App loaded with a scenario containing league trade events
- Timeline page is open

### Steps

1. Navigate to Timeline and locate an event whose `reason.type` is `league_trade`
   **Expected:** The event badge displays "Trade" (not "league_trade")

2. Verify the badge text does not contain underscores
   **Expected:** No raw programmatic strings are visible to the user

### Test Data

- Scenario with at least one `league_trade` event (e.g., Midweek)

### Edge Cases

- An event with `reason.type = "league_trade"` and no `reason.eventType` — should still show "Trade"

---

## TC-016: `game_event` displays as specific event type or "Game Update"

**Priority:** P1
**Type:** Functional

### Objective

Events with `reason.type = "game_event"` should show the specific `eventType` (e.g., "TD", "INT") if present, or fall back to "Game Update" if `eventType` is absent.

### Preconditions

- Timeline page open with game events

### Steps

1. Locate an event with `reason.type = "game_event"` and `reason.eventType = "TD"`
   **Expected:** Badge displays "TD"

2. Locate an event with `reason.type = "game_event"` and `reason.eventType = "INT"`
   **Expected:** Badge displays "INT"

3. Locate an event with `reason.type = "game_event"` and no `eventType`
   **Expected:** Badge displays "Game Update" (not "game_event")

### Test Data

- Live Game or Super Bowl scenario (contains game events with various eventTypes)

### Edge Cases

- `reason.eventType` is an empty string — should fall back to "Game Update"
- `reason.eventType` is an unexpected value (e.g., "fumble") — should display that value (or "Game Update" per mapping)

---

## TC-017: Event type labels match the type filter dropdown labels

**Priority:** P1
**Type:** Functional

### Objective

The display labels shown in event badges must be consistent with the labels used in the TYPE_FILTERS dropdown. If the filter says "Trades", the badge should say "Trade" (or vice versa, but they should be recognizably consistent).

### Preconditions

- Timeline page open

### Steps

1. Open the type filter dropdown and note the labels: "All Events", "News", "Trades", "Game Updates"
   **Expected:** These are the available filter options

2. Apply the "Trades" filter
   **Expected:** Only events with "Trade" badges are shown (not "league_trade")

3. Apply the "Game Updates" filter
   **Expected:** Only events with "Game Update", "TD", "INT", or other game event labels are shown (not "game_event")

4. Apply the "News" filter
   **Expected:** Only events with "News" badges are shown

### Test Data

- Scenario with a mix of news, trade, and game events

### Edge Cases

- An event type that does not match any filter — should appear under "All Events" only

---

## TC-018: Event with unknown `reason.type` displays graceful fallback

**Priority:** P2
**Type:** Functional

### Objective

If an event has a `reason.type` that is not in the mapping (e.g., null, undefined, or an unmapped string), it should display a fallback label like "Event" rather than `undefined` or a raw string.

### Preconditions

- Timeline page open with an event that has an unmapped reason type

### Steps

1. Locate or inject an event with `reason.type = "unknown_type"` and no `eventType`
   **Expected:** Badge displays "Event" or a similar generic fallback

2. Verify no `undefined`, `null`, or empty badge text appears
   **Expected:** A readable label is always shown

### Test Data

- Event with `reason: { type: "unknown_type" }` or `reason: null`

### Edge Cases

- `reason` is entirely null or undefined — label should still render as "Event"

---

## TC-019: Future-dated events are hidden in PlayerDetail price timeline

**Priority:** P1
**Type:** Functional

### Objective

In the PlayerDetail page, price history entries with timestamps after the scenario's "current date" should be filtered out (or visually distinguished) to maintain demo immersion.

### Preconditions

- App loaded with Midweek scenario (narrative date: Wed Dec 4)
- Navigate to a player whose `priceHistory` includes entries dated after Dec 4

### Steps

1. Open PlayerDetail for a player with future-dated price entries (e.g., entries dated Dec 6)
   **Expected:** The Price History chart does NOT plot data points beyond the scenario date (Dec 4)

2. Scroll to the "Price Changes" list below the chart
   **Expected:** Entries dated after Dec 4 are either hidden or visually marked as "upcoming"

### Test Data

- Midweek scenario, a player with priceHistory entries spanning Nov → Dec 6

### Edge Cases

- Entry timestamped exactly at midnight of Dec 5 (one second after scenario day ends) — should be excluded
- Entry on Dec 4 at 23:59 — should be included

---

## TC-020: Future-dated events derive scenario date from latest non-future event

**Priority:** P1
**Type:** Functional

### Objective

The "scenario current date" used for filtering should be derived from the latest non-future event timestamp (consistent with mcq-dvn.1's approach), not from a hardcoded date.

### Preconditions

- Midweek scenario loaded

### Steps

1. Open PlayerDetail and verify the chart x-axis ends at or near the scenario's derived "now" date
   **Expected:** The chart's rightmost data point aligns with the scenario date, not with future dates

2. Switch to Playoffs scenario and open the same or similar player
   **Expected:** The chart's rightmost point corresponds to the Playoffs scenario date

### Test Data

- Multiple scenarios with different date ranges

### Edge Cases

- A player with only one price history entry — chart should show that single point regardless

---

## TC-021: Future-dated events marked as "upcoming" (alternative AC)

**Priority:** P2
**Type:** UI/Visual

### Objective

If the implementation chooses to visually mark future events rather than hide them (AC option 2), verify the visual treatment is clear.

### Preconditions

- App loaded with Midweek scenario; PlayerDetail open for a player with future-dated entries
- Implementation uses the "visually marked" approach

### Steps

1. Scroll to the Price Changes list in PlayerDetail
   **Expected:** Entries after the scenario date are visually distinct (e.g., dimmed, labeled "Upcoming", different badge color)

2. Verify the chart distinguishes future data points
   **Expected:** Future data points use a dashed line, different color, or are otherwise visually separated from past data

### Test Data

- Player with mix of past and future-dated price entries

### Edge Cases

- All entries are in the future — entire timeline should be marked or an informational message displayed

---

## TC-022: Scenario-relative filtering does not break when event list is empty

**Priority:** P2
**Type:** Functional

### Objective

If a scenario has no events (empty `allEvents`), the scenario-relative date logic should gracefully handle the absence without errors. The fallback (`Date.now()`) should apply.

### Preconditions

- Timeline page loaded with a scenario that has no events (or mocked empty state)

### Steps

1. Open the Timeline page with an empty event list
   **Expected:** "No events match your filters" empty state is shown without console errors

2. Click "Today" filter
   **Expected:** Still shows empty state; no JavaScript errors about accessing properties of undefined

3. Click "This Week" filter
   **Expected:** Still shows empty state; no errors

### Test Data

- Empty or near-empty scenario data

### Edge Cases

- `allEvents[0]?.timestamp` is undefined — code should fall back to `Date.now()` per design notes
