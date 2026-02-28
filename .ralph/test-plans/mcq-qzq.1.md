# Test Plan: mcq-qzq.1 -- Convert sentimentEngine to TypeScript

## Summary

- **Bead:** `mcq-qzq.1`
- **Feature:** TypeScript conversion of sentimentEngine — file rename, type annotations, and SentimentResult interface with no structural changes
- **Total Test Cases:** 12
- **Test Types:** Functional, Integration, Regression

---

## TC-001: TypeScript Compilation Succeeds with Strict Mode

**Priority:** P0
**Type:** Functional

### Objective

Verify that `sentimentEngine.ts` compiles without errors under the project's `strict: true` tsconfig. A compilation failure blocks every downstream consumer.

### Preconditions

- Repository checked out on the working branch
- `tsconfig.json` has `"strict": true`

### Steps

1. Run `npx tsc --noEmit` from the project root.
   **Expected:** Exit code 0 with no type errors referencing `sentimentEngine.ts`.

2. Inspect compiler output for any warnings or implicit-any diagnostics in `src/services/sentimentEngine.ts`.
   **Expected:** Zero warnings or errors originating from this file.

### Test Data

- N/A — uses project source as-is.

### Edge Cases

- Ensure no residual `sentimentEngine.js` exists alongside `sentimentEngine.ts` (duplicate module resolution).

---

## TC-002: SentimentResult Interface Exported and Accurate

**Priority:** P0
**Type:** Functional

### Objective

Confirm that the module exports a `SentimentResult`-style interface (currently named `AnalyzeSentimentResult`) with the correct shape, so consumers can import and use it for type-safe integration.

### Preconditions

- `sentimentEngine.ts` exists in `src/services/`

### Steps

1. Open `src/services/sentimentEngine.ts` and locate the `AnalyzeSentimentResult` interface definition.
   **Expected:** Interface defines `sentiment: 'positive' | 'negative' | 'neutral'`, `magnitude: number`, `confidence: number`, `keywords: FoundKeyword[]`, and optional `scores: { positive: number; negative: number; net: number }`.

2. Verify the `FoundKeyword` interface defines `word: string`, `type: string`, `level: string`.
   **Expected:** All three fields present with correct types.

3. Verify that `KeywordLevel`, `SentimentType`, `KeywordMap` type aliases exist and are correctly defined.
   **Expected:** `KeywordLevel = 'high' | 'medium' | 'low'`; `SentimentType = 'positive' | 'negative' | 'neutral'`; `KeywordMap` maps each `KeywordLevel` to `string[]`.

### Test Data

- N/A — static code inspection.

### Edge Cases

- Verify that types referenced internally (e.g., `FoundKeyword`, `KeywordLevel`) are not accidentally exported if they were not exported before the conversion.

---

## TC-003: analyzeSentiment Returns Correct Shape for Empty/Null/Undefined Input

**Priority:** P0
**Type:** Regression

### Objective

Verify that the null-guard path is preserved after conversion — falsy inputs return the neutral default object with the correct typed shape.

### Preconditions

- Existing test suite passes before conversion

### Steps

1. Call `analyzeSentiment('')`.
   **Expected:** Returns `{ sentiment: 'neutral', magnitude: 0, confidence: 0, keywords: [] }` with no `scores` property.

2. Call `analyzeSentiment(null)`.
   **Expected:** Returns object with `sentiment === 'neutral'`, `magnitude === 0`, `confidence === 0`, `keywords` is empty array.

3. Call `analyzeSentiment(undefined)`.
   **Expected:** Same neutral result as null case.

### Test Data

- Inputs: `''`, `null`, `undefined`

### Edge Cases

- Verify the function signature accepts `string | null | undefined` as the first parameter at the type level.

---

## TC-004: analyzeSentiment Positive Keyword Detection Unchanged

**Priority:** P0
**Type:** Regression

### Objective

Confirm that positive keyword detection across all three weight tiers (high/medium/low) produces identical scores and keyword lists as before conversion.

### Preconditions

- Module compiles without errors

### Steps

1. Call `analyzeSentiment('Mahomes throws game-winning touchdown')`.
   **Expected:** `sentiment === 'positive'`, `scores.positive > 0`, keywords include entries with `type: 'positive'`.

2. Call `analyzeSentiment('Player leads team with explosive performance')`.
   **Expected:** `sentiment === 'positive'`, at least one keyword has `level: 'medium'`.

3. Call `analyzeSentiment('Player cleared for full participation, healthy')`.
   **Expected:** `sentiment === 'positive'`, at least one keyword has `level: 'low'`.

### Test Data

- High-tier text: `'Mahomes throws game-winning touchdown'`
- Medium-tier text: `'Player leads team with explosive performance'`
- Low-tier text: `'Player cleared for full participation, healthy'`

### Edge Cases

- Case-insensitivity: `'TOUCHDOWN'` should still match.

---

## TC-005: analyzeSentiment Negative Keyword Detection Unchanged

**Priority:** P0
**Type:** Regression

