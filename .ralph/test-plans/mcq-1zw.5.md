# Test Plan: mcq-1zw.5 -- Complete CSS Modules migration

## Summary

- **Bead:** `mcq-1zw.5`
- **Feature:** Migrate remaining raw CSS class strings to CSS Modules and replace Cypress `have.class 'active'` hacks with `data-active` attributes
- **Total Test Cases:** 18
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Layout nav links use scoped CSS Modules classes

**Priority:** P0
**Type:** Functional

### Objective

Verify that all 6 NavLink elements in `Layout.tsx` use `styles['nav-link']` from the CSS Module instead of the raw string `'nav-link'`. Raw strings produce no styling in production because CSS Modules hashes class names.

### Preconditions

- Application built with `npm run build` (production mode with hashed CSS class names)
- App served from the production build output

### Steps

1. Open the app at the root route `/`.
   **Expected:** All 6 navigation links (Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard) render with visible nav-link styling (background, padding, font styles defined in `Layout.module.css .nav-link`).

2. Inspect each `<a>` element inside `<nav>` using browser DevTools.
   **Expected:** Each element's `class` attribute contains a hashed class name (e.g., `Layout_nav-link__abc12`), NOT the literal string `nav-link`.

### Test Data

- Routes to check: `/`, `/market`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`

### Edge Cases

- Verify styling is correct in both development mode (unhashed) and production build (hashed). The bug only manifests in production.

---

## TC-002: Active nav link receives scoped active class

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the currently active NavLink receives the CSS Modules scoped `styles['active']` class, producing the correct visual highlight (color, border, background changes defined in `.nav-link.active`).

### Preconditions

- Application running (dev or production build)

### Steps

1. Navigate to `/market`.
   **Expected:** The "Market" nav link is visually highlighted (matches `.nav-link.active` styles). Its `class` attribute includes the hashed active class.

2. Inspect the "Market" link element.
   **Expected:** Class contains a hashed version of `active` (e.g., `Layout_active__xyz89`), NOT the literal string `active`.

3. Inspect all other nav links (Timeline, Portfolio, Watchlist, Mission, Leaderboard).
   **Expected:** None of them have the hashed `active` class.

4. Click "Portfolio" nav link.
   **Expected:** "Portfolio" now has the hashed `active` class. "Market" no longer has it.

### Test Data

- Test on each of the 6 routes: `/`, `/market`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`

### Edge Cases

- Navigate to `/` (root with `end` prop on NavLink). Verify only Timeline is active, not all links that start with `/`.
- Navigate to `/player/mahomes` (nested route not in nav). Verify no nav link is active, or the closest parent route link is active per React Router behavior.

---

## TC-003: Market sort tabs use CSS Modules active class only

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `+ ' active'` concatenation hack has been removed from `Market.tsx` sort tab buttons, and only the scoped `styles['active']` class is applied.

### Preconditions

- Application running in production build

### Steps

1. Navigate to `/market` and wait for the page to load.
   **Expected:** The default sort tab ("Biggest Risers") is visually styled as active (background color, text color per `.sort-tab.active`).

2. Inspect the active sort tab button's `class` attribute.
   **Expected:** Contains a hashed `active` class (e.g., `Market_active__abc12`). Does NOT contain the literal unscoped string `active` as a separate class.

3. Click the "Biggest Fallers" sort tab.
   **Expected:** "Biggest Fallers" gains the hashed active class. "Biggest Risers" loses it. No literal `active` class on any tab.

### Test Data

- Sort tabs: Biggest Risers, Biggest Fallers, Most Active, Highest Price

### Edge Cases

- Click each tab in sequence and verify only one tab is active at a time.
- Rapid-click between tabs to ensure class toggling is clean with no stale classes.

---

## TC-004: Market sort tabs expose `data-active` attribute

**Priority:** P0
**Type:** Functional

### Objective

Verify that active sort tab buttons in `Market.tsx` now include a `data-active="true"` attribute, replacing the old unscoped `active` class that Cypress relied on.

### Preconditions

- Application running

