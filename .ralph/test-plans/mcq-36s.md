# Test Plan: mcq-36s -- Trading UX Improvements

## Summary

- **Bead:** `mcq-36s`
- **Feature:** Fix silent portfolio reset on scenario switch, add explanation to disabled Sell tab, and fix PlayerCard moveReason truncation
- **Total Test Cases:** 18
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Confirmation dialog appears when switching scenarios with non-empty portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify that a confirmation dialog is shown before resetting the portfolio when the user has holdings and switches scenarios. This prevents accidental data loss (H-2).

### Preconditions

- App is loaded on any page with ScenarioToggle visible
- User has bought at least one share (portfolio is non-empty)

### Steps

1. Buy 1 share of any player in the Midweek scenario
   **Expected:** Portfolio now contains at least one holding; cash is less than $10,000

2. Click the "Live Game" scenario tab (desktop) to switch scenarios
   **Expected:** A confirmation dialog appears warning that switching will reset portfolio and cash

### Test Data

- Starting scenario: Midweek
- Target scenario: Live Game
- Portfolio: 1+ shares of any player

### Edge Cases

- Switch to every other scenario (Playoffs, Super Bowl, ESPN Live) — dialog should appear for each
- User has multiple holdings across different players — dialog still appears

---

## TC-002: Confirmation dialog message content

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify the dialog displays the correct warning text about portfolio and cash reset.

### Preconditions

- User has a non-empty portfolio
- Scenario switch is initiated (dialog is visible)

### Steps

1. With a non-empty portfolio, click a different scenario tab
   **Expected:** Dialog message warns "Switching scenarios will reset your portfolio and cash to defaults" (or equivalent)

2. Inspect that the dialog has two action options: "Switch & Reset" and "Cancel"
   **Expected:** Both options are clearly labeled and actionable

### Test Data

- N/A

### Edge Cases

- Verify wording is not truncated or clipped on narrow viewports

---

## TC-003: Cancel on confirmation dialog preserves scenario and portfolio

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking "Cancel" on the confirmation dialog keeps the current scenario and portfolio completely intact.

### Preconditions

- User is on Midweek scenario with holdings (e.g., 5 shares of Mahomes)
- Confirmation dialog is displayed after clicking another scenario

### Steps

1. Buy 5 shares of Mahomes in Midweek scenario
   **Expected:** Portfolio shows 5 shares of Mahomes; cash reduced accordingly

2. Click the "Playoffs" scenario tab
   **Expected:** Confirmation dialog appears

3. Click "Cancel" on the dialog
   **Expected:** Dialog closes; scenario remains Midweek; portfolio still shows 5 shares of Mahomes; cash is unchanged

4. Navigate to Portfolio page
   **Expected:** Mahomes holding with 5 shares is present; cash matches pre-dialog value

### Test Data

- Player: Mahomes, Shares: 5, Scenario: Midweek → Playoffs

### Edge Cases

- Press Escape key if dialog supports it — should behave like Cancel
- Click outside the dialog (if modal) — should behave like Cancel

---

## TC-004: "Switch & Reset" proceeds with scenario change and portfolio reset

**Priority:** P0
**Type:** Functional

### Objective

Verify that confirming the dialog resets portfolio to the new scenario's starting portfolio and resets cash to INITIAL_CASH ($10,000).

### Preconditions

- User is on Midweek scenario with custom holdings
- Confirmation dialog is displayed

### Steps

1. Buy 5 shares of Allen in Midweek scenario
   **Expected:** Portfolio contains Allen holding; cash is reduced

2. Click the "Playoffs" scenario tab
   **Expected:** Confirmation dialog appears

3. Click "Switch & Reset"
   **Expected:** Dialog closes; scenario changes to Playoffs; portfolio is reset to the Playoffs starting portfolio (Allen holding removed if not in starting portfolio); cash is $10,000

4. Navigate to Portfolio page
   **Expected:** Portfolio matches the Playoffs scenario's `startingPortfolio`; cash is $10,000

### Test Data

- Player: Allen, Shares: 5, Switch from Midweek → Playoffs

### Edge Cases

- Verify userImpact state is also cleared after reset

---

## TC-005: No confirmation dialog when portfolio is empty

**Priority:** P0
**Type:** Functional

### Objective

