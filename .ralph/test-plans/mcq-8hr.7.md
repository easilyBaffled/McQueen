# Test Plan: mcq-8hr.7 -- Add Vitest tests for remaining 0% components (PlayoffModal, MiniLeaderboard, LiveTicker)

## Summary

- **Bead:** `mcq-8hr.7`
- **Feature:** Vitest unit tests for PlayoffAnnouncementModal (show/dismiss/persistence), MiniLeaderboard (medals, user position, gap, empty state), and LiveTicker (conditional render, events, fallback)
- **Total Test Cases:** 30
- **Test Types:** Functional, Integration

---

## Component 1: PlayoffAnnouncementModal

---

## TC-001: Modal hidden when scenario is not playoffs

**Priority:** P0
**Type:** Functional

### Objective

Verify the modal renders nothing when the active scenario is anything other than `playoffs`. This is the primary gating condition.

### Preconditions

- ScenarioContext provides `scenario: 'midweek'` (or `'live'`)
- SimulationContext provides `playoffDilutionApplied: false`

### Steps

1. Render `PlayoffAnnouncementModal` with scenario set to `'midweek'`
   **Expected:** No element with `role="dialog"` exists in the DOM. Container has no visible children.

2. Render `PlayoffAnnouncementModal` with scenario set to `'live'`
   **Expected:** Same — no dialog rendered.

### Test Data

- Scenarios: `'midweek'`, `'live'`

### Edge Cases

- Scenario value is an empty string or `undefined` — modal should not appear

---

## TC-002: Modal hidden when dilution already applied

**Priority:** P0
**Type:** Functional

### Objective

Verify the modal does not re-appear if the user has already acknowledged the playoff dilution (persistence check).

### Preconditions

- ScenarioContext provides `scenario: 'playoffs'`
- SimulationContext provides `playoffDilutionApplied: true`

### Steps

1. Render `PlayoffAnnouncementModal` with `playoffDilutionApplied: true`
   **Expected:** No element with `role="dialog"` exists. Modal is completely absent.

### Test Data

- `playoffDilutionApplied: true`

### Edge Cases

- None

---

## TC-003: Modal appears on playoffs scenario when dilution not yet applied

**Priority:** P0
**Type:** Functional

### Objective

Verify the modal renders and shows the first step (Season-End Buyback) when the scenario is `playoffs` and dilution has not been applied.

### Preconditions

- ScenarioContext provides `scenario: 'playoffs'`, with player data containing both buyback and non-buyback players
- SimulationContext provides `playoffDilutionApplied: false`

### Steps

1. Render `PlayoffAnnouncementModal`
   **Expected:** An element with `role="dialog"` and `aria-modal="true"` is present.

2. Check heading content
   **Expected:** "Season-End Buyback" heading is visible. Modal subtitle "Eliminated Players Being Bought Back" is visible.

### Test Data

- At least 1 buyback player and 2 non-buyback players in `currentData.players`

### Edge Cases

- None

---

## TC-004: Buyback step shows player details and financials

**Priority:** P1
**Type:** Functional

### Objective

Verify the buyback step (step 0) lists each buyback player with correct name, buyback price, share count, and proceeds.

### Preconditions

- Modal is rendered in playoffs scenario on step 0
- Mock data includes a buyback player with id `'diggs-s'` that has a matching entry in `MOCK_BUYBACK_HOLDINGS`

### Steps

1. Render the modal in playoffs scenario
   **Expected:** Buyback player name (e.g., "Diggs") appears in the list.

2. Check buyback price column
   **Expected:** Price matches the last entry in the player's `priceHistory` (e.g., "$70.00").

3. Check shares column
   **Expected:** Shows the mock holding shares count (e.g., 5 for `diggs-s`).

4. Check proceeds column
   **Expected:** Shows computed proceeds = buybackPrice × shares (e.g., "+$350.00").

### Test Data

- Player: `{ id: 'diggs-s', name: 'Diggs', isBuyback: true, priceHistory: [{ price: 70 }] }`
- Holdings: `{ shares: 5, avgCost: 85 }`

### Edge Cases

- Buyback player with no matching entry in `MOCK_BUYBACK_HOLDINGS` — shares should show "—", proceeds should show "—"

