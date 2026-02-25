# Test Plan: mcq-63p -- CSS Module Class Fixes

## Summary

- **Bead:** `mcq-63p`
- **Feature:** Fix raw-string className references that bypass CSS Module hashing, restoring styling across onboarding, navigation, player detail content tiles, and daily mission result chips
- **Total Test Cases:** 16
- **Test Types:** Functional, UI/Visual, Regression, Integration

---

## TC-001: Onboarding content wrapper uses CSS module reference

**Priority:** P0
**Type:** Functional

### Objective

Verify that the onboarding content wrapper div references `styles['onboarding-content']` instead of the raw string `onboarding-content`, so that CSS Module hashing resolves correctly.

### Preconditions

- mcq-63p.1 fix is applied
- Source file: `src/components/Onboarding/Onboarding.tsx` (around line 146)

### Steps

1. Open `src/components/Onboarding/Onboarding.tsx` and locate the content wrapper div (line ~146)
   **Expected:** The `className` value uses `styles['onboarding-content']` (e.g., via template literal `${styles['onboarding-content']}`) — not the raw string `onboarding-content`

2. Search the entire file for any remaining raw string class names that should use CSS module references
   **Expected:** No raw class strings exist that correspond to classes defined in `Onboarding.module.css`

### Test Data

- Grep pattern: `className=` in `Onboarding.tsx`

### Edge Cases

- If the highlight conditional is also on this element, confirm it too uses a `styles[...]` reference (see TC-002)

---

## TC-002: Onboarding highlight classes use CSS module references or are removed

**Priority:** P0
**Type:** Functional

### Objective

Verify that the conditional highlight class (`highlight-${currentStep.highlight}`) is either converted to a CSS module reference or removed if the classes are not defined in the module CSS.

### Preconditions

- mcq-63p.1 fix is applied
- Source files: `Onboarding.tsx` and `Onboarding.module.css`

### Steps

1. Open `Onboarding.module.css` and search for classes matching `highlight-virtual`, `highlight-colors`, `highlight-cta`
   **Expected:** Either these classes exist in the module CSS, OR the highlight conditional has been removed from the JSX

2. If highlight classes exist in the CSS, open `Onboarding.tsx` and check that the highlight className uses `styles[`highlight-${currentStep.highlight}`]` or equivalent module reference
   **Expected:** The className expression resolves through the `styles` object — no raw string interpolation

3. If highlight classes do NOT exist in the CSS, confirm the conditional highlight class is removed from the template literal
   **Expected:** No dangling raw class names in the className expression

### Test Data

- `currentStep.highlight` values: `'virtual'`, `'colors'`, `'cta'`, and `undefined`/falsy

### Edge Cases

- When `currentStep.highlight` is `undefined` or an empty string, the className should not include `undefined` or an empty fragment — only the base `onboarding-content` module class
- When `currentStep.highlight` is a value with no matching CSS class, `styles[...]` returns `undefined` — confirm the fallback produces a clean className (no literal `undefined` in the DOM)

---

## TC-003: Onboarding content area displays correct padding and centering

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that after the CSS module fix, the onboarding content area renders with the expected `padding: 20px 40px 40px` and `text-align: center`.

### Preconditions

- mcq-63p.1 fix is applied
- localStorage cleared so onboarding is triggered
- App running in a browser

### Steps

1. Clear localStorage and navigate to the app root
   **Expected:** The onboarding overlay appears

2. Inspect the onboarding content wrapper element in DevTools
   **Expected:** The element's `class` attribute contains a hashed CSS module class (e.g., `_onboarding-content_abc12`) — NOT the raw string `onboarding-content`

3. Check computed styles of the content wrapper
   **Expected:** `padding: 20px 40px 40px` and `text-align: center` are applied

4. Resize the viewport to below the mobile breakpoint (e.g., 480px width)
   **Expected:** Padding changes to `16px 24px 32px` per the responsive media query

### Test Data

- Desktop viewport: 1280×800
- Mobile viewport: 480×800

### Edge Cases

- If the onboarding overlay has `overflow: hidden` or similar, confirm content is not clipped by the padding

---

## TC-004: Existing onboarding tests pass after fix

**Priority:** P0
**Type:** Regression

### Objective

Verify that all existing unit/integration tests for the Onboarding component continue to pass after the CSS module class fix.

### Preconditions

