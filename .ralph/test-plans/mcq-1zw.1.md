# Test Plan: mcq-1zw.1 -- Set up TypeScript ESLint linting

## Summary

- **Bead:** `mcq-1zw.1`
- **Feature:** Enable ESLint linting for all TypeScript/TSX files, load the typescript-eslint plugin, and remove no-op type suppressions in PlayerDetail.tsx
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: typescript-eslint package installed as devDependency

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `typescript-eslint` unified package is listed in `devDependencies` in `package.json` and is physically installed in `node_modules`.

### Preconditions

- Fresh clone of the branch, or `node_modules` removed and reinstalled via `npm ci`.

### Steps

1. Open `package.json` and inspect `devDependencies`.
   **Expected:** An entry for `typescript-eslint` exists with a valid semver range.

2. Run `ls node_modules/typescript-eslint`.
   **Expected:** The directory exists and contains a `package.json` with the package name `typescript-eslint`.

3. Run `npm ls typescript-eslint`.
   **Expected:** The package appears in the dependency tree under `devDependencies` with no `UNMET` or `INVALID` warnings.

### Test Data

- None.

### Edge Cases

- Ensure it is **not** listed under `dependencies` (it is a dev-only tool).
- Ensure the older individual packages (`@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`) are not also installed unless intentionally kept—duplicate packages could cause version conflicts.

---

## TC-002: ESLint config adds a file block matching `**/*.{ts,tsx}`

**Priority:** P0
**Type:** Functional

### Objective

Verify that `eslint.config.js` contains a configuration block whose `files` glob matches `.ts` and `.tsx` files.

### Preconditions

- The updated `eslint.config.js` is present on the branch.

### Steps

1. Open `eslint.config.js` and locate all `files:` entries.
   **Expected:** At least one block has `files: ['**/*.{ts,tsx}']` (or an equivalent glob that covers all TypeScript files in the repo).

2. Confirm the new block does **not** list `'**/*.{js,jsx}'`—that should remain in the existing JS block.
   **Expected:** JS and TS file blocks are separate (or a combined block covers both explicitly).

### Test Data

- None.

### Edge Cases

- Ensure the new block does not accidentally match files inside `dist/` (the existing `globalIgnores(['dist'])` should cover this).
- Ensure the new block respects the existing `ignores: ['cypress/**']` or adds its own ignore for Cypress files if those remain JS-only.

---

## TC-003: TS block extends tseslint.configs.recommended

**Priority:** P0
**Type:** Functional

### Objective

Verify that the TypeScript file block extends the recommended typescript-eslint configuration so that TS-specific lint rules are active.

### Preconditions

- `eslint.config.js` contains the TS file block from TC-002.

### Steps

1. Inspect the `extends` array of the TS file block in `eslint.config.js`.
   **Expected:** It includes `tseslint.configs.recommended` (or `tseslint.configs.recommendedTypeChecked` if type-checked linting was chosen).

2. Run `npx eslint --print-config src/App.tsx | grep @typescript-eslint`.
   **Expected:** Multiple `@typescript-eslint/*` rules appear in the resolved configuration (e.g., `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`).

### Test Data

- Use any `.tsx` file, e.g., `src/App.tsx`.

### Edge Cases

- If `recommendedTypeChecked` is used, confirm `parserOptions.project` is set correctly so the type-checker can resolve the `tsconfig.json`.

---

## TC-004: TS block includes react-hooks plugin

**Priority:** P0
**Type:** Functional

### Objective

Verify that React Hooks lint rules are active for TypeScript files.

### Preconditions

- The TS file block in `eslint.config.js` is present.

### Steps

1. Inspect the `extends` array of the TS file block.
   **Expected:** `reactHooks.configs['recommended-latest']` (or equivalent) is included.

2. Run `npx eslint --print-config src/App.tsx | grep react-hooks`.
   **Expected:** `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` rules appear and are set to `error` / `warn`.

### Test Data

- None.

### Edge Cases

- Temporarily introduce a hooks violation in a `.tsx` file (e.g., call `useState` inside a condition) and confirm ESLint reports it.

---

## TC-005: TS block includes react-refresh plugin

**Priority:** P1
**Type:** Functional

### Objective

Verify that the react-refresh plugin rules apply to TypeScript files.

### Preconditions

