# Test Plan: mcq-qbm.4 -- Verify Cypress E2E suite passes end-to-end

## Summary

- **Bead:** `mcq-qbm.4`
- **Feature:** Full Cypress E2E suite executes successfully against the refactored codebase with all tests passing
- **Total Test Cases:** 16
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Cypress test runner starts without configuration errors

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Cypress configuration (`cypress.config.js`), support file (`cypress/support/e2e.js`), and code-coverage plugin load without errors so the suite can execute at all.

### Preconditions

- Dev server running at `http://localhost:5173`
- All npm dependencies installed (`npm ci`)
- `@cypress/code-coverage` package available

### Steps

1. Run `npx cypress run --browser electron` from the project root.
   **Expected:** Cypress launches, prints the configuration summary, and begins discovering spec files without import/resolution errors.

2. Observe the console output for plugin initialization.
   **Expected:** `@cypress/code-coverage/task.js` registers its `setupNodeEvents` hooks without throwing.

### Test Data

- `cypress.config.js` — baseUrl `http://localhost:5173`, supportFile `cypress/support/e2e.js`

### Edge Cases

- Run with `--config video=true` to confirm the video flag override works.
- Delete `node_modules/.cache/cypress` and re-run to verify cold-start behavior.

---

## TC-002: All 11 spec files are discovered and executed

**Priority:** P0
**Type:** Functional

### Objective

Confirm Cypress discovers all 11 spec files in `cypress/e2e/` so no test file is silently skipped after the refactor.

### Preconditions

- Cypress configuration valid (TC-001 passes)

### Steps

1. Run `npx cypress run` and capture the summary output.
   **Expected:** The run summary lists exactly 11 spec files: `smoke`, `navigation`, `market`, `player-detail`, `portfolio`, `watchlist`, `timeline`, `leaderboard`, `onboarding`, `mission`, `toasts`.

2. Verify the total test count reported by Cypress.
   **Expected:** Cypress reports 80 tests found (5 + 6 + 8 + 17 + 8 + 6 + 9 + 5 + 5 + 8 + 3). If the issue states 75, document which 5 tests were added or reconcile the count.

### Test Data

- N/A

### Edge Cases

- Rename one spec file temporarily and re-run to verify Cypress reports only 10 specs (confirms discovery is file-based, not cached).

---

## TC-003: Custom Cypress commands load and execute correctly

**Priority:** P0
**Type:** Integration

### Objective

Verify that the three custom commands defined in `cypress/support/commands.js` — `clearAppState`, `skipOnboarding`, and `getPlayerCards` — are registered and function correctly after the refactor.

### Preconditions

- `cypress/support/e2e.js` imports `./commands`
- The app uses `mcqueen`-prefixed localStorage keys

### Steps

1. Run a spec that uses `cy.clearAppState()` (e.g., `navigation.cy.js`).
   **Expected:** No "Cypress command not found" error. All `mcqueen`-prefixed localStorage keys are removed.

2. Run a spec that uses `cy.skipOnboarding()` (e.g., `market.cy.js`).
   **Expected:** Five localStorage keys are set: `mcqueen-onboarded`, `mcqueen-first-trade-seen`, `mcqueen-welcome-dismissed`, `mcqueen-mission-help-seen`, `mcqueen-league-tooltip-seen`.

3. Run a spec that uses `cy.getPlayerCards()` (e.g., `market.cy.js` TC-MKT-001).
   **Expected:** Returns elements matching `[data-testid="player-card"]`.

### Test Data

- N/A

### Edge Cases

- If `commands.js` import path changed during refactor, Cypress will throw at load time — captured by TC-001.

---

## TC-004: Global `beforeEach` ESPN API intercept is active

**Priority:** P1
**Type:** Integration

### Objective

Verify the global `beforeEach` in `cypress/support/e2e.js` intercepts ESPN API calls so tests don't make real network requests.

### Preconditions

- `cypress/support/e2e.js` contains the `cy.intercept('GET', '/espn-api/**', ...)` hook

### Steps

1. Run any spec and open Cypress runner's command log (or inspect console output in headless mode).
   **Expected:** The `@espnApi` intercept alias is registered before each test.

2. Trigger a page load that would normally call the ESPN API.
   **Expected:** The intercepted response returns `{ articles: [] }` and no real HTTP request is made.

### Test Data

- N/A

### Edge Cases

- If the refactored app changes the ESPN API path prefix, the intercept pattern `/espn-api/**` may no longer match — tests depending on articles data would fail or make real requests.

---

## TC-005: Smoke tests pass (5 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify the 5 smoke tests in `smoke.cy.js` pass, confirming the app loads and basic navigation links work at the most fundamental level.

### Preconditions

- Dev server running

### Steps

