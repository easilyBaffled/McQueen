# McQueen Refactor Specification

> **Issue**: mcq-7h6 · Spec: Write Refactor Specification
> **Blocks**: mcq-061 (Issue Breakdown: Decompose Into Epics + Child Issues)
> **Date**: 2026-02-18

---

## 1. Target Architecture

### 1.1 State Management — Split GameContext Into Domain Contexts

The monolithic `GameContext.jsx` (957 lines, 16 `useState` hooks, 25+ functions, 5 `useEffect` hooks) is the single largest pain point (C1). Every state change re-renders every consumer. The fix is to split it into four domain-specific contexts, each with its own provider, hook, and isolated re-render boundary.

#### ScenarioContext

**Owns**: scenario selection, scenario data loading, player base data.

| State              | Type                          | Source                           |
| ------------------ | ----------------------------- | -------------------------------- |
| `scenario`         | `string`                      | localStorage / user selection    |
| `currentData`      | `ScenarioData \| null`        | Lazy-loaded JSON                 |
| `players`          | `Player[]`                    | `currentData.players`            |

| Action             | Signature                     |
| ------------------ | ----------------------------- |
| `setScenario`      | `(id: ScenarioId) => void`    |

**Key change**: Scenario JSON files are loaded via dynamic `import()` instead of static imports at the top of the file (addresses H4). Only the selected scenario is fetched; the others are never bundled into the initial chunk.

```typescript
const SCENARIO_LOADERS: Record<ScenarioId, () => Promise<ScenarioData>> = {
  midweek:   () => import('../data/midweek.json'),
  live:      () => import('../data/live.json'),
  playoffs:  () => import('../data/playoffs.json'),
  superbowl: () => import('../data/superbowl.json'),
  'espn-live': () => import('../data/espnPlayers.json')
    .then(m => ({ scenario: 'espn-live', players: m.default.players })),
};
```

When `setScenario` is called, the provider lazy-loads the new data file, resets downstream contexts via a shared `scenarioVersion` counter (see Migration Strategy, section 3.3), and exposes `players` once loaded.

#### SimulationContext

**Owns**: price simulation engine, price overrides, unified timeline, tick state.

| State              | Type                              |
| ------------------ | --------------------------------- |
| `tick`             | `number`                          |
| `isPlaying`        | `boolean`                         |
| `priceOverrides`   | `Record<string, number>`          |
| `unifiedTimeline`  | `TimelineEntry[]`                 |
| `history`          | `HistoryEntry[]`                  |

| ESPN-specific      | Type                              |
| ------------------ | --------------------------------- |
| `espnNews`         | `Article[]`                       |
| `espnPriceHistory` | `Record<string, PriceEntry[]>`    |
| `espnLoading`      | `boolean`                         |
| `espnError`        | `string \| null`                  |

| Action               | Signature                       |
| ----------------------| ------------------------------- |
| `setIsPlaying`        | `(v: boolean) => void`          |
| `goToHistoryPoint`    | `(index: number) => void`       |
| `refreshEspnNews`     | `() => void`                    |
| `applyPlayoffDilution`| `(percent: number) => void`     |

**Key change**: Introduce a `SimulationEngine` interface that unifies the two modes (addresses H2):

```typescript
interface SimulationEngine {
  start(): void;
  stop(): void;
  tick(): void;
  getPrice(playerId: string): number | undefined;
  onPriceUpdate: (playerId: string, price: number, reason: PriceReason) => void;
}
```

Two implementations:

- `TimelineSimulationEngine` — drives live/superbowl by advancing through `unifiedTimeline` on a 3-second interval. Replaces the tick `useEffect` currently at lines 379–428 of `GameContext.jsx`.
- `EspnSimulationEngine` — polls ESPN API, runs sentiment + price calculation, emits price updates. Replaces the ESPN `useEffect` at lines 316–333 and `fetchAndProcessEspnNews` at lines 213–313.

Both engines call the same `onPriceUpdate` callback to write `priceOverrides` and `history`, eliminating the divergent code paths.

#### TradingContext

**Owns**: portfolio, cash, user price impact, buy/sell operations.

| State          | Type                                           |
| -------------- | ---------------------------------------------- |
| `portfolio`    | `Record<string, { shares: number; avgCost: number }>` |
| `cash`         | `number`                                       |
| `userImpact`   | `Record<string, number>`                       |

