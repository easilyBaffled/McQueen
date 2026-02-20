# Test Plan: mcq-8hr.10 -- Fix all Cypress E2E tests -- migrate selectors from CSS classes to data-testid

## Summary

- **Bead:** `mcq-8hr.10`
- **Feature:** Migrate all Cypress E2E selectors from CSS class selectors (`.class-name`) to `[data-testid="..."]` selectors across 10 spec files and `commands.js`
- **Total Test Cases:** 18
- **Test Types:** Functional, Regression, Integration

---

## TC-001: commands.js — `getPlayerCards` custom command uses data-testid

**Priority:** P0
**Type:** Functional

### Objective

The `getPlayerCards` custom command is used across multiple spec files (market, watchlist, portfolio). Verifying it uses `[data-testid="player-card"]` instead of `.player-card` is foundational to all downstream tests.

### Preconditions

- Migration has been applied to `cypress/support/commands.js`
- Corresponding React component renders `data-testid="player-card"` on each player card element

### Steps

1. Open `cypress/support/commands.js` and inspect the `getPlayerCards` command body.
   **Expected:** The selector reads `cy.get('[data-testid="player-card"]')` — no `.player-card` class selector remains.

2. Run `npx cypress run --spec cypress/e2e/market.cy.js` (which exercises `getPlayerCards`).
   **Expected:** All tests in the market spec that call `cy.getPlayerCards()` pass without timeout or element-not-found errors.

### Test Data

- None (standard app data)

### Edge Cases

- Verify `clearAppState` and `skipOnboarding` commands do NOT contain CSS class selectors (they use localStorage only — should remain unchanged).

---

## TC-002: market.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify every CSS class selector in `market.cy.js` has been converted to its `data-testid` equivalent and that all 8 market tests pass.

### Preconditions

- Migration applied to `cypress/e2e/market.cy.js`
- Corresponding React components render the required `data-testid` attributes: `players-grid`, `sort-tab`, `search-input`, `welcome-banner`, `welcome-dismiss`, `player-detail-page`, `market-page`, `market-sidebar`

### Steps

1. Search `market.cy.js` for any remaining dotted-class selectors (`.players-grid`, `.sort-tab`, `.search-input`, `.welcome-banner`, `.welcome-dismiss`, `.player-detail-page`, `.market-page`, `.market-sidebar`).
   **Expected:** Zero occurrences of `cy.get('.xxx')` patterns. All replaced with `cy.get('[data-testid="xxx"]')`.

2. Verify compound selectors like `.players-grid a[href*="/player/"]` are migrated to `[data-testid="players-grid"] a[href*="/player/"]`.
   **Expected:** The anchor-href portion is preserved; only the class prefix is swapped.

3. Run `npx cypress run --spec cypress/e2e/market.cy.js`.
   **Expected:** All 8 tests (TC-MKT-001 through TC-MKT-008) pass.

### Test Data

- None (standard midweek scenario)

### Edge Cases

- `.sort-tab` appears with `.should('have.class', 'active')` assertions — the `have.class` assertion is checking state, NOT selecting by class. Confirm these assertions remain unchanged (they must still use `have.class`).

---

## TC-003: player-detail.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 17 tests in the player detail spec pass after migrating its extensive set of CSS selectors.

### Preconditions

- Migration applied to `cypress/e2e/player-detail.cy.js`
- React components render `data-testid` attributes for: `player-detail-page`, `player-name`, `player-price`, `price-change`, `chart-card`, `trading-card`, `error-state`, `chart-container`, `trading-tab`, `order-total`, `trade-button-buy`, `trade-button-sell`, `toast`, `holdings-card`, `form-input`, `watchlist-button`, `timeline-card`, `price-timeline`, `timeline-entry`, `league-owners-card`, `league-owner-row`, `back-link`, `player-header`

### Steps

1. Search `player-detail.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]` format.

2. Verify compound class selectors like `.trade-button.buy` are converted to a single `data-testid` (e.g., `[data-testid="trade-button-buy"]`), NOT `[data-testid="trade-button"][data-testid="buy"]`.
   **Expected:** Each compound selector maps to one descriptive test ID string.

3. Verify `.trading-tab` with `.should('have.class', 'active')` and `.should('be.disabled')` — the `.have.class` and `.be.disabled` assertions must be preserved.
   **Expected:** Only the `cy.get(...)` selector is changed; chained assertions remain identical.

4. Run `npx cypress run --spec cypress/e2e/player-detail.cy.js`.
   **Expected:** All 17 tests (TC-PD-001 through TC-PD-017) pass.

### Test Data

