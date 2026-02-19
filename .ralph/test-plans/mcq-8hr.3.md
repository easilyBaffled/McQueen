# Test Plan: mcq-8hr.3 -- Add Vitest tests for Watchlist page (0% coverage)

## Summary

- **Bead:** `mcq-8hr.3`
- **Feature:** Watchlist page — empty state illustration, quick-add popular players, remove from watchlist with toast, grid rendering with PlayerCard, and Browse All Players navigation
- **Total Test Cases:** 16
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Empty state renders when watchlist is empty

**Priority:** P0
**Type:** Functional

### Objective

Verify that the empty-state container is displayed when the user has no players on their watchlist.

### Preconditions

- `useSocial` returns `watchlist: []`
- `useTrading.getPlayers` returns an array of players (for popular-players section)
- `useTrading.getPlayer` is mocked (returns null for any id since watchlist is empty)
- `framer-motion` is mocked to render plain divs
- `PlayerCard` is mocked

### Steps

1. Render `<Watchlist />` with an empty watchlist
   **Expected:** A container with the `empty-state` and `enhanced` CSS classes is present in the document

2. Check that the watchlist grid is NOT rendered
   **Expected:** No element with the `watchlist-grid` class exists

### Test Data

- `watchlist: []`

### Edge Cases

- None (baseline empty state)

---

## TC-002: Empty state illustration — heart SVG and headings

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify that the empty state shows the animated heart SVG illustration, the "Track Your Favorites" heading, and the descriptive paragraph.

### Preconditions

- Same as TC-001

### Steps

1. Render `<Watchlist />` with an empty watchlist
   **Expected:** An `<svg>` element with `viewBox="0 0 80 80"` is present inside the empty state

2. Look for the heading text
   **Expected:** An `<h3>` containing "Track Your Favorites" is visible

3. Look for the descriptive paragraph
   **Expected:** Text "Watch players you're interested in without committing to buy" is present

### Test Data

- `watchlist: []`

### Edge Cases

- None

---

## TC-003: Page title and subtitle always render

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify the page heading and subtitle are present regardless of watchlist state.

### Preconditions

- Component renders (either empty or populated watchlist)

### Steps

1. Render `<Watchlist />` with an empty watchlist
   **Expected:** An `<h1>` with text "Your Watchlist" is in the document

2. Check the subtitle
   **Expected:** A `<p>` with text "Players you're keeping an eye on" is in the document

3. Render `<Watchlist />` with a non-empty watchlist
   **Expected:** The same `<h1>` and subtitle `<p>` are still present

### Test Data

- Empty watchlist for step 1–2; watchlist with one player id for step 3

### Edge Cases

- None

---

## TC-004: Quick-add popular players section renders in empty state

**Priority:** P0
**Type:** Functional

### Objective

Verify that popular players (sorted by absolute changePercent, max 4, excluding already-watched) appear in the empty state for quick-adding.

### Preconditions

- `useSocial` returns `watchlist: []`
- `useTrading.getPlayers` returns 5+ mock players with varying `changePercent` values

### Steps

1. Render `<Watchlist />`
   **Expected:** A section with label "📊 Popular Players" is visible

2. Count the quick-add player buttons
   **Expected:** Exactly 4 buttons are rendered (capped at 4 even though 5+ players exist)

3. Verify order: the player with the highest `Math.abs(changePercent)` should be listed first
   **Expected:** Player names appear in descending order of absolute change percent

### Test Data

- 6 mock players: `{ id: 'p1', name: 'Player A', team: 'KC', changePercent: 5.0 }`, `{ id: 'p2', name: 'Player B', team: 'BUF', changePercent: -8.0 }`, `{ id: 'p3', name: 'Player C', team: 'SF', changePercent: 3.0 }`, `{ id: 'p4', name: 'Player D', team: 'DAL', changePercent: -1.5 }`, `{ id: 'p5', name: 'Player E', team: 'PHI', changePercent: 6.5 }`, `{ id: 'p6', name: 'Player F', team: 'MIA', changePercent: -0.2 }`
- Expected display order: Player B (8.0), Player E (6.5), Player A (5.0), Player C (3.0)

### Edge Cases

- See TC-005 for empty getPlayers case
- See TC-006 for filtering out watched players

---

## TC-005: Quick-add section hidden when no players available

**Priority:** P1
**Type:** Functional

### Objective

Verify that the popular-players quick-add section does not render when `getPlayers()` returns an empty array.

### Preconditions

- `useSocial` returns `watchlist: []`
- `useTrading.getPlayers` returns `[]`

### Steps

1. Render `<Watchlist />`
   **Expected:** No element with the "📊 Popular Players" label is in the document

2. Verify the empty state still shows the illustration and CTA
   **Expected:** "Track Your Favorites" heading and "Browse All Players" link are still present