### Steps

1. Navigate to `/market`.
   **Expected:** The default active sort tab has `data-active="true"` attribute.

2. Inspect inactive sort tabs.
   **Expected:** Inactive tabs do NOT have `data-active="true"` (attribute is either absent or set to `"false"`).

3. Click "Most Active" sort tab.
   **Expected:** "Most Active" now has `data-active="true"`. Previously active tab no longer has it.

### Test Data

- None specific

### Edge Cases

- Verify `data-active` is the exact string `"true"` (not `""`, `"1"`, or boolean attribute without value).

---

## TC-005: PlayerDetail trading tabs use CSS Modules active class only

**Priority:** P0
**Type:** Functional

### Objective

Verify that the `+ ' active'` concatenation hack has been removed from `PlayerDetail.tsx` Buy/Sell tab buttons, and only the scoped `styles['active']` class is applied.

### Preconditions

- Application running in production build

### Steps

1. Navigate to `/player/mahomes`.
   **Expected:** The "Buy" trading tab is visually styled as active.

2. Inspect the "Buy" tab button's `class` attribute.
   **Expected:** Contains a hashed `active` class. Does NOT contain the literal unscoped string `active`.

3. Buy 1 share to enable the Sell tab, then click "Sell".
   **Expected:** "Sell" tab gains the hashed active class. "Buy" tab loses it. No literal `active` class on either tab.

### Test Data

- Player: `mahomes` (or any valid player)

### Edge Cases

- When Sell tab is disabled (no holdings), it should not have the active class or `data-active` attribute.

---

## TC-006: PlayerDetail trading tabs expose `data-active` attribute

**Priority:** P0
**Type:** Functional

### Objective

Verify that active trading tab buttons in `PlayerDetail.tsx` now include a `data-active="true"` attribute.

### Preconditions

- Application running

### Steps

1. Navigate to `/player/mahomes`.
   **Expected:** The "Buy" tab has `data-active="true"`. The "Sell" tab does not.

2. Buy 1 share, then click the "Sell" tab.
   **Expected:** "Sell" tab has `data-active="true"`. "Buy" tab no longer has it.

### Test Data

- Player: `mahomes`

### Edge Cases

- Disabled "Sell" tab (no holdings) should not have `data-active="true"`.

---

## TC-007: ScenarioInspector view mode buttons use CSS Modules active class

**Priority:** P0
**Type:** Functional

### Objective

Verify that the 3 view mode toggle buttons in `ScenarioInspector.tsx` (Full Scenario, Single Player, Timeline) use `styles['active']` instead of the raw string `'active'`.

### Preconditions

- Application running in production build
- ScenarioInspector page/panel is accessible

### Steps

1. Open the Scenario Inspector.
   **Expected:** The default view mode button ("Full Scenario") is visually styled as active per `.toggle-buttons button.active` in the CSS Module.

2. Inspect the active button's `class` attribute.
   **Expected:** Contains a hashed `active` class. Does NOT contain the literal string `active`.

3. Click "Single Player" button.
   **Expected:** "Single Player" gains the hashed active class. "Full Scenario" loses it.

4. Click "Timeline" button.
   **Expected:** "Timeline" gains the hashed active class. "Single Player" loses it.

### Test Data

- View modes: `full`, `player`, `timeline`

### Edge Cases

- Verify all three buttons are unstyled as active when their view mode is not selected.

---

## TC-008: Cypress navigation spec updated — active route detection

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Cypress test `navigation.cy.js` TC-NAV-002 ("highlights the active route") has been updated to use `data-active` or a CSS Modules-compatible selector instead of `.should('have.class', 'active')`.

### Preconditions

- Cypress test suite available
- Code changes applied to both production code and Cypress specs

### Steps

1. Run `npx cypress run --spec cypress/e2e/navigation.cy.js`.
   **Expected:** All tests pass, including TC-NAV-002.

2. Review the test code for TC-NAV-002.
   **Expected:** Assertions use `[data-active="true"]` or `data-testid` selectors rather than `.should('have.class', 'active')`. Negative assertions use `.should('not.have.attr', 'data-active', 'true')` or similar.

