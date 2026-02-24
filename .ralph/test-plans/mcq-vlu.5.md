# Test Plan: mcq-vlu.5 -- Wire provider composition and remove GameContext

## Summary

- **Bead:** `mcq-vlu.5`
- **Feature:** Provider tree composition in App.tsx with correct nesting order, migration of all components from useGame() to domain-specific hooks, and deletion of GameContext.jsx
- **Total Test Cases:** 14
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Provider nesting order matches specification

**Priority:** P0
**Type:** Integration

### Objective

Verify that the provider tree in App.tsx follows the exact nesting order: ScenarioProvider > SimulationProvider > TradingProvider > SocialProvider > ToastProvider > OnboardingProvider > BrowserRouter. Incorrect ordering will break cross-context dependencies (e.g., SimulationProvider depends on useScenario).

### Preconditions

- App.tsx exists with all provider imports

### Steps

1. Open `src/App.tsx` and inspect the JSX tree inside the `App` component.
   **Expected:** The nesting order top-to-bottom is ScenarioProvider → SimulationProvider → TradingProvider → SocialProvider → ToastProvider → OnboardingProvider → BrowserRouter.

2. Render the `<App />` component in a test environment.
   **Expected:** No errors are thrown during mount; all providers initialize successfully.

### Test Data

- None; uses default app bootstrap.

### Edge Cases

- If any provider is missing or duplicated, the app should fail to render or throw a context error.

---

## TC-002: GameContext.jsx is deleted from the repository

**Priority:** P0
**Type:** Functional

### Objective

Confirm that the legacy GameContext.jsx file has been completely removed from the codebase and no references to it remain.

### Preconditions

- Git working tree reflects the changes from this bead.

### Steps

1. Search the `src/` directory for any file named `GameContext.jsx` or `GameContext.tsx`.
   **Expected:** No file exists at any path matching `**/GameContext.*`.

2. Search the entire codebase for import statements referencing `GameContext`.
   **Expected:** Zero matches. No file imports from a GameContext module.

3. Search the entire codebase for string references to `GameContext` (including comments, type annotations).
   **Expected:** Zero matches in production source code (documentation references are acceptable).

### Test Data

- None.

### Edge Cases

- Verify that no barrel/index file re-exports GameContext.

---

## TC-003: No remaining useGame() calls in production code

**Priority:** P0
**Type:** Functional

### Objective

Verify that every component that previously used `useGame()` has been migrated to the appropriate domain hook(s): `useScenario`, `useSimulation`, `useTrading`, or `useSocial`.

### Preconditions

- All component files under `src/` are accessible.

### Steps

1. Search all `.tsx`, `.jsx`, `.ts`, `.js` files under `src/` for `useGame(` or `useGame)` references.
   **Expected:** Zero matches in any source file.

2. Search for any import of `useGame` from any module.
   **Expected:** Zero matches.

### Test Data

- None.

### Edge Cases

- Check test files as well — test helpers should also be migrated away from useGame().

---

## TC-004: SimulationProvider can access ScenarioContext values

**Priority:** P0
**Type:** Integration

### Objective

SimulationProvider calls `useScenario()` internally to read `scenario`, `players`, and `scenarioVersion`. This test verifies the dependency is satisfied by the nesting order.

### Preconditions

- App renders with ScenarioProvider wrapping SimulationProvider.

### Steps

1. Render the full provider tree and call `useSimulation()` from a child component.
   **Expected:** Hook returns a valid context object with `tick`, `isPlaying`, `history`, and other fields.

2. Change the scenario via `useScenario().setScenario('live')` and wait for loading to complete.
   **Expected:** `useSimulation().isPlaying` becomes `true`; simulation state resets (tick = 0).

### Test Data

- Scenarios: 'midweek' (default), 'live'.

### Edge Cases

- Calling `useSimulation()` without a wrapping `ScenarioProvider` should throw "useScenario must be used within a ScenarioProvider".

---

