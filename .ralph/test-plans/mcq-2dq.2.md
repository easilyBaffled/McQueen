# Test Plan: mcq-2dq.2 -- Change default scenario from ESPN Live to Midweek and add ESPN empty-state fallback

## Summary

- **Bead:** `mcq-2dq.2`
- **Feature:** Default scenario changed from espn-live to midweek; ESPN Live shows an empty-state fallback when there are zero events
- **Total Test Cases:** 12
- **Test Types:** Functional, UI/Visual, Integration, Regression

---

## TC-001: Default scenario is Midweek on fresh load (no localStorage)

**Priority:** P0
**Type:** Functional

### Objective

Verify that a brand-new user with no persisted scenario preference lands on the Midweek scenario, not ESPN Live. This is the core behavior change of the bead.

### Preconditions

- localStorage is cleared (no `mcqueen-scenario` key)
- App is loaded fresh in the browser

### Steps

1. Clear all localStorage entries for keys starting with `mcqueen-`
   **Expected:** No scenario preference is persisted

2. Navigate to the app root (Market page)
   **Expected:** The ScenarioContext initializes with `'midweek'` as the default value via `read(STORAGE_KEYS.scenario, 'midweek')`

3. Observe the ScenarioToggle in the header
   **Expected:** The "Midweek" tab is highlighted/active; "ESPN Live" is not active

4. Observe the Market page content
   **Expected:** Players are displayed with populated price history, change percentages, and event data from `midweek.json`

### Test Data

- No localStorage entries for `mcqueen-scenario`

### Edge Cases

- Verify that `localStorage.getItem('mcqueen-scenario')` returns `null` before load
- Verify the `read()` helper returns the fallback `'midweek'` when storage is empty

---

## TC-002: Persisted scenario preference is respected on reload

**Priority:** P0
**Type:** Functional

### Objective

Verify that if a user previously selected a scenario (e.g., `espn-live`), that selection is preserved across reloads and is not overwritten by the new default.

### Preconditions

- App has been loaded at least once
- User has previously switched to a non-default scenario

### Steps

1. Switch to the "ESPN Live" scenario using the ScenarioToggle
   **Expected:** Scenario changes to `espn-live`; localStorage key `mcqueen-scenario` is set to `"espn-live"`

2. Reload the browser page
   **Expected:** The app reads `"espn-live"` from localStorage and initializes with the ESPN Live scenario

3. Observe the ScenarioToggle
   **Expected:** "ESPN Live" tab is active, not "Midweek"

### Test Data

- `localStorage['mcqueen-scenario']` = `"espn-live"`

### Edge Cases

- Test with each valid scenario id: `midweek`, `live`, `playoffs`, `superbowl`, `espn-live`
- Test with an invalid/corrupted value in localStorage (e.g., `"bogus"`) — should fall back gracefully

---

## TC-003: Midweek scenario shows populated data on first impression

**Priority:** P0
**Type:** Functional

### Objective

Verify that the Midweek scenario provides a good first impression with non-zero counters, visible player cards, and timeline events — addressing the original problem of an empty first impression.

### Preconditions

- Default scenario is `midweek` (fresh load, no localStorage)

### Steps

1. Load the app with cleared localStorage
   **Expected:** Market page renders with the Midweek scenario

2. Observe the player grid on the Market page
   **Expected:** Multiple player cards are displayed with non-zero prices and change percentages

3. Navigate to the Timeline page
   **Expected:** Timeline events are populated; the stats counters (Events, TDs, INTs, Stats, News, Trades) show non-zero values for at least some categories

4. Check that the leaderboard sidebar on the Market page shows player rankings
   **Expected:** MiniLeaderboard renders with player entries, not empty

### Test Data

- Data sourced from `midweek.json`

### Edge Cases

- Verify that at least one player has a non-zero `priceHistory` array
- Verify stat counters are computed correctly from the midweek data

---

## TC-004: ESPN Live empty-state displayed when zero events and not loading

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the ESPN Live scenario is active and there are zero players/events (no ESPN data fetched), an informative empty-state message is shown instead of a blank page.

### Preconditions

- ESPN Live scenario is selected
- ESPN API returns zero articles (or has not yet returned data)
- `espnLoading` is `false`

### Steps

1. Switch to "ESPN Live" scenario
   **Expected:** Scenario changes to `espn-live`

2. Simulate or wait for ESPN data fetch to complete with zero results
   **Expected:** The market page shows an empty-state component with `data-testid="espn-empty-state"`

3. Read the empty-state message
   **Expected:** Title reads "No Live ESPN Data Right Now"; body text explains there are no live ESPN headlines and suggests refreshing or switching scenarios