- The TS file block in `eslint.config.js` is present.

### Steps

1. Inspect the `extends` array of the TS file block.
   **Expected:** `reactRefresh.configs.vite` (or equivalent) is included.

2. Run `npx eslint --print-config src/App.tsx | grep react-refresh`.
   **Expected:** `react-refresh/only-export-components` (or similar) rule appears.

### Test Data

- None.

### Edge Cases

- None.

---

## TC-006: TS block includes jsx-a11y plugin

**Priority:** P1
**Type:** Functional

### Objective

Verify that accessibility lint rules (jsx-a11y) apply to TypeScript/TSX files.

### Preconditions

- The TS file block in `eslint.config.js` is present.

### Steps

1. Inspect the `extends` array of the TS file block.
   **Expected:** `jsxA11y.flatConfigs.recommended` (or equivalent) is included.

2. Run `npx eslint --print-config src/App.tsx | grep jsx-a11y`.
   **Expected:** Multiple `jsx-a11y/*` rules appear (e.g., `jsx-a11y/alt-text`, `jsx-a11y/anchor-is-valid`).

### Test Data

- None.

### Edge Cases

- None.

---

## TC-007: TS block includes prettier config

**Priority:** P1
**Type:** Functional

### Objective

Verify that eslint-config-prettier is included in the TS block to disable formatting rules that conflict with Prettier.

### Preconditions

- The TS file block in `eslint.config.js` is present.

### Steps

1. Inspect the `extends` array of the TS file block.
   **Expected:** `prettier` (eslint-config-prettier) is listed, and it appears **last** in the extends array to properly override conflicting rules.

2. Run `npx eslint --print-config src/App.tsx` and check that typical formatting rules (e.g., `indent`, `semi`) are set to `off` or `0`.
   **Expected:** Prettier-conflicting rules are disabled.

### Test Data

- None.

### Edge Cases

- Confirm `prettier` is the last entry in extends; if it appears before other configs, formatting rules could be re-enabled.

---

## TC-008: All three `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments removed from PlayerDetail.tsx

**Priority:** P0
**Type:** Functional

### Objective

Verify that the three no-op `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in `PlayerDetail.tsx` have been deleted entirely, not just moved or reformatted.

### Preconditions

- The updated `PlayerDetail.tsx` is present on the branch.

### Steps

1. Search `PlayerDetail.tsx` for the string `eslint-disable`.
   **Expected:** Zero matches. No eslint-disable comments of any kind remain in the file (unless a new, justified one was added with an explanatory note).

2. Search `PlayerDetail.tsx` for the string `@typescript-eslint/no-explicit-any`.
   **Expected:** Zero matches.

### Test Data

- File: `src/pages/PlayerDetail/PlayerDetail.tsx`

### Edge Cases

- Confirm the comments were not simply moved to a file-level `/* eslint-disable */` block, which would hide all warnings.

---

## TC-009: `as any` cast removed from PlayerDetail.tsx line 440

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `as any` type assertion on the `Customized` component prop has been removed and replaced with a proper type.

### Preconditions

- The updated `PlayerDetail.tsx` is present on the branch.

### Steps

1. Search `PlayerDetail.tsx` for the string `as any`.
   **Expected:** Zero matches. The cast is removed.

2. Inspect the `<Customized component={...} />` JSX around the former line 440.
   **Expected:** The component prop is typed using a Recharts-compatible type (e.g., `CustomizedProps`, a typed callback signature, or an explicit interface) instead of `as any`.

3. Run `npx tsc --noEmit`.
   **Expected:** No type errors originate from `PlayerDetail.tsx`. The replacement type satisfies the TypeScript compiler.

### Test Data

- File: `src/pages/PlayerDetail/PlayerDetail.tsx`

### Edge Cases

- Ensure the replacement is not `as unknown as SomeType`—that pattern just hides the problem behind two casts.
- Ensure no new `// @ts-ignore` or `// @ts-expect-error` comments were added as a workaround.

---

## TC-010: Formatter callback types fixed in PlayerDetail.tsx

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Recharts `<Tooltip formatter>` callback parameters previously typed as `any` are now properly typed.

### Preconditions

- The updated `PlayerDetail.tsx` is present on the branch.

### Steps

