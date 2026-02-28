# Test Plan: mcq-1zw.9 -- Improve test confidence: reduce over-mocking, add integration tests

## Summary

- **Bead:** `mcq-1zw.9`
- **Feature:** Refactor test infrastructure to reduce over-mocking in renderWithProviders, replace CSS class name assertions with semantic assertions, and add meaningful end-to-end Cypress flows that verify computed values
- **Total Test Cases:** 24
- **Test Types:** Functional, Integration, Regression

---

## TC-001: renderWithProviders — useRealProviders wraps components in the full provider tree

**Priority:** P0
**Type:** Integration

### Objective

Verify that passing `useRealProviders: true` to `renderWithProviders` wraps the rendered component in the actual `ScenarioProvider > SimulationProvider > TradingProvider > SocialProvider > ToastProvider` hierarchy (not context stubs), using real test scenario data (e.g., midweek scenario loaded).

### Preconditions

- `renderWithProviders` has been refactored with the `useRealProviders` option.
- Test scenario data fixtures (midweek) are available.

### Steps

1. Call `renderWithProviders(<TestConsumer />, { useRealProviders: true })` where `TestConsumer` reads from every context.
   **Expected:** The component renders without errors and receives real context values (non-null `currentData`, populated `players[]`, numeric `cash` > 0).

2. Inside `TestConsumer`, call `getEffectivePrice('mahomes')`.
   **Expected:** Returns a positive number derived from actual scenario data, not `0` (the mock default).

3. Inside `TestConsumer`, read `portfolio` from TradingContext.
   **Expected:** Portfolio is an object (may be empty initially), not the `vi.fn()` stub default.

### Test Data

- Midweek scenario fixture with at least one player entry (`mahomes`).

### Edge Cases

- If scenario data fails to load, the component should render a loading/fallback state rather than throwing.
- Calling `useRealProviders: true` without any overrides should still produce a fully functional provider tree.

---

## TC-002: renderWithProviders — default mock mode still works unchanged

**Priority:** P0
**Type:** Regression

### Objective

Verify that the existing mock-based behavior of `renderWithProviders` remains the default, so all ~1,105 existing tests continue to pass without modification.

### Preconditions

- Refactored `renderWithProviders` is in place.

### Steps

1. Call `renderWithProviders(<TestConsumer />)` with no options (default mode).
   **Expected:** All context values are `vi.fn()` stubs (e.g., `buyShares` is a mock, `players` is `[]`, `cash` is `10000`).

2. Call `renderWithProviders(<TestConsumer />, { tradingOverrides: { cash: 500 } })`.
   **Expected:** `cash` is `500`; all other values remain mock defaults. No real providers are instantiated.

3. Run the full unit test suite (`npm run test:run`).
   **Expected:** All previously passing tests still pass.

### Test Data

- None beyond default mock values.

### Edge Cases

- Passing `useRealProviders: false` explicitly should behave identically to omitting the option.
- Passing both `useRealProviders: true` and override options should apply overrides on top of real provider values (or document that overrides are not supported in real mode).

---

## TC-003: renderWithProviders — documentation comments explain when to use each mode

**Priority:** P2
**Type:** Functional

### Objective

Verify that `renderWithProviders.tsx` includes JSDoc/documentation comments explaining when to use mock mode vs. real providers mode, so future contributors select the right mode.

### Preconditions

- Refactored file exists at `src/test/renderWithProviders.tsx`.

### Steps

1. Open `src/test/renderWithProviders.tsx` and read the exported function's JSDoc.
   **Expected:** A comment block above `renderWithProviders` explains: (a) mock mode is the default for isolated unit tests, (b) `useRealProviders` mode is for integration tests that need real context logic (portfolio calculation, trading, price resolution), and (c) examples of each usage.

2. Review the `useRealProviders` option in the `RenderWithProvidersOptions` interface.
   **Expected:** An inline doc comment on the `useRealProviders` field describes its purpose.

### Test Data

- N/A (code review).

### Edge Cases

- N/A.

---

## TC-004: renderWithProviders — real providers perform actual portfolio calculations

**Priority:** P0
**Type:** Integration

### Objective

Confirm that when using real providers, calling `buyShares` actually mutates portfolio state and `getPortfolioValue` returns computed values (not mocked zeros). This is the core confidence gap identified in the issue: tests must fail if portfolio logic is broken.