| Action         | Signature                                      |
| -------------- | ---------------------------------------------- |
| `buyShares`    | `(playerId: string, shares: number) => boolean`|
| `sellShares`   | `(playerId: string, shares: number) => boolean`|

**Dependencies**: Reads `getEffectivePrice` from SimulationContext (or a shared price selector). On scenario change, resets `portfolio` to `startingPortfolio`, resets `cash` to `INITIAL_CASH`, and clears `userImpact`.

**Key change**: `getEffectivePrice` becomes a pure function exported from a `priceResolver` module:

```typescript
function getEffectivePrice(
  playerId: string,
  priceOverrides: Record<string, number>,
  userImpact: Record<string, number>,
  players: Player[],
): number
```

This makes it independently testable (addresses H1) and removes the circular dependency between trading and simulation.

#### SocialContext

**Owns**: watchlist, mission, leaderboard.

| State              | Type                         |
| ------------------ | ---------------------------- |
| `watchlist`        | `string[]`                   |
| `missionPicks`     | `{ risers: string[]; fallers: string[] }` |
| `missionRevealed`  | `boolean`                    |

| Action               | Signature                                 |
| ----------------------| ----------------------------------------- |
| `addToWatchlist`      | `(playerId: string) => void`              |
| `removeFromWatchlist` | `(playerId: string) => void`              |
| `isWatching`          | `(playerId: string) => boolean`           |
| `setMissionPick`      | `(playerId: string, type: PickType) => void` |
| `clearMissionPick`    | `(playerId: string) => void`              |
| `revealMission`       | `() => void`                              |
| `resetMission`        | `() => void`                              |
| `getMissionScore`     | `() => MissionScore \| null`              |
| `getLeagueHoldings`   | `(playerId: string) => LeagueHolding[]`  |
| `getLeaderboardRankings` | `() => LeaderboardEntry[]`            |

**Key change**: Leaderboard page currently uses hardcoded fake data (M2). After refactor, it consumes `getLeaderboardRankings()` from SocialContext, which uses real league data from `leagueMembers.json`.

#### Provider Composition

```
<ScenarioProvider>
  <SimulationProvider>
    <TradingProvider>
      <SocialProvider>
        <ToastProvider>
          <OnboardingProvider>
            <BrowserRouter>
              ...
```

ScenarioProvider sits outermost because all other contexts depend on scenario data. SimulationProvider wraps TradingProvider because trading reads effective prices. SocialProvider is innermost among domain contexts because it depends on both prices and portfolio.

### 1.2 Service Layer — Boundaries and Contracts

The existing services (`espnService.js`, `sentimentEngine.js`, `priceCalculator.js`) are already well-isolated pure modules. The refactor adds typing, improves testability, and introduces two new modules.

| Module                | Responsibility                     | Current file              | Changes                                                  |
| --------------------- | ---------------------------------- | ------------------------- | -------------------------------------------------------- |
| `espnService`         | ESPN API client + cache            | `services/espnService.js` | Add TS types. Extract cache into its own utility. Add retry logic (L4). |
| `sentimentEngine`     | Keyword-based NLP                  | `services/sentimentEngine.js` | Add TS types. No structural changes needed.          |
| `priceCalculator`     | Sentiment → price impact           | `services/priceCalculator.js` | Add TS types. No structural changes needed.          |
| `priceResolver` (new) | Effective price computation        | Extracted from GameContext lines 431–448 | Pure function, no React dependency. Unit-testable.  |
| `simulationEngine` (new) | Unified simulation interface    | Extracted from GameContext lines 202–428 | Two implementations behind common interface.         |
| `storageService` (new) | localStorage with versioning      | Extracted from GameContext lines 137–187 | Schema version, migration support, validation (M5). |

### 1.3 Component Hierarchy — Patterns and Rules

**Three tiers**:

1. **Pages** (`src/pages/`) — Route-level components. Each page consumes exactly the context hooks it needs. Pages never pass context values down more than one level; if a child needs context, it calls the hook directly.

2. **Feature components** (`src/components/`) — Domain-specific UI blocks (e.g., `PlayerCard`, `ScenarioToggle`, `MiniLeaderboard`). May consume context hooks. Encapsulate their own CSS module.