- Player slug `mahomes` must exist in scenario data
- Player slug `hill` must exist (for sell-disabled test)
- Player slug `nonexistent-player-id-12345` must NOT exist (for error state test)

### Edge Cases

- `.players-grid a[href*="/player/"]` appears in TC-PD-016 (back navigation) — confirm anchor-href compound selector is handled.
- `.form-input` is used with `.clear().type(...)` — confirm the testid-based selector still chains correctly with Cypress input commands.

---

## TC-004: timeline.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 9 timeline tests pass after selector migration.

### Preconditions

- Migration applied to `cypress/e2e/timeline.cy.js`
- React components render `data-testid` for: `timeline-event`, `timeline-event-content`, `filter-select`, `search-input`, `timeline-track`, `inline-trade-widget`, `trade-btn`

### Steps

1. Search `timeline.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify nested selector `.inline-trade-widget .trade-btn` is migrated to `[data-testid="inline-trade-widget"] [data-testid="trade-btn"]`.
   **Expected:** Descendant combinator (space) is preserved between two `data-testid` selectors.

3. Run `npx cypress run --spec cypress/e2e/timeline.cy.js`.
   **Expected:** All 9 tests (TC-TL-001 through TC-TL-009) pass.

### Test Data

- Standard timeline events must be populated
- Search term `Mahomes` must match at least one event
- Search term `ZZZZZ_NO_MATCH` must match zero events

### Edge Cases

- `a[href*="/player/"]` inside `.within()` block — this is an attribute selector, not a class selector. It should remain unchanged.

---

## TC-005: watchlist.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 6 watchlist tests pass after migration.

### Preconditions

- Migration applied to `cypress/e2e/watchlist.cy.js`
- React components render `data-testid` for: `empty-state`, `quick-add-player`, `toast`, `watchlist-grid`, `remove-button`, `watchlist-card-wrapper`, `watchlist-button`

### Steps

1. Search `watchlist.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify compound selector `.watchlist-card-wrapper a[href*="/player/"]` is migrated correctly.
   **Expected:** `[data-testid="watchlist-card-wrapper"] a[href*="/player/"]`.

3. Run `npx cypress run --spec cypress/e2e/watchlist.cy.js`.
   **Expected:** All 6 tests (TC-WL-001 through TC-WL-006) pass.

### Test Data

- Player `mahomes` must be available for watchlist addition

### Edge Cases

- TC-WL-006 uses `.watchlist-button` from the player detail page (cross-page interaction). Confirm that both the watchlist page and player detail page have the corresponding `data-testid` attributes.

---

## TC-006: portfolio.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 8 portfolio tests pass after migration.

### Preconditions

- Migration applied to `cypress/e2e/portfolio.cy.js`
- React components render `data-testid` for: `holdings-list`, `holding-row`, `portfolio-summary`, `summary-card`, `summary-label`, `summary-value`, `player-name`, `holding-shares`, `holding-cost`, `holding-value`, `holding-gain`

### Steps

1. Search `portfolio.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify `nav a[href="/portfolio"]` and `nav a[href="/market"]` selectors — these use element + attribute selectors, NOT class selectors. Confirm they are preserved unchanged OR migrated to `[data-testid="nav-link-portfolio"]` etc. per project convention.
   **Expected:** Consistent approach; either left as-is (since they don't use CSS classes) or migrated to data-testid.

3. Verify compound selector `.trade-button.buy` is migrated to `[data-testid="trade-button-buy"]`.
   **Expected:** Single data-testid attribute replacing dual-class selector.

4. Run `npx cypress run --spec cypress/e2e/portfolio.cy.js`.
   **Expected:** All 8 tests (TC-PF-001 through TC-PF-008) pass.

### Test Data

- Midweek scenario with 3 starting holdings

### Edge Cases

- `.summary-label` used with `.trigger('mouseenter')` — confirm testid-based selector still supports Cypress trigger commands.
- `player-name` testid is shared between portfolio's holding-row context and player-detail page. Confirm no naming collision (the `.within()` scope prevents ambiguity at runtime, but the testid name should still be unique or contextual).

---

## TC-007: mission.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 8 mission tests pass after migration.

### Preconditions

- Migration applied to `cypress/e2e/mission.cy.js`
- React components render `data-testid` for: `mission-page`, `daily-mission`, `help-toggle`, `mission-help`, `selector-btn-up`, `selector-btn-down`, `picks-column-risers`, `picks-column-fallers`, `pick-chip`, `reveal-button`, `mission-results`, `reset-button`, `player-selector`

### Steps

1. Search `mission.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify complex compound selectors are handled correctly:
   - `.selector-btn.up` → `[data-testid="selector-btn-up"]`
   - `.selector-btn.down` → `[data-testid="selector-btn-down"]`
   - `.picks-column.risers .pick-chip:not(.empty)` → appropriate testid-based equivalent (e.g., `[data-testid="picks-column-risers"] [data-testid="pick-chip"]:not([data-testid="pick-chip-empty"])` or a simplified approach)
   **Expected:** All compound/pseudo selectors have a clear, working testid-based replacement.