### Objective

Confirm that negative keyword detection across all three weight tiers produces identical results as before conversion.

### Preconditions

- Module compiles without errors

### Steps

1. Call `analyzeSentiment('Star QB suffers torn ACL, out for season')`.
   **Expected:** `sentiment === 'negative'`, `scores.negative > 0`, keywords include `'torn'`, `'acl'`, `'out for season'`.

2. Call `analyzeSentiment('Player listed as questionable after setback')`.
   **Expected:** `sentiment === 'negative'`, at least one keyword has `level: 'medium'`.

3. Call `analyzeSentiment('Minor rest day, precautionary')`.
   **Expected:** Keywords found at `level: 'low'` with `type: 'negative'`.

### Test Data

- High-tier: `'Star QB suffers torn ACL, out for season'`
- Medium-tier: `'Player listed as questionable after setback'`
- Low-tier: `'Minor rest day, precautionary'`

### Edge Cases

- Text containing both positive and negative high-tier keywords should produce correct net scoring.

---

## TC-006: Negation Modifier Behavior Preserved

**Priority:** P1
**Type:** Regression

### Objective

Verify that negation words within 5 tokens of a keyword still flip the scoring direction after the TS conversion.

### Preconditions

- Module compiles without errors

### Steps

1. Call `analyzeSentiment("Player did not score a touchdown")`.
   **Expected:** `scores.negative > 0` (negation flips the positive keyword to count as negative).

2. Call `analyzeSentiment("The injury is not serious")`.
   **Expected:** The negative keyword `'serious'` is flipped, contributing to `positiveScore` instead.

3. Call `analyzeSentiment("Player scored a touchdown. Later, not related, he left.")` where negation is far from the keyword.
   **Expected:** `'touchdown'` still scores as positive because negation is not within 5-word proximity.

### Test Data

- Near-negation: `"Player did not score a touchdown"`
- Negation-flips-negative: `"The injury is not serious"`
- Far-negation: long sentence with negation distant from keyword

### Edge Cases

- Multiple negation words in same sentence (e.g., `"didn't not"` double-negative).
- Negation word at position 0 with keyword at position 6+ (outside window).

---

## TC-007: Position-Specific Keyword Scoring Preserved

**Priority:** P1
**Type:** Regression

### Objective

Confirm that position-specific keywords (QB, RB, WR, TE) still contribute +1.5 weight per match after conversion.

### Preconditions

- Module compiles without errors

### Steps

1. Call `analyzeSentiment('Elite passer rating and clean pocket performance', 'Patrick Mahomes', 'QB')`.
   **Expected:** Keywords include `'passer rating'` and `'clean pocket'`. `scores.positive >= 3.0` (1.5 each).

2. Call `analyzeSentiment('Record targets and receptions in contested catch situations', 'Justin Jefferson', 'WR')`.
   **Expected:** Keywords include `'targets'`, `'receptions'`, `'contested catch'`.

3. Call `analyzeSentiment('Running back with fumbles and limited touches', 'Player', 'RB')`.
   **Expected:** Keywords include negative RB-specific terms. `scores.negative` reflects 1.5 weight per keyword.

4. Call `analyzeSentiment('Tight end with red zone targets and seam route usage', 'Player', 'TE')`.
   **Expected:** Keywords include `'red zone targets'` and `'seam route'`.

### Test Data

- Per step above.

### Edge Cases

- Unknown position string (e.g., `'K'` or `'DEF'`): should not crash; position-specific scoring simply skipped.
- Empty position string: position block should be skipped gracefully.

---

## TC-008: Fantasy Keyword Scoring Preserved

**Priority:** P1
**Type:** Regression

### Objective

Verify that fantasy-relevant keywords (target share, committee, etc.) still score correctly at weight 1 after conversion.

### Preconditions

- Module compiles without errors

### Steps

1. Call `analyzeSentiment('Increased target share and snap count increase')`.
   **Expected:** Keywords include `'target share'` and `'snap count increase'`, both with `level: 'low'` and `type: 'positive'`. `scores.positive >= 2`.

2. Call `analyzeSentiment('Running back in committee timeshare, reduced role')`.
   **Expected:** `sentiment === 'negative'`, keywords include `'committee'`, `'timeshare'`, `'reduced role'`.

### Test Data

- Per step above.

### Edge Cases

- Fantasy keyword embedded in a larger word (e.g., `'committees'` should still match due to `includes()` logic).

---

## TC-009: Confidence and Magnitude Capping at 1.0

**Priority:** P1
**Type:** Regression

### Objective

Ensure the `Math.min` capping for confidence (totalScore / 10) and magnitude (score / 9) is unchanged, so values never exceed 1.0.

### Preconditions

- Module compiles without errors

### Steps

1. Call `analyzeSentiment('touchdown td winning career-high record-breaking mvp game-winning clutch dominant historic pro bowl all-pro')`.
   **Expected:** `confidence <= 1.0` and `magnitude <= 1.0`.