### Preconditions

- `useRealProviders: true` mode is implemented.
- Midweek scenario data is loaded with known player prices.

### Steps

1. Render a component with `useRealProviders: true` that has access to `useTrading()`.
   **Expected:** `cash` starts at the scenario's initial balance (e.g., $10,000).

2. Call `buyShares('mahomes', 2)` via a button click in the rendered component.
   **Expected:** `buyShares` returns `true`. `portfolio` now contains `mahomes` with `shares: 2`. `cash` has decreased by `2 × getEffectivePrice('mahomes')`.

3. Call `getPortfolioValue()`.
   **Expected:** `value` equals `2 × getEffectivePrice('mahomes')`. `cost` equals the purchase cost. `gain` is `0` (price hasn't changed). `gainPercent` is `0`.

### Test Data

- Midweek scenario with `mahomes` at a known price (e.g., $52.00).

### Edge Cases

- Buy with insufficient cash should return `false` and leave portfolio unchanged.
- Sell more shares than held should return `false`.

---

## TC-005: renderWithProviders — real providers resolve player prices from scenario data

**Priority:** P0
**Type:** Integration

### Objective

Confirm that `getEffectivePrice` returns a real price from the loaded scenario, not the mocked `0`. This validates that price resolution logic works end-to-end.

### Preconditions

- `useRealProviders: true` mode is implemented with midweek scenario loaded.

### Steps

1. Render with `useRealProviders: true`, call `getEffectivePrice('mahomes')`.
   **Expected:** Returns the midweek price for Mahomes (a positive number matching the fixture).

2. Call `getEffectivePrice('nonexistent-player')`.
   **Expected:** Returns `0`, `null`, or throws — whatever the real implementation does, the test documents it.

3. Call `getPlayer('mahomes')`.
   **Expected:** Returns the full player object with `name`, `team`, `position`, `currentPrice`, etc.

### Test Data

- Midweek scenario fixture.

### Edge Cases

- Price for a player that exists in one scenario but not another.

---

## TC-006: Replace CSS class assertion — PlayerCard positive change indicator

**Priority:** P1
**Type:** Regression

### Objective

Replace `expect(change.className).toMatch(/up/)` in `PlayerCard.test.tsx` with a semantic assertion that does not depend on CSS Module hash output.

### Preconditions

- `PlayerCard` component is rendered with a player having positive `changePercent`.

### Steps

1. Render `PlayerCard` with `changePercent: 2.5`.
   **Expected:** The change element contains the text `▲` or a visible "+" prefix, or has `aria-label` containing "up" or "positive".

2. Assert using `toHaveTextContent`, `toHaveAttribute('aria-label', ...)`, or `getByTestId('change-indicator')` with `data-direction="up"`.
   **Expected:** Assertion passes based on visible/accessible content, not CSS class name.

### Test Data

- `createMockEnrichedPlayer({ changePercent: 2.5, priceChange: 1.25 })`.

### Edge Cases

- `changePercent` of exactly `0` — should show neutral indicator, not "up" or "down".
- Very small positive change (e.g., `0.01`) — still shows positive indicator.

---

## TC-007: Replace CSS class assertion — PlayerCard negative change indicator

**Priority:** P1
**Type:** Regression

### Objective

Replace `expect(change.className).toMatch(/down/)` in `PlayerCard.test.tsx` with a semantic assertion.

### Preconditions

- `PlayerCard` component rendered with negative `changePercent`.

### Steps

1. Render `PlayerCard` with `changePercent: -3.1`.
   **Expected:** The change element contains `▼` or a visible "−" prefix, or has `aria-label` containing "down" or "negative".

2. Assert using semantic query (text content, aria-label, or data-testid attribute).
   **Expected:** Assertion passes without referencing CSS class names.

### Test Data

- `createMockEnrichedPlayer({ changePercent: -3.1 })`.

### Edge Cases

- Large negative change (e.g., `-50.0`) — still shows "down" indicator, no overflow.

---

## TC-008: Replace CSS class assertion — Market sort tab active state

**Priority:** P1
**Type:** Regression

### Objective

Replace `expect(risersBtn.className).toMatch(/active/)` in `Market.test.tsx` with a semantic assertion for the active sort tab.

### Preconditions

- Market page rendered with player data.

### Steps

1. Render Market, verify "Biggest Risers" tab is active by default.
   **Expected:** Assert via `aria-selected="true"`, `data-active="true"`, `aria-current`, or `toHaveAttribute('data-active', 'true')` — not `className.toMatch(/active/)`.

2. Click "Biggest Fallers" tab.
   **Expected:** "Biggest Fallers" has `data-active="true"`. "Biggest Risers" has `data-active="false"` or the attribute is absent.

### Test Data

- Three mock players with different `changePercent` values.

### Edge Cases

- Rapid tab switching — final state should be the last clicked tab.

---

## TC-009: Replace CSS class assertion — Onboarding dot active state

**Priority:** P1
**Type:** Regression

### Objective

Replace all `expect(getDots()[N].className).toMatch(/active/)` assertions in `Onboarding.test.tsx` with semantic assertions (approximately 12 instances).

### Preconditions

- Onboarding component rendered.

### Steps

1. On step 1 of onboarding, verify dot 0 is active.
   **Expected:** Assert via `aria-current="step"`, `aria-selected="true"`, `data-active="true"`, or visible styling indicator — not `className.toMatch(/active/)`.

2. Advance to step 2, verify dot 1 is active and dot 0 is inactive.
   **Expected:** Semantic assertions correctly distinguish active vs. inactive dots.

3. Navigate backward, verify correct dot becomes active again.
   **Expected:** Assertions track state changes accurately.

### Test Data

- Default onboarding state (6 steps).

### Edge Cases

- First dot (index 0) — cannot go further back.
- Last dot (index 5) — cannot go further forward.

---

## TC-010: Replace CSS class assertion — DailyMission riser/faller button active state

**Priority:** P1
**Type:** Regression

### Objective

Replace `className.toMatch(/active/)` assertions in `DailyMission.test.tsx` for riser/faller pick buttons with semantic assertions.

### Preconditions

- DailyMission component rendered with player data.

### Steps

1. Select a player as a "riser" pick.
   **Expected:** The riser button is indicated as selected via `aria-pressed="true"`, `data-active="true"`, or a visible text/icon change — not `className.toMatch(/active/)`.

2. Verify the faller button for the same player is not active.
   **Expected:** Semantic assertion shows it is unselected.

### Test Data

- At least 2 mock players for mission picks.

### Edge Cases

- Selecting the same player as both riser and faller (should not be allowed, or one replaces the other).

---

## TC-011: Replace CSS class assertion — DailyMission change direction indicators

**Priority:** P1
**Type:** Regression

### Objective

Replace `className.toMatch(/up/)` and `className.toMatch(/down/)` in `DailyMission.test.tsx` for price change indicators with semantic assertions.

### Preconditions

- DailyMission component rendered with revealed mission results showing both gains and losses.

### Steps

1. Verify a player with positive change shows an "up" indicator.
   **Expected:** Assert via text content (e.g., `▲`, `+`), `aria-label`, or `data-direction="up"`.

2. Verify a player with negative change shows a "down" indicator.
   **Expected:** Assert via text content (e.g., `▼`, `−`), `aria-label`, or `data-direction="down"`.

### Test Data

- Mission results with one player gaining and one losing.

### Edge Cases

- Zero change — should show neutral indicator.

---

## TC-012: Cypress E2E — Buy flow verifies portfolio with computed values

**Priority:** P0
**Type:** Integration

### Objective

Create a new Cypress spec that executes a complete buy flow and verifies the portfolio page shows the holding with **correct share count and computed dollar value** — not just DOM element presence.

### Preconditions

- App is running with midweek scenario data.
- User starts with no holdings and $10,000 cash.

### Steps

1. Navigate to `/market`, click on a player card (e.g., first player).
   **Expected:** Player detail page loads. Note the displayed price (e.g., "$52.00").

2. Read the current price from `[data-testid="player-price"]` and store it.
   **Expected:** Price is a valid dollar amount.

3. Set share quantity to `3` in the form input, then click the Buy button.
   **Expected:** Success toast appears. Holdings card shows `Shares: 3`.

4. Navigate to `/portfolio`.
   **Expected:** Holdings list contains one row for the purchased player.

5. In the holding row, verify: `[data-testid="holding-shares"]` contains text `3`.
   **Expected:** Share count is exactly `3`.

6. In the holding row, verify: `[data-testid="holding-value"]` displays approximately `3 × price` (within $0.01 tolerance).
   **Expected:** Market value is computed correctly, e.g., "$156.00" for price $52.00.

7. Verify `[data-testid="holding-gain"]` shows `$0.00` or `0.00%` (no price change yet).
   **Expected:** Gain is zero because buy price equals current price.

8. Verify the summary card "Total Value" reflects the holdings value plus remaining cash.
   **Expected:** Total ≈ $10,000 (cash portion decreased by purchase, holdings offset it).

### Test Data

- Clean app state, midweek scenario, default $10,000 starting cash.

### Edge Cases

- Buy 0 shares — button should be disabled or show error.
- Buy fractional shares — form should reject non-integer input if not supported.
- Buy when cash is exactly equal to price × shares — should succeed with $0.00 remaining cash.

---

## TC-013: Cypress E2E — Buy flow then sell flow verifies correct portfolio update

**Priority:** P0
**Type:** Integration

### Objective

Extend the buy flow to also sell shares and verify the portfolio correctly updates share counts and cash balance.

### Preconditions

- App running with midweek scenario. Clean state.

### Steps

1. Navigate to a player detail page, note the price.
   **Expected:** Price is displayed.

2. Buy 5 shares.
   **Expected:** Success toast. Holdings card shows 5 shares.

3. Switch to Sell tab, sell 2 shares.
   **Expected:** Success toast. Holdings card now shows 3 shares.

4. Navigate to `/portfolio`.
   **Expected:** Holding row shows `3` shares.

5. Verify cash balance has decreased by `5 × price` (buy) and increased by `2 × price` (sell), net decrease of `3 × price`.
   **Expected:** Cash ≈ `$10,000 - (3 × price)`.

### Test Data

- Clean app state, midweek scenario.

### Edge Cases

- Sell all shares — holding row should disappear from portfolio (or show 0 shares).
- Sell shares immediately after buying — gain should be $0.00.

---

## TC-014: Cypress E2E — Scenario switch resets portfolio and changes prices

**Priority:** P0
**Type:** Integration

### Objective

Verify that switching scenarios causes player prices to change and portfolio state to reset, confirming the scenario/simulation pipeline works end-to-end.

### Preconditions

- App running, scenario toggle is accessible (e.g., via ScenarioToggle component or inspector).
- At least two scenarios available (e.g., "midweek" and "gameday").

### Steps

1. On the market page with "midweek" scenario, record the price for a known player (e.g., Mahomes) from `[data-testid="player-price"]` or the player card.
   **Expected:** A specific dollar price is displayed.

2. Buy 2 shares of that player. Navigate to `/portfolio` and verify holding exists.
   **Expected:** Portfolio shows 2 shares.

3. Switch the scenario to "gameday" (via scenario toggle or URL).
   **Expected:** Page re-renders with new data.

4. Navigate to `/market` and record the price for the same player.
   **Expected:** Price is **different** from the midweek price (scenarios have different price data).

5. Navigate to `/portfolio`.
   **Expected:** Portfolio is reset — either holdings are cleared or reflect the new scenario's starting state. The old midweek holding of 2 shares is not carried over (or if it is, the value reflects the new price).

### Test Data

- Two scenario fixtures with different prices for at least one overlapping player.

### Edge Cases

- Switching back to the original scenario — should portfolio restore or stay reset?
- Switching scenario while on the player detail page — prices should update in place.

---

## TC-015: Cypress E2E — Watchlist add/verify/remove full flow

**Priority:** P1
**Type:** Integration

### Objective

Create a Cypress spec that adds a player to the watchlist from the player detail page, navigates to the watchlist page to verify the player appears with correct data, then removes and verifies the player is gone.

### Preconditions

- Clean app state. Watchlist is empty.

### Steps

1. Navigate to `/player/mahomes`.
   **Expected:** Player detail page loads. Watchlist button says "Add to Watchlist".

2. Click the watchlist button.
   **Expected:** Button text changes to "Watching". Toast confirms addition.

3. Navigate to `/watchlist`.
   **Expected:** Watchlist grid is visible (not empty state).

4. Verify a card for "Patrick Mahomes" exists, showing his current price and team.
   **Expected:** Card contains text "Patrick Mahomes", "KC", and a dollar-formatted price.

5. Click the remove button on the Mahomes card.
   **Expected:** Toast confirms removal. Card disappears.

6. Verify the empty state message ("Track Your Favorites") is displayed.
   **Expected:** Empty state is visible.

### Test Data

- Clean state, midweek scenario with Mahomes in the player list.

### Edge Cases

- Adding the same player twice (from different entry points) — should not duplicate.
- Watchlist persistence across page reload (already covered in existing `watchlist.cy.js` TC-WL-006 but should verify computed values too).

---

## TC-016: Cypress E2E — Watchlist player card shows correct computed price

**Priority:** P1
**Type:** Integration

### Objective

Verify that the watchlist card displays the player's actual current price and change percentage from the scenario data, not placeholder values.

### Preconditions

- At least one player added to watchlist.

### Steps

1. Navigate to `/player/mahomes`, read the displayed price and change percentage.
   **Expected:** Price (e.g., "$52.00") and change (e.g., "+2.50%") are visible.

2. Add to watchlist, navigate to `/watchlist`.
   **Expected:** Watchlist card for Mahomes is displayed.

3. Verify the watchlist card shows the **same price and change percentage** as the player detail page.
   **Expected:** Values match (within display rounding).

### Test Data

- Midweek scenario, Mahomes player data.

### Edge Cases

- Player with zero change — card should display "0.00%" without a direction indicator.

---

## TC-017: Existing unit tests still pass after renderWithProviders refactor

**Priority:** P0
**Type:** Regression

### Objective

Run the full vitest suite to confirm that the refactored `renderWithProviders` (with `useRealProviders` option added) does not break any of the ~1,105 existing tests that use the default mock mode.

### Preconditions

- `renderWithProviders` refactor is complete.
- No other code changes that could affect test results.

### Steps

1. Run `npm run test:run`.
   **Expected:** All tests pass. Zero regressions.

2. Run `npm run test:coverage`.
   **Expected:** Coverage thresholds are still met (no decrease).

### Test Data

- N/A.

### Edge Cases

- Tests that import `renderWithProviders` directly and destructure its return — must remain compatible.
- Tests that pass `scenarioOverrides`, `tradingOverrides`, etc. — override mechanism must work identically.

---

## TC-018: Existing Cypress E2E specs still pass

**Priority:** P0
**Type:** Regression

### Objective

Confirm that none of the 11 existing Cypress spec files break after the changes (CSS class assertion refactors, new E2E specs, any data-testid additions).

### Preconditions

- All code changes are complete. App builds and starts successfully.

### Steps

1. Run `npm run cy:run`.
   **Expected:** All existing specs pass (portfolio, watchlist, player-detail, market, navigation, leaderboard, toasts, onboarding, mission, timeline, smoke).

2. Verify the 3 new E2E specs (buy flow, scenario switch, watchlist flow) also pass.
   **Expected:** New specs pass.

### Test Data

- Standard Cypress test environment.

### Edge Cases

- Flaky tests due to timing — new specs should use explicit waits/assertions, not `cy.wait()`.

---

## TC-019: Coverage thresholds are maintained after CSS class assertion replacements

**Priority:** P1
**Type:** Regression

### Objective

After replacing `className.toMatch(...)` assertions with semantic alternatives, verify that test coverage does not decrease (the same code paths are still exercised).

### Preconditions

- All CSS class assertion replacements are complete across PlayerCard, Market, Onboarding, and DailyMission tests.

### Steps

1. Run `npm run test:coverage`.
   **Expected:** Coverage meets or exceeds existing thresholds for all metrics (statements, branches, functions, lines).

2. Compare coverage report to pre-change baseline.
   **Expected:** No coverage lines lost. Replaced assertions still exercise the same component rendering paths.

### Test Data

- N/A.

### Edge Cases

- If a component conditionally applies a class but the new assertion checks text instead, ensure the conditional branch is still covered (e.g., the positive/negative change rendering path).

---

## TC-020: Integration test — trading logic rejects invalid operations with real providers

**Priority:** P1
**Type:** Integration

### Objective

With `useRealProviders: true`, verify that trading guard rails work: insufficient funds, selling unowned shares, and zero-quantity trades are all rejected.

### Preconditions

- `useRealProviders: true` mode is functional.
- Midweek scenario loaded with known player prices.

### Steps

1. Render with real providers. Attempt to buy 999,999 shares of any player.
   **Expected:** `buyShares` returns `false`. Cash and portfolio are unchanged.

2. Attempt to sell 1 share of a player not in the portfolio.
   **Expected:** `sellShares` returns `false`. Portfolio unchanged.

3. Attempt to buy 0 shares.
   **Expected:** Operation is rejected or is a no-op. Portfolio unchanged.

### Test Data

- Midweek scenario, starting cash $10,000, player price ~$50.

### Edge Cases

- Buying exactly `Math.floor(cash / price)` shares — should succeed, leaving near-zero cash.
- Buying `Math.floor(cash / price) + 1` shares — should fail.

---

## TC-021: Integration test — social context works with real providers

**Priority:** P1
**Type:** Integration

### Objective

With `useRealProviders: true`, verify that watchlist and mission pick operations actually mutate state, not just call `vi.fn()` stubs.

### Preconditions

- `useRealProviders: true` mode with SocialProvider.

### Steps

1. Call `addToWatchlist('mahomes')`.
   **Expected:** `watchlist` array now contains `'mahomes'`. `isWatching('mahomes')` returns `true`.

2. Call `removeFromWatchlist('mahomes')`.
   **Expected:** `watchlist` is empty. `isWatching('mahomes')` returns `false`.

3. Call `setMissionPick('mahomes', 'riser')`.
   **Expected:** `missionPicks.risers` contains `'mahomes'`.

### Test Data

- Midweek scenario with Mahomes available.

### Edge Cases

- Adding a non-existent player ID to watchlist — should either reject or accept gracefully.
- Adding the same player twice — watchlist should not contain duplicates.

---

## TC-022: New data-testid or aria attributes do not conflict with existing ones

**Priority:** P2
**Type:** Regression

### Objective

If new `data-testid` attributes or `aria-label` values are added to support semantic assertions (e.g., `data-direction="up"` on change indicators), verify they don't conflict with existing attributes used by Cypress specs.

### Preconditions

- All component changes are complete.

### Steps

1. Search codebase for all `data-testid` values; check for duplicates across unrelated components.
   **Expected:** No unintentional duplicates that could cause Cypress selector ambiguity.

2. Run existing Cypress specs.
   **Expected:** No spec fails due to selector conflicts from newly added attributes.

### Test Data

- N/A (code review + Cypress run).

### Edge Cases

- Components rendered inside other components (e.g., `PlayerCard` inside `Market` and `Watchlist`) — `data-testid` values should be scoped or contextual.

---

## TC-023: Gate — full CI pipeline passes

**Priority:** P0
**Type:** Functional

### Objective

Verify the complete gate as specified in the design notes: `npm run test:run`, `npm run test:coverage` (thresholds met), and `npm run cy:run` (all specs including new ones pass).

### Preconditions

- All code changes are finalized and committed.

### Steps

1. Run `npm run test:run`.
   **Expected:** Exit code 0, all unit/integration tests pass.

2. Run `npm run test:coverage`.
   **Expected:** Exit code 0, all coverage thresholds met.

3. Run `npm run cy:run`.
   **Expected:** Exit code 0, all E2E specs pass including the 3 new ones (buy flow, scenario switch, watchlist flow).

### Test Data

- CI environment or local equivalent.

### Edge Cases

- Flaky Cypress tests — retry once if a timing-related failure occurs.
- Coverage threshold just barely met — acceptable as long as it passes.

---

## TC-024: Real-provider integration tests catch intentionally broken logic

**Priority:** P0
**Type:** Integration

### Objective

The whole point of this issue is that tests should **fail when features are broken**. Verify this by temporarily breaking portfolio calculation logic and confirming the new integration tests catch it (while the old mock-based tests do not).

### Preconditions

- Both mock-mode and real-provider tests exist for trading operations.

### Steps

1. Temporarily modify `getPortfolioValue` in `TradingContext` to always return `{ value: 0, cost: 0, gain: 0, gainPercent: 0 }`.
   **Expected:** Mock-based unit tests that use `vi.fn()` stubs still pass (they never call real logic).

2. Run the new `useRealProviders: true` integration tests.
   **Expected:** Tests FAIL — they detect that `getPortfolioValue` returns incorrect zeros after a real buy.

3. Revert the intentional breakage.
   **Expected:** All tests pass again.

### Test Data

- Same as TC-004.

### Edge Cases

- Breaking `buyShares` to always return `true` without mutating state — integration tests should catch this too.
- Breaking `getEffectivePrice` to return `0` — integration tests should detect incorrect order totals.