- mcq-63p.1 fix is applied
- Test runner (Vitest) available

### Steps

1. Run `npx vitest run --reporter=verbose` scoped to onboarding test files
   **Expected:** All existing tests pass with zero failures

2. Check that no tests rely on querying by raw class name `onboarding-content`
   **Expected:** If any tests used `querySelector('.onboarding-content')`, they are updated to use `data-testid` or the hashed class

### Test Data

- Test file: `src/components/Onboarding/Onboarding.test.tsx` (or similar)

### Edge Cases

- Snapshot tests may need updating if the rendered className output has changed

---

## TC-005: All six NavLink components use styles['nav-link'] for base class

**Priority:** P0
**Type:** Functional

### Objective

Verify that every `NavLink` in the Layout component uses `styles['nav-link']` instead of the raw string `nav-link`.

### Preconditions

- mcq-63p.2 fix is applied
- Source file: `src/components/Layout/Layout.tsx`

### Steps

1. Open `Layout.tsx` and locate all six `NavLink` components (Timeline, Market, Portfolio, Watchlist, Mission, Leaderboard)
   **Expected:** All six NavLink `className` callbacks reference `styles['nav-link']`

2. Search the file for any remaining occurrence of the raw string `'nav-link'` used as a class name (outside of `styles[...]`)
   **Expected:** Zero occurrences of raw `nav-link` in className expressions

### Test Data

- Six NavLinks at approximately lines 78, 89, 99, 109, 119, 129

### Edge Cases