3. **Shared components** (new: `src/shared/`) — Purely presentational, zero context dependency. Receive all data via props. Examples: `SkeletonLoader`, `InfoTooltip`, `EventMarkerPopup`, `Toast` (rendering only; the provider stays in components).

**Rules**:

- Shared components must not import from `context/`, `services/`, or `data/`.
- Feature components may import from `context/` and `services/` but not from `data/` directly.
- Only context providers import from `data/` (and they do so via dynamic `import()`, not static imports).
- Every component gets a co-located CSS Module file (`.module.css`) replacing the current global CSS file. Migrated incrementally — new CSS Modules can coexist with existing global CSS during transition.

---

## 2. Modularization Plan

### 2.1 Target Directory Structure

```
src/
├── context/
│   ├── ScenarioContext.tsx
│   ├── SimulationContext.tsx
│   ├── TradingContext.tsx
│   ├── SocialContext.tsx
│   └── index.ts                     # Re-exports all hooks
├── services/
│   ├── espnService.ts
│   ├── sentimentEngine.ts
│   ├── priceCalculator.ts
│   ├── priceResolver.ts             # NEW: pure price computation
│   ├── simulationEngine.ts          # NEW: unified simulation interface
│   ├── storageService.ts            # NEW: typed localStorage with versioning
│   ├── __tests__/
│   │   ├── priceCalculator.test.ts
│   │   ├── priceResolver.test.ts
│   │   ├── simulationEngine.test.ts
│   │   ├── storageService.test.ts
│   │   ├── sentimentEngine.test.ts
│   │   └── espnService.test.ts
│   └── index.ts
├── components/
│   ├── AddEventModal/
│   │   ├── AddEventModal.tsx
│   │   └── AddEventModal.module.css
│   ├── DailyMission/
│   │   ├── DailyMission.tsx
│   │   └── DailyMission.module.css
│   ├── Layout/
│   │   ├── Layout.tsx
│   │   └── Layout.module.css
│   ├── PlayerCard/
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerCard.module.css
│   │   └── PlayerCard.test.tsx
│   ├── ScenarioToggle/
│   │   ├── ScenarioToggle.tsx
│   │   └── ScenarioToggle.module.css
│   ├── ... (remaining components follow same pattern)
│   ├── Toast/
│   │   ├── Toast.tsx
│   │   ├── Toast.module.css
│   │   └── ToastProvider.tsx
│   ├── Onboarding/
│   │   ├── Onboarding.tsx
│   │   ├── Onboarding.module.css
│   │   └── OnboardingProvider.tsx
│   └── index.ts
├── shared/
│   ├── EventMarkerPopup/
│   │   ├── EventMarkerPopup.tsx
│   │   └── EventMarkerPopup.module.css
│   ├── InfoTooltip/
│   │   ├── InfoTooltip.tsx
│   │   └── InfoTooltip.module.css
│   ├── SkeletonLoader/
│   │   ├── SkeletonLoader.tsx
│   │   └── SkeletonLoader.module.css
│   ├── FirstTradeGuide/
│   │   ├── FirstTradeGuide.tsx
│   │   └── FirstTradeGuide.module.css
│   ├── Glossary/
│   │   ├── Glossary.tsx
│   │   └── Glossary.module.css
│   └── ErrorBoundary/               # NEW
│       └── ErrorBoundary.tsx
├── pages/
│   ├── Market/
│   │   ├── Market.tsx
│   │   └── Market.module.css
│   ├── PlayerDetail/
│   │   ├── PlayerDetail.tsx
│   │   └── PlayerDetail.module.css
│   ├── ... (remaining pages follow same pattern)
│   └── ScenarioInspector/
│       ├── ScenarioInspector.tsx
│       └── ScenarioInspector.module.css
├── types/
│   ├── scenario.ts                  # ScenarioData, Player, PriceHistoryEntry
│   ├── trading.ts                   # Portfolio, Holding
│   ├── simulation.ts                # TimelineEntry, HistoryEntry
│   ├── social.ts                    # MissionPicks, LeaderboardEntry
│   ├── espn.ts                      # Article, GameEvent
│   └── index.ts
├── data/
│   ├── midweek.json
│   ├── live.json
│   ├── playoffs.json
│   ├── superbowl.json
│   ├── espnPlayers.json
│   ├── leagueMembers.json
│   └── README.md
├── utils/
│   ├── formatters.ts
│   ├── playerImages.ts
│   ├── espnUrls.ts
│   ├── devMode.ts
│   └── __tests__/
│       └── formatters.test.ts
├── constants.ts
├── App.tsx
├── main.tsx
└── index.css                        # Global reset + CSS custom properties only
```