### Test Data

- None specific

### Edge Cases

- Ensure both the positive assertion (active link) and negative assertion (inactive link) are updated.

---

## TC-009: Cypress market spec updated — sort tab active detection

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Cypress test `market.cy.js` TC-MKT-002 ("sorts players with tabs") has been updated to use `data-active` or a CSS Modules-compatible selector instead of `.should('have.class', 'active')`.

### Preconditions

- Cypress test suite available

### Steps

1. Run `npx cypress run --spec cypress/e2e/market.cy.js`.
   **Expected:** All tests pass, including TC-MKT-002.

2. Review test code.
   **Expected:** All 4 `.should('have.class', 'active')` assertions in TC-MKT-002 replaced with `[data-active="true"]` assertions.

### Test Data

- Sort tabs tested: Biggest Risers, Biggest Fallers, Most Active, Highest Price

### Edge Cases

- None

---

## TC-010: Cypress player-detail spec updated — trading tab active detection

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Cypress tests in `player-detail.cy.js` (TC-PD-005, TC-PD-007, TC-PD-008) have been updated to use `data-active` instead of `.should('have.class', 'active')` for trading tab assertions.

### Preconditions

- Cypress test suite available

### Steps

1. Run `npx cypress run --spec cypress/e2e/player-detail.cy.js`.
   **Expected:** All tests pass, including TC-PD-005 (buys shares — Buy tab active), TC-PD-007 (sells shares — Sell tab active), TC-PD-008 (prevents over-sell — Sell tab active).

2. Review test code.
   **Expected:** All 3 `.should('have.class', 'active')` assertions replaced with `[data-active="true"]` assertions or `.should('have.attr', 'data-active', 'true')`.

### Test Data

- Player: `mahomes`

### Edge Cases

- None

---

## TC-011: Production build succeeds with no CSS warnings

**Priority:** P0
**Type:** Regression

### Objective

Verify that `npm run build` completes successfully after the migration, with no CSS-related warnings about undefined classes or unused exports.

### Preconditions

- All code changes applied

### Steps

1. Run `npm run build`.
   **Expected:** Build completes with exit code 0. No warnings referencing `nav-link`, `active`, or CSS Modules composition errors.

2. Inspect the built CSS output (e.g., `dist/assets/*.css`).
   **Expected:** The `.nav-link` and `.active` rules from `Layout.module.css` are present in the output (hashed). No orphaned raw class references.

### Test Data

- None

### Edge Cases

- None

---

## TC-012: Unit/component tests pass after migration

**Priority:** P0
**Type:** Regression

### Objective

Verify that `npm run test:run` passes with no failures caused by the CSS Modules migration.

### Preconditions

- All code changes applied

### Steps

1. Run `npm run test:run`.
   **Expected:** All tests pass. No failures related to class name assertions or missing styles.

### Test Data

- None

### Edge Cases

- If any unit tests assert on `have.class('active')` or `toHaveClass('active')`, they must also be updated to use `data-active`.

---

## TC-013: Full Cypress suite passes

**Priority:** P0
**Type:** Regression

### Objective

Verify that `npm run cy:run` passes all specs end-to-end, confirming no selectors were broken by the migration.

### Preconditions

- All code and test changes applied
- App build available for Cypress

### Steps

1. Run `npm run cy:run`.
   **Expected:** All 11 spec files pass with 0 failures.

### Test Data

- None

### Edge Cases

- Pay special attention to `navigation.cy.js`, `market.cy.js`, and `player-detail.cy.js` which contain the affected selectors.

---

## TC-014: Visual — Nav link hover state still works

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that nav link hover styling (defined in `.nav-link:hover`) still functions after the className callback migration.

### Preconditions

- Application running

### Steps

1. Navigate to `/market`.
   **Expected:** Page loads normally.

2. Hover over the "Portfolio" nav link (an inactive link).
   **Expected:** Hover styling is applied (opacity change, background highlight, or other hover effects defined in `.nav-link:hover`).

