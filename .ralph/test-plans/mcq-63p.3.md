# Test Plan: mcq-63p.3 -- Fix PlayerDetail content tile type badge CSS module classes

## Summary

- **Bead:** `mcq-63p.3`
- **Feature:** Content tile type badges use CSS module references so color-coded backgrounds apply correctly
- **Total Test Cases:** 9
- **Test Types:** Functional, UI/Visual, Regression

---

## TC-001: Article tile badge receives CSS module class

**Priority:** P0
**Type:** Functional

### Objective

Verify that a content tile with `type: 'article'` has its type badge rendered with the CSS-module-scoped `.article` class (via `styles['article']`), not a raw unscoped `article` class name.

### Preconditions

- Player has `contentTiles` with at least one tile of `type: 'article'`
- `PlayerDetail.module.css` defines `.article` with `background: rgba(33, 150, 243, 0.2)` and `color: #2196f3`

### Steps

1. Navigate to a PlayerDetail page for a player whose data includes a content tile of type `article`.
   **Expected:** The "Related Content" section renders and the article tile is visible.

2. Inspect the `<span>` element containing the type badge text "article".
   **Expected:** The element's `className` includes two CSS-module-hashed class names: one for `tile-type` and one for `article`. There is NO raw, unscoped class name `article` in the DOM.

