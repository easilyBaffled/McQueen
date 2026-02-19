# Test Plan: mcq-qzq.2 -- Convert priceCalculator to TypeScript

## Summary

- **Bead:** `mcq-qzq.2`
- **Feature:** TypeScript conversion of priceCalculator with PriceImpact/PriceResult interfaces, full type annotations, and no `any` types
- **Total Test Cases:** 12
- **Test Types:** Functional, Integration, Regression

---

## TC-001: File renamed from .js to .ts

**Priority:** P0
**Type:** Functional

### Objective

Verify the module exists at `src/services/priceCalculator.ts` and that the old `.js` file no longer exists. This is the foundational deliverable of the conversion.

### Preconditions

- TypeScript conversion work is complete
- Project builds without errors

### Steps

1. Check for `src/services/priceCalculator.ts` on disk
   **Expected:** File exists and contains TypeScript syntax (type annotations, interfaces)

2. Check for `src/services/priceCalculator.js` on disk
   **Expected:** File does NOT exist (no leftover JS file alongside the TS file)

### Test Data

- N/A

### Edge Cases

- Ensure no stale `.js` artifact is left by the build in the source tree (distinguish compiled output from source)

---

## TC-002: PriceImpact interface is exported

**Priority:** P0
**Type:** Functional

### Objective

Verify that a `PriceImpact` interface (or type) is exported from `priceCalculator.ts`, matching the shape returned by `calculatePriceImpact()`.

### Preconditions

- `src/services/priceCalculator.ts` exists

### Steps

1. Inspect exports of `priceCalculator.ts` for a named export `PriceImpact`
   **Expected:** `PriceImpact` is exported as an interface or type alias

2. Verify the `PriceImpact` type includes at minimum: `impactPercent: number`, `impactMultiplier: number`, `description: string`, and a `details` object with `sentiment`, `level`, `baseImpact`, `confidence`, `confidenceMultiplier`
   **Expected:** All fields are present with specific types (no `any`)

3. Verify `calculatePriceImpact()` return type is annotated as (or assignable to) `PriceImpact`
   **Expected:** TypeScript compiler confirms the return type matches `PriceImpact`

### Test Data

- N/A

### Edge Cases

- If `PriceImpact` is re-exported from `src/types/espn.ts`, verify the two definitions are consistent (no duplicate conflicting types)

---

## TC-003: PriceResult interface is exported

**Priority:** P0
**Type:** Functional

### Objective

Verify that a `PriceResult` interface (or type) is exported from `priceCalculator.ts`, matching the shape returned by `calculateNewPrice()`.

### Preconditions

- `src/services/priceCalculator.ts` exists

### Steps

1. Inspect exports of `priceCalculator.ts` for a named export `PriceResult`
   **Expected:** `PriceResult` is exported as an interface or type alias

2. Verify the `PriceResult` type includes at minimum: `newPrice: number`, `previousPrice: number`, `change: number`, `changePercent: number`, and `impact: PriceImpact`
   **Expected:** All fields are present with specific types (no `any`); `impact` references the `PriceImpact` type

3. Verify `calculateNewPrice()` return type is annotated as (or assignable to) `PriceResult`
   **Expected:** TypeScript compiler confirms the return type matches `PriceResult`

### Test Data

- N/A

### Edge Cases

- Verify `PriceResult` does not use inline object literals where the named interface should be used

---

## TC-004: SentimentResult type is imported from sentimentEngine

**Priority:** P0
**Type:** Integration

### Objective

Verify that `priceCalculator.ts` imports and uses the `SentimentResult` (or `AnalyzeSentimentResult`) type from `sentimentEngine.ts` for sentiment input parameters rather than defining its own duplicate type.

### Preconditions

- `src/services/sentimentEngine.ts` exports `SentimentResult` or `AnalyzeSentimentResult`
- `src/services/priceCalculator.ts` exists

### Steps

1. Inspect imports in `priceCalculator.ts` for a type import from `./sentimentEngine`
   **Expected:** A type like `SentimentResult` or `AnalyzeSentimentResult` is imported (possibly as a type-only import)

2. Verify that functions accepting sentiment data (`calculatePriceImpact`, `calculateNewPrice`, `calculateCumulativeImpact`) use the imported type (or a compatible subset) for their sentiment parameter
   **Expected:** Parameters are typed with the imported sentiment type, not a locally-defined `SentimentInput` that duplicates the shape