---

## TC-005: Buyback summary totals displayed when proceeds exist

**Priority:** P1
**Type:** Functional

### Objective

Verify that the buyback summary section showing total proceeds and total loss is rendered when `totalBuybackProceeds > 0`.

### Preconditions

- Modal rendered on step 0 with at least one buyback player that has holdings

### Steps

1. Render the modal with buyback player data that yields positive proceeds
   **Expected:** "Total Buyback Proceeds" label is visible with a formatted positive dollar amount.

2. Check loss row
   **Expected:** "Total Loss from Original Cost" label is visible with a formatted negative dollar amount.

### Test Data

- Player with `buybackPrice: 70`, holdings `{ shares: 5, avgCost: 85 }` → proceeds = $350, loss = $75

### Edge Cases

- All buyback players have zero proceeds (no holdings match) — summary section should not render

---

## TC-006: Continue button advances from buyback step to dilution step

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking "Continue" transitions the modal from step 0 (buyback) to step 1 (dilution).

### Preconditions

- Modal is on step 0

### Steps

1. Click the "Continue" button
   **Expected:** "Playoff Stock Issuance" heading appears. "Season-End Buyback" heading is no longer visible.

2. Check dilution description
   **Expected:** Text containing "15% additional shares" is displayed.

### Test Data

- Default playoff player data

### Edge Cases

- None

---

## TC-007: Dilution step shows playoff player price impact

**Priority:** P1
**Type:** Functional

### Objective

Verify the dilution step lists non-buyback (playoff) players with current price, diluted price, and percentage change.

### Preconditions

- Modal has been advanced to step 1

### Steps

1. Advance to step 1 by clicking "Continue"
   **Expected:** Each non-buyback player name appears (e.g., "Mahomes", "Allen").

2. Check price columns for a player
   **Expected:** Current price and diluted price (85% of current) are shown. Change column shows "-15.0%".

### Test Data

- Player: `{ id: 'mahomes', basePrice: 100, priceHistory: [{ price: 110 }] }` → current = $110, diluted = $93.50

### Edge Cases

- Player with no `priceHistory` — should fall back to `basePrice` for calculations

---

## TC-008: "Got It" button applies dilution and closes modal

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking "Got It" on step 1 calls `applyPlayoffDilution(15)` and hides the modal.

### Preconditions

- Modal is on step 1

### Steps

1. Click "Continue" to advance to step 1
2. Click "Got It"
   **Expected:** `applyPlayoffDilution` has been called with argument `15`. The dialog element is removed from the DOM.

### Test Data

- Mock `applyPlayoffDilution` function

### Edge Cases

- None

---

## TC-009: Close button applies dilution and dismisses modal

**Priority:** P0
**Type:** Functional

### Objective

Verify clicking the close (×) button at any step applies dilution and removes the modal.

### Preconditions

- Modal is visible on step 0

### Steps

1. Click the button with `aria-label="Close announcement"`
   **Expected:** `applyPlayoffDilution` has been called with `15`. Dialog is removed from the DOM.

### Test Data

- Mock `applyPlayoffDilution` function

### Edge Cases

- Close button clicked on step 1 — should also apply dilution and close

---

## TC-010: Escape key applies dilution and dismisses modal

**Priority:** P1
**Type:** Functional

### Objective

Verify pressing the Escape key triggers the close handler, applying dilution and hiding the modal.

### Preconditions

- Modal is visible

### Steps

1. Dispatch a `keydown` event with `key: 'Escape'` on the document
   **Expected:** `applyPlayoffDilution` called with `15`. Dialog is removed from the DOM.

### Test Data

- Mock `applyPlayoffDilution` function

### Edge Cases

- Pressing Escape when modal is not visible should have no effect (event listener is removed on cleanup)

---

## TC-011: Step indicators reflect current step

**Priority:** P2
**Type:** Functional

### Objective

Verify the step dots visually indicate which step is active and which is completed.

### Preconditions

- Modal is visible

### Steps

1. On step 0, inspect step indicator elements
   **Expected:** First dot has `active` class. Second dot does not have `active` or `completed` class.

2. Click "Continue" to advance to step 1
   **Expected:** First dot has `completed` class (no longer `active`). Second dot has `active` class.