3. Run `npx cypress run --spec cypress/e2e/mission.cy.js`.
   **Expected:** All 8 tests (TC-MS-001 through TC-MS-008) pass.

### Test Data

- At least 6 players must be available for pick selection

### Edge Cases

- `.picks-column.risers .pick-chip:not(.empty) button` — three-level compound selector with pseudo-class. The migrated version must correctly target the remove button inside non-empty pick chips. This is the most complex selector in the entire migration.

---

## TC-008: onboarding.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 5 onboarding tests pass after migration.

### Preconditions

- Migration applied to `cypress/e2e/onboarding.cy.js`
- React components render `data-testid` for: `onboarding-overlay`, `onboarding-modal`, `next-button`, `back-button`, `step-dot`, `skip-button`

### Steps

1. Search `onboarding.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify `.step-dot.active` compound selector is migrated. Options: `[data-testid="step-dot"].active` (if active is a CSS state class) or `[data-testid="step-dot-active"]`.
   **Expected:** The chosen approach correctly identifies the active step dot.

3. Run `npx cypress run --spec cypress/e2e/onboarding.cy.js`.
   **Expected:** All 5 tests (TC-OB-001 through TC-OB-005) pass.

### Test Data

- Fresh app state (no `mcqueen-onboarded` in localStorage)

### Edge Cases

- TC-OB-003 checks `.back-button` with `.should('not.exist')` — confirm `[data-testid="back-button"]` correctly returns zero elements on step 0.

---

## TC-009: toasts.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 3 toast tests pass after migration.

### Preconditions

- Migration applied to `cypress/e2e/toasts.cy.js`
- React components render `data-testid` for: `toast`, `toast-success`, `toast-close`, `trade-button-buy`, `form-input`, `players-grid`

### Steps

1. Search `toasts.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Run `npx cypress run --spec cypress/e2e/toasts.cy.js`.
   **Expected:** All 3 tests (TC-TOAST-001 through TC-TOAST-003) pass.

### Test Data

- None (standard app data)

### Edge Cases

- `.toast` selector is used for both visibility checks (`should('be.visible')`) and non-existence checks (`should('not.exist')`). Confirm both work with the testid selector.

---

## TC-010: leaderboard.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 5 leaderboard tests pass after migration. This file already uses `[class*="..."]` partial-match selectors (likely due to CSS Modules), which are also fragile and must be migrated.

### Preconditions

- Migration applied to `cypress/e2e/leaderboard.cy.js`
- React components render `data-testid` for: `leaderboard-table`, `table-row`, `col-trader`, `col-value`, `col-gain`, `user-rank-card`, `rank-badge`, `rank-value`, `user-row`

### Steps

1. Search `leaderboard.cy.js` for remaining `[class*="..."]` selectors and `.text-up` class selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify `[class*="leaderboard-table"]` becomes `[data-testid="leaderboard-table"]`, `[class*="table-row"]` becomes `[data-testid="table-row"]`, etc.
   **Expected:** Each partial-class-match selector maps to an exact data-testid match.

3. Verify `.text-up` (TC-LB-006) is migrated — this is a utility/color class, not a component class. Determine if it should become a `data-testid` or if the test should assert color/style differently.
   **Expected:** Either `[data-testid="text-up"]` or the assertion is refactored to check computed style or a semantic attribute.

4. Run `npx cypress run --spec cypress/e2e/leaderboard.cy.js`.
   **Expected:** All 5 tests pass.

### Test Data

- Leaderboard must have at least 10 entries (3 with medal icons)

### Edge Cases

- Emoji assertions (`🥇`, `🥈`, `🥉`) are content checks, not selector checks — they should remain unchanged.

---

## TC-011: navigation.cy.js — all CSS class selectors replaced

**Priority:** P0
**Type:** Functional

### Objective

Verify all 6 navigation tests pass after migration.

### Preconditions

- Migration applied to `cypress/e2e/navigation.cy.js`
- React components render `data-testid` for: `nav-link`, `balance-value`, `balance-label`, `header-center`, `help-button`

### Steps

1. Search `navigation.cy.js` for remaining `.class-name` selectors.
   **Expected:** All converted to `[data-testid="..."]`.