4. Verify the empty-state has a refresh button
   **Expected:** A button labeled "⟳ Refresh ESPN News" is present with `data-testid="espn-empty-refresh"`

### Test Data

- ESPN API mock returning empty array `[]`

### Edge Cases

- Confirm the empty-state does NOT appear while `espnLoading` is `true` (skeleton/loading state should show instead)
- Confirm the empty-state does NOT appear if players exist with data

---

## TC-005: ESPN Live empty-state shows error variant when ESPN fetch fails

**Priority:** P0
**Type:** Functional

### Objective

Verify that when ESPN Live encounters a fetch error, the empty-state displays an error-specific message including the error text.

### Preconditions

- ESPN Live scenario is selected
- ESPN API fetch fails with an error

### Steps

1. Switch to "ESPN Live" scenario
   **Expected:** Scenario activates and attempts to fetch ESPN news

2. Simulate an ESPN fetch failure (e.g., network error "Failed to fetch")
   **Expected:** `espnError` state is set to the error message string

3. Observe the Market page empty-state
   **Expected:** Title reads "Unable to Load ESPN Data"; body text includes the specific error message (e.g., "There was an error fetching ESPN news: Failed to fetch. Try refreshing or switch to another scenario.")

4. Verify the refresh button is present and enabled
   **Expected:** "⟳ Refresh ESPN News" button is clickable

### Test Data

- ESPN API mock that throws `new Error('Failed to fetch')`

### Edge Cases

- Verify `espnError` is propagated from `SimulationContext` through to the Market page
- Verify error clears when switching away from ESPN Live and back

---

## TC-006: ESPN Live refresh button triggers re-fetch

**Priority:** P1
**Type:** Functional

### Objective

Verify that clicking the refresh button in the ESPN empty-state triggers a new ESPN data fetch.

### Preconditions

- ESPN Live scenario is active
- Empty-state is displayed (zero events)

### Steps

1. Observe the empty-state with the "⟳ Refresh ESPN News" button
   **Expected:** Button is enabled (not disabled)

2. Click the "⟳ Refresh ESPN News" button
   **Expected:** `refreshEspnNews()` is called; `espnLoading` transitions to `true`; button becomes disabled during loading

3. Wait for fetch to complete
   **Expected:** If data returns, the empty-state is replaced by the player grid; if still no data, empty-state remains

### Test Data

- First fetch: ESPN API returns `[]`
- Second fetch (after button click): ESPN API returns articles, or still `[]`

### Edge Cases

- Rapidly clicking the refresh button multiple times should not cause duplicate fetches or race conditions
- Button should show disabled state during the loading period

---

## TC-007: Timeline page empty-state for ESPN Live with zero events

**Priority:** P1
**Type:** Functional

### Objective

Verify that the Timeline page shows an appropriate empty-state message when ESPN Live is active and there are no timeline events.

### Preconditions

- ESPN Live scenario is active
- No ESPN articles have been fetched or matched to players
- Players have no `priceHistory` entries

### Steps

1. Switch to "ESPN Live" scenario
   **Expected:** Scenario changes to espn-live

2. Navigate to the Timeline page
   **Expected:** Timeline page loads

3. Observe the timeline track area
   **Expected:** The existing empty-state message "No events match your filters" is shown (or a more specific ESPN-related empty message if one is added)

4. Verify stat counters in the header
   **Expected:** All counters (Events, TDs, INTs, Stats, News, Trades) show 0

### Test Data

- ESPN API mock returning empty results

### Edge Cases

- Verify that switching filters does not cause errors when there are zero events
- Verify the empty-state renders even with all filters set to "all"

---

## TC-008: ScenarioContext default value wiring

**Priority:** P0
**Type:** Integration

### Objective

Verify that `ScenarioContext.tsx` passes `'midweek'` as the default to the `read()` storage helper, so the correct fallback is used when no preference is stored.

### Preconditions

- Source code has been modified per the bead description

### Steps

1. Inspect the `ScenarioProvider` component's `useState` initializer
   **Expected:** The call reads `read(STORAGE_KEYS.scenario, 'midweek')` — the second argument (default) is `'midweek'`

2. Verify the `scenarioLoaders` map includes `'midweek'` as a valid key
   **Expected:** `scenarioLoaders['midweek']` exists and loads `midweek.json`

3. Mount the `ScenarioProvider` with empty localStorage
   **Expected:** `scenario` state initializes to `'midweek'`; the `midweek` loader is triggered; `currentData` is populated from `midweek.json`

### Test Data

- Empty localStorage

### Edge Cases

- If `read()` returns an unexpected type (e.g., number, object), the loader lookup should handle it gracefully (no matching loader → loading stops, no crash)

---