## TC-005: TradingProvider can access both ScenarioContext and SimulationContext

**Priority:** P0
**Type:** Integration

### Objective

TradingProvider depends on both `useScenario()` (for `players`, `scenarioVersion`, `currentData`) and `useSimulation()` (for `priceOverrides`, `isEspnLiveMode`, `espnPriceHistory`). Verify both are available.

### Preconditions

- Full provider tree rendered with correct nesting.

### Steps

1. Render the full provider tree and call `useTrading()` from a child component.
   **Expected:** Returns valid context with `portfolio`, `cash`, `buyShares`, `sellShares`, `getPlayer`, `getPlayers`, `getEffectivePrice`, `getPortfolioValue`.

2. Call `getPlayers()` and verify players come from ScenarioContext.
   **Expected:** Returns an array of players with `currentPrice` and `changePercent` computed fields.

3. Call `getEffectivePrice('mahomes')`.
   **Expected:** Returns a positive number reflecting the price from SimulationContext's priceOverrides merged with scenario base prices.

### Test Data

- Default 'midweek' scenario; player ID 'mahomes'.

### Edge Cases

- Calling `useTrading()` outside TradingProvider throws "useTrading must be used within a TradingProvider".

---

## TC-006: SocialProvider can access ScenarioContext and TradingContext

**Priority:** P0
**Type:** Integration

### Objective

SocialProvider depends on `useScenario()` (for `scenarioVersion`) and `useTrading()` (for `getPlayer`, `getEffectivePrice`, `portfolio`, `cash`, `getPortfolioValue`). Verify both are available through the nesting order.

### Preconditions

- Full provider tree rendered with correct nesting.

### Steps

1. Render the full provider tree and call `useSocial()` from a child component.
   **Expected:** Returns valid context with `watchlist`, `missionPicks`, `addToWatchlist`, `removeFromWatchlist`, `getLeaderboardRankings`, etc.

2. Call `getLeaderboardRankings()` which internally uses `getEffectivePrice` and `getPortfolioValue` from TradingContext.
   **Expected:** Returns a sorted array of ranked traders including the user entry with computed portfolio values.

3. Change scenario and verify mission state resets.
   **Expected:** `missionPicks` resets to `{ risers: [], fallers: [] }` while `watchlist` is preserved.

### Test Data

- Default 'midweek' scenario; player ID 'mahomes' for watchlist/mission picks.

### Edge Cases

- Calling `useSocial()` outside SocialProvider throws "useSocial must be used within a SocialProvider".

---

## TC-007: All four domain hooks return valid context simultaneously

**Priority:** P0
**Type:** Integration

### Objective

Verify that a component nested inside the full provider tree can call all four hooks (`useScenario`, `useSimulation`, `useTrading`, `useSocial`) at once and receive valid values from each.

### Preconditions

- Full provider tree with all four context providers.

### Steps

1. Create a test component that calls all four hooks and render it within the full provider tree.
   **Expected:** No errors thrown; all four hooks return non-null context objects.

2. Verify baseline values from each context:
   - `useScenario().scenario` equals `'midweek'`
   - `useSimulation().tick` equals `0`
   - `useTrading().cash` equals `10000`
   - `useSocial().watchlist` equals `[]`
   **Expected:** All assertions pass.

### Test Data

- Default application state with localStorage cleared.

### Edge Cases

- None.

---

## TC-008: Component imports reference domain hooks, not useGame

**Priority:** P1
**Type:** Regression

### Objective

Verify that each production component that consumes context data imports from the correct domain-specific context module rather than a monolithic GameContext.

### Preconditions

- All component source files under `src/pages/` and `src/components/` are available.

### Steps

1. Inspect `src/pages/Market/Market.tsx` imports.
   **Expected:** Imports `useScenario` from `ScenarioContext` and `useTrading` from `TradingContext`. No import of `useGame`.

2. Inspect `src/pages/PlayerDetail/PlayerDetail.tsx` imports.
   **Expected:** Imports `useTrading` from `TradingContext` and `useSocial` from `SocialContext`. No import of `useGame`.

