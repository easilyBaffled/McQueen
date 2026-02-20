# Test Plan: mcq-8hr.11 -- Verify coverage targets met

## Summary

- **Bead:** `mcq-8hr.11`
- **Feature:** Run Vitest and Cypress coverage suites, verify line coverage meets minimum thresholds (Vitest >= 80%, Cypress >= 75%), and generate final HTML reports
- **Total Test Cases:** 10
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Vitest coverage run completes without errors

**Priority:** P0
**Type:** Functional

### Objective

Verify that `npm run test:coverage` executes successfully — all unit tests pass and the coverage instrumentation produces output. A failing suite means coverage numbers are meaningless.

### Preconditions

- Dependencies installed (`npm ci` or `npm install` completed)
- No uncommitted changes that would break the build

### Steps

1. Run `npm run test:coverage` from the project root.
   **Expected:** The command exits with code 0. All unit tests pass (zero failures, zero errors).

2. Observe the terminal output for the coverage summary table.
   **Expected:** A text summary is printed showing statements, branches, functions, and lines percentages for all included source files.

### Test Data

- None (standard project source and test files)

### Edge Cases

- If any individual test is flaky and fails intermittently, re-run once to confirm. A persistent failure blocks this entire plan.
- If the `--coverage` flag triggers an OOM error on large codebases, check that Node heap size is adequate (e.g., `NODE_OPTIONS=--max-old-space-size=4096`).

---

## TC-002: Vitest line coverage meets >= 80% threshold

**Priority:** P0
**Type:** Functional

### Objective

The primary acceptance criterion for the Vitest side: aggregate line coverage must be at least 80%. The threshold is configured in `vite.config.js` under `test.coverage.thresholds.lines: 80`.

### Preconditions

- TC-001 passed (coverage run completed successfully)

### Steps

1. Inspect the text summary output from `npm run test:coverage` and locate the **All files** row.
   **Expected:** The `Lines` column shows a value >= 80.00%.

2. Verify the command did NOT exit with a threshold-violation error.
   **Expected:** Vitest's built-in threshold enforcement (configured at `lines: 80`) did not cause a non-zero exit code. If the threshold is met, the process exits cleanly.

3. Cross-check by opening `coverage/vitest/index.html` and reading the aggregate line coverage from the HTML report header.
   **Expected:** The HTML report's aggregate line percentage matches the terminal output and is >= 80%.

### Test Data

- None

### Edge Cases

- If line coverage is exactly 80.00%, confirm that the threshold check treats this as passing (>= not >).
- If coverage is 79.x%, the command should fail with a threshold error — confirming enforcement works.

---

## TC-003: Vitest statement, branch, and function coverage thresholds met

**Priority:** P1
**Type:** Functional

### Objective

Beyond lines, the project enforces thresholds on statements (79%), branches (66%), and functions (74%) in `vite.config.js`. Verify all four thresholds pass simultaneously.

### Preconditions

- TC-001 passed

### Steps

1. Inspect the text summary output from `npm run test:coverage` and locate the **All files** row.
   **Expected:** Statements >= 79%, Branches >= 66%, Functions >= 74%, Lines >= 80%.

2. Verify no threshold-violation error is printed for any of the four metrics.
   **Expected:** All four thresholds pass; exit code is 0.

### Test Data

- None

### Edge Cases

- A file with 0% branch coverage (no branches) should not drag down the aggregate if it has minimal lines. Confirm the aggregation method (weighted by lines vs. simple average) matches expectations.

---

## TC-004: Cypress coverage run completes without errors

**Priority:** P0
**Type:** Functional

### Objective

Verify that `npm run cy:coverage` executes successfully — the app builds with Istanbul instrumentation, the preview server starts, all Cypress E2E tests pass, and coverage data is collected.

### Preconditions

- Dependencies installed
- No other process occupying port 4173
- `CYPRESS_COVERAGE=true` environment variable is set by the script

### Steps

1. Run `npm run cy:coverage` from the project root.
   **Expected:** The command performs three stages: (a) `vite build` with Istanbul plugin enabled, (b) `vite preview` starts on port 4173, (c) `cypress run` executes all E2E specs. Exit code is 0.

2. Observe the Cypress runner output.
   **Expected:** All E2E spec files pass with zero failures.