### Test Data

- `getPlayers()` → `[]`

### Edge Cases

- None

---

## TC-006: Quick-add filters out already-watched players

**Priority:** P1
**Type:** Functional

### Objective

Verify that players already on the watchlist do not appear in the quick-add popular players section.

### Preconditions

- `useSocial` returns `watchlist: ['p1', 'p2']`
- `useTrading.getPlayers` returns 5 players including p1 and p2
- `useTrading.getPlayer` returns enriched data for p1 and p2

### Steps

1. Render `<Watchlist />`
   **Expected:** The watchlist grid renders (because there are watched players), so the quick-add section is not visible at all since it only shows in empty state

### Test Data

- watchlist: `['p1', 'p2']`, players: p1 through p5

### Edge Cases

- If all available players are already watched AND watchlist becomes empty (not possible simultaneously, but conceptually tests filtering logic in isolation)

---

## TC-007: Quick-add button shows player team, name, and change percent

**Priority:** P1
**Type:** UI/Visual

### Objective

Verify each quick-add button displays the player's team badge, name, and formatted change percentage with correct directional indicator.

### Preconditions

- `useSocial` returns `watchlist: []`
- `useTrading.getPlayers` returns at least 2 players: one with positive change, one with negative change

### Steps

1. Render `<Watchlist />` and find the quick-add buttons
   **Expected:** Each button contains a `quick-add-team` element with the player's team abbreviation

2. Check player name display
   **Expected:** Each button contains a `quick-add-name` element with the player's name

3. Check positive change indicator for a player with `changePercent: 5.0`
   **Expected:** Text includes "▲" and "5.0%", and the change element has the `up` CSS class

4. Check negative change indicator for a player with `changePercent: -3.2`
   **Expected:** Text includes "▼" and "3.2%", and the change element has the `down` CSS class

5. Verify aria-label on change element for positive player
   **Expected:** `aria-label` is "Up 5.0 percent"

6. Verify aria-label on change element for negative player
   **Expected:** `aria-label` is "Down 3.2 percent"

### Test Data

- Player with `{ changePercent: 5.0, team: 'KC', name: 'Patrick Mahomes' }`
- Player with `{ changePercent: -3.2, team: 'BUF', name: 'Josh Allen' }`

### Edge Cases

- Player with `changePercent: 0` — should show "▲" and "0.0%" (treated as non-negative)

---

## TC-008: Clicking quick-add calls addToWatchlist and shows success toast

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking a quick-add button invokes `addToWatchlist` with the correct player ID and shows a success toast with the player name.

### Preconditions

- `useSocial` returns `watchlist: []`, with `addToWatchlist` as a mock function
- `useToast` returns `addToast` as a mock function
- `useTrading.getPlayers` returns players including one named "Patrick Mahomes" with id "p1"

### Steps

1. Render `<Watchlist />` and click the quick-add button for "Patrick Mahomes"
   **Expected:** `addToWatchlist` was called once with `'p1'`

2. Check toast
   **Expected:** `addToast` was called once with `('Added Patrick Mahomes to watchlist', 'success')`

### Test Data

- Player: `{ id: 'p1', name: 'Patrick Mahomes', team: 'KC', changePercent: 5.0 }`

### Edge Cases

- Clicking quick-add for multiple different players in sequence: each should trigger its own `addToWatchlist` and `addToast` call

---

## TC-009: Watchlist grid renders PlayerCard for each watched player

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the watchlist is non-empty, a grid of `PlayerCard` components renders — one per watched player.

### Preconditions

- `useSocial` returns `watchlist: ['p1', 'p2', 'p3']`
- `useTrading.getPlayer` returns enriched player data for each ID
- `PlayerCard` is mocked to render a simple element with the player name (e.g., `<div data-testid="player-card">{player.name}</div>`)

### Steps

1. Render `<Watchlist />`
   **Expected:** A container with the `watchlist-grid` class is present

2. Count PlayerCard instances
   **Expected:** Exactly 3 mocked PlayerCard elements are rendered

3. Verify each PlayerCard receives the correct `player` prop
   **Expected:** The mocked PlayerCard was called with the enriched player object for p1, p2, and p3 respectively

### Test Data

- `watchlist: ['p1', 'p2', 'p3']`
- Enriched players: Patrick Mahomes (p1), Josh Allen (p2), Jalen Hurts (p3)

### Edge Cases

- None (single player case covered in TC-010)

---

## TC-010: Watchlist grid with a single watched player

**Priority:** P1
**Type:** Functional

### Objective

Verify the grid renders correctly with just one watched player (boundary case).

### Preconditions

- `useSocial` returns `watchlist: ['p1']`
- `useTrading.getPlayer('p1')` returns enriched data

### Steps