3. Compile the project with `tsc --noEmit`
   **Expected:** No type errors related to sentiment type compatibility between the two modules

### Test Data

- N/A

### Edge Cases

- If a local `SentimentInput` subset interface is kept for flexibility (e.g., `Pick<SentimentResult, ...>`), verify it explicitly references or extends `SentimentResult` rather than being fully independent

---

## TC-005: All public functions have typed parameters and return types

**Priority:** P0
**Type:** Functional

### Objective

Verify that every exported function in `priceCalculator.ts` has explicit TypeScript type annotations on all parameters and an explicit return type annotation.

### Preconditions

- `src/services/priceCalculator.ts` exists

### Steps

1. Inspect `calculatePriceImpact` signature
   **Expected:** `sentimentResult` parameter has an explicit type; return type is explicitly annotated (e.g., `: PriceImpact`)

2. Inspect `applyPriceImpact` signature
   **Expected:** `currentPrice` is typed as `number`; `impact` parameter has an explicit type (e.g., `{ impactMultiplier: number }` or `Pick<PriceImpact, 'impactMultiplier'>`); return type is `: number`

3. Inspect `calculateNewPrice` signature
   **Expected:** `currentPrice: number`; `sentimentResult` has an explicit type; return type is explicitly annotated (e.g., `: PriceResult`)

4. Inspect `calculateCumulativeImpact` signature
   **Expected:** `currentPrice: number`; `sentimentResults` is typed as an array of the sentiment type; `options` parameter has an explicit type; return type is explicitly annotated

5. Inspect `createPriceHistoryEntry` signature
   **Expected:** `article` parameter has an explicit type (interface or inline); `sentimentResult` has an explicit type; `newPrice: number`; return type is explicitly annotated

### Test Data

- N/A

### Edge Cases

- Verify that the `options` parameter in `calculateCumulativeImpact` with default values still has an explicit type annotation (not just inferred)

---

## TC-006: No `any` types anywhere in the module

**Priority:** P0
**Type:** Functional

### Objective

Verify that the converted file contains zero occurrences of the `any` type, including in local variables, parameters, return types, and generic type arguments.

### Preconditions

- `src/services/priceCalculator.ts` exists

### Steps

1. Search `priceCalculator.ts` for the token `any` used as a type annotation (`: any`, `as any`, `<any>`, `Record<string, any>`, etc.)
   **Expected:** Zero matches found

2. Compile with `tsc --noEmit --strict`
   **Expected:** No errors or implicit-any warnings for this file

### Test Data

- N/A

### Edge Cases

- Check for `unknown` used as a lazy substitute for `any` — while technically allowed, `Record<string, unknown>` in the `impacts` array of `calculateCumulativeImpact` should ideally use a specific type
- Check for type assertions (`as`) that might mask `any` usage

---

## TC-007: Existing priceCalculator tests still pass

**Priority:** P0
**Type:** Regression

### Objective

Verify that the existing test suite in `priceCalculator.test.js` (or after rename to `.ts`) passes without modification to test logic, confirming the TypeScript conversion is behavior-preserving.

### Preconditions

- Test runner (vitest) is configured
- `priceCalculator.ts` conversion is complete

### Steps

1. Run `npx vitest run src/services/__tests__/priceCalculator.test.js` (or `.ts` if renamed)
   **Expected:** All existing tests pass (applyPriceImpact: 4 tests, createPriceHistoryEntry: 2 tests, calculatePriceImpact: 4 tests, calculateNewPrice: 3 tests, calculateCumulativeImpact: 4 tests — 17 total)

2. Verify no test was skipped, marked pending, or commented out
   **Expected:** All 17 tests are executed and green

### Test Data

- Uses existing test data already defined in the test file

### Edge Cases

- If the test file was renamed to `.ts`, verify no type errors were introduced in the test code itself
- Confirm that import paths in the test file resolve correctly to the new `.ts` module

---

## TC-008: Test file renamed from .js to .ts

**Priority:** P1
**Type:** Functional

### Objective

Verify that the test file has been renamed from `priceCalculator.test.js` to `priceCalculator.test.ts` per AC #4.

### Preconditions

- Conversion work is complete

### Steps

1. Check for `src/services/__tests__/priceCalculator.test.ts` on disk
   **Expected:** File exists