2. Verify `nav .nav-link` is migrated to `nav [data-testid="nav-link"]` or `[data-testid="nav-link"]` (depending on whether the `nav` element prefix is kept).
   **Expected:** The selector correctly matches all 6 navigation links.

3. Verify `nav a[href="/market"]` style selectors — these use element + attribute selectors (NOT class selectors). Determine whether they need migration.
   **Expected:** Either left as-is (no CSS class involved) or migrated to `[data-testid="nav-link-market"]` for consistency. Approach is documented.

4. Verify `.have.class` assertions for `active` state on nav links remain intact.
   **Expected:** `have.class` assertions are unchanged — they test CSS class state, not selector strategy.

5. Run `npx cypress run --spec cypress/e2e/navigation.cy.js`.
   **Expected:** All 6 tests (TC-NAV-001 through TC-NAV-006) pass.

### Test Data

- None (standard app)

### Edge Cases

- TC-NAV-005 uses `cy.get('body').type('{esc}')` — not a class selector, should remain unchanged.

---

## TC-012: No CSS class selectors remain in any spec file

**Priority:** P0
**Type:** Regression

### Objective

A sweep verification that no `.class-name` selectors were accidentally left behind in any of the 11 files.

### Preconditions

- Migration complete across all files

### Steps

1. Run a grep/search across all Cypress spec files and `commands.js` for the pattern `cy.get('.[a-z]` (a `cy.get` call whose selector starts with a dot).
   **Expected:** Zero matches. Every `cy.get` uses `[data-testid="..."]`, `a[href="..."]`, or another non-class-based selector.

2. Run the same search for `cy.get("[class` and `cy.get('[class` to catch `[class*="..."]` partial-match patterns (used in leaderboard.cy.js).
   **Expected:** Zero matches.

### Test Data

- N/A

### Edge Cases

- False positives: `.should('have.class', ...)` is NOT a selector — it's an assertion and should be excluded from the search.
- `.contains(...)` calls are text-based, not class-based — they should be excluded.

---

## TC-013: React components have corresponding data-testid attributes

**Priority:** P0
**Type:** Integration

### Objective

Every `data-testid` value referenced in test selectors must exist on an actual DOM element rendered by the React components. A missing attribute will cause silent test failures (element-not-found timeouts).

### Preconditions

- All spec files migrated
- Application source code updated with `data-testid` attributes

### Steps

1. Compile a list of all unique `data-testid` values used across all 11 files.
   **Expected:** A canonical list is produced (estimated 50+ unique testids).

2. For each `data-testid` value, search the React source (`src/`) for `data-testid="<value>"`.
   **Expected:** Every testid referenced in Cypress files has exactly one (or contextually correct number of) corresponding source occurrence.

3. Start the dev server and visit each major page (`/`, `/market`, `/player/mahomes`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`). In DevTools, run `document.querySelectorAll('[data-testid]')` on each page.
   **Expected:** All expected testid elements are present in the DOM.

### Test Data

- Full application with midweek scenario data

### Edge Cases

- Conditional elements (e.g., `error-state` only renders for invalid player IDs, `holdings-card` only renders after a purchase). Verify these testids are present when the condition is met.
- `toast` elements are transient — they appear briefly after an action. Verify the testid is present during the toast's visible duration.

---

## TC-014: data-testid naming convention is consistent

**Priority:** P1
**Type:** Functional

### Objective

All `data-testid` values should follow a consistent naming convention (kebab-case, descriptive, no abbreviations that differ from the original class names).

### Preconditions

- Migration complete

### Steps

1. Extract all `data-testid` values from the 11 migrated files.
   **Expected:** All values use kebab-case (e.g., `player-card`, `trade-button-buy`).

2. Verify no testid uses camelCase, PascalCase, snake_case, or contains special characters.
   **Expected:** Pattern `^[a-z][a-z0-9-]*$` matches every testid value.

3. Verify compound CSS selectors (e.g., `.trade-button.buy`) map to hyphenated testids (e.g., `trade-button-buy`), not dot-separated or space-separated values.
   **Expected:** Each compound selector maps to a single descriptive testid.

### Test Data

- N/A

### Edge Cases

- The pattern `.selector-btn.up` could become `selector-btn-up` or `selector-button-up`. Either is acceptable as long as it's consistent.

---

## TC-015: Full E2E suite passes after migration

**Priority:** P0
**Type:** Regression

### Objective

Run the entire Cypress test suite to confirm no regressions were introduced by the migration.

### Preconditions

- All 11 files migrated
- All React components updated with `data-testid` attributes
- Dev server is running

### Steps

1. Run `npx cypress run` (full suite).
   **Expected:** All tests across all 11 spec files (including `smoke.cy.js`) pass. Zero failures.

2. Check the Cypress output for any warnings about deprecated or unknown selectors.
   **Expected:** No warnings related to selectors.

### Test Data

- Standard midweek scenario

### Edge Cases

- `smoke.cy.js` was not listed in the migration scope — verify it does not use CSS class selectors, or if it does, that it was also migrated.

---

## TC-016: data-testid attributes do not leak into production bundle styling

**Priority:** P1
**Type:** Regression

### Objective

Adding `data-testid` attributes must not interfere with existing CSS styles, component rendering, or conditional logic.

### Preconditions

- React components updated with `data-testid` attributes
- Application builds successfully

### Steps

1. Run `npm run build` (production build).
   **Expected:** Build completes with zero errors and zero new warnings.

2. Visually inspect each page (`/`, `/market`, `/player/mahomes`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`) in the browser.
   **Expected:** All pages render identically to pre-migration state. No layout shifts, missing elements, or style changes.