### Test Data

- Default scenario data

### Edge Cases

- None

---

## TC-012: Accessibility — dialog role and aria attributes

**Priority:** P1
**Type:** Functional

### Objective

Verify the modal uses correct ARIA attributes for screen reader accessibility.

### Preconditions

- Modal is visible

### Steps

1. Query the dialog element
   **Expected:** Element has `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="playoff-modal-title"`.

2. Check that the referenced label element exists
   **Expected:** An element with `id="playoff-modal-title"` is present and contains the step title text.

### Test Data

- Default scenario data

### Edge Cases

- None

---

## TC-013: Dilution note shows total playoff player count

**Priority:** P2
**Type:** Functional

### Objective

Verify the informational note on step 1 shows the correct count of playoff-bound players.

### Preconditions

- Modal is on step 1

### Steps

1. Advance to step 1 and inspect the dilution note
   **Expected:** Text contains "This affects all {N} playoff-bound players" where N matches the count of non-buyback players in the data.

### Test Data

- 2 non-buyback players → note should say "all 2 playoff-bound players"

### Edge Cases

- Zero non-buyback players — note should say "all 0 playoff-bound players" (or dilution list is empty)

---

## Component 2: MiniLeaderboard

---

## TC-014: Renders standings header with trophy icon

**Priority:** P1
**Type:** Functional

### Objective

Verify the component renders the header section with "STANDINGS" text and trophy emoji.

### Preconditions

- SocialContext provides `getLeaderboardRankings` returning at least one entry

### Steps

1. Render `MiniLeaderboard`
   **Expected:** Text "STANDINGS" is visible in the header.

### Test Data

- Standard mock leaderboard rankings

### Edge Cases

- None

---

## TC-015: "View All" link navigates to leaderboard page

**Priority:** P1
**Type:** Functional

### Objective

Verify the "View All" link exists and points to `/leaderboard`.

### Preconditions

- Component wrapped in `MemoryRouter`

### Steps

1. Render `MiniLeaderboard`
   **Expected:** A link element with text "View All" is present. Its `href` attribute is `/leaderboard`.

### Test Data

- Standard mock rankings

### Edge Cases

- None

---

## TC-016: Top 3 traders displayed with correct medal emojis

**Priority:** P0
**Type:** Functional

### Objective

Verify the first three ranked traders are shown with gold, silver, and bronze medal indicators respectively.

### Preconditions

- Rankings data has at least 3 entries

### Steps

1. Render `MiniLeaderboard`
   **Expected:** All three trader names from positions 1–3 are visible in the DOM.

2. Verify rank 1 indicator contains gold medal emoji
   **Expected:** The rank indicator for the first row contains the text content of the gold medal emoji.

3. Verify rank 2 indicator contains silver medal emoji
   **Expected:** Silver medal emoji present.

4. Verify rank 3 indicator contains bronze medal emoji
   **Expected:** Bronze medal emoji present.

### Test Data

- Rankings: `[{ rank: 1, name: 'GridironGuru' }, { rank: 2, name: 'TDKing2024' }, { rank: 3, name: 'FantasyMVP' }, ...]`

### Edge Cases

- Only 1 or 2 traders in rankings — should show only those, no errors thrown

---

## TC-017: User position shown below divider when not in top 3

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the current user is ranked outside the top 3, their position is shown in a separate section below a divider.

### Preconditions

- User is ranked 5th (not in top 3)

### Steps

1. Render `MiniLeaderboard` with user at rank 5
   **Expected:** Text "You" is visible. Rank indicator shows "#5". A divider element with "•••" is present between top 3 and user section.

### Test Data

- User entry: `{ isUser: true, rank: 5, name: 'You' }`

### Edge Cases

- User is at rank 4 (just outside top 3) — should still show in separate section

---

## TC-018: Gap calculation — shows distance to next rank

**Priority:** P0
**Type:** Functional

### Objective

Verify the gap indicator shows the formatted dollar amount the user trails the next-ranked trader by.

### Preconditions

- User is not in top 3
- User entry has `gapToNext > 0` and a valid `traderAhead`

### Steps