1. Run `npx cypress run --spec cypress/e2e/smoke.cy.js`.
   **Expected:** All 5 tests pass: homepage loads, bottom nav exists, Market/Portfolio/Leaderboard links navigate correctly.

2. Check that `cy.get('nav')` still matches the refactored navigation element.
   **Expected:** A `<nav>` element exists in the DOM.

3. Check that `a[href="/market"]`, `a[href="/portfolio"]`, `a[href="/leaderboard"]` selectors still match.
   **Expected:** Links exist and clicking them updates the URL.

### Test Data

- N/A

### Edge Cases

- If the refactor changed `<nav>` to a `<div>`, the smoke test for bottom navigation will fail.
- If route paths changed (e.g., `/market` → `/markets`), all navigation tests will fail.

---

## TC-006: Navigation tests pass (6 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 6 tests in `navigation.cy.js` pass, confirming layout, nav links, active-route highlighting, header elements, glossary modal, and scroll-to-top behavior.

### Preconditions

- Onboarding skipped via `cy.skipOnboarding()`

### Steps

1. Run `npx cypress run --spec cypress/e2e/navigation.cy.js`.
   **Expected:** All 6 tests pass.

2. Verify selectors that are likely affected by refactor:
   - `[data-testid="nav-link"]` — 6 instances exist in `<nav>`
   - `[data-testid="balance-value"]`, `[data-testid="balance-label"]`
   - `[data-testid="header-center"]`
   - `[data-testid="help-button"]`
   - `.active` class on nav links
   **Expected:** Each selector resolves to the correct element.

### Test Data

- N/A

### Edge Cases

- If CSS class names changed from `.active` to a different convention (e.g., `[aria-current="page"]`), TC-NAV-002 will fail.
- If the glossary modal dismiss mechanism changed from `Esc` key to a close button, TC-NAV-005 will fail.

---

## TC-007: Market page tests pass (8 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 8 tests in `market.cy.js` pass, covering player card rendering, sort tabs, search filtering, welcome banner, player detail navigation, first-trade guide, loading skeleton, and mini leaderboard sidebar.

### Preconditions

- Onboarding skipped; dev server running

### Steps

1. Run `npx cypress run --spec cypress/e2e/market.cy.js`.
   **Expected:** All 8 tests pass.

2. Verify critical selectors:
   - `[data-testid="players-grid"]`, `[data-testid="player-card"]`
   - `[data-testid="sort-tab"]` with `.active` class
   - `[data-testid="search-input"]`
   - `[data-testid="welcome-banner"]`, `[data-testid="welcome-dismiss"]`
   - `[data-testid="market-sidebar"]`
   - `a[href*="/player/"]` inside the players grid
   **Expected:** Each selector resolves correctly.

### Test Data

- Search term: `KC`
- localStorage key: `mcqueen-welcome-dismissed`

### Edge Cases

- If player card component was renamed/restructured in refactor, `[data-testid="player-card"]` may not match.
- If sort tab labels changed (e.g., "Biggest Risers" → "Top Risers"), tab-selection tests will fail.

---

## TC-008: Player detail page tests pass (17 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 17 tests in `player-detail.cy.js` pass, covering page load, error state, chart rendering, buy/sell trading, quantity validation, watchlist toggle, holdings card, price timeline, content tiles, league owners, back navigation, and image fallback.

### Preconditions

- Onboarding skipped; known player slug `mahomes` exists in data; player slug `hill` exists with no holdings

### Steps

1. Run `npx cypress run --spec cypress/e2e/player-detail.cy.js`.
   **Expected:** All 17 tests pass.

2. Verify critical selectors:
   - `[data-testid="player-detail-page"]`, `[data-testid="player-name"]`, `[data-testid="player-price"]`
   - `[data-testid="chart-card"]`, `[data-testid="chart-container"]`
   - `[data-testid="trading-tab"]`, `[data-testid="trade-button"]` with `data-variant`
   - `[data-testid="form-input"]`
   - `[data-testid="watchlist-button"]`
   - `[data-testid="holdings-card"]`
   - `[data-testid="timeline-card"]`, `[data-testid="price-timeline"]`, `[data-testid="timeline-entry"]`
   - `[data-testid="league-owners-card"]`, `[data-testid="league-owner-row"]`
   - `[data-testid="error-state"]`
   - `[data-testid="back-link"]`
   **Expected:** Each selector resolves correctly.

3. Verify trade flow: buy → toast → holdings card appears → sell tab enabled → sell → toast.
   **Expected:** Full round-trip trade works without selector failures.

### Test Data

- Player slugs: `mahomes`, `hill`, `nonexistent-player-id-12345`
- Quantity for boundary test: `999999` (buy), `999` (sell)

### Edge Cases

- If the refactor changed the route from `/player/:slug` to `/players/:id`, all `visitFirstPlayer()` calls will 404.
- If the trading form input was refactored from `<input>` to a custom component, `cy.clear().type()` may not work.
- If error state component was renamed, TC-PD-002 will fail silently (no element found).