### Test Data

- N/A

### Edge Cases

- If the project uses a Babel/Vite plugin to strip `data-testid` in production, verify it is configured correctly and the attributes are only present in test/dev builds.

---

## TC-017: Assertions using `.have.class` are preserved correctly

**Priority:** P1
**Type:** Functional

### Objective

Several tests assert CSS class state via `.should('have.class', 'active')` or `.should('be.disabled')`. These assertions must NOT be changed during the migration — only the `cy.get(...)` selector should change.

### Preconditions

- Migration complete

### Steps

1. Search all spec files for `.should('have.class'` occurrences.
   **Expected:** All instances are preserved exactly as before. Files affected: `market.cy.js` (sort-tab active), `player-detail.cy.js` (trading-tab active), `navigation.cy.js` (nav link active), `onboarding.cy.js` (step-dot active).

2. Verify that the elements found by the new `[data-testid="..."]` selector still have the expected CSS classes (`active`, `disabled`, etc.) at runtime.
   **Expected:** The `have.class` assertions pass because the elements retain their CSS classes — `data-testid` is additive, not replacing class attributes.

### Test Data

- N/A

### Edge Cases

- If the project uses CSS Modules, the actual class name at runtime might be hashed (e.g., `active_abc123`). Verify `have.class` assertions account for this, or that the app uses non-module classes for state indicators.

---

## TC-018: Compound and descendant selectors are migrated correctly

**Priority:** P0
**Type:** Functional

### Objective

Several tests use compound selectors (`.class1.class2`) or descendant selectors (`.parent .child`). These require careful migration to avoid breaking the query chain.

### Preconditions

- Migration complete

### Steps

1. Verify each compound selector migration:
   - `.trade-button.buy` → `[data-testid="trade-button-buy"]`
   - `.trade-button.sell` → `[data-testid="trade-button-sell"]`
   - `.selector-btn.up` → `[data-testid="selector-btn-up"]`
   - `.selector-btn.down` → `[data-testid="selector-btn-down"]`
   - `.picks-column.risers` → `[data-testid="picks-column-risers"]`
   - `.picks-column.fallers` → `[data-testid="picks-column-fallers"]`
   - `.step-dot.active` → appropriate testid-based equivalent
   **Expected:** Each compound selector maps to a single `data-testid` value (not two separate attributes).

2. Verify each descendant selector migration:
   - `.inline-trade-widget .trade-btn` → `[data-testid="inline-trade-widget"] [data-testid="trade-btn"]`
   - `.picks-column.risers .pick-chip:not(.empty)` → appropriate testid-based equivalent
   - `.players-grid a[href*="/player/"]` → `[data-testid="players-grid"] a[href*="/player/"]`
   - `nav .nav-link` → `nav [data-testid="nav-link"]`
   **Expected:** Descendant combinators are preserved; each class segment is replaced independently.

3. Verify pseudo-class selectors:
   - `.pick-chip:not(.empty)` → determine testid-based approach (e.g., `:not([data-empty])` or filtering by a testid attribute)
   **Expected:** The pseudo-class logic is correctly replicated.

4. Run the full test suite.
   **Expected:** All compound/descendant/pseudo-class selectors resolve to the correct elements.

### Test Data

- Mission page with available picks (for compound selector tests)

### Edge Cases

- `.picks-column.risers .pick-chip:not(.empty) button` — four-part selector. Verify the entire chain resolves correctly after migration.
- `.toast-success` and `.toast-close` are variants of `.toast` — ensure each has its own distinct testid (not all sharing `data-testid="toast"`).