3. Verify the computed styles of the badge.
   **Expected:** `background-color` is `rgba(33, 150, 243, 0.2)` and `color` is `rgb(33, 150, 243)` (#2196f3).

### Test Data

- Content tile: `{ type: 'article', title: 'Mahomes dominates', source: 'ESPN', url: 'https://example.com' }`

### Edge Cases

- None for this case; covered by TC-005–TC-008 for edge/negative scenarios.

---

## TC-002: Video tile badge receives CSS module class

**Priority:** P0
**Type:** Functional

### Objective

Verify that a content tile with `type: 'video'` has its type badge rendered with the CSS-module-scoped `.video` class.

### Preconditions

- Player has `contentTiles` with at least one tile of `type: 'video'`
- `PlayerDetail.module.css` defines `.video` with `background: rgba(156, 39, 176, 0.2)` and `color: #9c27b0`

### Steps

1. Navigate to a PlayerDetail page for a player whose data includes a content tile of type `video`.
   **Expected:** The "Related Content" section renders and the video tile is visible.

2. Inspect the `<span>` element containing the type badge text "video".
   **Expected:** The element's `className` includes CSS-module-hashed class names for both `tile-type` and `video`. No raw unscoped `video` class is present.

3. Verify the computed styles of the badge.
   **Expected:** `background-color` is `rgba(156, 39, 176, 0.2)` and `color` is `rgb(156, 39, 176)` (#9c27b0).

### Test Data

- Content tile: `{ type: 'video', title: 'Highlight Reel', source: 'NFL Network', url: 'https://example.com/video' }`

### Edge Cases

- None; see TC-005–TC-008.

---

## TC-003: Analysis tile badge receives CSS module class

**Priority:** P0
**Type:** Functional

### Objective

Verify that a content tile with `type: 'analysis'` has its type badge rendered with the CSS-module-scoped `.analysis` class.

### Preconditions

- Player has `contentTiles` with at least one tile of `type: 'analysis'`
- `PlayerDetail.module.css` defines `.analysis` with `background: rgba(255, 152, 0, 0.2)` and `color: #ff9800`

### Steps

1. Navigate to a PlayerDetail page for a player whose data includes a content tile of type `analysis`.
   **Expected:** The "Related Content" section renders and the analysis tile is visible.

2. Inspect the `<span>` element containing the type badge text "analysis".
   **Expected:** The element's `className` includes CSS-module-hashed class names for both `tile-type` and `analysis`. No raw unscoped `analysis` class is present.

3. Verify the computed styles of the badge.
   **Expected:** `background-color` is `rgba(255, 152, 0, 0.2)` and `color` is `rgb(255, 152, 0)` (#ff9800).

### Test Data

- Content tile: `{ type: 'analysis', title: 'QB Rankings Week 15', source: 'PFF', url: 'https://example.com/analysis' }`

### Edge Cases

- None; see TC-005–TC-008.

---

## TC-004: News tile badge receives CSS module class

**Priority:** P0
**Type:** Functional

### Objective

Verify that a content tile with `type: 'news'` has its type badge rendered with the CSS-module-scoped `.news` class.

### Preconditions

- Player has `contentTiles` with at least one tile of `type: 'news'`
- `PlayerDetail.module.css` defines `.news` with `background: rgba(0, 200, 83, 0.2)` and `color: #00c853`

### Steps

1. Navigate to a PlayerDetail page for a player whose data includes a content tile of type `news`.
   **Expected:** The "Related Content" section renders and the news tile is visible.

2. Inspect the `<span>` element containing the type badge text "news".
   **Expected:** The element's `className` includes CSS-module-hashed class names for both `tile-type` and `news`. No raw unscoped `news` class is present.

3. Verify the computed styles of the badge.
   **Expected:** `background-color` is `rgba(0, 200, 83, 0.2)` and `color` is `rgb(0, 200, 83)` (#00c853).

### Test Data

- Content tile: `{ type: 'news', title: 'Trade Deadline Rumors', source: 'NFL.com', url: 'https://example.com/news' }`

### Edge Cases

- None; see TC-005–TC-008.

---

## TC-005: Unknown tile type gracefully falls back to empty string

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a content tile has a `type` value not defined in the CSS module (e.g., `'podcast'`), the fallback `|| ''` prevents `undefined` from appearing in the class list, and the badge renders with only the base `tile-type` styling.

### Preconditions

- Player has `contentTiles` with a tile whose `type` is not one of `article`, `video`, `analysis`, `news`

### Steps

1. Navigate to a PlayerDetail page for a player whose data includes a content tile of type `podcast` (or any unrecognized type).
   **Expected:** The "Related Content" section renders and the tile is visible.

2. Inspect the `<span>` element containing the type badge text.
   **Expected:** The element's `className` includes only the CSS-module-hashed class for `tile-type`. There is no `undefined`, no `null`, and no raw string `podcast` in the class list.

3. Verify the computed styles of the badge.
   **Expected:** The badge uses the base `.tile-type` styles (font-size: 10px, uppercase text, letter-spacing: 1px, font-weight: 700, padding: 3px 8px, border-radius). No color-coded background is applied — only default/inherited colors.

### Test Data

- Content tile: `{ type: 'podcast', title: 'Fantasy Podcast Ep 12', source: 'Spotify', url: 'https://example.com/podcast' }`

### Edge Cases

- Type is an empty string `''`: className should be `styles['tile-type']` only, no trailing space or `undefined`.
- Type is `undefined` or missing: should not throw; badge should render with base styles only.

---

## TC-006: Multiple tiles with different types render correct per-tile coloring

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a player has multiple content tiles of different types, each badge independently receives the correct CSS module class for its own type.

### Preconditions

- Player has `contentTiles` with at least one of each: `article`, `video`, `analysis`, `news`

### Steps

1. Navigate to a PlayerDetail page for a player with four content tiles of different types.
   **Expected:** Four content tiles render in the "Related Content" section.

2. Inspect the type badge for each tile.
   **Expected:** Each badge has the correct CSS-module-scoped type class matching its own `tile.type` value. No tile inherits another tile's type class.

3. Visually verify badge colors.
   **Expected:**
   - `article` badge: blue tint (`rgba(33, 150, 243, 0.2)` background, `#2196f3` text)
   - `video` badge: purple tint (`rgba(156, 39, 176, 0.2)` background, `#9c27b0` text)
   - `analysis` badge: orange tint (`rgba(255, 152, 0, 0.2)` background, `#ff9800` text)
   - `news` badge: green tint (`rgba(0, 200, 83, 0.2)` background, `#00c853` text)

### Test Data

- Content tiles array with all four types:
  ```
  [
    { type: 'article', title: 'Title A', source: 'ESPN', url: '...' },
    { type: 'video', title: 'Title B', source: 'NFL', url: '...' },
    { type: 'analysis', title: 'Title C', source: 'PFF', url: '...' },
    { type: 'news', title: 'Title D', source: 'NFL.com', url: '...' }
  ]
  ```

### Edge Cases

- Mix of known and unknown types: known types get color-coded badges, unknown types get base styling only.

---

## TC-007: No raw (unscoped) class names leak into the DOM

**Priority:** P0
**Type:** Regression

### Objective

Verify the original bug is fixed: raw class names like `article`, `video`, `analysis`, `news` no longer appear as unscoped classes in the rendered DOM. Only CSS-module-hashed class names should be present.

### Preconditions

- Player has content tiles with known types
- The fix `${styles[tile.type] || ''}` is in place on PlayerDetail.tsx line 483

### Steps

1. Navigate to a PlayerDetail page with content tiles.
   **Expected:** Content tiles render normally.

2. Open browser DevTools and inspect the `<span>` elements for type badges.
   **Expected:** Each `<span>` element's `class` attribute contains only hashed/scoped class names (e.g., `_tile-type_abc12` and `_article_xyz34`). No plain `article`, `video`, `analysis`, or `news` strings appear as class names.

3. Run a DOM query: `document.querySelectorAll('.article, .video, .analysis, .news')` in the DevTools console.
   **Expected:** Returns an empty NodeList (length 0), confirming no unscoped type classes exist in the DOM.

### Test Data

- Any player with content tiles of known types.

### Edge Cases

- None.

---

## TC-008: Badge base styling (tile-type) is always applied

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that regardless of the tile type, every type badge always receives the base `.tile-type` CSS module class and its associated styles.

### Preconditions

- Player has content tiles (any type)

### Steps

1. Navigate to a PlayerDetail page with content tiles.
   **Expected:** Content tiles are visible.

2. Inspect the type badge `<span>` element for any tile.
   **Expected:** The element's `className` always includes the CSS-module-hashed class for `tile-type`.

3. Verify computed styles match `.tile-type` base definition.
   **Expected:**
   - `font-size`: 10px
   - `text-transform`: uppercase
   - `letter-spacing`: 1px
   - `font-weight`: 700
   - `padding`: 3px 8px
   - `border-radius`: matches `var(--radius-sm)`
   - `width`: fit-content

### Test Data

- Content tiles of any type, including unknown types.

### Edge Cases

- When `styles[tile.type]` resolves to `undefined` (unknown type), the base `tile-type` styles must still be intact and not disrupted.

---

## TC-009: CSS module file defines all four tile type classes

**Priority:** P1
**Type:** Functional

### Objective

Verify that `PlayerDetail.module.css` contains class definitions for all four expected tile types (`.article`, `.video`, `.analysis`, `.news`), each with distinct background and color values, ensuring the module lookup `styles[tile.type]` can resolve for all known types.

### Preconditions

- Access to `src/pages/PlayerDetail/PlayerDetail.module.css`

### Steps

1. Open `PlayerDetail.module.css` and search for `.tile-type.article`.
   **Expected:** Class exists with `background: rgba(33, 150, 243, 0.2)` and `color: #2196f3`.

2. Search for `.tile-type.video`.
   **Expected:** Class exists with `background: rgba(156, 39, 176, 0.2)` and `color: #9c27b0`.

3. Search for `.tile-type.analysis`.
   **Expected:** Class exists with `background: rgba(255, 152, 0, 0.2)` and `color: #ff9800`.

4. Search for `.tile-type.news`.
   **Expected:** Class exists with `background: rgba(0, 200, 83, 0.2)` and `color: #00c853`.

5. Verify that the class names are standalone (e.g., `.article`, not `.tile-type-article`), so they can be resolved by `styles['article']` etc.
   **Expected:** Each type class is defined as a standalone class (`.article { ... }`) composed with `.tile-type` via `.tile-type.article` in the CSS file, and individually addressable as `styles['article']` in the module import.

### Test Data

- N/A (static file inspection)

### Edge Cases

- If any of the four classes is missing, `styles[tile.type]` will resolve to `undefined` for that type and the fallback `|| ''` will prevent breakage, but the color-coded background will not apply — this would be a defect.
