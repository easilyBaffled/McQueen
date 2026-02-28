# Double Test Coverage

- type: epic
- priority: 1
- labels: testing, coverage
- description: Double Vitest coverage from ~50% to 80%+ lines and Cypress coverage from ~38% to 75%+ lines. Requires shared test helpers, new unit tests for 8 uncovered files, expanded partial coverage, data-testid attributes on ~20 components, and Cypress selector migration from broken CSS class selectors to data-testid.

## Create shared test helpers (renderWithProviders + mockData)

- type: task
- priority: 1
- estimate: 60
- description: Create src/test/renderWithProviders.tsx (wraps components in mocked ScenarioContext, TradingContext, SocialContext, ToastContext) and src/test/mockData.ts (reusable mock player, portfolio, leaderboard data). Base on existing mock patterns in Leaderboard.test.tsx and PlayerCard.test.tsx. Refactor one existing test to validate the helper works.
- acceptance: |
  1. src/test/renderWithProviders.tsx exists and exports renderWithProviders()
  2. src/test/mockData.ts exports mockPlayer, mockPlayers, mockPortfolio, mockLeaderboardRankings
  3. All 617 existing Vitest tests still pass via npm run test:run

## Add Vitest tests for Market page (0% coverage)

- type: task
- priority: 1
- estimate: 120
- description: Write src/pages/Market/__tests__/Market.test.tsx. Test player grid rendering, 4 sort tabs (risers/fallers/active/price), search filtering (partial match, case-insensitive, no results), welcome banner dismiss with localStorage persistence, loading skeleton state. Mock useScenario, useTrading, PlayerCard, MiniLeaderboard, FirstTradeGuide, framer-motion.
- acceptance: |
  1. Market.test.tsx exists with tests for: grid rendering, all 4 sort modes, search filtering, welcome banner dismiss, empty state
  2. Market.tsx line coverage reaches 80%+ per npm run test:coverage
  3. All tests pass via npm run test:run

## Add Vitest tests for Watchlist page (0% coverage)

- type: task
- priority: 1
- estimate: 90
- description: Write src/pages/Watchlist/__tests__/Watchlist.test.tsx. Test empty state with illustration, quick-add popular players, remove from watchlist with toast, watchlist grid rendering, Browse All Players navigation link. Mock useTrading, useSocial, useToast, PlayerCard, framer-motion.
- acceptance: |
  1. Watchlist.test.tsx exists with tests for: empty state, quick-add, remove, toast notifications, grid rendering
  2. Watchlist.tsx line coverage reaches 80%+ per npm run test:coverage
  3. All tests pass via npm run test:run

## Add Vitest tests for Mission page (0% coverage)

- type: task
- priority: 1
- estimate: 60
- description: Write src/pages/Mission/__tests__/Mission.test.tsx. Test DailyMission renders, help panel toggle with localStorage persistence, collapsible sections. Mock DailyMission component, framer-motion.
- acceptance: |
  1. Mission.test.tsx exists with tests for: page rendering, help toggle, localStorage persistence
  2. Mission.tsx line coverage reaches 80%+ per npm run test:coverage
  3. All tests pass via npm run test:run

## Add Vitest tests for Onboarding component (0% coverage)

- type: task
- priority: 1
- estimate: 120
- description: Write src/components/Onboarding/__tests__/Onboarding.test.tsx. Test 6-step wizard navigation (next/back), skip button closes modal, Escape key closes modal, localStorage persistence for completed/dismissed state, step indicators update, custom event dispatch (mcqueen-onboarding-complete) on completion.
- acceptance: |
  1. Onboarding.test.tsx exists with tests for: step navigation, skip, Escape key, localStorage, step indicators
  2. Onboarding.tsx line coverage reaches 80%+ per npm run test:coverage
  3. All tests pass via npm run test:run

## Add Vitest tests for DailyMission component (0% coverage)

- type: task
- priority: 1
- estimate: 120
- description: Write src/components/DailyMission/__tests__/DailyMission.test.tsx. Test pick selection for risers/fallers columns, reveal results, reset mission, score calculation and display, disabled states when picks incomplete, collapsible mode. Mock useTrading and useSocial contexts.
- acceptance: |
  1. DailyMission.test.tsx exists with tests for: pick selection, reveal, reset, score display, disabled states
  2. DailyMission.tsx line coverage reaches 80%+ per npm run test:coverage
  3. All tests pass via npm run test:run

## Add Vitest tests for remaining 0% components (PlayoffModal, MiniLeaderboard, LiveTicker)