Verify that scenario switching proceeds immediately without a dialog when the user has an empty portfolio (no custom trades beyond starting portfolio defaults).

### Preconditions

- App is freshly loaded or portfolio has been reset
- User has not bought or sold any shares beyond the starting portfolio

### Steps

1. Load the app fresh (clear localStorage) on Midweek scenario
   **Expected:** Starting portfolio is applied (may include default holdings)

2. Sell all holdings from the starting portfolio so portfolio is truly empty, OR clear localStorage to start with empty portfolio
   **Expected:** Portfolio is empty, cash is at INITIAL_CASH

3. Click the "Live Game" scenario tab
   **Expected:** Scenario switches immediately to Live Game without any confirmation dialog

### Test Data

- Empty portfolio (no keys in portfolio object)

### Edge Cases

- Portfolio object exists but all holdings have 0 shares — should this count as empty? Verify behavior
- Starting portfolio has default holdings — does the dialog trigger when user hasn't made any trades?

---

## TC-006: Confirmation dialog on mobile dropdown scenario switch

**Priority:** P1
**Type:** Functional

### Objective

Verify that the confirmation dialog also appears when switching scenarios via the mobile dropdown (not just the desktop tab bar).

### Preconditions

- Viewport is at mobile width (ScenarioToggle shows dropdown instead of tabs)
- User has non-empty portfolio

### Steps

1. On a mobile viewport, buy 1 share of any player
   **Expected:** Portfolio is non-empty

2. Tap the mobile scenario dropdown trigger
   **Expected:** Dropdown menu opens showing all scenarios

3. Tap a different scenario in the dropdown
   **Expected:** Confirmation dialog appears before the switch

4. Tap "Cancel"
   **Expected:** Dropdown closes (or remains); scenario is unchanged; portfolio intact

5. Repeat step 2-3, then tap "Switch & Reset"
   **Expected:** Scenario switches; portfolio resets; dropdown closes

### Test Data

- Mobile viewport (< 768px or whatever breakpoint triggers mobile dropdown)

### Edge Cases

- Rapidly tapping different scenarios in the dropdown — only one dialog should appear at a time

---

## TC-007: Disabled Sell tab shows tooltip on hover (no holdings)

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that hovering over the disabled Sell tab on the PlayerDetail page displays an explanatory tooltip saying "You need to own shares to sell."

### Preconditions

- User navigates to a PlayerDetail page for a player they do NOT own
- Sell tab is disabled (`disabled={!holding}`)

### Steps

1. Navigate to `/player/hill` (or any player not in portfolio)
   **Expected:** PlayerDetail page loads; Sell tab is visually disabled (grayed out, cursor: not-allowed)

2. Hover the mouse over the disabled Sell tab
   **Expected:** A tooltip appears with text "You need to own shares to sell"

3. Move the mouse away from the Sell tab
   **Expected:** Tooltip disappears

### Test Data

- Player: any player not currently held (e.g., Hill)

### Edge Cases

- Hover quickly on and off — tooltip should appear and disappear cleanly without flicker

---

## TC-008: No tooltip on Sell tab when user holds shares

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the Sell tab is enabled (user owns shares of this player), no tooltip appears on hover.

### Preconditions

- User owns shares of the player being viewed

### Steps

1. Buy 1 share of Mahomes
   **Expected:** Portfolio contains Mahomes

2. Navigate to `/player/mahomes`
   **Expected:** PlayerDetail loads; Sell tab is enabled (clickable, not grayed out)

3. Hover over the Sell tab
   **Expected:** No tooltip appears; tab is clickable and switches to the Sell form

4. Click the Sell tab
   **Expected:** Sell form is displayed with share count and sell button

### Test Data

- Player: Mahomes, Holdings: 1+ share

### Edge Cases

- Buy a share, view tooltip is gone, sell all shares, verify tooltip reappears without page refresh

---

## TC-009: Sell tab tooltip accessible via keyboard focus

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the tooltip on the disabled Sell tab is accessible via keyboard navigation (e.g., via `title` attribute or ARIA tooltip pattern).

### Preconditions

- User does not hold shares of the viewed player
- Sell tab is disabled

### Steps

1. Navigate to a PlayerDetail page for a player not held
   **Expected:** Sell tab is disabled