- Confirm the `className` is still a function `({ isActive }) => ...` (required by React Router's NavLink)

---

## TC-006: NavLink active state uses styles['active'] via isActive callback

**Priority:** P0
**Type:** Functional

### Objective

Verify that the active state class is applied via `styles['active']` within the `isActive` callback, not as a raw string `'active'`.

### Preconditions

- mcq-63p.2 fix is applied

### Steps

1. Open `Layout.tsx` and inspect each NavLink className callback
   **Expected:** The isActive conditional uses `styles['active']` or `styles.active` — e.g., `${isActive ? styles['active'] : ''}`

2. Verify `Layout.module.css` defines `.nav-link.active` (compound selector)
   **Expected:** The compound selector `.nav-link.active` exists with `background: var(--color-primary)` and `color: white`

### Test Data

- All six NavLink components

### Edge Cases

- When no route is active (e.g., 404 page), no NavLink should have the active class
- The `end` prop on the Timeline NavLink (`to="/"`) should prevent it from being active on all routes

---

## TC-007: Navigation links display correct visual styling

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that after the fix, navigation links render with proper padding, font-weight, gap, and the active link has a primary-color background with white text.

### Preconditions

- mcq-63p.2 fix is applied
- App running in a browser

### Steps

1. Load the app and observe the navigation bar
   **Expected:** All six nav links are visually styled with padding, proper font weight, and icon alignment (flex, gap: 8px)

2. Inspect any nav link element in DevTools
   **Expected:** The element's class attribute contains a hashed CSS module class (e.g., `_nav-link_x1y2z`) — NOT the raw string `nav-link`

3. Click the "Market" nav link to navigate to /market
   **Expected:** The Market link receives the active styling — primary color background (`var(--color-primary)`) and white text

4. Confirm the previously active link (Timeline) loses the active styling
   **Expected:** Timeline link reverts to default styling (no primary background)

5. Hover over an inactive nav link
   **Expected:** Hover state shows `background: var(--color-bg-elevated)` and `color: var(--color-text-primary)`

### Test Data

- Navigate to each of the six routes: `/`, `/market`, `/portfolio`, `/watchlist`, `/mission`, `/leaderboard`

### Edge Cases

- On narrow viewports, confirm nav links reduce padding to `8px 14px` and font-size to `13px` per the responsive breakpoint in `Layout.module.css`

---

## TC-008: Existing Layout/navigation tests pass after fix

**Priority:** P0
**Type:** Regression

### Objective

Verify that all existing tests for the Layout component pass after the nav link CSS module fix.

### Preconditions

- mcq-63p.2 fix is applied

### Steps

1. Run `npx vitest run --reporter=verbose` scoped to Layout test files
   **Expected:** All existing tests pass

2. Search test files for any assertions against raw class name `nav-link` or `active`
   **Expected:** Tests use `data-testid="nav-link"` or other non-class-based selectors; if any query by `.nav-link`, they are updated

### Test Data

- Test file: `src/components/Layout/Layout.test.tsx` (or similar)

### Edge Cases

- Integration tests that render routes within the Layout should still correctly detect active states

---

## TC-009: PlayerDetail content tile type badge uses CSS module reference

**Priority:** P1
**Type:** Functional

### Objective

Verify that content tile type badges use `styles[tile.type]` (or equivalent) instead of the raw `tile.type` string, so that type-specific color-coded backgrounds resolve through CSS Modules.

### Preconditions

- mcq-63p.3 fix is applied
- Source file: `src/pages/PlayerDetail/PlayerDetail.tsx` (around line 483)

### Steps

1. Open `PlayerDetail.tsx` and locate the content tile type badge `<span>` (line ~483)
   **Expected:** The className uses `styles[tile.type]` or `styles[tile.type] || ''` — NOT the raw `${tile.type}`

2. Verify `PlayerDetail.module.css` defines individual classes for `.article`, `.video`, `.analysis`, `.news` (separate from the compound `.tile-type.article` selectors)
   **Expected:** Either individual classes exist (`.article { ... }`), OR the compound selectors have been refactored so both parts resolve through CSS Modules

### Test Data

- Content types: `article`, `video`, `analysis`, `news`

### Edge Cases

- CSS Modules with compound selectors (`.tile-type.article`) require both classes to be from the module. If the CSS uses compound selectors, both `styles['tile-type']` and `styles['article']` must be applied for the compound rule to match. Verify the selector strategy works end-to-end.
- If `tile.type` is an unexpected value not in the CSS (e.g., `'podcast'`), `styles[tile.type]` returns `undefined` — confirm this doesn't produce `"undefined"` in the DOM class attribute

---

## TC-010: Content tile type badges show distinct color-coded backgrounds

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that each content type displays the correct color-coded background on the type badge.

### Preconditions

- mcq-63p.3 fix is applied
- A player with content tiles exists in the scenario data
- App running in a browser

### Steps

1. Navigate to a player detail page that has content tiles (e.g., a player with articles/videos)
   **Expected:** Content tiles section is visible

2. Inspect an "article" type badge in DevTools
   **Expected:** Background is `rgba(33, 150, 243, 0.2)` and text color is `#2196f3` (blue)

3. Inspect a "video" type badge
   **Expected:** Background is `rgba(156, 39, 176, 0.2)` and text color is `#9c27b0` (purple)

4. Inspect an "analysis" type badge
   **Expected:** Background is `rgba(255, 152, 0, 0.2)` and text color is `#ff9800` (orange)

5. Inspect a "news" type badge
   **Expected:** Background is `rgba(0, 200, 83, 0.2)` and text color is `#00c853` (green)

### Test Data

- Player with at least one of each content type, or navigate to different players to cover all types

### Edge Cases

- If a player has zero content tiles, the content section should either be hidden or show an empty state — no broken badges

---

## TC-011: Existing PlayerDetail tests pass after fix

**Priority:** P1
**Type:** Regression

### Objective

Verify that all existing tests for the PlayerDetail page continue to pass after the content tile CSS module fix.

### Preconditions

- mcq-63p.3 fix is applied

### Steps

1. Run `npx vitest run --reporter=verbose` scoped to PlayerDetail test files
   **Expected:** All existing tests pass

### Test Data

- Test file: `src/pages/PlayerDetail/PlayerDetail.test.tsx` (or similar)

### Edge Cases

- Snapshot tests may need updating if rendered className output changed

---

## TC-012: DailyMission result chips use styles[status] for correct/incorrect

**Priority:** P1
**Type:** Functional

### Objective

Verify that both result chip locations (risers list at line ~111, fallers list at line ~135) use `styles[status]` instead of the raw `status` string.

### Preconditions

- mcq-63p.4 fix is applied
- Source file: `src/components/DailyMission/DailyMission.tsx`

### Steps

1. Open `DailyMission.tsx` and locate the risers result chip (line ~111)
   **Expected:** The className uses `${styles[status]}` or `${status ? styles[status] : ''}` — NOT the raw `${status}`

2. Locate the fallers result chip (line ~135)
   **Expected:** Same pattern — `styles[status]` instead of raw `${status}`

3. Search the file for any other raw class names that correspond to CSS module classes
   **Expected:** No other raw string class references exist

### Test Data

- `status` values: `'correct'`, `'incorrect'`

### Edge Cases

- If `status` can be `undefined` or `null` (e.g., before mission results are evaluated), confirm `styles[status]` handles the falsy case gracefully (no `undefined` in the DOM class)
- Both risers and fallers lists must be checked — the bug exists in two separate locations

---

## TC-013: Correct predictions display green styling, incorrect display red

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that after the fix, result chips with `correct` status show green feedback and `incorrect` status show red feedback.

### Preconditions

- mcq-63p.4 fix is applied
- Daily mission with submitted picks and evaluated results
- App running in a browser

### Steps

1. Navigate to the Mission page with a completed daily mission that has results
   **Expected:** Result chips are visible in the results grid

2. Inspect a result chip for a correct prediction in DevTools
   **Expected:** Element has hashed CSS module class for `correct`; computed `background` is `var(--color-up-bg)` and `border-color` is `var(--color-up)` (green)

3. Inspect a result chip for an incorrect prediction
   **Expected:** Element has hashed CSS module class for `incorrect`; computed `background` is `var(--color-down-bg)` and `border-color` is `var(--color-down)` (red)

4. Check the status icon within each chip
   **Expected:** Correct chips show "✓" in green (`var(--color-up)`), incorrect chips show "✗" in red (`var(--color-down)`)

### Test Data

- A mission with at least one correct and one incorrect prediction

### Edge Cases

- If all predictions are correct, confirm no incorrect styles bleed through
- If all predictions are incorrect, confirm no correct styles bleed through

---

## TC-014: Existing DailyMission tests pass after fix

**Priority:** P1
**Type:** Regression

### Objective

Verify that all existing tests for the DailyMission component pass after the result chip CSS module fix.

### Preconditions

- mcq-63p.4 fix is applied

### Steps

1. Run `npx vitest run --reporter=verbose` scoped to DailyMission test files
   **Expected:** All existing tests pass

### Test Data

- Test file: `src/components/DailyMission/DailyMission.test.tsx` (or similar)

### Edge Cases

- Snapshot tests may need updating if rendered className output changed

---

## TC-015: Full build succeeds with all four CSS module fixes applied

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Vite build completes successfully with all four sub-bead fixes applied, confirming that all CSS module references resolve at build time.

### Preconditions

- All four fixes applied (mcq-63p.1 through mcq-63p.4)

### Steps

1. Run `npm run build` (Vite production build)
   **Expected:** Build completes with zero errors and zero warnings related to CSS module resolution

2. Inspect the built output CSS for hashed class names
   **Expected:** The output CSS contains hashed versions of `onboarding-content`, `nav-link`, `active`, `tile-type`, `article`, `video`, `analysis`, `news`, `result-chip`, `correct`, `incorrect`

3. Run the full test suite: `npx vitest run`
   **Expected:** All tests pass

### Test Data

- N/A

### Edge Cases

- Tree-shaking should not remove any of the newly-referenced CSS module classes

---

## TC-016: No remaining raw className strings across all four components

**Priority:** P0
**Type:** Functional

### Objective

Perform a comprehensive code audit to confirm that no raw className strings remain in the four affected files that should be using CSS module references.

### Preconditions

- All four fixes applied (mcq-63p.1 through mcq-63p.4)

### Steps

1. Search `Onboarding.tsx` for any `className` that uses a string literal without `styles[...]`
   **Expected:** All className values either use `styles[...]`, `styles.xxx`, or are intentionally global (none in this case)

2. Search `Layout.tsx` for any `className` that uses a string literal without `styles[...]`
   **Expected:** All className values use CSS module references

3. Search `PlayerDetail.tsx` for any `className` that uses a string literal without `styles[...]`
   **Expected:** All className values use CSS module references

4. Search `DailyMission.tsx` for any `className` that uses a string literal without `styles[...]`
   **Expected:** All className values use CSS module references

5. Run a project-wide grep: `className="` and `className={\`...raw-string...\`}` patterns across all `.tsx` files
   **Expected:** No new raw string class references exist that should be module references

### Test Data

- Grep pattern: `className="[^{]` or `className={\`[^$]` across `src/**/*.tsx`

### Edge Cases

- Some components may legitimately use non-module classNames for third-party library integration — these should be documented and excluded from the check