- type: task
- priority: 2
- estimate: 120
- description: Write tests for three small 0%-coverage components. PlayoffAnnouncementModal (src/components/PlayoffAnnouncementModal/__tests__/PlayoffAnnouncementModal.test.tsx): show/dismiss with localStorage persistence. MiniLeaderboard (src/components/MiniLeaderboard/__tests__/MiniLeaderboard.test.tsx): top-3 medals, user position, gap calculation, empty state. LiveTicker (src/components/LiveTicker/__tests__/LiveTicker.test.tsx): conditional render for live scenario only, event display, fallback to history.
- acceptance: |
  1. PlayoffAnnouncementModal.test.tsx, MiniLeaderboard.test.tsx, LiveTicker.test.tsx all exist
  2. Each component reaches 80%+ line coverage per npm run test:coverage
  3. All tests pass via npm run test:run

## Expand Vitest tests for partially-covered files (Portfolio, PlayerDetail, shared components)

- type: task
- priority: 2
- estimate: 180
- description: Expand existing tests to reach 80%+ coverage. Portfolio (33% to 80%): add tests for holdings list, summary cards, empty state, trade navigation. PlayerDetail (47% to 75%): add tests for buy/sell flows, quantity validation, watchlist toggle, error state for invalid player. ScenarioToggle (48% to 80%): switching and active state. Glossary (48% to 80%): open/close, search. SkeletonLoader (11% to 80%): all variants. InfoTooltip (45% to 80%): hover behavior.
- acceptance: |
  1. Portfolio.tsx reaches 80%+ line coverage
  2. PlayerDetail.tsx reaches 75%+ line coverage
  3. ScenarioToggle, Glossary, SkeletonLoader, InfoTooltip each reach 80%+ line coverage
  4. All tests pass via npm run test:run

## Add data-testid attributes to source components for Cypress selectors

- type: task
- priority: 1
- estimate: 120
- description: Add data-testid attributes to ~20 source components for all 59 elements targeted by Cypress CSS class selectors. CSS Modules hashes class names so all .class-name selectors are broken. Components needing data-testid: Market.tsx (players-grid, sort-tab, search-input, welcome-banner, welcome-dismiss, market-page, market-sidebar), PlayerDetail.tsx (player-detail-page, player-name, player-price, price-change, chart-card, trading-card, error-state, chart-container, trading-tab, order-total, trade-button-buy, holdings-card, form-input), Timeline.tsx (timeline-event, timeline-event-content, filter-select, search-input, timeline-track), Watchlist.tsx (empty-state, quick-add-player, watchlist-grid, remove-button, watchlist-card-wrapper, watchlist-button), Portfolio.tsx (holdings-list, holding-row, portfolio-summary, summary-card, summary-label, summary-value, trade-button-buy), Mission.tsx (mission-page, help-toggle, mission-help), DailyMission.tsx (daily-mission, selector-btn-up, selector-btn-down, picks-column-risers, picks-column-fallers, pick-chip, reveal-button, mission-results, reset-button, player-selector), Onboarding.tsx (onboarding-overlay, onboarding-modal, next-button, back-button, step-dot, skip-button), PlayerCard.tsx (player-card), Toast.tsx/ToastProvider.tsx (toast, toast-success, toast-close), Leaderboard.tsx (leaderboard table elements).
- acceptance: |
  1. All 59 data-testid attributes added across ~20 component files
  2. All 617+ Vitest tests still pass (no regressions)
  3. npm run build succeeds

## Fix all Cypress E2E tests -- migrate selectors from CSS classes to data-testid

- type: task
- priority: 1
- estimate: 120
- description: Update all 10 Cypress spec files + cypress/support/commands.js to use [data-testid="..."] selectors instead of broken .css-class selectors. Migration pattern -- cy.get('.player-card') becomes cy.get('[data-testid="player-card"]'). Files to update: market.cy.js (8 selectors), player-detail.cy.js (14 selectors), timeline.cy.js (5 selectors), watchlist.cy.js (7 selectors), portfolio.cy.js (8 selectors), mission.cy.js (13 selectors), onboarding.cy.js (6 selectors), toasts.cy.js (6 selectors), leaderboard.cy.js (~3 selectors), navigation.cy.js (~2 selectors), commands.js getPlayerCards() (1 selector).
- acceptance: |
  1. All 10 Cypress spec files updated with [data-testid="..."] selectors
  2. commands.js getPlayerCards() uses [data-testid="player-card"]
  3. At least 70 of 80 Cypress tests pass when run via npm run cy:run
  4. Cypress line coverage reaches 75%+ via npm run cy:coverage

## Verify coverage targets met

- type: task
- priority: 1
- estimate: 30
- description: Run npm run test:coverage and npm run cy:coverage. Verify Vitest line coverage >= 80% and Cypress line coverage >= 75%. Generate final HTML reports at coverage/vitest/index.html and coverage/cypress/lcov-report/index.html.
- acceptance: |
  1. npm run test:coverage shows >= 80% line coverage
  2. npm run cy:coverage shows >= 75% line coverage
  3. coverage/vitest/index.html and coverage/cypress/lcov-report/index.html both generated