1. Render with user having `gapToNext: 1500` and `traderAhead: { name: 'StockJock' }`
   **Expected:** Text "$1,500" is displayed in the gap indicator.

2. Check the trailing text
   **Expected:** Text contains "behind #4 StockJock" (rank - 1 of user's rank).

### Test Data

- User at rank 5, `gapToNext: 1500`, `traderAhead: { name: 'StockJock', memberId: 'stockjock' }`

### Edge Cases

- `gapToNext` is 0 — gap indicator section should not render
- `traderAhead` is null/undefined — gap indicator section should not render

---

## TC-019: User in top 3 at rank 1 — leader message

**Priority:** P1
**Type:** Functional

### Objective

Verify the motivational message "You're in the lead!" appears when the user is ranked #1.

### Preconditions

- User entry has `rank: 1` and `isUser: true`

### Steps

1. Render with user in first place
   **Expected:** Text matching "You're in the lead" is visible. No gap indicator or separate user section is shown.

### Test Data

- Modify mock rankings so index 0 has `isUser: true, rank: 1`

### Edge Cases

- None

---

## TC-020: User in top 3 at rank 2 or 3 — close-to-leader message

**Priority:** P1
**Type:** Functional

### Objective

Verify that when the user is ranked 2nd or 3rd, a "close to leader" message appears showing the gap to the rank above.

### Preconditions

- User entry has `rank: 2` and `gapToNext: 700`

### Steps

1. Render with user in second place, gap of $700
   **Expected:** An element with `status-close` class is present. Its content includes "$700" and references rank #1.

### Test Data

- User: `{ isUser: true, rank: 2, gapToNext: 700 }`

### Edge Cases

- User at rank 3 with `gapToNext: 0` — message should show "$0 to #2"

---

## TC-021: Value formatting with dollar sign and commas

**Priority:** P1
**Type:** Functional

### Objective

Verify portfolio values are formatted as dollars with comma-separated thousands and no decimal places.

### Preconditions

- Rankings include a trader with `totalValue: 14500`

### Steps

1. Render `MiniLeaderboard`
   **Expected:** Text "$14,500" appears in the DOM (no decimals).

### Test Data

- Trader with `totalValue: 14500`

### Edge Cases

- `totalValue: 0` — should render "$0"
- `totalValue: 999999` — should render "$999,999"

---

## TC-022: Empty state — no rankings data

**Priority:** P0
**Type:** Functional

### Objective

Verify the component handles an empty rankings array gracefully without errors.

### Preconditions

- `getLeaderboardRankings` returns `[]`

### Steps

1. Render `MiniLeaderboard` with empty rankings
   **Expected:** "STANDINGS" header still renders. The list section is empty — no trader rows, no user section, no gap indicator. No runtime errors.

### Test Data

- `getLeaderboardRankings: () => []`

### Edge Cases

- None

---

## TC-023: User avatar shows generic icon, others show custom avatar

**Priority:** P2
**Type:** Functional

### Objective

Verify that user entries display the generic avatar emoji while non-user entries display their custom avatar.

### Preconditions

- Rankings include user and non-user entries with distinct avatars

### Steps

1. Render `MiniLeaderboard`
   **Expected:** Non-user traders show their assigned `avatar` value. The user row (both in top 3 and in separate section) shows the generic user emoji.

### Test Data

- Non-user: `{ avatar: '🦅', isUser: false }`
- User: `{ isUser: true }`

### Edge Cases

- None

---

## TC-024: Leader row has special styling class

**Priority:** P2
**Type:** Functional

### Objective

Verify the first-place row gets the `is-leader` CSS class for visual distinction.

### Preconditions

- At least one trader in rankings

### Steps

1. Render and inspect the first trader row element
   **Expected:** The first row's `className` includes the `is-leader` class.

2. Inspect the second trader row
   **Expected:** Does not include the `is-leader` class.

### Test Data

- Standard mock rankings

### Edge Cases

- None

---

## Component 3: LiveTicker

---

## TC-025: Returns null when scenario is not 'live'

**Priority:** P0
**Type:** Functional

### Objective

Verify the component renders absolutely nothing when the scenario is not `'live'`.

### Preconditions

- ScenarioContext provides `scenario: 'midweek'`

### Steps

1. Render `LiveTicker` with scenario `'midweek'`
   **Expected:** `container.firstChild` is `null`. No DOM output whatsoever.

2. Render `LiveTicker` with scenario `'playoffs'`
   **Expected:** Same — no output.

### Test Data

- Scenarios: `'midweek'`, `'playoffs'`

### Edge Cases

- Scenario is `undefined` or empty string — should not render

---

## TC-026: Renders LIVE label when scenario is 'live'

**Priority:** P0
**Type:** Functional

### Objective

Verify the ticker renders the "LIVE" badge with the pulsing dot when in live scenario.

### Preconditions

- ScenarioContext provides `scenario: 'live'`
- SimulationContext has default empty timeline

### Steps

1. Render `LiveTicker`
   **Expected:** Text "LIVE" is visible in the DOM. A ticker-dot element exists (for the pulsing animation indicator).

### Test Data

- Default simulation state (empty timeline, tick 0)

### Edge Cases

- None

---

## TC-027: Shows current event headline from unified timeline at current tick

**Priority:** P0
**Type:** Functional

### Objective

Verify the ticker displays the headline from the unified timeline entry at the current tick index.

### Preconditions

- `unifiedTimeline` has multiple entries with `reason.headline` values
- `tick` is set to a valid index within the timeline

### Steps

1. Render with `tick: 1` and timeline `[{ reason: { headline: 'Mahomes throws TD' } }, { reason: { headline: 'Allen interception' } }]`
   **Expected:** "Allen interception" is displayed (the entry at index 1).

### Test Data

- Timeline entries with distinct headlines
- `tick: 1`

### Edge Cases

- `tick` equals 0 — should show first event's headline
- Timeline entry at current tick has no `reason` or no `headline` — should fall through to next fallback

---

## TC-028: Fallback to recent events headline when current tick has no direct headline

**Priority:** P1
**Type:** Functional

### Objective

Verify that when the current tick entry does not produce a `currentEvent`, the ticker falls back to the most recent event's headline from the `recentEvents` list.

### Preconditions

- `tick` is beyond the timeline length (e.g., `tick >= unifiedTimeline.length`)
- Timeline has at least one entry with a headline

### Steps

1. Render with `tick: 5` and timeline of length 3
   **Expected:** `currentEvent` is null (tick out of bounds). The display falls through to `recentEvents[0]?.reason?.headline`, showing the last (most recent) event's headline.

### Test Data

- `tick: 5`, timeline: `[{ reason: { headline: 'Event A' } }, { reason: { headline: 'Event B' } }, { reason: { headline: 'Event C' } }]`
- Expected display: "Event C" (last event reversed to first in recentEvents)

### Edge Cases

- None

---

## TC-029: Fallback to history events when unified timeline is empty

**Priority:** P0
**Type:** Functional

### Objective

Verify the ticker falls back to the simulation history when the unified timeline is empty or absent.

### Preconditions

- `unifiedTimeline` is `[]`
- `history` has entries with `action` strings

### Steps

1. Render with empty unified timeline and history containing `[{ action: 'Scenario loaded' }, { action: 'Player price updated' }]`
   **Expected:** "Player price updated" is displayed. "Scenario loaded" is filtered out (excluded by the filter logic).

### Test Data

- `history: [{ action: 'Scenario loaded', tick: 0 }, { action: 'Player price updated', tick: 1 }]`

### Edge Cases

- All history entries have `action: 'Scenario loaded'` — should fall through to static fallback
- History is empty and timeline is empty — should show static fallback

---

## TC-030: Static fallback text when no events of any kind exist

**Priority:** P0
**Type:** Functional

### Objective

Verify the ticker shows the default static text when there are no unified timeline events and no qualifying history events.

### Preconditions

- `unifiedTimeline: []`, `history: []`, `tick: 0`

### Steps

1. Render `LiveTicker` with all-empty data
   **Expected:** Text matching "MNF: Chiefs vs Bills - Live updates as they happen" is visible. The event text does not have the `current` CSS class (it uses the base `ticker-event` style only).

### Test Data

- All empty arrays

### Edge Cases

- History only has `'Scenario loaded'` entries (filtered out) — same fallback should appear