### 2.2 File Migration Map

| Current path                           | Target path                                           | Notes                        |
| -------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| `context/GameContext.jsx`              | Split into `context/{Scenario,Simulation,Trading,Social}Context.tsx` | Largest single change |
| `services/espnService.js`             | `services/espnService.ts`                             | TS types only                |
| `services/sentimentEngine.js`         | `services/sentimentEngine.ts`                         | TS types only                |
| `services/priceCalculator.js`         | `services/priceCalculator.ts`                         | TS types only                |
| _new_                                  | `services/priceResolver.ts`                           | Extracted from GameContext   |
| _new_                                  | `services/simulationEngine.ts`                        | Extracted from GameContext   |
| _new_                                  | `services/storageService.ts`                          | Extracted from GameContext   |
| `components/Toast.jsx`                | `components/Toast/Toast.tsx` + `ToastProvider.tsx`    | Split provider from UI      |
| `components/Onboarding.jsx`           | `components/Onboarding/Onboarding.tsx` + `OnboardingProvider.tsx` | Split provider from UI |
| `components/EventMarkerPopup.jsx`     | `shared/EventMarkerPopup/EventMarkerPopup.tsx`        | No context dependency        |
| `components/InfoTooltip.jsx`          | `shared/InfoTooltip/InfoTooltip.tsx`                  | No context dependency        |
| `components/SkeletonLoader.jsx`       | `shared/SkeletonLoader/SkeletonLoader.tsx`            | No context dependency        |
| `components/FirstTradeGuide.jsx`      | `shared/FirstTradeGuide/FirstTradeGuide.tsx`          | No context dependency        |
| `components/Glossary.jsx`             | `shared/Glossary/Glossary.tsx`                        | No context dependency        |
| _new_                                  | `shared/ErrorBoundary/ErrorBoundary.tsx`              | Wraps pages (M6)            |
| All other `components/*.jsx`          | `components/<Name>/<Name>.tsx`                        | Co-located CSS module        |
| All `pages/*.jsx`                     | `pages/<Name>/<Name>.tsx`                             | Co-located CSS module        |
| All `utils/*.js`                      | `utils/*.ts`                                          | TS types only                |
| `constants.js`                        | `constants.ts`                                        | TS types only                |
| `App.jsx` / `main.jsx`               | `App.tsx` / `main.tsx`                                | Last to convert              |
| All `*.css` (component/page)          | Co-located `*.module.css`                             | Incremental                  |
| _new_                                  | `types/*.ts`                                          | Shared type definitions      |

### 2.3 TypeScript Migration Order

TypeScript conversion should proceed bottom-up — from modules with zero React dependency to the top-level app shell. Each step must leave the app fully functional.

| Phase | Files                                            | Rationale                                          |
| ----- | ------------------------------------------------ | -------------------------------------------------- |
| 1     | `types/*.ts`, `constants.ts`                     | Type foundations; no runtime changes               |
| 2     | `utils/*.ts`                                     | Pure functions, easy to type, high test value      |
| 3     | `services/*.ts`                                  | Pure modules, no React; enables typed service contracts |
| 4     | `context/*.tsx`                                  | Contexts typed with the types from phase 1-3       |
| 5     | `shared/**/*.tsx`                                | Presentational components, props-only typing       |
| 6     | `components/**/*.tsx`                            | Feature components consuming typed context hooks   |
| 7     | `pages/**/*.tsx`                                 | Route-level components                             |
| 8     | `App.tsx`, `main.tsx`                            | Final shell                                        |

TypeScript is configured with `strict: true` from the start. During migration, unconverted `.jsx` files coexist with `.tsx` files — Vite handles both natively with zero config.

---

## 3. Migration Strategy

### 3.1 Incremental, Not Big-Bang

Every change is a single, independently shippable commit that leaves the app green (Cypress E2E suite passes). No long-lived feature branches. The refactor proceeds as a series of small pull requests, each touching one concern.