2. Use Tab key to navigate focus to the Sell tab area
   **Expected:** If using `title` attribute, the browser's native tooltip mechanism applies; if using a custom tooltip, it should be associated via `aria-describedby` or similar

3. Verify screen reader announces the tooltip text
   **Expected:** Screen reader reads "You need to own shares to sell" or equivalent

### Test Data

- N/A

### Edge Cases

- Disabled buttons may not be focusable by default — verify the implementation handles this (e.g., wrapping in a span with tabIndex)

---

## TC-010: moveReason truncation respects word boundaries

**Priority:** P0
**Type:** Functional

### Objective

Verify that PlayerCard's `moveReason` text is truncated at the last word boundary before 60 characters, not mid-word.

### Preconditions

- PlayerCard is rendered with a `moveReason` longer than 60 characters

### Steps

1. Render a PlayerCard with moveReason: "Patrick Mahomes threw his third touchdown pass of the game to seal the victory"
   **Expected:** Text is truncated at a word boundary before or at the 60-character mark. The displayed text should end at a complete word followed by "..." (e.g., "Patrick Mahomes threw his third touchdown pass of the game..." — truncated at "game" which is the last complete word before position 60)

### Test Data

- moveReason: `"Patrick Mahomes threw his third touchdown pass of the game to seal the victory"` (78 chars)
- The 60th character falls within "game t..." — truncation should happen at "game"

### Edge Cases