## TC-009: ESPN error state propagation from SimulationContext

**Priority:** P1
**Type:** Integration

### Objective

Verify that `espnError` set in `SimulationContext` is properly accessible to consuming components (Market, ScenarioToggle) for rendering fallback UI.

### Preconditions

- ESPN Live scenario is active
- ESPN fetch encounters an error

### Steps

1. Trigger an ESPN fetch error (mock network failure)
   **Expected:** `SimulationContext` sets `espnError` to the error message string

2. Check Market page
   **Expected:** Market reads `espnError` from `useSimulation()` and conditionally renders the error variant of the empty-state

3. Check ScenarioToggle
   **Expected:** The ESPN tab shows an error indicator (`!` icon) instead of the live dot, and an error banner appears below the toggle

### Test Data

- Mock `fetchNFLNews` to reject with `new Error('Network timeout')`

### Edge Cases

- Verify `espnError` resets to `null` when scenario changes away from espn-live (checked in the `scenarioVersion` reset effect)
- Verify `espnError` resets to `null` at the start of each new fetch attempt

---

## TC-010: Empty-state UI layout and visual styling

**Priority:** P2
**Type:** UI/Visual

### Objective

Verify the ESPN empty-state component is visually correct, centered, and has appropriate styling for both normal and error variants.

### Preconditions

- ESPN Live scenario is active
- Empty-state is rendered

### Steps

1. Observe the empty-state container on the Market page
   **Expected:** The container has `data-testid="espn-empty-state"` and uses the `espn-empty-state` CSS class; content is centered within the market main area

2. Verify the icon element
   **Expected:** The 📡 icon (`espn-empty-icon` class) is displayed prominently above the title

3. Verify the title text styling
   **Expected:** Title (`espn-empty-title` class) is visually distinct (larger font, bold weight)

4. Verify the body text
   **Expected:** Body text (`espn-empty-text` class) is in a muted/secondary color and provides actionable guidance

5. Verify the refresh button styling
   **Expected:** The refresh button (`espn-empty-refresh` class) is styled as a primary action; shows a disabled/muted appearance when `espnLoading` is true

6. Resize viewport to mobile width (< 768px)
   **Expected:** Empty-state remains readable and properly centered; no horizontal overflow

### Test Data

- N/A (visual inspection)

### Edge Cases

- Verify the error variant title ("Unable to Load ESPN Data") and normal variant title ("No Live ESPN Data Right Now") each render with correct text
- Check dark mode / theme compatibility if applicable

---

## TC-011: Switching from ESPN Live empty-state to Midweek shows data immediately

**Priority:** P1
**Type:** Regression

### Objective

Verify that when a user sees the ESPN empty-state and switches to Midweek, populated data appears without requiring a page reload.

### Preconditions

- ESPN Live scenario is active with empty-state displayed

### Steps

1. Observe the ESPN empty-state on the Market page
   **Expected:** Empty-state message is displayed; no player cards visible

2. Click the "Midweek" tab in the ScenarioToggle
   **Expected:** Scenario switches to `midweek`; a brief loading skeleton may appear

3. Observe the Market page after transition
   **Expected:** Player cards populate with midweek data; the empty-state is gone; leaderboard sidebar shows rankings

4. Navigate to Timeline
   **Expected:** Timeline events from midweek data are displayed with non-zero counters

### Test Data

- ESPN returns zero articles; midweek.json has populated data

### Edge Cases

- Rapidly toggling between ESPN Live and Midweek should not leave stale state or show the wrong empty-state

---

## TC-012: ESPN Live with data does NOT show empty-state

**Priority:** P1
**Type:** Regression

### Objective

Verify that when ESPN Live successfully fetches articles that match players, the normal player grid is displayed and the empty-state is NOT shown.

### Preconditions

- ESPN Live scenario is active
- ESPN API returns articles that match at least one player

### Steps

1. Switch to "ESPN Live" scenario
   **Expected:** ESPN fetch begins; loading state shown briefly

2. ESPN fetch returns articles matching player search terms
   **Expected:** Prices update based on sentiment analysis; `espnPriceHistory` populates

3. Observe the Market page
   **Expected:** Player grid (`data-testid="players-grid"`) is rendered with player cards showing ESPN-derived price changes

4. Verify the empty-state is NOT present
   **Expected:** No element with `data-testid="espn-empty-state"` exists in the DOM

### Test Data

- ESPN API mock returning articles with headlines mentioning known player names/search terms

### Edge Cases

- Verify that if ESPN data arrives but matches zero players (all articles irrelevant), the empty-state IS shown because `sortedPlayers.length === 0`
- Verify the loading skeleton shows while `espnLoading` is `true`, not the empty-state
