# Test Plan: mcq-dvn.5 -- Map raw event type strings to display labels in Timeline

## Summary

- **Bead:** `mcq-dvn.5`
- **Feature:** The `getEventTypeLabel` function maps raw `reason.type` strings (e.g., `league_trade`, `game_event`, `news`) to human-readable display labels shown in Timeline event badges.
- **Total Test Cases:** 9
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: league_trade maps to "Trade"

**Priority:** P0
**Type:** Functional

### Objective

Verify that a timeline event with `reason.type === 'league_trade'` displays the label "Trade" instead of the raw string "league_trade".

### Preconditions

- At least one player has a price history entry with `reason.type` of `league_trade`.
- The Timeline page is accessible and populated with events.

### Steps

1. Navigate to the Timeline page.
   **Expected:** The page loads and displays timeline events.

2. Locate a timeline event card that originates from a league trade (trade arrow icon on the marker).
   **Expected:** The event's type badge text reads **"Trade"**, not "league_trade".

### Test Data

- A `PriceHistoryEntry` with `reason: { type: 'league_trade', headline: 'Player X traded to Team Y' }`.

### Edge Cases

- A `league_trade` event where `reason.eventType` is `undefined` — should still show "Trade".

---

## TC-002: game_event without eventType maps to "Game Update"

**Priority:** P0
**Type:** Functional

### Objective

Verify that a timeline event with `reason.type === 'game_event'` and no `eventType` sub-field displays the label "Game Update".

### Preconditions

- At least one player has a price history entry with `reason.type` of `game_event` and `reason.eventType` is `undefined` or absent.

### Steps

1. Navigate to the Timeline page.
   **Expected:** The page loads and displays timeline events.

2. Locate a timeline event card originating from a game event that has no specific `eventType` (e.g., stats, TD, INT).
   **Expected:** The event's type badge text reads **"Game Update"**.

### Test Data

- A `PriceHistoryEntry` with `reason: { type: 'game_event', headline: 'Stat line updated' }` (no `eventType` field).

### Edge Cases

- `reason.eventType` is an empty string `""` — since empty string is falsy, should fall back to "Game Update".

---

## TC-003: game_event with eventType displays the eventType value

**Priority:** P0
**Type:** Functional

### Objective

Verify that a timeline event with `reason.type === 'game_event'` and a specific `eventType` (e.g., "TD", "INT", "stats") displays that `eventType` value as the badge label.

### Preconditions

- At least one player has price history entries with `reason.type === 'game_event'` and various `eventType` values.

### Steps

1. Navigate to the Timeline page.
   **Expected:** The page loads and displays timeline events.

2. Locate a timeline event card with `reason.eventType === 'TD'`.
   **Expected:** The event's type badge text reads **"TD"**.

3. Locate a timeline event card with `reason.eventType === 'INT'`.
   **Expected:** The event's type badge text reads **"INT"**.

4. Locate a timeline event card with `reason.eventType === 'stats'`.
   **Expected:** The event's type badge text reads **"stats"**.

### Test Data

- `PriceHistoryEntry` with `reason: { type: 'game_event', eventType: 'TD', headline: 'Touchdown pass' }`.
- `PriceHistoryEntry` with `reason: { type: 'game_event', eventType: 'INT', headline: 'Interception thrown' }`.
- `PriceHistoryEntry` with `reason: { type: 'game_event', eventType: 'stats', headline: 'Updated stats' }`.

### Edge Cases

- None beyond TC-002's empty-string case.

---

## TC-004: news maps to "News"

**Priority:** P0
**Type:** Functional

### Objective

Verify that a timeline event with `reason.type === 'news'` displays the label "News" instead of the raw string.

### Preconditions

- At least one player has a price history entry with `reason.type` of `news`.

### Steps

1. Navigate to the Timeline page.
   **Expected:** The page loads and displays timeline events.

2. Locate a timeline event card originating from a news item (document icon on the marker).
   **Expected:** The event's type badge text reads **"News"**, not "news".

### Test Data

- A `PriceHistoryEntry` with `reason: { type: 'news', headline: 'Report: Player X signs extension' }`.

### Edge Cases

- A `news` event where `reason.eventType` is unexpectedly set — the function should still return "News" because `reason.type === 'news'` is checked explicitly before falling through.

---

## TC-005: Null or undefined reason falls back to "Event"

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `reason` is `null` or `undefined`, the badge label defaults to "Event".

### Preconditions

- A price history entry exists where the `reason` field is missing or null.

### Steps

1. Navigate to the Timeline page with an event whose `reason` is `null`.
   **Expected:** The event's type badge text reads **"Event"**.

