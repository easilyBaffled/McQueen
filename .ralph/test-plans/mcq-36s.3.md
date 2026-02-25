# Test Plan: mcq-36s.3 -- Fix PlayerCard moveReason truncation to respect word boundaries

## Summary

- **Bead:** `mcq-36s.3`
- **Feature:** Truncate the `moveReason` text at word boundaries (last space before limit) and only append ellipsis when the text is actually truncated
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Short moveReason returned unchanged (under limit)

**Priority:** P0
**Type:** Functional

### Objective

Verify that a moveReason string shorter than 60 characters is returned verbatim with no ellipsis appended.

### Preconditions

- `truncateAtWord` helper is available
- `maxLen` is 60

### Steps

1. Call `truncateAtWord("Traded to the Chiefs", 60)`
   **Expected:** Returns `"Traded to the Chiefs"` — no ellipsis, no modification.

### Test Data

- Input: `"Traded to the Chiefs"` (20 chars)

### Edge Cases

- Verify no trailing whitespace is added or removed from an already-clean short string.

---

## TC-002: moveReason exactly 60 characters returned unchanged

**Priority:** P0
**Type:** Functional

### Objective

Verify the boundary condition: a string whose length is exactly `maxLen` (60) is not truncated and has no ellipsis.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Call `truncateAtWord("Promoted to starter after strong preseason camp performance", 60)` (exactly 60 chars)
   **Expected:** Returns the input string unchanged, with no `"..."` appended.

### Test Data

- Input: a 60-character string (count verified)

### Edge Cases

- A string of exactly 60 characters consisting of a single word (no spaces) must also be returned unchanged.

---

## TC-003: Long moveReason truncated at last space before limit

**Priority:** P0
**Type:** Functional

### Objective

Verify that a string longer than 60 characters is cut at the last space occurring before position 60, and `"..."` is appended.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Call `truncateAtWord("Breakout performance in Week 3 elevated his stock significantly among fantasy managers", 60)`
   **Expected:** The result ends at a complete word that fits within 60 chars, followed by `"..."`. No mid-word cut. For this input, the last space before index 60 is after `"significantly"` → returns `"Breakout performance in Week 3 elevated his stock significantly..."` (or whichever word boundary is last before 60).

### Test Data

- Input: 85-character string with spaces throughout

### Edge Cases

- Verify no partial word appears before the ellipsis.

---

## TC-004: Long moveReason with no spaces falls back to hard cut at maxLen

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a string exceeds 60 characters and contains no spaces at all, truncation falls back to cutting at exactly position 60 and appending `"..."`.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Call `truncateAtWord("Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 60)` (69 'a' chars, no spaces)
   **Expected:** Returns the first 60 characters followed by `"..."` (63-char result).

### Test Data

- Input: 69-character single-token string

### Edge Cases

- A string of exactly 61 characters with no spaces should cut at 60 and append `"..."`.

---

## TC-005: Empty string returned unchanged

**Priority:** P1
**Type:** Functional

### Objective

Verify that an empty moveReason string is returned as-is with no ellipsis.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Call `truncateAtWord("", 60)`
   **Expected:** Returns `""`.

### Test Data

- Input: `""`

### Edge Cases

- None beyond the empty-string case itself.

---

## TC-006: moveReason of 61 characters triggers truncation

**Priority:** P0
**Type:** Functional

### Objective

Verify the off-by-one boundary: a string of 61 characters (one over the limit) is truncated.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Call `truncateAtWord("Strong weekly outing pushed his value up across all formats X", 60)` (61 chars, with a space at position 58)
   **Expected:** The string is truncated at the last space before position 60, and `"..."` is appended. The trailing `"X"` (and any partial word) is removed.

### Test Data

- Input: 61-character string with spaces

### Edge Cases

- Verify no off-by-one: 60-char strings pass through, 61-char strings truncate.

---

## TC-007: Space only at position 0 treated as no valid break point

**Priority:** P1
**Type:** Functional

### Objective

The `lastIndexOf(' ')` check uses `> 0`, so a space only at index 0 should not be used as the break point. The function should fall back to cutting at `maxLen`.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Call `truncateAtWord(" aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa...", 60)` — a string starting with a single space followed by 60+ non-space characters.
   **Expected:** Since `lastIndexOf(' ')` returns 0 and the condition `> 0` is false, the function cuts at position 60 and appends `"..."`.

### Test Data

- Input: space at index 0, then 65 non-space characters

### Edge Cases

- Verify `.trimEnd()` does not affect the result when the character at position 59 is not whitespace.

---

## TC-008: Trailing whitespace before the cut point is trimmed

**Priority:** P1
**Type:** Functional

### Objective

When the last space before `maxLen` leaves trailing whitespace, `.trimEnd()` removes it before appending `"..."`.

