# Test Plan: mcq-x8o.2 -- Add viewport boundary checking to EventMarkerPopup

## Summary

- **Bead:** `mcq-x8o.2`
- **Feature:** Viewport boundary checking prevents EventMarkerPopup from overflowing the chart container edges
- **Total Test Cases:** 10
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Popup stays within container when marker is near the right edge

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a chart event marker is near the right edge of the chart container, the popup shifts left so it does not overflow the container's right boundary. This is the primary behavior described in AC-2.

### Preconditions

- Player detail page is loaded for a player with price history events
- The chart container is rendered with a known width
- At least one event marker exists near the right edge of the chart

### Steps

1. Click an event marker whose `cx` coordinate places `cx + POPUP_MIN_WIDTH/2` (i.e., `cx + 130`) beyond the container width.
   **Expected:** The popup's `left` style is clamped to `containerWidth - POPUP_MIN_WIDTH/2` so the popup's right edge does not exceed the container boundary.

2. Inspect the rendered popup element position.
   **Expected:** The popup is fully visible within the chart container; no horizontal scrollbar appears and no content is clipped.

### Test Data

- Container width: 600px
- Marker cx: 550 (550 + 130 = 680 > 600, triggers right-edge adjustment)
- Expected adjusted x: 600 - 130 = 470

### Edge Cases

- Marker at the exact boundary (cx + 130 == containerWidth): should still be clamped
- Marker 1px past boundary: should clamp

---

## TC-002: Popup stays within container when marker is near the left edge

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a chart event marker is near the left edge, the popup shifts right so it does not overflow the container's left boundary. The popup uses `transform: translateX(-50%)`, so position.x represents the popup center.

### Preconditions

- Player detail page is loaded with chart events
- At least one event marker exists near the left edge of the chart

### Steps

1. Click an event marker whose `cx` coordinate places `cx - POPUP_MIN_WIDTH/2` (i.e., `cx - 130`) below 0.
   **Expected:** The popup's `left` style is clamped to `POPUP_MIN_WIDTH/2` (130px) so the popup's left edge does not go negative.

2. Inspect the rendered popup element.
   **Expected:** The popup is fully visible; no content overflows leftward past the container.

### Test Data

- Container width: 600px
- Marker cx: 50 (50 - 130 = -80 < 0, triggers left-edge adjustment)
- Expected adjusted x: 130

### Edge Cases

- Marker at cx = 0: popup should shift to x = 130
- Marker at cx = 130: borderline case, no adjustment needed

---

## TC-003: Popup shifts above the marker when near the bottom edge

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a chart event marker is near the bottom of the chart container, the popup repositions above the marker instead of below it. This is the primary behavior described in AC-3.

### Preconditions

- Player detail page is loaded with chart events
- At least one event marker is in the lower portion of the chart

### Steps

1. Click an event marker whose `cy + 20 + POPUP_EST_HEIGHT` (i.e., `cy + 20 + 150`) exceeds the container height.
   **Expected:** The popup's `top` style is set to `cy + 20 - POPUP_EST_HEIGHT - 40` (above the marker), instead of the default `cy + 20` below.

2. Verify the popup arrow/caret visual orientation.
   **Expected:** The popup appears above the marker point. Content is fully visible within the container.

### Test Data

- Container height: 250px (matches ResponsiveContainer height)
- Marker cy: 200 (200 + 20 + 150 = 370 > 250, triggers bottom-edge adjustment)
- Expected adjusted y: 220 - 150 - 40 = 30

### Edge Cases

- Marker at the very bottom of the chart (cy = containerHeight): popup shifts well above
- Marker where cy + 20 + 150 exactly equals containerHeight: borderline, should still shift

---

## TC-004: Popup positioned normally when marker is in the center of the chart

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the marker is comfortably within the interior of the chart container (far from all edges), no boundary adjustment is applied and the popup appears at its default position.

### Preconditions

- Player detail page with chart events
- At least one event marker is in the center of the chart area

### Steps

1. Click an event marker at roughly the center of the chart (e.g., cx=300, cy=100 in a 600x250 container).
   **Expected:** Popup position is `{ left: 300, top: 120 }` (cx, cy+20) with no adjustment.

2. Verify the popup renders below the marker.
   **Expected:** Popup appears directly below the clicked marker with the upward-pointing arrow caret visible.

### Test Data

- Container: 600px wide, 250px tall
- Marker at cx: 300, cy: 100
- Expected position: x=300, y=120 (no clamping)

### Edge Cases

- None; this is the baseline/happy path case

---

## TC-005: Combined right + bottom edge adjustment

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a marker is in the bottom-right corner of the chart, both horizontal and vertical adjustments are applied simultaneously.

### Preconditions

- Player detail page with chart events
- An event marker exists near the bottom-right corner

### Steps

1. Click an event marker at cx=580, cy=220 in a 600x250 container.
   **Expected:** The popup's x is clamped to `600 - 130 = 470` (right-edge rule) AND the popup's y is shifted to `240 - 150 - 40 = 50` (bottom-edge rule). Both adjustments apply.

2. Verify the popup is fully visible.
   **Expected:** Neither the right nor bottom edge of the popup exceeds the chart container.

### Test Data

- Container: 600x250
- Marker at cx: 580, cy: 220
- Expected adjusted position: x=470, y=50

### Edge Cases