3. Inspect `src/components/PlayerCard/PlayerCard.tsx` imports.
   **Expected:** Imports `useScenario`, `useTrading`, and `useSocial` from their respective context modules. No import of `useGame`.

4. Inspect `src/components/Layout/Layout.tsx` imports.
   **Expected:** Imports `useScenario` and `useTrading`. No import of `useGame`.

5. Inspect `src/components/ScenarioToggle/ScenarioToggle.tsx` imports.
   **Expected:** Imports `useScenario` and `useSimulation`. No import of `useGame`.

6. Inspect `src/components/LiveTicker/LiveTicker.tsx` imports.
   **Expected:** Imports `useScenario` and `useSimulation`. No import of `useGame`.

7. Inspect `src/components/PlayoffAnnouncementModal/PlayoffAnnouncementModal.tsx` imports.
   **Expected:** Imports `useScenario` and `useSimulation`. No import of `useGame`.

8. Inspect `src/pages/Portfolio/Portfolio.tsx`, `src/pages/Watchlist/Watchlist.tsx`, `src/pages/Timeline/Timeline.tsx`, `src/pages/Leaderboard/Leaderboard.tsx`.
   **Expected:** Each imports only domain-specific hooks. No import of `useGame`.

### Test Data

- None; static code analysis.

### Edge Cases

- Check `src/components/DailyMission/DailyMission.tsx`, `src/components/MiniLeaderboard/MiniLeaderboard.tsx`, and `src/components/TimelineDebugger/TimelineDebugger.tsx` as well.

---

## TC-009: App renders without runtime errors after provider wiring

**Priority:** P0
**Type:** Functional

### Objective

End-to-end smoke test confirming the app boots successfully with the new provider composition and all routes are reachable.

### Preconditions

- Application builds without TypeScript or lint errors.
- Test environment available (jsdom or browser).

### Steps

1. Render `<App />` and wait for the default route (`/`) to mount.
   **Expected:** Timeline page renders without errors; no console errors related to missing context.

2. Navigate to `/market`.
   **Expected:** Market page renders; player cards display with prices.

3. Navigate to `/portfolio`.
   **Expected:** Portfolio page renders with cash balance and holdings.

4. Navigate to `/watchlist`.
   **Expected:** Watchlist page renders (empty state or populated).

5. Navigate to `/leaderboard`.
   **Expected:** Leaderboard page renders with ranked traders.

6. Navigate to `/player/mahomes`.
   **Expected:** PlayerDetail page renders with player data and price info.

### Test Data

- Default 'midweek' scenario.

### Edge Cases

- Navigate to `/inspector` (ScenarioInspector) route and verify it loads without context errors.

---

## TC-010: Scenario change cascades correctly through all providers

**Priority:** P1
**Type:** Integration

### Objective

When the scenario changes, state should reset in the correct order through the provider chain: ScenarioContext loads new data → SimulationContext resets tick/prices → TradingContext resets portfolio/cash → SocialContext resets mission picks.

### Preconditions

- Full provider tree rendered; initial scenario is 'midweek'.

### Steps

1. Buy shares and add a watchlist item to establish non-default state.
   **Expected:** Cash is less than 10000; portfolio has entries; watchlist is non-empty.

2. Change scenario to 'playoffs' via `setScenario('playoffs')` and wait for loading to complete.
   **Expected:**
   - `scenario` equals `'playoffs'`
   - `tick` resets to `0`
   - `cash` resets to `10000`
   - `missionPicks` resets to `{ risers: [], fallers: [] }`
   - `watchlist` is preserved (not reset)

### Test Data

- Player ID 'mahomes' for buy/watchlist operations.

### Edge Cases

- Switch to 'live' scenario: verify `isPlaying` becomes `true` automatically.
- Switch to 'superbowl' scenario: verify `isPlaying` becomes `true` automatically.
- Switch to 'espn-live' scenario: verify ESPN-specific state initializes.