---

## TC-009: Portfolio page tests pass (8 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 8 tests in `portfolio.cy.js` pass, covering starting holdings, summary cards, buy-then-verify flow, holdings table columns, navigation to player detail, gain/loss color coding, market navigation, and tooltip hover.

### Preconditions

- Onboarding skipped; scenario data provides 3 starting holdings

### Steps

1. Run `npx cypress run --spec cypress/e2e/portfolio.cy.js`.
   **Expected:** All 8 tests pass.

2. Verify critical selectors:
   - `[data-testid="holdings-list"]`, `[data-testid="holding-row"]`
   - `[data-testid="portfolio-summary"]`, `[data-testid="summary-card"]`
   - `[data-testid="summary-label"]`, `[data-testid="summary-value"]`
   - `[data-testid="player-name"]`, `[data-testid="holding-shares"]`, `[data-testid="holding-cost"]`, `[data-testid="holding-value"]`, `[data-testid="holding-gain"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- Starting scenario provides exactly 3 holdings

### Edge Cases

- If the refactor changed the number of summary cards from 4, TC-PF-002 will fail on the `.should('have.length', 4)` assertion.
- If starting holdings count changed in the scenario data, TC-PF-001 will fail on `.should('have.length', 3)`.

---

## TC-010: Watchlist page tests pass (6 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 6 tests in `watchlist.cy.js` pass, covering empty state, quick-add, removal, player detail navigation, "Browse All Players" CTA, and persistence across reload.

### Preconditions

- Onboarding skipped; watchlist starts empty

### Steps

1. Run `npx cypress run --spec cypress/e2e/watchlist.cy.js`.
   **Expected:** All 6 tests pass.

2. Verify critical selectors:
   - `[data-testid="empty-state"]`
   - `[data-testid="quick-add-player"]`
   - `[data-testid="watchlist-grid"]`, `[data-testid="watchlist-card-wrapper"]`
   - `[data-testid="remove-button"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- Player slug `mahomes` is used for cross-page watchlist persistence test

### Edge Cases

- If watchlist localStorage key format changed, persistence test (TC-WL-006) will fail after reload.
- If "Track Your Favorites" empty-state copy changed, TC-WL-001 will fail.

---

## TC-011: Timeline page tests pass (9 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 9 tests in `timeline.cy.js` pass, covering event loading, type/magnitude filters, search, expand/collapse, inline trading (buy and sell), empty search state, and player detail navigation from event badges.

### Preconditions

- Onboarding skipped; timeline has events in the scenario data

### Steps

1. Run `npx cypress run --spec cypress/e2e/timeline.cy.js`.
   **Expected:** All 9 tests pass.

2. Verify critical selectors:
   - `[data-testid="timeline-event"]`, `[data-testid="timeline-event-content"]`
   - `[data-testid="filter-select"]` (2 instances: type and magnitude)
   - `[data-testid="search-input"]`
   - `[data-testid="inline-trade-widget"]`, `[data-testid="trade-btn"]`
   - `[data-testid="timeline-track"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- Search terms: `Mahomes`, `ZZZZZ_NO_MATCH`
- Filter values: `news`, `all`, `major`

### Edge Cases

- If the refactor changed `<select>` elements to custom dropdowns, `cy.select()` calls in TC-TL-002 and TC-TL-003 will fail.
- If the inline trade widget was restructured, `[data-testid="trade-btn"]` nested inside `[data-testid="inline-trade-widget"]` may not resolve.

---

## TC-012: Leaderboard page tests pass (5 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 5 tests in `leaderboard.cy.js` pass, covering table rendering, medal icons for top 3, user rank card, user row highlighting, and gain percentage color coding.

### Preconditions

- Onboarding skipped; leaderboard data has ≥10 rows

### Steps

1. Run `npx cypress run --spec cypress/e2e/leaderboard.cy.js`.
   **Expected:** All 5 tests pass.

2. Verify critical selectors:
   - `[data-testid="leaderboard-table"]`, `[data-testid="table-row"]`
   - `[data-testid="col-trader"]`, `[data-testid="col-value"]`, `[data-testid="col-gain"]`
   - `[data-testid="user-rank-card"]`, `[data-testid="rank-badge"]`, `[data-testid="rank-value"]`
   - `[data-testid="table-row"][data-user]`
   - `[data-testid="col-gain"][aria-label*="Up"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- Medal emojis: 🥇, 🥈, 🥉

### Edge Cases

- If medals were changed from emoji text to SVG icons, `should('contain.text', '🥇')` will fail.
- If leaderboard rows < 10, the `.should('have.length.gte', 10)` assertion will fail.

---

## TC-013: Onboarding tests pass (5 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 5 tests in `onboarding.cy.js` pass, covering initial display for new users, 6-step progression, back-button navigation, skip functionality, and non-reappearance after completion.

### Preconditions

- App state cleared (no `mcqueen-onboarded` key in localStorage)

### Steps

1. Run `npx cypress run --spec cypress/e2e/onboarding.cy.js`.
   **Expected:** All 5 tests pass.

2. Verify critical selectors:
   - `[data-testid="onboarding-overlay"]`, `[data-testid="onboarding-modal"]`
   - `[data-testid="next-button"]`, `[data-testid="back-button"]`, `[data-testid="skip-button"]`
   - `[data-testid="step-dot"][data-active="true"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- localStorage key: `mcqueen-onboarded`
- Onboarding has 6 steps (loop clicks "next" 5 times, then once more to complete)

### Edge Cases

- If onboarding step count changed (e.g., from 6 to 5), the loop in TC-OB-002 will either click too many times or not enough.
- If the skip button was removed or renamed, TC-OB-004 will fail.

---

## TC-014: Mission page tests pass (8 tests)

**Priority:** P0
**Type:** Regression

### Objective

Verify all 8 tests in `mission.cy.js` pass, covering page load, help panel toggle, riser/faller selection, pick removal, result reveal, reveal-button disabled state, and play-again reset.

### Preconditions

- Onboarding skipped; mission help marked as seen

### Steps

1. Run `npx cypress run --spec cypress/e2e/mission.cy.js`.
   **Expected:** All 8 tests pass.

2. Verify critical selectors:
   - `[data-testid="mission-page"]`, `[data-testid="daily-mission"]`
   - `[data-testid="help-toggle"]`, `[data-testid="mission-help"]`
   - `[data-testid="selector-btn"][data-variant="up"]`, `[data-testid="selector-btn"][data-variant="down"]`
   - `[data-testid="picks-column"][data-variant="risers"]`, `[data-testid="picks-column"][data-variant="fallers"]`
   - `[data-testid="pick-chip"]` with and without `[data-empty]`
   - `[data-testid="reveal-button"]`, `[data-testid="reset-button"]`
   - `[data-testid="mission-results"]`, `[data-testid="player-selector"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- At least 6 players must exist in the mission player list for the 3-risers + 3-fallers selection to work

### Edge Cases

- If pick-chip uses a different attribute than `data-empty` to indicate empty slots, the `:not([data-empty])` selector will fail.
- If the reveal button disabled state is implemented via `aria-disabled` instead of the `disabled` attribute, `.should('be.disabled')` will fail.

---

## TC-015: Toast notification tests pass (3 tests)

**Priority:** P1
**Type:** Regression

### Objective

Verify all 3 tests in `toasts.cy.js` pass, covering success toast on buy, error toast on insufficient funds, and toast dismissal via close button.

### Preconditions

- Onboarding skipped

### Steps

1. Run `npx cypress run --spec cypress/e2e/toasts.cy.js`.
   **Expected:** All 3 tests pass.

2. Verify critical selectors:
   - `[data-testid="toast"]`, `[data-testid="toast"][data-type="success"]`
   - `[data-testid="toast-close"]`
   **Expected:** Each selector resolves correctly.

### Test Data

- Quantity: `999999` for insufficient-funds scenario

### Edge Cases

- If the toast auto-dismiss timing changed (faster), the close-button test may fail because the toast disappears before the click.
- If `data-type="success"` attribute was removed from the toast, TC-TOAST-001 will fail.

---

## TC-016: Full suite runs green with zero failures

**Priority:** P0
**Type:** Integration

### Objective

Run the complete Cypress suite in a single invocation and confirm zero failures, verifying there are no cross-spec side effects (e.g., localStorage pollution between spec files).

### Preconditions

- Dev server running at `http://localhost:5173`
- All dependencies installed
- No other Cypress instances running

### Steps

1. Run `npx cypress run` (no `--spec` filter) from the project root.
   **Expected:** Cypress runs all 11 spec files sequentially. The final summary shows 0 failures.

2. Review the total test count in the Cypress summary.
   **Expected:** Total tests = 80 (or 75 if 5 tests were intentionally removed during refactor). Document the exact count.

3. Review the total run time.
   **Expected:** Suite completes within a reasonable time (< 5 minutes). No individual spec hangs or times out.

4. Check for any "skipped" or "pending" tests in the output.
   **Expected:** 0 skipped, 0 pending. All tests executed.

### Test Data

- N/A

### Edge Cases

- Run the suite twice in succession to verify no flaky tests that pass on first run but fail on second due to state leakage.
- Run with `--browser chrome` and `--browser electron` to verify cross-browser compatibility.
- If any tests were modified to fix selector issues, document what changed and verify the modification count is "minimal" per the acceptance criteria.