2. Call `analyzeSentiment('injury torn out for season arrested suspended acl season-ending surgery fracture broken serious')`.
   **Expected:** `confidence <= 1.0` and `magnitude <= 1.0`.

### Test Data

- Sentence containing all high-tier positive keywords.
- Sentence containing all high-tier negative keywords.

### Edge Cases

- Exactly at cap boundary: text producing `totalScore === 10` should yield `confidence === 1.0`.
- Text with zero keywords: `confidence === 0`, `magnitude === 0`.

---

## TC-010: getMagnitudeLevel Boundary Values Preserved

**Priority:** P1
**Type:** Regression

### Objective

Verify `getMagnitudeLevel` thresholds (0.66 for high, 0.33 for medium) are unchanged after adding type annotations.

### Preconditions

- Module compiles without errors

### Steps

1. Call `getMagnitudeLevel(0.66)`.
   **Expected:** Returns `'high'`.

2. Call `getMagnitudeLevel(0.659)`.
   **Expected:** Returns `'medium'`.

3. Call `getMagnitudeLevel(0.33)`.
   **Expected:** Returns `'medium'`.

4. Call `getMagnitudeLevel(0.329)`.
   **Expected:** Returns `'low'`.

5. Call `getMagnitudeLevel(0)`.
   **Expected:** Returns `'low'`.

6. Call `getMagnitudeLevel(1.0)`.
   **Expected:** Returns `'high'`.

### Test Data

- Boundary values: `0`, `0.329`, `0.33`, `0.659`, `0.66`, `1.0`

### Edge Cases

- Negative magnitude input (e.g., `-0.1`): should return `'low'`.
- Magnitude greater than 1.0 (e.g., `1.5`): should return `'high'`.

---

## TC-011: getSentimentDescription Output Strings Preserved

**Priority:** P1
**Type:** Regression

### Objective

Confirm that all 7 description strings (including emoji) are returned correctly for each sentiment/magnitude combination after TS conversion.

### Preconditions

- Module compiles without errors

### Steps

1. Call `getSentimentDescription({ sentiment: 'positive', magnitude: 0.8 })`.
   **Expected:** `'Very Bullish 🚀'`

2. Call `getSentimentDescription({ sentiment: 'positive', magnitude: 0.5 })`.
   **Expected:** `'Bullish 📈'`

3. Call `getSentimentDescription({ sentiment: 'positive', magnitude: 0.1 })`.
   **Expected:** `'Slightly Bullish 📊'`

4. Call `getSentimentDescription({ sentiment: 'negative', magnitude: 0.8 })`.
   **Expected:** `'Very Bearish 📉'`

5. Call `getSentimentDescription({ sentiment: 'negative', magnitude: 0.5 })`.
   **Expected:** `'Bearish 🔻'`

6. Call `getSentimentDescription({ sentiment: 'negative', magnitude: 0.1 })`.
   **Expected:** `'Slightly Bearish 📊'`

7. Call `getSentimentDescription({ sentiment: 'neutral', magnitude: 0 })`.
   **Expected:** `'Neutral ➡️'`

### Test Data

- Per step above.

### Edge Cases

- Unknown sentiment string (e.g., `'unknown'`): should return fallback `'Neutral ➡️'`.
- Neutral with high magnitude (e.g., `0.8`): should return `'Mixed Signals ↔️'`.

---

## TC-012: Downstream Consumer Import Compatibility

**Priority:** P0
**Type:** Integration

### Objective

Verify that all existing consumers of `sentimentEngine` continue to resolve imports correctly after the `.js` to `.ts` rename, with no runtime or compile-time breakage.

### Preconditions

- `sentimentEngine.ts` exists; no `sentimentEngine.js` remains
- All consumer files are unmodified

### Steps

1. Verify `src/services/index.ts` re-exports from `'./sentimentEngine'` resolve without error.
   **Expected:** `npx tsc --noEmit` produces no errors for this file.

2. Verify `src/services/priceCalculator.ts` imports `getMagnitudeLevel` from `'./sentimentEngine'` without error.
   **Expected:** No compile errors; `getMagnitudeLevel` type is `(magnitude: number) => 'high' | 'medium' | 'low'`.

3. Verify `src/context/GameContext.jsx` imports `analyzeSentiment` and `getSentimentDescription` from `'../services/sentimentEngine'` without error.
   **Expected:** No compile errors (with `allowJs: true` in tsconfig).

4. Run the existing test suite: `npx vitest run src/services/__tests__/sentimentEngine.test.js`.
   **Expected:** All 20+ existing tests pass with zero failures.

5. Run the full project test suite.
   **Expected:** No new test failures introduced by the conversion.

### Test Data

- N/A — uses existing codebase and test fixtures.

### Edge Cases

- Verify no `sentimentEngine.js` file remains in `src/services/` that could cause ambiguous module resolution.
- Verify the default export object `{ analyzeSentiment, getMagnitudeLevel, getSentimentDescription, POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS }` is still importable via `import sentimentEngine from './sentimentEngine'`.