3. Verify that the `@cypress/code-coverage` plugin prints a summary after the run.
   **Expected:** A message like "Writing coverage object..." and "Generating report..." appears, confirming instrumentation data was captured.

### Test Data

- Standard app scenario data (midweek)

### Edge Cases

- If `vite build` fails with instrumentation enabled, check that `vite-plugin-istanbul` is correctly configured in `vite.config.js` (the `CYPRESS_COVERAGE` env guard).
- If the preview server fails to start on port 4173, check for port conflicts. The `start-server-and-test` utility should handle this, but a stale process could block it.
- If Cypress tests pass but no coverage is collected, verify that `cypress/support/e2e.js` imports `@cypress/code-coverage/support`.

---

## TC-005: Cypress line coverage meets >= 75% threshold

**Priority:** P0
**Type:** Functional

### Objective

The primary acceptance criterion for the Cypress side: aggregate line coverage must be at least 75%. The current `.nycrc.json` has `lines: 37`, which is below the 75% target — confirming the threshold config may need updating as part of the parent task, and this test plan verifies the actual measured coverage.

### Preconditions

- TC-004 passed (Cypress coverage run completed successfully)
- Coverage data written to `coverage/cypress/`

### Steps

1. After `npm run cy:coverage` completes, run `npx nyc report --reporter=text` (or inspect the inline summary) to view aggregate Cypress coverage.
   **Expected:** The `Lines` column in the **All files** row shows a value >= 75.00%.

2. Run `npm run cy:check-coverage` (which invokes `nyc check-coverage`).
   **Expected:** If `.nycrc.json` has been updated to `lines: 75`, the command exits with code 0. If `.nycrc.json` still has `lines: 37`, it will pass trivially — in that case, manually verify the reported line percentage is >= 75%.

3. Open `coverage/cypress/index.html` (or `coverage/cypress/lcov-report/index.html`) and read the aggregate line coverage.
   **Expected:** The HTML report's aggregate line percentage matches the terminal output and is >= 75%.

### Test Data

- None

### Edge Cases

- If line coverage is between 37% (current nyc threshold) and 75% (target), `nyc check-coverage` will still pass with the old config. The manual verification in Step 1 is the authoritative check.
- If Cypress coverage is unexpectedly low (< 50%), investigate whether Istanbul instrumentation is actually active in the build (`CYPRESS_COVERAGE=true` must propagate to both the `vite build` and `vite preview` commands).

---

## TC-006: Cypress statement, branch, and function coverage reported

**Priority:** P1
**Type:** Functional

### Objective

Verify that all four coverage metrics (statements, branches, functions, lines) are reported for Cypress and assess their values against the `.nycrc.json` thresholds.

### Preconditions

- TC-004 passed

### Steps

1. Inspect the nyc text summary for Cypress coverage.
   **Expected:** All four columns (Statements, Branches, Functions, Lines) are populated with non-zero percentages.

2. Compare each metric against the `.nycrc.json` thresholds: statements >= 36%, branches >= 21%, functions >= 33%, lines >= 37% (current config).
   **Expected:** All thresholds pass. If thresholds have been raised to match the 75% line target, confirm the new thresholds also pass.

### Test Data

- None

### Edge Cases

- If branches coverage is disproportionately low compared to lines, it may indicate that E2E tests follow the happy path but miss error/edge branches. Note for future improvement but not a blocker for this bead.

---

## TC-007: Vitest HTML coverage report is generated and valid

**Priority:** P0
**Type:** Functional

### Objective

The acceptance criteria require generating final HTML reports. Verify the Vitest HTML report exists, is browsable, and contains per-file drill-down data.

### Preconditions

- TC-001 passed

### Steps

1. Check that the directory `coverage/vitest/` exists after running `npm run test:coverage`.
   **Expected:** The directory exists and contains `index.html`.

2. Open `coverage/vitest/index.html` in a browser.
   **Expected:** The report loads and displays a sortable table of source files with columns for Statements, Branches, Functions, and Lines.

3. Click into a specific source file (e.g., a component or hook).
   **Expected:** The drill-down view shows line-by-line highlighting — green for covered lines, red for uncovered lines.

4. Verify the `lcov` reporter also generated output (configured in `vite.config.js` as `reporter: ['text', 'html', 'lcov']`).
   **Expected:** `coverage/vitest/lcov.info` exists and is non-empty.