2. Check for `src/services/__tests__/priceCalculator.test.js` on disk
   **Expected:** File does NOT exist (old JS test file removed)

3. Run the renamed test file
   **Expected:** All tests pass with no type errors

### Test Data

- N/A

### Edge Cases

- If the test file imports types from `priceCalculator.ts`, verify those type imports compile correctly

---

## TC-009: Barrel export from services/index.ts still works

**Priority:** P1
**Type:** Integration

### Objective

Verify that `src/services/index.ts` continues to re-export all public symbols from `priceCalculator.ts` after the conversion, including the new type exports.

### Preconditions

- `src/services/index.ts` exists and re-exports from `priceCalculator`
- Conversion is complete

### Steps

1. Inspect `src/services/index.ts` for re-export of `priceCalculator`
   **Expected:** `export * from './priceCalculator'` (or equivalent) is present

2. Import `{ calculatePriceImpact, applyPriceImpact, calculateNewPrice, calculateCumulativeImpact, createPriceHistoryEntry }` from `src/services/index.ts` in a TypeScript file
   **Expected:** All function imports resolve without errors

3. Import `{ PriceImpact, PriceResult }` (as types) from `src/services/index.ts`
   **Expected:** Type imports resolve without errors

4. Run the barrel export test suite (`barrelExports.test.ts`)
   **Expected:** All assertions pass, including checks for `calculatePriceImpact` and `applyPriceImpact`

### Test Data

- N/A

### Edge Cases

- Verify no duplicate exports if `PriceImpact` is also exported from `src/types/espn.ts`

---

## TC-010: Downstream consumer (SimulationContext) compiles

**Priority:** P1
**Type:** Integration

### Objective

Verify that `src/context/SimulationContext.jsx` (which imports from `priceCalculator`) continues to compile and function after the conversion.

### Preconditions

- `SimulationContext.jsx` imports `calculateNewPrice`, `calculateCumulativeImpact`, etc. from `priceCalculator`
- Conversion is complete

### Steps

1. Run `tsc --noEmit` on the full project
   **Expected:** No type errors in `SimulationContext.jsx` or any other file importing from `priceCalculator`

2. Verify the import path in `SimulationContext.jsx` resolves correctly
   **Expected:** Import resolves to the new `.ts` file without needing path changes

### Test Data

- N/A

### Edge Cases

- If `SimulationContext.jsx` passes untyped objects to `priceCalculator` functions, verify TypeScript does not reject them (JSX files may not enforce strict typing)

---

## TC-011: Project builds successfully end-to-end

**Priority:** P0
**Type:** Regression

### Objective

Verify the entire project compiles and builds without errors after the TypeScript conversion, confirming no type incompatibilities were introduced.

### Preconditions

- All conversion work is complete
- All dependencies are installed

### Steps

1. Run `tsc --noEmit` (type-checking only)
   **Expected:** Zero errors

2. Run the project's build command (e.g., `npm run build`)
   **Expected:** Build completes successfully with no errors

3. Run the full test suite (e.g., `npm test` or `npx vitest run`)
   **Expected:** All tests pass, including priceCalculator tests and barrelExports tests

### Test Data

- N/A

### Edge Cases

- Check for TypeScript warnings (not just errors) that may indicate issues

---

## TC-012: PRICE_IMPACT_RANGES constant is properly typed

**Priority:** P2
**Type:** Functional

### Objective

Verify that the `PRICE_IMPACT_RANGES` constant has a specific type annotation rather than relying on type inference alone, and that it uses the sentiment/magnitude-level keys from the domain model.

### Preconditions

- `src/services/priceCalculator.ts` exists

### Steps

1. Inspect the type of `PRICE_IMPACT_RANGES` in `priceCalculator.ts`
   **Expected:** Has an explicit type annotation (e.g., `Record<string, Record<string, { min: number; max: number }>>` or a more specific type using literal union keys like `'positive' | 'negative' | 'neutral'`)

2. Verify the nested range objects (`{ min: number; max: number }`) are properly typed
   **Expected:** Each range has `min` and `max` as `number`, not `any`

### Test Data

- N/A

### Edge Cases

- If the type uses `Record<string, ...>`, consider whether a narrower key type (e.g., `SentimentType`) would be more appropriate — flag if `any` is used anywhere in the type
