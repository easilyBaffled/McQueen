#!/usr/bin/env bash
set -euo pipefail

# ui-repair-beads.sh
# Creates all beads for the UI Audit Repair specification.
# Generated from: .ralph/specs/ui-repair.md

BEAD_COUNT=0

# ============================================================
# Epic 1: CSS Module Class Fixes (C-1, C-2, M-2, M-3)
# Critical path — no dependencies
# ============================================================

EPIC_CSS_ID=$(bd create "CSS Module Class Fixes" \
  -t epic \
  -p 0 \
  -d $'Fix CSS module class references that use raw strings instead of styles[...] references. These are Critical severity because they break styling across onboarding, navigation, player detail content tiles, and daily mission result chips.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_ONBOARDING_CSS_ID=$(bd create "Fix Onboarding content wrapper CSS module class" \
  -t bug \
  -p 0 \
  -e 15 \
  --parent "$EPIC_CSS_ID" \
  -l "css-modules,onboarding,critical" \
  -d $'The onboarding content wrapper div on line 146 of Onboarding.tsx uses a raw string onboarding-content instead of styles[\'onboarding-content\']. The highlight class highlight-${currentStep.highlight} is also raw. Fix both to use CSS module references so that padding, text-align, and highlight styles apply correctly. Audit issue: C-1.' \
  --acceptance $'1. Content wrapper div uses styles[\'onboarding-content\'] instead of raw onboarding-content\n2. Highlight classes use CSS module references or are removed if unused in the CSS\n3. Onboarding content area displays with padding: 20px 40px 40px and text-align: center\n4. Existing tests pass' \
  --design $'Modify src/components/Onboarding/Onboarding.tsx line 146. Change className={`onboarding-content ${...}`} to className={`${styles[\'onboarding-content\']} ${currentStep.highlight ? styles[`highlight-${currentStep.highlight}`] || \\'\\' : \\'\\'}`}. If highlight classes (highlight-virtual, highlight-colors, highlight-cta) do not exist in Onboarding.module.css, add them or remove the conditional class. Verify the onboarding-content padding and text-align are applied.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_NAV_CSS_ID=$(bd create "Fix Layout nav link CSS module classes" \
  -t bug \
  -p 0 \
  -e 15 \
  --parent "$EPIC_CSS_ID" \
  -l "css-modules,layout,critical" \
  -d $'All six NavLink components in Layout.tsx use raw nav-link and active strings. Since the component uses CSS Modules, these must be changed to styles[\'nav-link\'] and styles[\'active\'] respectively. Navigation is completely unstyled without this fix. Audit issue: C-2.' \
  --acceptance $'1. All six NavLink components use styles[\'nav-link\'] for the base class\n2. Active state uses styles[\'active\'] via the isActive callback\n3. Navigation links display with correct padding, font-weight, and active state highlighting\n4. Existing tests pass' \
  --design $'Modify src/components/Layout/Layout.tsx lines 78, 89, 99, 109, 119, 129. Change className={({ isActive }) => `nav-link ${isActive ? \'active\' : \'\'}`} to className={({ isActive }) => `${styles[\'nav-link\']} ${isActive ? styles[\'active\'] : \'\'}`}. The CSS module already defines .nav-link and .nav-link.active styles.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TILE_CSS_ID=$(bd create "Fix PlayerDetail content tile type badge CSS module classes" \
  -t bug \
  -p 1 \
  -e 15 \
  --parent "$EPIC_CSS_ID" \
  -l "css-modules,player-detail" \
  -d $'Content tile type badges in PlayerDetail.tsx line 483 use ${tile.type} as a raw class name alongside the module-referenced styles[\'tile-type\']. Fix to use CSS module references for the type classes so color-coded backgrounds apply. Audit issue: M-2.' \
  --acceptance $'1. Content tile type badges use styles[tile.type] or equivalent CSS module reference\n2. Different content types (article, video, analysis, news) show distinct color-coded backgrounds\n3. Existing tests pass' \
  --design $'Modify src/pages/PlayerDetail/PlayerDetail.tsx line 483. Change className={`${styles[\'tile-type\']} ${tile.type}`} to className={`${styles[\'tile-type\']} ${styles[tile.type] || \'\'}`}. Verify that PlayerDetail.module.css defines classes for each tile type (.article, .video, .analysis, .news).' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_MISSION_CSS_ID=$(bd create "Fix DailyMission result-chip status CSS module classes" \
  -t bug \
  -p 1 \
  -e 15 \
  --parent "$EPIC_CSS_ID" \
  -l "css-modules,daily-mission" \
  -d $'Result chips in DailyMission.tsx (lines 111 and 135) append ${status} as a raw class where status is correct or incorrect. Fix to use styles[status] for proper CSS module references so green/red feedback renders. Audit issue: M-3.' \
  --acceptance $'1. Result chips use styles[status] instead of raw strings\n2. Correct predictions display with green styling, incorrect with red\n3. Existing tests pass' \
  --design $'Modify src/components/DailyMission/DailyMission.tsx lines 111 and 135. Change className={`${styles[\'result-chip\']} ${status}`} to className={`${styles[\'result-chip\']} ${status ? styles[status] : \'\'}`}. Verify that DailyMission.module.css defines .correct and .incorrect classes.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 2: Layout & Header Repair (M-4, M-10, M-11)
# Depends on Epic 1
# ============================================================

EPIC_LAYOUT_ID=$(bd create "Layout and Header Repair" \
  -t epic \
  -p 1 \
  -d $'Fix layout issues: sidebar sticky positioning overlapping header, Total Value clipping in header, and content appearing below the fold on all pages.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_SIDEBAR_STICKY_ID=$(bd create "Fix Market sidebar sticky positioning to account for header" \
  -t bug \
  -p 1 \
  -e 10 \
  --parent "$EPIC_LAYOUT_ID" \
  --deps "$BEAD_NAV_CSS_ID" \
  -l "layout,market" \
  -d $'The market sidebar has top: 16px for sticky positioning, but the sticky header is 64px tall. On scroll, the sidebar slides under the header. Update the top value to account for header height. Audit issue: M-4.' \
  --acceptance $'1. Market sidebar sticks below the header on scroll, not behind it\n2. Sidebar top value uses calc(var(--header-height) + 16px) or equivalent\n3. Sidebar remains correctly positioned across different viewport sizes' \
  --design $'Modify src/pages/Market/Market.module.css line 134. Change top: 16px to top: calc(var(--header-height) + 16px). The --header-height CSS variable is defined globally in src/index.css.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_HEADER_CLIP_ID=$(bd create "Fix header Total Value clipping on scenarios with badges" \
  -t bug \
  -p 1 \
  -e 20 \
  --parent "$EPIC_LAYOUT_ID" \
  --deps "$BEAD_NAV_CSS_ID" \
  -l "layout,header" \
  -d $'The header Total Value label and dollar amount are clipped when scenario tabs include LIVE/ESPN badges. The header-left and header-right both have flex: 1 while header-center has flex: 2. When center content expands, it squeezes the right section. Audit issue: M-10.' \
  --acceptance $'1. TOTAL VALUE label and dollar amount are fully visible on all scenarios including ESPN Live and Live Game\n2. Header layout does not overflow on desktop viewports (>768px)\n3. Mobile responsive layout still works correctly' \
  --design $'Modify src/components/Layout/Layout.module.css. Change header-right to flex: 0 0 auto; min-width: fit-content; to prevent shrinking. Change header-center from flex: 2 to flex: 1 1 auto with min-width: 0; overflow: hidden; so center shrinks before right.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_BELOW_FOLD_ID=$(bd create "Reduce header/nav vertical footprint to show content above the fold" \
  -t bug \
  -p 1 \
  -e 25 \
  --parent "$EPIC_LAYOUT_ID" \
  --deps "$BEAD_HEADER_CLIP_ID" \
  -l "layout,header,ux" \
  -d $'The header (~64px) plus nav (~48px) push all page content below the initial viewport. Users see a mostly empty dark page and must scroll. Reduce vertical space consumed by header area. Audit issue: M-11.' \
  --acceptance $'1. Main page content is visible in the initial viewport without scrolling on standard desktop viewports (1080p+)\n2. Header height is reduced or nav is more compact\n3. All header elements remain accessible\n4. Mobile layout still works' \
  --design $'Modify src/components/Layout/Layout.module.css. Reduce header height from 64px to ~52px (update --header-height). Reduce nav padding from 12px 24px to 8px 24px. Reduce main-content top padding from 24px to 16px. Test on all 6 nav pages to ensure nothing breaks.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 3: Onboarding & First-Run (H-1, H-8)
# Depends on Epic 1 (Bead 1)
# ============================================================

EPIC_ONBOARDING_ID=$(bd create "Onboarding and First-Run Experience" \
  -t epic \
  -p 1 \
  -d $'Fix onboarding state sync so FirstTradeGuide appears after completion, and change the default scenario from ESPN Live to Midweek with a proper empty-state fallback.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_ONBOARDING_SYNC_ID=$(bd create "Sync Onboarding completion with OnboardingProvider state" \
  -t bug \
  -p 1 \
  -e 20 \
  --parent "$EPIC_ONBOARDING_ID" \
  --deps "$BEAD_ONBOARDING_CSS_ID" \
  -l "onboarding,state" \
  -d $'When onboarding completes, the OnboardingProvider state does not update because Onboarding.tsx writes to localStorage directly instead of calling markOnboardingComplete. The FirstTradeGuide will not appear until page refresh. Fix Onboarding.tsx to call the provider method. Audit issue: H-1.' \
  --acceptance $'1. After completing onboarding, hasCompletedOnboarding updates to true without page refresh\n2. FirstTradeGuide appears on the Market page immediately after onboarding completion\n3. showFirstTradeGuide state activates within the same session\n4. Existing onboarding tests pass' \
  --design $'Modify src/components/Onboarding/Onboarding.tsx. Import useOnboarding from OnboardingProvider. In handleComplete, call markOnboardingComplete() from the context instead of writing localStorage directly. The provider markOnboardingComplete already handles localStorage + state updates. Remove redundant localStorage.setItem calls and CustomEvent dispatch if unnecessary.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_ESPN_DEFAULT_ID=$(bd create "Change default scenario from ESPN Live to Midweek and add ESPN empty-state fallback" \
  -t bug \
  -p 1 \
  -e 25 \
  --parent "$EPIC_ONBOARDING_ID" \
  -l "scenario,espn,first-run" \
  -d $'ESPN Live as the default scenario shows an empty first impression with zero counters and no events. Change default to Midweek so new users see populated data. Add an empty-state fallback for ESPN Live with a clear message. Audit issue: H-8.' \
  --acceptance $'1. App loads with Midweek scenario selected by default\n2. When ESPN Live is selected and has no data, a clear empty state message appears\n3. ESPN refresh button shows loading state and on failure displays an error message\n4. User can still manually select ESPN Live from the scenario toggle' \
  --design $'Modify src/context/ScenarioContext.tsx to change default scenario from espn-live to midweek. Add an empty-state component in src/pages/Timeline/Timeline.tsx that detects espn-live with zero events and shows a helpful message. Check src/context/SimulationContext.tsx for espnError propagation.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 4: Trading UX (H-2, H-3, H-5)
# Independent
# ============================================================

EPIC_TRADING_ID=$(bd create "Trading UX Improvements" \
  -t epic \
  -p 1 \
  -d $'Fix silent portfolio reset on scenario switch, add explanation to disabled Sell tab, and fix PlayerCard moveReason truncation.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_CONFIRM_RESET_ID=$(bd create "Add confirmation dialog before portfolio reset on scenario switch" \
  -t task \
  -p 1 \
  -e 30 \
  --parent "$EPIC_TRADING_ID" \
  -l "trading,ux,scenario" \
  -d $'When users switch scenarios, their portfolio is silently reset. Add a confirmation dialog warning about data loss. The dialog should appear only when the user has a non-empty portfolio. Audit issue: H-2.' \
  --acceptance $'1. Switching scenarios when portfolio is non-empty shows a confirmation dialog\n2. Dialog warns about portfolio and cash reset\n3. Dialog has Switch & Reset and Cancel buttons\n4. Cancel keeps current scenario and portfolio intact\n5. Switch & Reset proceeds with scenario change\n6. Empty portfolio does not trigger dialog' \
  --design $'Modify src/components/ScenarioToggle/ScenarioToggle.tsx. Import useTrading and check if portfolio is non-empty before calling setScenario. If non-empty, show window.confirm() dialog (MVP) or a styled modal. Modify both onClick handler and handleMobileSelect function.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_SELL_TOOLTIP_ID=$(bd create "Add tooltip explanation to disabled Sell tab" \
  -t task \
  -p 1 \
  -e 15 \
  --parent "$EPIC_TRADING_ID" \
  -l "trading,ux,player-detail" \
  -d $'The Sell tab on PlayerDetail is disabled when !holding but has no explanation. Add a tooltip or title attribute that says You need to own shares to sell. Audit issue: H-3.' \
  --acceptance $'1. Hovering over disabled Sell tab shows You need to own shares to sell\n2. When Sell tab is enabled (user holds shares), no tooltip appears\n3. Tooltip disappears when mouse leaves the tab' \
  --design $'Modify src/pages/PlayerDetail/PlayerDetail.tsx around line 681-692. Add title="You need to own shares to sell" to the disabled button element. For a richer experience, wrap in a tooltip container using the Tooltip component from Onboarding.tsx or a simple title attribute.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TRUNCATION_ID=$(bd create "Fix PlayerCard moveReason truncation to respect word boundaries" \
  -t bug \
  -p 1 \
  -e 15 \
  --parent "$EPIC_TRADING_ID" \
  -l "player-card,ux" \
  -d $'PlayerCard.tsx line 140 uses substring(0, 60) which cuts mid-word, and unconditionally appends ellipsis. Fix to truncate at word boundaries and only add ellipsis when actually truncated. Audit issue: H-5.' \
  --acceptance $'1. moveReason truncation respects word boundaries\n2. Ellipsis is only appended when text was actually truncated (length > limit)\n3. Short move reasons display without trailing ellipsis' \
  --design $'Modify src/components/PlayerCard/PlayerCard.tsx line 140. Replace player.moveReason.substring(0, 60)}... with a helper function truncateAtWord(text, 60) that finds last space before position 60, slices there, appends ellipsis. If full string is <=60 chars, return unchanged.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 5: Timeline & Scenario (H-4, H-7, M-9, L-4, L-7, L-8)
# Independent
# ============================================================

EPIC_TIMELINE_ID=$(bd create "Timeline and Scenario Improvements" \
  -t epic \
  -p 1 \
  -d $'Fix timeline time filters to use scenario-relative dates, add live simulation indicator for non-dev users, add scenario loading state, fix hardcoded LiveTicker text, map raw event type strings to display labels, and handle future-dated events.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TIME_FILTERS_ID=$(bd create "Fix Timeline time filters to use scenario-relative dates" \
  -t bug \
  -p 1 \
  -e 20 \
  --parent "$EPIC_TIMELINE_ID" \
  -l "timeline,filters" \
  -d $'The Today and This Week time filters compare against new Date(), but scenario data uses hardcoded past timestamps. Change filters to be relative to the latest event timestamp in the current scenario data. Audit issue: H-4.' \
  --acceptance $'1. Today filter shows events from the same day as the scenario latest event timestamp\n2. This Week filter shows events from the 7 days leading up to the scenario latest timestamp\n3. All Time filter continues to show all events\n4. Filters work correctly across all demo scenarios' \
  --design $'Modify src/pages/Timeline/Timeline.tsx lines 159-169. Replace const now = new Date() with const scenarioNow = new Date(allEvents[0]?.timestamp || Date.now()) since events are sorted newest-first. Use scenarioNow for Today and This Week comparisons.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_LIVE_INDICATOR_ID=$(bd create "Add simplified live simulation indicator for non-dev users" \
  -t task \
  -p 2 \
  -e 25 \
  --parent "$EPIC_TIMELINE_ID" \
  -l "timeline,live,ux" \
  -d $'The TimelineDebugger is hidden behind isDevMode(). Add a simplified indicator visible to all users in Live and Super Bowl scenarios showing the simulation is active with a play/pause toggle. Audit issue: H-7.' \
  --acceptance $'1. In Live or Super Bowl scenarios, a visible indicator shows the simulation is active\n2. The indicator includes a play/pause toggle\n3. Full TimelineDebugger with scrubbing/rewind remains dev-only\n4. Indicator does not appear in non-live scenarios' \
  --design $'Modify src/components/TimelineDebugger/TimelineDebugger.tsx. Add a second rendering path: when !isDevMode() and scenario is live or superbowl, return a minimal div with play/pause button and Live simulation label. Use existing isPlaying/setIsPlaying from useSimulation(). Add new CSS classes in TimelineDebugger.module.css for the simplified view.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_SCENARIO_LOADING_ID=$(bd create "Add loading state to ScenarioToggle during scenario switches" \
  -t task \
  -p 2 \
  -e 15 \
  --parent "$EPIC_TIMELINE_ID" \
  -l "scenario,ux" \
  -d $'When switching scenarios, the tab highlights instantly but data may still be loading. Add a brief visual loading indicator to the active tab. Audit issue: M-9.' \
  --acceptance $'1. During scenario loading, active tab shows a subtle loading indicator\n2. Loading state clears when data finishes loading\n3. Quick switches between scenarios do not cause visual glitches' \
  --design $'Modify src/components/ScenarioToggle/ScenarioToggle.tsx. Import scenarioLoading from useScenario(). Add conditional class to active tab: ${scenarioLoading ? styles[\'loading\'] : \\'\\'}. Add .loading class to ScenarioToggle.module.css with subtle pulse animation.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TICKER_FALLBACK_ID=$(bd create "Replace hardcoded LiveTicker fallback text" \
  -t bug \
  -p 2 \
  -e 10 \
  --parent "$EPIC_TIMELINE_ID" \
  -l "live-ticker" \
  -d $'The LiveTicker fallback text is hardcoded to MNF: Chiefs vs Bills - Live updates as they happen. Replace with a generic or data-driven fallback. Audit issue: L-4.' \
  --acceptance $'1. Fallback text does not reference specific team names\n2. Fallback reads something like Live game updates as they happen' \
  --design $'Modify src/components/LiveTicker/LiveTicker.tsx line 62. Change the hardcoded string to Live game updates as they happen or pull matchup description from currentData via useScenario().' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_EVENT_LABELS_ID=$(bd create "Map raw event type strings to display labels in Timeline" \
  -t bug \
  -p 2 \
  -e 15 \
  --parent "$EPIC_TIMELINE_ID" \
  -l "timeline,display" \
  -d $'Timeline event badges display raw strings like league_trade instead of human-readable labels like Trade. The getEventTypeLabel function returns reason.type which includes underscores. Audit issue: L-7.' \
  --acceptance $'1. league_trade displays as Trade in timeline event badges\n2. game_event displays as the specific event type or Game Update\n3. All displayed labels match the type filter dropdown labels for consistency' \
  --design $'Modify src/pages/Timeline/Timeline.tsx function getEventTypeLabel (line 67-69). Add a mapping: const TYPE_DISPLAY_LABELS = { league_trade: \'Trade\', game_event: \'Game Update\', news: \'News\' }. Return reason?.eventType?.toUpperCase() || TYPE_DISPLAY_LABELS[reason?.type] || \'Event\'.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_FUTURE_DATES_ID=$(bd create "Filter out future-dated events relative to scenario date" \
  -t bug \
  -p 3 \
  -e 15 \
  --parent "$EPIC_TIMELINE_ID" \
  --deps "$BEAD_TIME_FILTERS_ID" \
  -l "timeline,player-detail,data" \
  -d $'In Midweek scenario (Wed Dec 4), some price change entries are dated Dec 6, breaking demo immersion. Filter or label events that fall after the scenario narrative date. Audit issue: L-8.' \
  --acceptance $'1. Price changes in PlayerDetail timeline do not show events dated after the scenario current date\n2. Or events are visually marked as upcoming if after scenario date' \
  --design $'Modify src/pages/PlayerDetail/PlayerDetail.tsx price timeline section. Filter chartData to exclude entries where timestamp > scenarioDate. Derive scenario date from latest non-future event timestamp. Depends on Bead 13 establishing the scenario now pattern. Do not modify src/data/*.json files.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 6: Mission & Leaderboard (H-6, M-6, L-6)
# Independent
# ============================================================

EPIC_MISSION_ID=$(bd create "Mission and Leaderboard Improvements" \
  -t epic \
  -p 1 \
  -d $'Expand the DailyMission player selector beyond 12 players, fix Leaderboard trader column alignment, and rename misleading Weekly Gain header.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_MISSION_SELECTOR_ID=$(bd create "Add search/filter and expand player selector in DailyMission" \
  -t task \
  -p 1 \
  -e 30 \
  --parent "$EPIC_MISSION_ID" \
  -l "daily-mission,ux" \
  -d $'The mission player selector only shows 12 players (players.slice(0, 12)). Add a search input to filter players by name/team, and show all matching players in a scrollable container. Audit issue: H-6.' \
  --acceptance $'1. All available players are accessible in the selector (not limited to 12)\n2. A search/filter input allows typing to filter by name or team\n3. Player list is scrollable when showing many results\n4. Existing pick functionality continues to work' \
  --design $'Modify src/components/DailyMission/DailyMission.tsx. Add searchQuery state. Replace players.slice(0, 12) (line 245) with a filter on name/team. Add search input above selector chips. Add max-height: 300px; overflow-y: auto; to .selector-chips in DailyMission.module.css.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_LEADERBOARD_ALIGN_ID=$(bd create "Fix Leaderboard trader column alignment" \
  -t bug \
  -p 2 \
  -e 10 \
  --parent "$EPIC_MISSION_ID" \
  -l "leaderboard,css" \
  -d $'The trader column uses inline span elements for avatar and name without explicit flex alignment, causing inconsistent vertical alignment. Add flex layout. Audit issue: M-6.' \
  --acceptance $'1. Avatar emoji and trader name are vertically centered and consistently aligned\n2. Alignment is consistent across different browsers' \
  --design $'Modify src/pages/Leaderboard/Leaderboard.module.css. Add to .col-trader: display: flex; align-items: center; gap: 8px;' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_WEEKLY_GAIN_ID=$(bd create "Rename Weekly Gain column header to Gain" \
  -t bug \
  -p 3 \
  -e 5 \
  --parent "$EPIC_MISSION_ID" \
  -l "leaderboard,copy" \
  -d $'The leaderboard Weekly Gain column header implies time-based tracking that does not exist in this demo app. Rename to Gain to accurately describe the data. Audit issue: L-6.' \
  --acceptance $'1. Column header reads Gain instead of Weekly Gain\n2. No other functional changes' \
  --design $'Modify src/pages/Leaderboard/Leaderboard.tsx line 70. Change Weekly Gain to Gain.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 7: Accessibility (M-1, M-7, M-8)
# After functional fixes
# ============================================================

EPIC_A11Y_ID=$(bd create "Accessibility Improvements" \
  -t epic \
  -p 1 \
  -d $'Add accessible alternative to PlayerCard sparkline, add keyboard dismissal to Toast notifications, and increase Watchlist remove button touch target.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_SPARKLINE_A11Y_ID=$(bd create "Add accessible alternative to PlayerCard sparkline chart" \
  -t task \
  -p 1 \
  -e 15 \
  --parent "$EPIC_A11Y_ID" \
  --deps "$BEAD_NAV_CSS_ID" \
  -l "accessibility,player-card" \
  -d $'The Recharts sparkline in PlayerCard renders as SVG with no accessible description. Screen reader users get no information about the price trend. Add an aria-label describing the trend. Audit issue: M-1.' \
  --acceptance $'1. Sparkline chart container has aria-label describing the trend (e.g. 7-day price trend: up 5.2%)\n2. Chart has role=img to indicate it is a non-interactive image\n3. Screen readers convey the price trend information' \
  --design $'Modify src/components/PlayerCard/PlayerCard.tsx. Wrap the ResponsiveContainer in a div with role="img" and aria-label={`7-day price trend: ${isUp ? \'up\' : \'down\'} ${Math.abs(player.changePercent).toFixed(1)}%`}.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TOAST_A11Y_ID=$(bd create "Add keyboard dismissal and ARIA improvements to Toast" \
  -t task \
  -p 1 \
  -e 20 \
  --parent "$EPIC_A11Y_ID" \
  -l "accessibility,toast" \
  -d $'Toast notifications cannot be dismissed via keyboard. The container has role=status and aria-live=polite, but no keyboard support exists. Add Escape key handling. Audit issue: M-7.' \
  --acceptance $'1. Pressing Escape dismisses the most recent toast\n2. Individual toast close buttons are focusable via Tab\n3. role=status and aria-live=polite on the container are preserved\n4. Toasts continue to auto-dismiss after the timeout' \
  --design $'Modify src/components/Toast/Toast.tsx. Add onKeyDown handler to the toast container that listens for Escape and calls removeToast on the last toast. Ensure close button has proper focus. The close button already has aria-label="Dismiss notification".' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TOUCH_TARGET_ID=$(bd create "Increase Watchlist remove button touch target" \
  -t task \
  -p 2 \
  -e 10 \
  --parent "$EPIC_A11Y_ID" \
  -l "accessibility,watchlist" \
  -d $'The remove button on watchlist cards is a small positioned icon. Increase its touch target to meet WCAG 44x44px minimum. Audit issue: M-8.' \
  --acceptance $'1. Remove button has a minimum tap area of 44x44px\n2. Visual appearance can remain compact (hit area extends via padding)\n3. Button remains correctly positioned on the card' \
  --design $'Modify src/pages/Watchlist/Watchlist.module.css. Add to .remove-button: min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Epic 8: Minor Polish (M-5, L-1, L-2, L-3, L-5, L-9)
# Last
# ============================================================

EPIC_POLISH_ID=$(bd create "Minor Polish" \
  -t epic \
  -p 2 \
  -d $'Cosmetic and edge-case fixes: chart tooltip truncation, EventMarkerPopup overflow, portfolio responsive columns, search input consistency, mock buyback holdings, and welcome banner border.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_TOOLTIP_FIX_ID=$(bd create "Fix PlayerDetail chart tooltip truncation and add date context" \
  -t bug \
  -p 2 \
  -e 15 \
  --parent "$EPIC_POLISH_ID" \
  -l "player-detail,chart" \
  -d $'Price chart tooltip always truncates headlines to 40 chars with unconditional ellipsis and hides the date label. Fix truncation to be conditional and show the date. Audit issue: M-5.' \
  --acceptance $'1. Tooltip shows full headline when <=40 characters (no trailing ellipsis)\n2. Tooltip truncates at word boundaries when headline >40 characters\n3. Tooltip shows the date/time of the hovered price point' \
  --design $'Modify src/pages/PlayerDetail/PlayerDetail.tsx lines 369-379. For the formatter: conditionally truncate at word boundary. Remove labelStyle={{ display: \'none\' }} and format the label to show date from entry.timestamp.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_POPUP_BOUNDS_ID=$(bd create "Add viewport boundary checking to EventMarkerPopup" \
  -t bug \
  -p 3 \
  -e 15 \
  --parent "$EPIC_POLISH_ID" \
  -l "player-detail,chart" \
  -d $'The EventMarkerPopup position is set as { x: cx, y: cy + 20 } with no boundary checking. Near edges, the popup may overflow. Audit issue: L-1.' \
  --acceptance $'1. Popup repositions to stay within chart container bounds\n2. Near right edge, popup shifts left\n3. Near bottom edge, popup shifts above the marker' \
  --design $'Modify src/pages/PlayerDetail/PlayerDetail.tsx in handleEventClick (line 162). After computing position, check against chartContainerRef bounds. Adjust position if popup would overflow.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_PORTFOLIO_COLS_ID=$(bd create "Make Portfolio responsive column hiding class-based instead of nth-child" \
  -t chore \
  -p 3 \
  -e 20 \
  --parent "$EPIC_POLISH_ID" \
  -l "portfolio,css,responsive" \
  -d $'Portfolio page uses nth-child selectors for responsive column hiding, which is fragile. Switch to class-based hiding. Audit issue: L-2.' \
  --acceptance $'1. Responsive column hiding uses class names instead of nth-child\n2. At 900px breakpoint, Avg Cost and Value columns are hidden\n3. At 600px breakpoint, Shares column is additionally hidden\n4. Header and row columns remain aligned at all breakpoints' \
  --design $'Modify src/pages/Portfolio/Portfolio.tsx to add class names to each column span. Modify src/pages/Portfolio/Portfolio.module.css to replace nth-child selectors with class-based media queries.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_SEARCH_TYPE_ID=$(bd create "Standardize search input type across pages" \
  -t chore \
  -p 3 \
  -e 5 \
  --parent "$EPIC_POLISH_ID" \
  -l "ux,consistency" \
  -d $'Market uses type=search while Timeline uses type=text for search inputs. Standardize to type=search. Audit issue: L-3.' \
  --acceptance $'1. Both Market and Timeline search inputs use type=search\n2. Search functionality is unchanged' \
  --design $'Modify src/pages/Timeline/Timeline.tsx line 299. Change type="text" to type="search".' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_BUYBACK_MOCK_ID=$(bd create "Replace mock buyback holdings with actual portfolio data" \
  -t bug \
  -p 3 \
  -e 20 \
  --parent "$EPIC_POLISH_ID" \
  -l "playoffs,trading" \
  -d $'PlayoffAnnouncementModal uses MOCK_BUYBACK_HOLDINGS instead of actual portfolio from TradingContext. Replace with real portfolio data. Audit issue: L-5.' \
  --acceptance $'1. Buyback modal shows actual user holdings for eliminated-team players\n2. Buyback proceeds calculated from actual shares and prices\n3. If user has no eliminated-team holdings, show No holdings to buy back' \
  --design $'Modify src/components/PlayoffAnnouncementModal/PlayoffAnnouncementModal.tsx. Import useTrading and portfolio from TradingContext. Replace MOCK_BUYBACK_HOLDINGS references with portfolio. Filter to only show holdings for buybackPlayers. Remove the MOCK_BUYBACK_HOLDINGS constant.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

BEAD_BANNER_BORDER_ID=$(bd create "Replace welcome banner debug-style border with subtle styling" \
  -t bug \
  -p 3 \
  -e 5 \
  --parent "$EPIC_POLISH_ID" \
  -l "market,css,polish" \
  -d $'The welcome banner has border: 1px solid var(--color-primary) which renders as a prominent red border resembling a debug artifact. Replace with subtle border. Audit issue: L-9.' \
  --acceptance $'1. Welcome banner border uses var(--color-border) or similarly subtle color\n2. Banner blends with the app design system' \
  --design $'Modify src/pages/Market/Market.module.css line 163. Change border: 1px solid var(--color-primary) to border: 1px solid var(--color-border). Optionally add border-left: 3px solid var(--color-primary) for visual accent.' \
  --silent)
BEAD_COUNT=$((BEAD_COUNT + 1))

# ============================================================
# Summary
# ============================================================

echo "Created $BEAD_COUNT beads across 8 epics for the ui-repair specification."
