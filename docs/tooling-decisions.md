# Tooling & Validation Decisions

> **Issue**: mcq-sqo · Tech Stack: Confirm Tooling and Validation Approach
> **Blocks**: mcq-7h6 (Spec: Write Refactor Specification)
> **Date**: 2026-02-18

---

## 1. TypeScript: No — Stay with JavaScript

The codebase remains `.js`/`.jsx`. At 40 source files the project is small enough that TypeScript's refactor-safety benefits don't outweigh the migration cost and ongoing type-maintenance overhead. The `@types/react` and `@types/react-dom` devDependencies stay for editor IntelliSense via JSDoc imports.

---

## 2. Test Framework: Vitest (already in place)

Vitest is configured in `vite.config.js` with:

- `happy-dom` test environment
- `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`
- Setup file at `src/test/setup.js`
- Scripts: `test` (watch), `test:run` (single), `test:coverage`

**No bootstrap needed.** The framework is operational with 3 existing unit tests. Coverage expansion is tracked separately (pain point H1 in the POC audit).

---

## 3. E2E Tool: Cypress (already in place)

Cypress 15 is configured in `cypress.config.js` with:

- 11 spec files, ~75 tests
- `start-server-and-test` for CI integration
- `cypress-parallel` for parallel execution (3 workers)

**Rationale for keeping Cypress over Playwright**: 75 working E2E tests already exist. Migration cost is high for zero feature gain at this stage. Cypress component testing can be added later if needed.

---

## 4. Accessibility Validation: Deferred

Not a priority for this phase. Pain point L6 remains open and can be revisited in a future phase with `eslint-plugin-jsx-a11y` and/or `cypress-axe`.

---

## 5. Prettier: Add It

ESLint 9 is deprecating its stylistic/formatting rules. Adding Prettier with `eslint-config-prettier` gives deterministic formatting without maintaining custom ESLint style rules. A minimal `.prettierrc` (printWidth, singleQuote, trailingComma) keeps diffs clean across contributors.

---

## Setup Tasks

Concrete implementation tasks filed as child issues:

| Task                     | Description                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add Prettier             | Install `prettier` + `eslint-config-prettier`. Create `.prettierrc`. Add `format` / `format:check` scripts. Run initial format pass. Update `eslint.config.js`. |
| Clean up @types packages | Keep `@types/react` and `@types/react-dom` for IntelliSense. Add `jsconfig.json` to formalize the JS-only setup.                                                |
| Extract magic numbers    | Create `src/constants.js` with `TICK_INTERVAL_MS`, `ESPN_REFRESH_MS`, `USER_IMPACT_FACTOR`, `INITIAL_CASH`, etc. (Pain point L2.)                               |