### Preconditions

- `truncateAtWord` helper is available

### Steps

1. Construct a string where the last space before position 60 is followed by additional spaces (e.g., `"Word   nextword"` pattern where spaces cluster before the cut). Call `truncateAtWord(input, 60)`.
   **Expected:** The returned string has no trailing spaces before the `"..."`.

### Test Data

- Input: `"Short sentence with extra    spacing that pushes beyond the sixty char boundary here"` (> 60 chars, multiple consecutive spaces around position 30–40)

### Edge Cases

- Multiple consecutive spaces near the boundary should not produce `"Word   ..."` — trailing spaces must be trimmed to `"Word..."`.

---

## TC-009: PlayerCard does not render moveReason when falsy

**Priority:** P0
**Type:** Functional / Regression

### Objective

Verify that when `player.moveReason` is `undefined`, `null`, or an empty string, the `<p className="card-reason">` element is not rendered at all.

### Preconditions

- Render `<PlayerCard>` with a player whose `moveReason` is `undefined`

### Steps

1. Render `PlayerCard` with `player.moveReason = undefined`.
   **Expected:** No element with class `card-reason` is present in the DOM.

2. Render `PlayerCard` with `player.moveReason = ""`.
   **Expected:** No element with class `card-reason` is present in the DOM (empty string is falsy).

### Test Data

- Player object with `moveReason` set to `undefined`, `null`, and `""` in separate iterations

### Edge Cases

- Whitespace-only moveReason (`"   "`) is truthy and would render — this may be acceptable or may need its own handling (out of scope for this bead, but worth noting).

---

## TC-010: PlayerCard renders full moveReason without ellipsis when short

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a short moveReason (≤ 60 chars) is displayed in full on the card with no `"..."` suffix.

### Preconditions

- Render `<PlayerCard>` with a player whose `moveReason` is `"Upgraded to WR1 after trade"` (27 chars)

### Steps

1. Render the PlayerCard and locate the `.card-reason` element.
   **Expected:** Text content is exactly `"Upgraded to WR1 after trade"` — no ellipsis visible.

2. Visually inspect the card.
   **Expected:** The reason text fits naturally within the card layout. No overflow or clipping.

### Test Data

- `moveReason`: `"Upgraded to WR1 after trade"`

### Edge Cases

- A moveReason of exactly 60 characters should also display with no ellipsis.

---

## TC-011: PlayerCard renders truncated moveReason with ellipsis when long

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that a long moveReason (> 60 chars) is displayed truncated at a word boundary with `"..."` appended, and the visual presentation is clean.

### Preconditions

- Render `<PlayerCard>` with a player whose `moveReason` is `"Breakout performance in Week 3 elevated his stock significantly among fantasy managers"` (85 chars)

### Steps

1. Render the PlayerCard and locate the `.card-reason` element.
   **Expected:** Text content ends with `"..."` and the last word before `"..."` is a complete, uncut word.

2. Verify no mid-word truncation.
   **Expected:** The text does not end with a partial word like `"significan..."`.

3. Visually inspect the card.
   **Expected:** The truncated text with ellipsis fits cleanly within the card. No layout overflow or wrapping artifacts.

### Test Data

- `moveReason`: `"Breakout performance in Week 3 elevated his stock significantly among fantasy managers"`

### Edge Cases

- A moveReason of 120+ characters should still truncate correctly and not overflow the card visually.

---

## TC-012: Regression — old substring(0, 60) behavior is gone

**Priority:** P0
**Type:** Regression

### Objective

Confirm that the old behavior (hard `substring(0, 60)` with unconditional `"..."`) no longer occurs. Mid-word cuts and unnecessary ellipsis on short strings must not happen.

### Preconditions

- Render `<PlayerCard>` with various moveReason lengths

### Steps

1. Render PlayerCard with `moveReason = "Short reason"` (12 chars).
   **Expected:** Displayed as `"Short reason"` — no `"..."`.

2. Render PlayerCard with `moveReason = "His recent performance in practice has coaches excited about his potential role"` (78 chars). Under old code, this would produce `"His recent performance in practice has coaches excited about..."` cutting mid-phrase with unconditional ellipsis.
   **Expected:** Text is truncated at a complete word boundary. The word at the cut point is not split. Ellipsis is appended only because the string exceeded 60 characters.

3. Inspect the source code at the moveReason render site.
   **Expected:** No call to `.substring(0, 60)` with a hard-coded `"..."` suffix exists. The `truncateAtWord` helper is used instead.

### Test Data

- Short string: `"Short reason"`
- Long string: `"His recent performance in practice has coaches excited about his potential role"`

### Edge Cases

- Ensure no other location in PlayerCard.tsx still uses the old pattern.
