# Test Plan: mcq-63p.1 -- Fix Onboarding content wrapper CSS module class

## Summary

- **Bead:** `mcq-63p.1`
- **Feature:** Ensure the onboarding content wrapper and highlight classes use CSS module references so that padding, text-align, and highlight styles are applied correctly.
- **Total Test Cases:** 8
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: `onboarding-content` class is applied via CSS module reference

**Priority:** P0
**Type:** Functional

### Objective

Verify that the content wrapper div uses `styles['onboarding-content']` (a CSS module hashed class) instead of the raw string `onboarding-content`. This is the core bug fix.

### Preconditions

- Application is running locally with CSS modules enabled (Vite/webpack config unchanged).
- `localStorage` has no `mcqueen-onboarded` key so the onboarding modal appears.

### Steps

1. Open the app in a browser and trigger the onboarding overlay.
   **Expected:** The onboarding modal appears with the content area visible.

2. Inspect the content wrapper `<div>` (the `motion.div` wrapping the icon, title, subtitle, and text) using browser DevTools.
   **Expected:** The element's `class` attribute contains a CSS-module-hashed class name (e.g., `_onboarding-content_a1b2c`) rather than the literal raw string `onboarding-content`.

3. Verify the hashed class name matches the `.onboarding-content` rule in the compiled CSS.
   **Expected:** The DevTools "Styles" panel shows the `.onboarding-content` rule is matched and applied to the element.

### Test Data

- No special data required; default first-visit state.

### Edge Cases

- Hard-refresh (Ctrl+Shift+R) to ensure no stale CSS cache masks the issue.

---

## TC-002: Padding is applied to the content wrapper

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that the `padding: 20px 40px 40px` declared in `.onboarding-content` is actually applied to the content wrapper element, confirming the CSS module class is functional.

### Preconditions

- Onboarding modal is visible (no prior onboarding completion in localStorage).
- Viewport width is > 500px (above the responsive breakpoint).

### Steps

1. Open the onboarding modal and inspect the content wrapper div in DevTools.
   **Expected:** Computed padding is `20px` top, `40px` left and right, `40px` bottom.

2. Visually confirm the content (icon, title, subtitle, body text) has generous horizontal and bottom padding within the modal.
   **Expected:** Text and icon are clearly inset from the modal edges, not flush against them.

### Test Data

- None.

### Edge Cases

- If padding is `0` or noticeably absent, the CSS module class is not being applied (regression).

---

## TC-003: Text alignment is applied to the content wrapper

**Priority:** P0
**Type:** UI/Visual

### Objective

Verify that `text-align: center` from `.onboarding-content` is applied, centering the icon, title, subtitle, and body text.

### Preconditions

- Onboarding modal is visible.

### Steps

1. Open the onboarding modal on the first step ("Welcome to McQueen").
   **Expected:** The football emoji icon, the title, subtitle, and body text are all horizontally centered within the content area.

2. Inspect the content wrapper in DevTools and check the computed `text-align` property.
   **Expected:** `text-align` is `center`.

### Test Data

- None.

### Edge Cases

- If text appears left-aligned, the CSS module class is not being applied.

---

## TC-004: Highlight class for steps with `highlight: 'virtual'` is handled correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that when the current step has `highlight: 'virtual'`, the content wrapper either applies a CSS-module-referenced `highlight-virtual` class or gracefully omits it without injecting a raw string class.

### Preconditions

- Onboarding modal is visible.

### Steps

1. Navigate to step 2 ("Your Starting Balance") which has `highlight: 'virtual'`.
   **Expected:** The step renders without errors. The balance demo element ($10,000.00) is displayed.

2. Inspect the content wrapper div's `class` attribute in DevTools.
   **Expected:** One of two valid outcomes:
   - A hashed `highlight-virtual` class is present (if the class was added to the CSS module), OR
   - No raw string `highlight-virtual` appears in the class list (if the fix removes the conditional or guards against undefined lookups).

3. Confirm no `undefined` or `null` literal string appears in the class attribute.
   **Expected:** The class attribute contains only valid, non-empty class names separated by spaces.

### Test Data

- None.