- Bottom-left corner (cx near 0, cy near containerHeight): both left-edge and bottom-edge adjust
- Top-right corner: only right-edge adjusts

---

## TC-006: Combined left + bottom edge adjustment

**Priority:** P1
**Type:** Functional

### Objective

Verify that when a marker is in the bottom-left corner, the popup shifts both rightward and upward.

### Preconditions

- Player detail page with chart events
- An event marker near the bottom-left corner

### Steps

1. Click an event marker at cx=30, cy=230 in a 600x250 container.
   **Expected:** The popup's x is clamped to 130 (left-edge rule) AND the y shifts above the marker (bottom-edge rule).

2. Verify the popup is fully visible and not clipped on either axis.
   **Expected:** Popup is contained within the chart boundaries.

### Test Data

- Container: 600x250
- Marker at cx: 30, cy: 230
- Expected adjusted position: x=130, y adjusted above

### Edge Cases

- Marker at exact origin (0, 0): both left-edge shifts, no bottom-edge shift needed

---

## TC-007: Boundary checking gracefully handles missing containerRef

**Priority:** P1
**Type:** Functional

### Objective

Verify that if `containerRef` is null or undefined, the popup falls back to the raw unadjusted position without errors. The code guards with `if (containerRef?.current)`.

### Preconditions

- EventMarkerPopup is rendered without a `containerRef` prop (or with a ref whose `.current` is null)

### Steps

1. Render EventMarkerPopup with position `{ x: 500, y: 200 }` and no `containerRef`.
   **Expected:** Popup renders at `left: 500, top: 200` with no JavaScript errors.

2. Verify no console errors or warnings related to null reference.
   **Expected:** Component renders cleanly; boundary logic is skipped entirely.

### Test Data

- Position: { x: 500, y: 200 }
- containerRef: undefined

### Edge Cases

- containerRef passed but `.current` is null (ref not yet attached): same fallback behavior expected

---

## TC-008: Popup arrow/caret visual correctness after repositioning

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify that the CSS arrow (::before / ::after pseudo-elements) on the popup remains visually coherent after the popup has been repositioned by boundary checking. The arrow is always centered via `left: 50%; transform: translateX(-50%)` in CSS, which may not point at the marker after horizontal shifts.

### Preconditions

- Popup has been shifted due to right-edge or left-edge clamping

### Steps

1. Trigger popup on a right-edge marker (e.g., cx=570 in a 600px container).
   **Expected:** Popup shifts left. The CSS arrow at top-center of the popup is visible and does not overflow or clip.

2. Trigger popup on a left-edge marker (e.g., cx=20).
   **Expected:** Popup shifts right. Arrow is visible.

3. Inspect the arrow visually.
   **Expected:** Arrow appears at the horizontal center of the popup. While it may not perfectly point at the marker after large shifts, it should not be visually broken (clipped, misaligned with border, etc.).

### Test Data

- Various edge positions as described above

### Edge Cases

- When popup shifts above the marker (bottom-edge case), the arrow points downward from the top—verify it doesn't look inverted or misplaced

---

## TC-009: Popup remains interactive after boundary adjustment

**Priority:** P1
**Type:** Integration

### Objective

Verify that after the popup has been repositioned by boundary checking, all interactive elements (close button, "Read Full Story" link, click-outside dismissal, Escape key) still function correctly.

### Preconditions

- Popup is displayed after boundary adjustment (any edge case)

### Steps

1. Trigger popup on a right-edge marker so boundary adjustment kicks in.
   **Expected:** Popup appears, shifted left.

2. Click the close button (X) in the popup header.
   **Expected:** Popup closes; `selectedEvent` is set to null.

3. Trigger popup again on the same marker.
   **Expected:** Popup reappears at the adjusted position.

4. Press the Escape key.
   **Expected:** Popup closes.

5. Trigger popup once more, then click outside the popup area.
   **Expected:** Popup closes.

6. If the event has a URL, click "Read Full Story".
   **Expected:** Link opens in a new tab; popup remains visible until explicitly closed.

### Test Data

- Use an event with a non-empty `url` field to test the link interaction

### Edge Cases

- Rapidly clicking different edge markers in sequence: each popup should position correctly and close the previous one

---

## TC-010: Boundary checking uses correct container dimensions on window resize

**Priority:** P2
**Type:** Regression

### Objective

Verify that if the browser window or chart container is resized, the boundary checking uses the current (post-resize) container dimensions, not stale values. The implementation calls `getBoundingClientRect()` on each click, so it should naturally pick up new dimensions.

### Preconditions

- Player detail page loaded with chart events
- Browser window is resizable

### Steps

1. With a wide browser window (e.g., 1200px), click a marker near the right edge of the chart.
   **Expected:** Popup may not need adjustment (container is wide). Popup appears at default position.

2. Resize the browser window to a narrow width (e.g., 400px) so the chart container shrinks.
   **Expected:** Chart container re-renders at the new width.

3. Click the same marker (now possibly closer to or past the right edge of the narrower container).
   **Expected:** Boundary checking uses the updated container width. Popup is clamped within the new narrower bounds.

### Test Data

- Wide viewport: 1200px window width
- Narrow viewport: 400px window width

### Edge Cases

- Rapid resize while popup is open: popup position is set on click, not dynamically re-adjusted while open—verify no visual glitch