---

## TC-011: Provider error boundaries — hooks outside providers throw descriptive errors

**Priority:** P1
**Type:** Functional

### Objective

Each domain hook must throw a clear error message when called outside its provider, guiding developers to the correct fix.

### Preconditions

- Isolated test environment (no wrapping providers).

### Steps

1. Call `useScenario()` with no ScenarioProvider wrapper.
   **Expected:** Throws "useScenario must be used within a ScenarioProvider".

2. Call `useSimulation()` with no SimulationProvider wrapper.
   **Expected:** Throws "useSimulation must be used within a SimulationProvider".

3. Call `useTrading()` with no TradingProvider wrapper.
   **Expected:** Throws "useTrading must be used within a TradingProvider".

4. Call `useSocial()` with no SocialProvider wrapper.
   **Expected:** Throws "useSocial must be used within a SocialProvider".

### Test Data

- None.

### Edge Cases

- Call `useSimulation()` inside only a ScenarioProvider (without SimulationProvider): should still throw the SimulationProvider error.

---

## TC-012: ToastProvider and OnboardingProvider are correctly positioned

**Priority:** P1
**Type:** Integration

### Objective

Verify that ToastProvider sits inside SocialProvider and wraps OnboardingProvider, and that OnboardingProvider wraps BrowserRouter. This ensures toasts and onboarding flows have access to all domain contexts.

### Preconditions

- App.tsx reflects the specified nesting order.

### Steps

1. Inspect the App.tsx JSX tree for provider nesting.
   **Expected:** SocialProvider > ToastProvider > OnboardingProvider > BrowserRouter.

2. Render the app and trigger a toast notification from within a route component.
   **Expected:** Toast renders correctly; toast component can access domain context if needed.

3. Render the app and verify the Onboarding component mounts.
   **Expected:** Onboarding component renders inside the OnboardingProvider without errors.

### Test Data

- None.

### Edge Cases

- Verify BrowserRouter is the innermost provider (wrapping Routes), not an outer provider.

---

## TC-013: No duplicate provider instances in the tree

**Priority:** P1
**Type:** Regression

### Objective

Ensure each context provider appears exactly once in the component tree. Duplicate providers would create independent context instances, causing state divergence.

### Preconditions

- Access to App.tsx and all component files.

### Steps

1. Search all `.tsx` and `.jsx` files for `<ScenarioProvider`.
   **Expected:** Appears only in `App.tsx` (and test files). Not in any page or component file.

2. Search all `.tsx` and `.jsx` files for `<SimulationProvider`.
   **Expected:** Appears only in `App.tsx` (and test files).

3. Search all `.tsx` and `.jsx` files for `<TradingProvider`.
   **Expected:** Appears only in `App.tsx` (and test files).

4. Search all `.tsx` and `.jsx` files for `<SocialProvider`.
   **Expected:** Appears only in `App.tsx` (and test files).

### Test Data

- None; static code analysis.

### Edge Cases

- Check `renderWithProviders` test helpers to ensure they compose providers in the same order as App.tsx.

---

## TC-014: TypeScript compilation succeeds with no type errors

**Priority:** P0
**Type:** Functional

### Objective

After removing GameContext and rewiring all imports, the project must compile cleanly with `tsc --noEmit`. Any dangling references to GameContext types or useGame would surface as type errors.

### Preconditions

- All code changes from this bead are applied.

### Steps

1. Run `npx tsc --noEmit` from the project root.
   **Expected:** Exit code 0 with no type errors.

2. Run the project's lint command (e.g., `npm run lint`).
   **Expected:** No lint errors related to missing imports, unused imports, or undefined variables.

3. Run the existing test suite (`npm test` or `npx vitest run`).
   **Expected:** All tests pass. No failures related to missing context or undefined hooks.

### Test Data

- None.

### Edge Cases

- Verify that no `@ts-ignore` or `@ts-expect-error` comments were added to suppress GameContext-related errors.