**Ordering principle**: infrastructure before consumers. Types and services first, then contexts, then components. Each PR can be reviewed and merged independently.

### 3.2 Testing Guardrails

The existing 75 Cypress E2E tests are the primary regression safety net. They exercise all 8 user flows documented in the research audit and will catch any behavioral regression during the refactor.

**New unit tests are added alongside each refactored module**:

| Module                         | Test focus                                                        |
| ------------------------------ | ----------------------------------------------------------------- |
| `priceResolver`                | Price resolution from overrides, history, user impact             |
| `simulationEngine` (timeline)  | Timeline construction, tick advancement, boundary conditions      |
| `simulationEngine` (ESPN)      | Article processing, sentiment-to-price pipeline, deduplication    |
| `storageService`               | Read/write, version migration, corrupt data recovery              |
| `ScenarioContext`              | Lazy loading, scenario switching, reset propagation               |
| `TradingContext`               | Buy/sell mechanics, cash accounting, user impact math             |
| `SocialContext`                | Watchlist ops, mission scoring, leaderboard ranking               |
| `sentimentEngine`              | Keyword matching, negation detection, position-specific scoring   |
| `espnService`                  | Cache behavior, fallback logic (mocked fetch)                     |

Target: every service and context module has >90% branch coverage. Component tests target interaction behavior (clicks, form submission), not rendering details.

### 3.3 Cross-Context Reset on Scenario Change

When the user switches scenarios, all four contexts must reset coherently. The current GameContext handles this in a single `useEffect` (lines 343–376). In the split architecture, ScenarioContext owns a `scenarioVersion` counter that increments on every switch. Downstream contexts subscribe to this counter and run their own reset logic when it changes:

```typescript
// In ScenarioProvider
const [scenarioVersion, setScenarioVersion] = useState(0);

const setScenario = useCallback((id: ScenarioId) => {
  setScenarioState(id);
  setScenarioVersion(v => v + 1);
}, []);
```

SimulationContext resets `priceOverrides`, `tick`, `history`, and re-initializes the appropriate engine. TradingContext resets `portfolio`, `cash`, and `userImpact`. SocialContext resets `missionPicks` and `missionRevealed` (watchlist persists across scenarios per current behavior).

### 3.4 Bundle Optimization

The production bundle is 993 KB uncompressed (H3). Three techniques bring it under target:

1. **Dynamic scenario imports** (section 1.1) — removes ~400 KB of JSON from the initial bundle. Each scenario is a separate chunk loaded on demand.

2. **Route-based code splitting** — wrap page imports in `React.lazy()`:

```typescript
const Market = lazy(() => import('./pages/Market/Market'));
const PlayerDetail = lazy(() => import('./pages/PlayerDetail/PlayerDetail'));
// ... etc.
```

Each page and its CSS Module becomes a separate chunk. Only the active route is loaded.

3. **Manual vendor chunks** — split `recharts`, `framer-motion`, and `react-router-dom` into separate cacheable chunks via `vite.config.js` `build.rollupOptions.output.manualChunks`.

Target: initial bundle under 200 KB (gzipped), with lazy chunks loaded per-route.

### 3.5 CSS Migration

Global CSS files are replaced incrementally with CSS Modules. The migration proceeds file-by-file alongside the TypeScript conversion of each component (section 2.3, phases 5-7):

1. Create `<Component>.module.css` with the same rules, namespaced via CSS Modules.
2. Update the component to `import styles from './<Component>.module.css'` and replace `className="foo"` with `className={styles.foo}`.
3. Delete the old global CSS file.
4. Keep `index.css` for global reset, CSS custom properties (design tokens), and font imports.

This can happen one component at a time with no risk of conflict.

### 3.6 Error Boundaries

A new `<ErrorBoundary>` component (M6) wraps each page route:

```tsx
<Route path="market" element={
  <ErrorBoundary fallback={<ErrorPage />}>
    <Suspense fallback={<SkeletonLoader />}>
      <Market />
    </Suspense>
  </ErrorBoundary>
} />
```

This catches rendering errors per-page without crashing the entire app. The `<Suspense>` boundary handles the loading state from `React.lazy()` and dynamic scenario imports.

---

## 4. Acceptance Criteria per Major Area