1. Render `<Watchlist />`
   **Expected:** The `watchlist-grid` container is present with exactly 1 PlayerCard

2. Verify no empty-state is shown
   **Expected:** No "Track Your Favorites" heading is in the document

### Test Data

- `watchlist: ['p1']`

### Edge Cases

- None

---

## TC-011: Each watched player card links to player detail page

**Priority:** P0
**Type:** Functional

### Objective

Verify that each PlayerCard in the watchlist grid is wrapped in a `<Link>` that navigates to `/player/{id}`.

### Preconditions

- `useSocial` returns `watchlist: ['p1', 'p2']`
- `react-router-dom` is available (use MemoryRouter in test)

### Steps

1. Render `<Watchlist />` and find all links wrapping PlayerCards
   **Expected:** Link for player p1 has `href="/player/p1"`

2. Check the second link
   **Expected:** Link for player p2 has `href="/player/p2"`

### Test Data

- `watchlist: ['p1', 'p2']`

### Edge Cases

- None

---

## TC-012: Remove button calls removeFromWatchlist and shows info toast

**Priority:** P0
**Type:** Functional

### Objective

Verify that clicking the remove button on a watchlist card invokes `removeFromWatchlist` with the correct player ID and shows an info toast.

### Preconditions

- `useSocial` returns `watchlist: ['p1']` with `removeFromWatchlist` as a mock function
- `useToast` returns `addToast` as a mock function
- `useTrading.getPlayer('p1')` returns enriched player with `name: 'Patrick Mahomes'`

### Steps

1. Render `<Watchlist />` and click the remove button (the one with `title="Remove from watchlist"`)
   **Expected:** `removeFromWatchlist` was called once with `'p1'`

2. Check toast
   **Expected:** `addToast` was called once with `('Removed Patrick Mahomes from watchlist', 'info')`

### Test Data

- Player: `{ id: 'p1', name: 'Patrick Mahomes' }`

### Edge Cases

- None (multiple removals covered in TC-013)

---

## TC-013: Remove button calls preventDefault to avoid navigation

**Priority:** P1
**Type:** Functional

### Objective

Verify that the remove button's click handler calls `e.preventDefault()` so the parent `<Link>` does not navigate.

### Preconditions

- Same as TC-012

### Steps

1. Render `<Watchlist />` and simulate a click event on the remove button
   **Expected:** `event.preventDefault()` was called on the click event

### Test Data

- `watchlist: ['p1']`

### Edge Cases

- None

---

## TC-014: Remove button has correct aria-label for accessibility

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify each remove button includes an accessible `aria-label` that names the player being removed.

### Preconditions

- `useSocial` returns `watchlist: ['p1', 'p2']`
- `useTrading.getPlayer` returns enriched data for both

### Steps

1. Render `<Watchlist />` and query for the remove button by `aria-label`
   **Expected:** A button with `aria-label="Remove Patrick Mahomes from watchlist"` exists for player p1

2. Check p2's remove button
   **Expected:** A button with `aria-label="Remove Josh Allen from watchlist"` exists for player p2

### Test Data

- p1: `{ name: 'Patrick Mahomes' }`, p2: `{ name: 'Josh Allen' }`

### Edge Cases

- None

---

## TC-015: Browse All Players link navigates to /market

**Priority:** P0
**Type:** Functional

### Objective

Verify the "Browse All Players" CTA link in the empty state points to `/market`.

### Preconditions

- `useSocial` returns `watchlist: []`
- `react-router-dom` is available (MemoryRouter)

### Steps

1. Render `<Watchlist />` and find the link containing "Browse All Players"
   **Expected:** The link element has `href="/market"`

2. Verify the link text includes the label
   **Expected:** The link text content includes "Browse All Players"

### Test Data

- `watchlist: []`

### Edge Cases

- None

---

## TC-016: Null players filtered from watchedPlayers array

**Priority:** P1
**Type:** Functional

### Objective

Verify that if `getPlayer` returns `null` for a watchlist ID (e.g., stale or deleted player), that entry is silently excluded from the rendered grid.

### Preconditions

- `useSocial` returns `watchlist: ['p1', 'p_invalid', 'p2']`
- `useTrading.getPlayer('p1')` returns enriched player
- `useTrading.getPlayer('p_invalid')` returns `null`
- `useTrading.getPlayer('p2')` returns enriched player

### Steps

1. Render `<Watchlist />`
   **Expected:** Only 2 PlayerCard elements are rendered (p1 and p2)

2. Verify no error or crash occurred
   **Expected:** Component renders without throwing

### Test Data

- `watchlist: ['p1', 'p_invalid', 'p2']`

### Edge Cases

- All watchlist IDs return null from `getPlayer` — should render the empty state since `watchedPlayers.length === 0`