- moveReason where position 60 falls exactly at the end of a word — truncate at that word boundary
- moveReason with no spaces (one continuous word longer than 60 chars) — must still truncate at 60 and add ellipsis (can't find a word boundary)

---

## TC-011: Short moveReason displays without trailing ellipsis

**Priority:** P0
**Type:** Functional

### Objective

Verify that when `moveReason` is 60 characters or shorter, it displays in full without a trailing "..." appended.

### Preconditions

- PlayerCard is rendered with a short moveReason

### Steps

1. Render a PlayerCard with moveReason: "Quick trade update" (18 chars)
   **Expected:** Card displays "Quick trade update" with no trailing ellipsis

2. Render a PlayerCard with moveReason: exactly 60 characters (e.g., `"A".repeat(59) + "B"`)
   **Expected:** Full text is displayed without ellipsis

### Test Data

- Short reason: `"Quick trade update"` (18 chars)
- Exact boundary: a 60-character string
- Just under: a 59-character string

### Edge Cases

- moveReason of exactly 61 characters — should be truncated with ellipsis
- Empty string moveReason — no reason paragraph should render (existing `{player.moveReason && ...}` guard)

---

## TC-012: moveReason truncation with text exactly at word boundary at position 60

**Priority:** P1
**Type:** Functional

### Objective

Verify correct behavior when the 60th character is exactly a space or the last character of a word.

### Preconditions

- PlayerCard rendered with crafted moveReason strings

### Steps

1. Render PlayerCard with moveReason where char 60 is a space: `"abcdef " * ~8` padded to exactly place a space at position 60
   **Expected:** Text truncates cleanly at the word before position 60; no trailing space before the ellipsis

2. Render PlayerCard with moveReason where char 60 is the last letter of a word
   **Expected:** That word is included in full, followed by "..."

### Test Data

- Crafted strings with known word boundaries around position 60

### Edge Cases

- Multiple consecutive spaces near the truncation point — extra whitespace should be trimmed before adding ellipsis

---

## TC-013: moveReason with null/undefined value does not render

**Priority:** P1
**Type:** Functional

### Objective

Verify that when `moveReason` is falsy (null, undefined, empty string), no reason paragraph is rendered on the PlayerCard.

### Preconditions

- PlayerCard rendered with various falsy moveReason values

### Steps

1. Render PlayerCard with `moveReason: undefined`
   **Expected:** No `.card-reason` element is present in the DOM

2. Render PlayerCard with `moveReason: ""`
   **Expected:** No `.card-reason` element is present in the DOM

3. Render PlayerCard with `moveReason: null`
   **Expected:** No `.card-reason` element is present in the DOM

### Test Data

- `moveReason: undefined`, `moveReason: ""`, `moveReason: null`

### Edge Cases

- `moveReason: " "` (whitespace only) — implementation may or may not render this; verify desired behavior

---

## TC-014: Portfolio state persists correctly after Cancel on scenario switch

**Priority:** P1
**Type:** Integration

### Objective

Verify that after dismissing the confirmation dialog with Cancel, the full portfolio state (including avgCost and localStorage) is intact.

### Preconditions

- User has made multiple trades in the current scenario

### Steps

1. Buy 3 shares of Mahomes and 2 shares of Allen in Midweek
   **Expected:** Portfolio: Mahomes (3 shares), Allen (2 shares); cash reduced

2. Click Playoffs scenario tab
   **Expected:** Confirmation dialog appears

3. Click "Cancel"
   **Expected:** Portfolio still has Mahomes (3 shares, correct avgCost) and Allen (2 shares, correct avgCost)

4. Refresh the page
   **Expected:** Portfolio is restored from localStorage with the same holdings and cash (persistence verified)

### Test Data

- Mahomes: 3 shares, Allen: 2 shares

### Edge Cases

- Verify localStorage keys `portfolio` and `cash` are not modified when Cancel is clicked

---

## TC-015: Rapid scenario switching with non-empty portfolio

**Priority:** P2
**Type:** Regression

### Objective

Verify that rapidly clicking different scenario tabs doesn't cause race conditions or skip the confirmation dialog.

### Preconditions

- Non-empty portfolio

### Steps

1. Buy shares in Midweek scenario
   **Expected:** Non-empty portfolio

2. Rapidly click Live Game, then Playoffs, then Super Bowl tabs in quick succession
   **Expected:** Only one confirmation dialog appears at a time; no scenario switches happen without confirmation; no console errors

### Test Data

- N/A

### Edge Cases

- Double-click the same scenario tab — nothing should happen (already selected)
- Click current scenario again — no dialog should appear

---

## TC-016: Sell tab visual state matches disabled/enabled correctly

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the Sell tab has correct visual styling in both disabled and enabled states.

### Preconditions

- PlayerDetail page loaded

### Steps

1. Navigate to a player NOT in portfolio
   **Expected:** Sell tab has `opacity: 0.5`, `cursor: not-allowed` styling; appears visually grayed out

2. Buy 1 share of the player, then navigate back to their detail page (or stay on page)
   **Expected:** Sell tab now appears fully opaque, clickable; `cursor: pointer`; no disabled attribute

3. Sell all shares of the player
   **Expected:** Sell tab returns to disabled state with grayed-out styling

### Test Data

- Any player

### Edge Cases

- Verify that the active tab reverts to "Buy" when the Sell tab becomes disabled while the Sell form is displayed

---

## TC-017: Confirmation dialog integrates correctly with ScenarioContext state

**Priority:** P1
**Type:** Integration

### Objective

Verify that when the user confirms the reset, `scenarioVersion` increments in ScenarioContext and TradingContext's reset effect fires, clearing portfolio, cash, and userImpact.

### Preconditions

- Non-empty portfolio with user-impact trades

### Steps

1. Buy 10 shares of Allen (generates userImpact) in Midweek
   **Expected:** Portfolio has Allen; cash reduced; userImpact for Allen is non-zero

2. Switch to Playoffs via confirmation dialog ("Switch & Reset")
   **Expected:** `scenarioVersion` changes; portfolio resets to Playoffs `startingPortfolio`; cash is $10,000; userImpact is cleared (empty object)

3. Verify Allen's effective price is back to base (no user impact)
   **Expected:** Allen's price on Market page reflects base price without user impact premium

### Test Data

- Allen: 10 shares in Midweek

### Edge Cases

- Switch back to Midweek after resetting to Playoffs — starting portfolio for Midweek is applied

---

## TC-018: moveReason truncation does not affect PlayerDetail full moveReason display

**Priority:** P1
**Type:** Regression

### Objective

Verify that the word-boundary truncation change in PlayerCard does NOT affect the PlayerDetail page, which should continue to display the full untruncated moveReason.

### Preconditions

- A player has a moveReason longer than 60 characters

### Steps

1. Browse the Market page and find a PlayerCard with a truncated moveReason (ending in "...")
   **Expected:** moveReason is truncated at a word boundary with "..."

2. Click through to that player's PlayerDetail page
   **Expected:** The "Why Did This Move?" section shows the full, untruncated moveReason text

### Test Data

- Player with a long moveReason (> 60 characters)

### Edge Cases

- Verify the full reason displays correctly even for very long reasons (200+ characters)