2. Navigate to the Timeline page with an event whose `reason` is `undefined`.
   **Expected:** The event's type badge text reads **"Event"**.

### Test Data

- A `PriceHistoryEntry` with `reason: null`.
- A `PriceHistoryEntry` with `reason` field omitted entirely.

### Edge Cases

- `reason` is an empty object `{}` — `reason.type` will be `undefined`, no branch matches, so the function should return "Event" via the final fallback.

---

## TC-006: Unrecognized reason.type falls back to "Event"

**Priority:** P1
**Type:** Functional

### Objective

Verify that if `reason.type` is a value not covered by the mapping (e.g., a future type or unexpected string), the function returns the fallback label "Event".

### Preconditions

- A price history entry exists with a `reason.type` value not in `{'game_event', 'news', 'league_trade'}`.

### Steps

1. Create or inject an event with `reason: { type: 'unknown_type', headline: 'Something happened' }`.
   **Expected:** The event's type badge text reads **"Event"** (the fallback).

### Test Data

- `reason: { type: 'trade_rumor', headline: 'Rumor mill' }` (hypothetical unmapped type).

### Edge Cases

- `reason.type` is an empty string `""` — none of the `if/else if` branches match, should return "Event".

---

## TC-007: Badge displays no underscores or raw internal strings

**Priority:** P0
**Type:** Regression

### Objective

Verify the original bug (L-7 audit) is resolved: no timeline event badge should display raw strings containing underscores like "league_trade" or "game_event".

### Preconditions

- The Timeline page is loaded with a mix of events across all three reason types (`news`, `game_event`, `league_trade`).

### Steps

1. Navigate to the Timeline page.
   **Expected:** The page loads with multiple timeline events.

2. Visually inspect every visible event badge label.
   **Expected:** No badge contains an underscore character. Labels should be one of: "Trade", "Game Update", "News", "TD", "INT", "stats", "injury", or "Event".

3. Scroll through the full list of events to inspect remaining badges.
   **Expected:** All badges use human-readable labels, not raw type strings.

### Test Data

- A scenario with at least one event of each `reason.type` (`news`, `game_event`, `league_trade`).

### Edge Cases

- Verify after applying type filters (e.g., "Trades" filter) that filtered results also show clean labels.

---

## TC-008: Badge styling and layout with mapped labels

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the type badge renders correctly with the mapped label text — proper color, background tint, and no text overflow or truncation.

### Preconditions

- The Timeline page is loaded with events of all three types.

### Steps

1. Navigate to the Timeline page and locate a "Trade" badge.
   **Expected:** The badge has a purple-tinted background (`#9C27B025`) with purple text (`#9C27B0`). The text "Trade" fits within the badge without truncation.

2. Locate a "News" badge.
   **Expected:** The badge has a blue-tinted background (`#2196F325`) with blue text (`#2196F3`). The text "News" fits within the badge without truncation.

3. Locate a "Game Update" badge.
   **Expected:** The badge has a green-tinted background (`#00C85325`) with green text (`#00C853`). The text "Game Update" fits within the badge without truncation.

4. Locate a "TD" badge.
   **Expected:** The badge has a green-tinted background with the text "TD". No overflow.

5. Resize the browser to a narrow viewport (e.g., 375px width).
   **Expected:** All badges remain readable and properly styled. No text is clipped.

### Test Data

- Standard scenario data with events of each type.

### Edge Cases

- Very long `eventType` strings (if any): verify the badge does not break layout.

---

## TC-009: Mapped labels work correctly with type filters

**Priority:** P1
**Type:** Integration

### Objective

Verify that the label mapping is consistent with the filter system — filtering by a type shows events with the correct mapped labels, not mismatched ones.

### Preconditions

- The Timeline page is loaded with events of all three types.

### Steps

1. Navigate to the Timeline page and click the **"Trades"** filter button.
   **Expected:** Only events with the badge label "Trade" are displayed. No "News" or "Game Update" badges appear.

2. Click the **"News"** filter button.
   **Expected:** Only events with the badge label "News" are displayed.

3. Click the **"Game Updates"** filter button.
   **Expected:** Only events with badge labels "Game Update", "TD", "INT", "stats", or "injury" are displayed (all `game_event` sub-types).

4. Click the **"All Events"** filter button.
   **Expected:** All events are displayed with their correct mapped labels.

### Test Data

- Standard scenario data with a mix of events across all types.

### Edge Cases

- Applying a filter when no events of that type exist should show the empty state "No events match your filters", not a broken badge.