3. Hover over the "Market" nav link (the active link).
   **Expected:** Active styling is maintained; hover does not break the active state appearance.

### Test Data

- None

### Edge Cases

- Test on both desktop and mobile viewport widths (Layout.module.css has a `@media` query at line 245 that changes `.nav-link` styles).

---

## TC-015: Visual — Nav link active state styling matches design

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the active nav link styling (color, border-bottom, font-weight defined in `.nav-link.active`) is correctly applied when using `styles['active']`.

### Preconditions

- Application running in production build

### Steps

1. Navigate to `/portfolio`.
   **Expected:** "Portfolio" nav link is clearly distinguishable as active — typically a different text color, a bottom border, or a background highlight compared to inactive links.

2. Compare against inactive links.
   **Expected:** The visual contrast between active and inactive links is clear and matches the design intent in `Layout.module.css`.

### Test Data

- Check all 6 routes

### Edge Cases

- Verify styling in both light and dark mode if applicable.
- Verify on mobile viewport (responsive breakpoint in `Layout.module.css` line 245+).

---

## TC-016: No raw 'active' class leaks into the DOM

**Priority:** P1
**Type:** Regression

### Objective

Verify that after the migration, no element in the entire app has a literal unscoped `active` class in its `class` attribute. All active styling should use hashed CSS Module class names.

### Preconditions

- Application running in production build

### Steps

1. Navigate to `/market`.
   **Expected:** Page loads.

2. Open browser DevTools console and run: `document.querySelectorAll('.active')`.
   **Expected:** Returns an empty NodeList (0 elements). No element matches the raw `.active` selector.

3. Click a sort tab, then re-run the query.
   **Expected:** Still returns 0 elements.

4. Navigate to `/player/mahomes` and repeat the query.
   **Expected:** 0 elements matching `.active`.

5. Open Scenario Inspector and repeat the query.
   **Expected:** 0 elements matching `.active`.

### Test Data

- Routes: `/market`, `/player/mahomes`, Scenario Inspector

### Edge Cases

- Check the nav bar on every route as well. The NavLink raw `active` class was the most widespread instance.

---

## TC-017: Layout NavLink `data-active` attribute for nav links

**Priority:** P1
**Type:** Functional

### Objective

If the nav links in `Layout.tsx` are also updated to include `data-active` (for consistency with Market/PlayerDetail), verify the attribute is set correctly. If not, verify Cypress navigation specs use an alternative selector (e.g., checking for the hashed class via a regex, or using `aria-current`).

### Preconditions

- Application running

### Steps

1. Navigate to `/market`.
   **Expected:** The "Market" nav link has either `data-active="true"` or React Router's built-in `aria-current="page"` attribute.

2. Check that the Cypress `navigation.cy.js` TC-NAV-002 test uses a selector that works in production.
   **Expected:** The assertion does not rely on the literal string `active` as a class name.

### Test Data

- None

### Edge Cases

- React Router's `NavLink` sets `aria-current="page"` by default on active links. If the Cypress test uses this instead of `data-active`, that is also acceptable.

---

## TC-018: ScenarioInspector active button styling in production

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the ScenarioInspector view mode toggle buttons have correct active styling in production, where the raw `'active'` string would have been invisible.

### Preconditions

- Application running in production build
- ScenarioInspector is accessible

### Steps

1. Open the Scenario Inspector.
   **Expected:** The default active view mode button ("Full Scenario") has visible active styling (per `.toggle-buttons button.active` in `ScenarioInspector.module.css`).

2. Click "Single Player".
   **Expected:** "Single Player" button gains active styling. "Full Scenario" loses it.

3. Click "Timeline".
   **Expected:** "Timeline" button gains active styling. "Single Player" loses it.

4. Inspect each button's `class` attribute.
   **Expected:** Active button has a hashed class name (e.g., `ScenarioInspector_active__xyz`). No literal `active` string.

### Test Data

- None

### Edge Cases

- Verify that only one button appears active at a time across all 3 view modes.