### Edge Cases

- If `styles['highlight-virtual']` is undefined (class not in CSS module), the className should not contain the literal string `undefined`.

---

## TC-005: Highlight class for steps with `highlight: 'colors'` is handled correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `highlight: 'colors'` step correctly references CSS modules for the highlight class or gracefully omits it.

### Preconditions

- Onboarding modal is visible.

### Steps

1. Navigate to step 3 ("Reading the Market") which has `highlight: 'colors'`.
   **Expected:** The step renders correctly. The green/red demo price elements are displayed.

2. Inspect the content wrapper div's `class` attribute in DevTools.
   **Expected:** One of two valid outcomes:
   - A hashed `highlight-colors` class is present (if added to CSS module), OR
   - No raw string `highlight-colors` appears in the class list.

3. Confirm no `undefined` string literal in the class attribute.
   **Expected:** Class attribute contains only valid class names.

### Test Data

- None.

### Edge Cases

- Ensure the demo elements inside this step (`.demo-price.up`, `.demo-price.down`) still use CSS module references and render their green/red styling correctly.

---

## TC-006: Highlight class for steps with `highlight: 'cta'` is handled correctly

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `highlight: 'cta'` step correctly references CSS modules for the highlight class or gracefully omits it.

### Preconditions

- Onboarding modal is visible.

### Steps

1. Navigate to step 6 ("Ready to Trade!") which has `highlight: 'cta'`.
   **Expected:** The step renders correctly.

2. Inspect the content wrapper div's `class` attribute in DevTools.
   **Expected:** One of two valid outcomes:
   - A hashed `highlight-cta` class is present (if added to CSS module), OR
   - No raw string `highlight-cta` appears in the class list.

3. Confirm no `undefined` string literal in the class attribute.
   **Expected:** Class attribute contains only valid class names.

### Test Data

- None.

### Edge Cases

- This is the final step. Confirm the "Start Trading!" button also renders correctly and the final-step styling is unaffected by the highlight fix.

---

## TC-007: Steps with `highlight: null` do not inject spurious classes

**Priority:** P1
**Type:** Regression

### Objective

Verify that steps where `highlight` is `null` (steps 1, 4, 5) do not inject `highlight-null`, `null`, `undefined`, or any empty class name into the content wrapper's className.

### Preconditions

- Onboarding modal is visible.

### Steps

1. Open the onboarding on step 1 ("Welcome to McQueen", `highlight: null`).
   **Expected:** The content wrapper's class attribute contains only the hashed `onboarding-content` class and no extra highlight-related classes.

2. Navigate to step 4 ("Build Your Portfolio", `highlight: null`).
   **Expected:** Same as above — only the `onboarding-content` module class, no spurious strings.

3. Navigate to step 5 ("Daily Predictions", `highlight: null`).
   **Expected:** Same — no `highlight-null`, `null`, or `undefined` in the class list.

### Test Data

- None.

### Edge Cases

- Check that the class attribute does not contain trailing or leading spaces, double spaces, or empty class tokens that could cause selector mismatches.

---

## TC-008: Responsive padding applies at narrow viewports

**Priority:** P2
**Type:** UI/Visual / Regression

### Objective

Verify that the responsive `@media (max-width: 500px)` override for `.onboarding-content` padding (`16px 24px 32px`) still applies after the fix, confirming the CSS module selector chain is intact for media queries.

### Preconditions

- Onboarding modal is visible.

### Steps

1. Resize the browser viewport to 480px wide (or use DevTools device emulation).
   **Expected:** The onboarding modal adjusts to the narrow viewport.

2. Inspect the content wrapper div's computed padding.
   **Expected:** Padding is `16px` top, `24px` left and right, `32px` bottom (per the media query override).

3. Confirm the icon size shrinks to `48px`, title to `28px`, and text to `14px` as defined in the media query.
   **Expected:** All responsive overrides are applied, confirming the CSS module class is correctly referenced and media query selectors match.

### Test Data

- Viewport width: 480px.

### Edge Cases

- Test at exactly 500px (boundary) — at this width the media query should just barely apply.
- Test at 501px — the default (larger) padding should apply.