### Test Data

- None

### Edge Cases

- If `coverage/vitest/` is listed in `.gitignore`, the report won't be committed — this is expected and correct. Verify the directory is gitignored.
- If the HTML report shows 0% for files that should be covered, check that the `include`/`exclude` patterns in `vite.config.js` are correct.

---

## TC-008: Cypress HTML coverage report is generated and valid

**Priority:** P0
**Type:** Functional

### Objective

Verify the Cypress HTML report exists, is browsable, and reflects E2E coverage data.

### Preconditions

- TC-004 passed

### Steps

1. Check that the directory `coverage/cypress/` exists after running `npm run cy:coverage`.
   **Expected:** The directory exists and contains either `index.html` directly or an `lcov-report/index.html`.

2. Open the Cypress HTML coverage report in a browser.
   **Expected:** The report loads and displays a sortable table of instrumented source files with Statements, Branches, Functions, and Lines columns.

3. Click into a specific source file.
   **Expected:** Line-by-line coverage highlighting is shown (green = covered by E2E tests, red = uncovered).

4. Confirm the report only includes files matching the Istanbul `include: 'src/*'` pattern and excludes `node_modules`, `src/test`, and `src/**/__tests__/**`.
   **Expected:** No test utility files or node_modules appear in the report.

### Test Data

- None

### Edge Cases

- The `report-dir` in `.nycrc.json` is set to `coverage/cypress`. If `@cypress/code-coverage` writes to a different location (e.g., `.nyc_output`), the HTML report may not appear where expected. Verify the output path.
- If the report is empty (no files listed), Istanbul instrumentation was not active during the build.

---

## TC-009: Coverage reports do not include excluded files

**Priority:** P1
**Type:** Regression

### Objective

Both Vitest and Cypress configurations exclude certain paths from coverage. Verify those exclusions are respected so that coverage percentages are not artificially inflated or deflated.

### Preconditions

- TC-001 and TC-004 passed (both coverage runs completed)

### Steps

1. Open the Vitest HTML report (`coverage/vitest/index.html`) and scan the file list.
   **Expected:** No files from `src/test/**`, `src/**/__tests__/**`, `src/**/*.test.*`, `src/build/**`, `src/data/**`, `src/types/**`, or `src/pages/ScenarioInspector/**` appear in the report.

2. Open the Cypress HTML report and scan the file list.
   **Expected:** No files from `node_modules`, `src/test`, or `src/**/__tests__/**` appear (per the Istanbul plugin `exclude` config in `vite.config.js`).

3. Verify that non-excluded source files (e.g., components, hooks, pages, utilities) ARE included.
   **Expected:** Core application files like components and hooks appear with coverage data.

### Test Data

- None

### Edge Cases

- `src/pages/ScenarioInspector/**` is excluded from Vitest but may not be excluded from Cypress (different config). Verify whether this is intentional.
- Type-only files (`src/types/**`) are excluded from Vitest. If they contain runtime code, they would be missed. Confirm they are pure type definitions.

---

## TC-010: Consecutive coverage runs produce consistent results

**Priority:** P2
**Type:** Regression

### Objective

Verify that running coverage commands twice in a row produces the same (or nearly identical) results, confirming there are no stale-cache or incremental-build artifacts skewing numbers.

### Preconditions

- Both coverage commands have been run at least once

### Steps

1. Run `npm run test:coverage` and record the aggregate line coverage percentage for Vitest.
   **Expected:** A specific percentage is noted (e.g., 82.3%).

2. Run `npm run test:coverage` again immediately.
   **Expected:** The aggregate line coverage is identical (within 0.1%) to the first run.

3. Run `npm run cy:coverage` and record the aggregate line coverage percentage for Cypress.
   **Expected:** A specific percentage is noted.

4. Run `npm run cy:coverage` again immediately.
   **Expected:** The aggregate line coverage is identical (within 0.1%) to the first run.

### Test Data

- None

### Edge Cases

- If Vitest runs tests in parallel with random ordering, branch coverage could vary slightly between runs due to test isolation differences. A variance > 1% across runs indicates a flaky coverage setup.
- Cypress coverage depends on which code paths the E2E tests exercise. If tests are deterministic (no randomization), coverage should be identical across runs.