1. Locate the `formatter=` prop on the `<Tooltip>` component in `PlayerDetail.tsx`.
   **Expected:** The callback parameters (`value`, `_name`, `props`) use specific types rather than `any`. For example, `value: number`, `_name: string`, `props: { payload: ChartDataPoint }` or equivalent Recharts types.

2. Run `npx tsc --noEmit`.
   **Expected:** No type errors from the formatter callback. The types align with what Recharts actually passes at runtime.

3. Run `npm run lint`.
   **Expected:** No `@typescript-eslint/no-explicit-any` warnings from PlayerDetail.tsx.

### Test Data

- File: `src/pages/PlayerDetail/PlayerDetail.tsx`

### Edge Cases

- Verify the formatter still works at runtime: the tooltip should display the formatted price value when hovering over the chart.

---

## TC-011: `npm run lint` passes on entire codebase

**Priority:** P0
**Type:** Integration

### Objective

Verify that the full ESLint run completes with zero errors across all JS, JSX, TS, and TSX files.

### Preconditions

- All dependencies installed (`npm ci`).
- The updated `eslint.config.js` and all code fixes are in place.

### Steps

1. Run `npm run lint`.
   **Expected:** Exit code `0`. Zero errors reported. Warnings are acceptable if explicitly triaged, but zero is preferred.

2. Verify output includes `.ts` and `.tsx` files in the linted file set (if ESLint is run in debug mode or with `--debug` flag).
   **Expected:** TypeScript files appear in the list of linted files, confirming the new config block is active.

### Test Data

- The full `src/` directory (94 `.ts`/`.tsx` files at time of writing).

### Edge Cases

- Run `npm run lint -- --max-warnings 0` to also catch warnings treated as non-blocking.
- Confirm that `dist/` is still excluded (should not be linted).
- Confirm that Cypress JS files still lint under their own block without TS-specific rules.

---

## TC-012: `npx tsc --noEmit` passes

**Priority:** P0
**Type:** Integration

### Objective

Verify that the TypeScript compiler reports no type errors after the `any` removals and type fixes in PlayerDetail.tsx.

### Preconditions

- All dependencies installed (`npm ci`).

### Steps

1. Run `npx tsc --noEmit`.
   **Expected:** Exit code `0`. Zero errors. No warnings about missing types.

### Test Data

- None.

### Edge Cases

- If the project uses multiple `tsconfig` files (e.g., `tsconfig.app.json`, `tsconfig.node.json`), run `tsc --noEmit` against each to ensure none have regressions.

---

## TC-013: `npm run test:run` passes

**Priority:** P0
**Type:** Regression

### Objective

Verify that all existing Vitest unit/component tests still pass after the ESLint config changes and PlayerDetail.tsx type fixes.

### Preconditions

- All dependencies installed (`npm ci`).

### Steps

1. Run `npm run test:run`.
   **Expected:** Exit code `0`. All test suites pass. No test failures or unexpected skips.

2. Check the test count against the previous run (or CI baseline).
   **Expected:** No tests were accidentally deleted or skipped as part of the lint/type fixes.

### Test Data

- None.

### Edge Cases

- Pay special attention to `PlayerDetail.test.tsx` and `PlayerDetail.keyboard.test.tsx`—these test the component whose types were changed and are most likely to regress.

---

## TC-014: No new `any` types or suppression comments introduced elsewhere

**Priority:** P1
**Type:** Regression

### Objective

Verify that fixing the lint/type issues did not push `any` types or eslint-disable comments into other files as a workaround.

### Preconditions

- All changes from this bead are committed.

### Steps

1. Run `git diff main -- '*.ts' '*.tsx' | grep -c 'as any'` (or equivalent diff against the base branch).
   **Expected:** The count of `as any` additions is zero (net change should be negative or zero).

2. Run `git diff main -- '*.ts' '*.tsx' | grep -c 'eslint-disable'`.
   **Expected:** The count of `eslint-disable` additions is zero (net change should be negative or zero).

3. Run `git diff main -- '*.ts' '*.tsx' | grep -c '@ts-ignore\|@ts-expect-error'`.
   **Expected:** Zero new `@ts-ignore` or `@ts-expect-error` comments added.

### Test Data

- Compare against the base branch (`main` or `origin/ralphing`).

### Edge Cases

- Check shared type files (`src/types/*.ts`) to ensure no type was widened to `any` to satisfy the compiler.