### 4.1 Data Layer

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| D1  | No static JSON imports in any context or component file                   | H4        |
| D2  | Each scenario JSON is a separate Vite chunk, loaded on demand             | H3, H4   |
| D3  | TypeScript interfaces defined for `ScenarioData`, `Player`, `PriceHistoryEntry`, `LeagueMember`, `LeagueHoldings` | C2 |
| D4  | `storageService` validates data shape on read and handles schema migration| M5        |
| D5  | All scenario data contracts documented in `types/scenario.ts`             | —         |

### 4.2 State Management

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| S1  | `GameContext.jsx` no longer exists; replaced by four domain contexts      | C1        |
| S2  | Changing `watchlist` does not re-render `Market` or `PlayerDetail`        | C1        |
| S3  | Each context has a dedicated test file with >90% branch coverage          | H1        |
| S4  | `getPlayers()` and `getEffectivePrice()` results are memoized            | M7        |
| S5  | Scenario switching resets all domain contexts coherently (no stale state) | —         |
| S6  | `priceResolver` is a pure function with no React dependency               | H1        |

### 4.3 Simulation

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| X1  | `SimulationEngine` interface with two implementations sharing no duplicated logic | H2 |
| X2  | Adding a third simulation mode requires only a new engine implementation  | H2        |
| X3  | Tick-based simulation unit tests verify timeline advancement and stop condition | H1   |
| X4  | ESPN simulation unit tests verify article processing, deduplication, and price updates | H1 |
| X5  | `history` array capped at a configurable max size                         | L3        |

### 4.4 UI Components

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| U1  | Every component uses a co-located CSS Module; no global component CSS files remain | M3 |
| U2  | `ErrorBoundary` wraps every page route                                    | M6        |
| U3  | Shared components (`shared/`) have zero imports from `context/` or `services/` | —    |
| U4  | Leaderboard page uses `getLeaderboardRankings()` — no hardcoded fake data | M2       |
| U5  | All components have TypeScript props interfaces                           | C2        |

### 4.5 Testing

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| T1  | Unit tests exist for all service modules (`espnService`, `sentimentEngine`, `priceCalculator`, `priceResolver`, `simulationEngine`, `storageService`) | H1 |
| T2  | Unit tests exist for all four context providers                           | H1        |
| T3  | Existing 75 Cypress E2E tests pass without modification (or with minimal selector updates) | — |
| T4  | Total unit test count exceeds 50 (from current 3)                         | H1        |
| T5  | `vitest` runs in under 10 seconds for the full unit suite                 | —         |

### 4.6 Accessibility

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| A1  | `eslint-plugin-jsx-a11y` added to ESLint config and all warnings resolved | L6       |
| A2  | All interactive elements have visible focus indicators                     | L6        |
| A3  | All icon-only buttons have `aria-label`                                   | L6        |
| A4  | Color-coded gain/loss indicators have a secondary indicator (icon or text) | L6       |
| A5  | Tab navigation works through all page flows without mouse                 | L6        |

### 4.7 Build Tooling

| #   | Criterion                                                                 | Validates |
| --- | ------------------------------------------------------------------------- | --------- |
| B1  | `tsconfig.json` with `strict: true`; all source files are `.ts`/`.tsx`    | C2       |
| B2  | Production bundle initial chunk < 200 KB gzipped                          | H3       |
| B3  | Route-based code splitting via `React.lazy` + `Suspense`                  | H3       |
| B4  | Recharts and Framer Motion in separate vendor chunks                      | H3       |
| B5  | `vite build` produces no size warnings                                    | H3       |
| B6  | ESPN proxy and save-scenario API preserved in Vite dev config             | —        |

---

## 5. Out of Scope

The following are explicitly deferred to future work:

- **Chrome extension sync** (M4) — requires a different architecture (message passing, shared data source). Tracked separately.
- **Backend / API server** — McQueen remains a client-side SPA with static data + ESPN proxy.
- **Design system / component library** — CSS Modules are sufficient at current scale. A design system (Storybook, etc.) is premature.
- **State management library** (Redux, Zustand, Jotai) — React Context with proper domain splitting is sufficient for this app's complexity. If re-render performance remains an issue after the split, Zustand can be adopted per-context without architectural changes.
- **PWA / offline support** — not a current requirement.
