# McQueen UI Audit Report

**Date:** February 24, 2026
**Method:** Static code analysis + live browser dogfood testing (cursor-ide-browser MCP), simulating 4 user personas
**Dev Server:** Running at http://localhost:5173 (Vite, confirmed 200 OK)
**Dogfood session:** Full-app browser walkthrough covering all 6 nav pages, all 5 demo scenarios, trading flow, glossary panel. Screenshots archived in `dogfood-output/screenshots/`.

---

## Executive Summary

| Severity | Count (code analysis) | Count (browser dogfood) | Combined |
|----------|-----------------------|-------------------------|----------|
| Critical | 2                     | 0                       | 2        |
| High     | 7                     | 1                       | 8        |
| Medium   | 9                     | 2                       | 11       |
| Low      | 6                     | 3                       | 9        |
| **Total**| **24**                | **6**                   | **30**   |

All 7 required pages were audited: Market, PlayerDetail, Portfolio, Watchlist, Mission, Leaderboard, Timeline. All 4 personas were walked through via code-level analysis. Issues span visual bugs, interaction bugs, UX friction, data display issues, accessibility gaps, and performance concerns.

**Browser dogfood addendum (6 new issues, H-8 through L-9):** Live testing confirmed many code-analysis findings and surfaced 6 additional issues not visible from static analysis — most notably that the ESPN Live scenario (the default!) presents an empty first-impression, and that the header layout overflows on scenarios with extra badges. No JS console errors were observed during the browser session.

---

## Issues by Severity

### Critical

#### C-1: Onboarding CSS module class not applied to content wrapper

**Affected page/component:** Onboarding
**Description:** In `Onboarding.tsx` (line 146), the content wrapper div uses a raw string class `onboarding-content` and conditional `highlight-${currentStep.highlight}` instead of CSS module references (`styles['onboarding-content']`). Since this component uses CSS Modules (`import styles from './Onboarding.module.css'`), the raw class name won't match the hashed CSS module class. The `onboarding-content` styles (padding, text-align, etc.) defined in the `.module.css` file will not be applied.
**Steps to reproduce:**
1. Clear localStorage to trigger onboarding
2. Navigate to the app root
3. Observe onboarding content area has no padding or text-alignment
**Expected:** Content wrapper has `padding: 20px 40px 40px` and `text-align: center`
**Actual:** Raw class name `onboarding-content` is used instead of `styles['onboarding-content']`, so CSS module styles are not applied. Content area lacks proper padding and centering.

#### C-2: Nav link classes use raw strings instead of CSS module references

**Affected page/component:** Layout (Navigation)
**Description:** In `Layout.tsx` (lines 78, 89, 99, 109, 119, 129), all `NavLink` components use raw class strings `nav-link` and `active` instead of CSS module references. The Layout component imports `styles from './Layout.module.css'`, and the CSS defines `.nav-link` and `.nav-link.active` styles. Since CSS Modules hash class names, the raw `nav-link` and `active` strings won't match the hashed class names, causing navigation links to have no styling (no padding, no font-weight, no active state highlighting).
**Steps to reproduce:**
1. Load the app
2. Observe the navigation bar below the header
3. Note that nav links have no visual styling, no active state indicator
**Expected:** Navigation links have padding, font-weight, and the active link is highlighted with primary color background
**Actual:** Navigation links render as unstyled text because `className="nav-link"` doesn't match the CSS module hashed class `.nav-link`

---

### High

#### H-1: Onboarding does not sync state back to OnboardingProvider on completion

**Affected page/component:** Onboarding, OnboardingProvider
**Description:** The `Onboarding` component and `OnboardingProvider` manage onboarding state independently. The `Onboarding` component reads/writes `localStorage` directly and dispatches a `CustomEvent`, but the `OnboardingProvider`'s `hasCompletedOnboarding` state is initialized only on mount from localStorage. When onboarding completes, the provider's state doesn't update (it uses `useState` initialized from localStorage, not a live subscription). This means `hasCompletedOnboarding` in the provider will remain `false` until the page is refreshed, and `showFirstTradeGuide` won't activate within the same session.
**Steps to reproduce:**
1. Clear localStorage
2. Load the app (onboarding appears)
3. Complete onboarding (click through all steps)
4. Observe that `FirstTradeGuide` on the Market page does not appear until page refresh
**Expected:** After completing onboarding, the first-trade guide should immediately appear
**Actual:** `OnboardingProvider` state doesn't update in real-time; requires page refresh

#### H-2: Portfolio holdings disappear when switching scenarios

**Affected page/component:** Portfolio, TradingContext
**Description:** In `TradingContext.tsx` (lines 64-71), when `scenarioVersion` changes, portfolio is reset to `startingPortfolio` and cash is reset to `INITIAL_CASH`. This means all user trades are lost when switching scenarios. There's no warning dialog or confirmation before this happens.
**Steps to reproduce:**
1. Buy several players in Midweek scenario
2. Switch to Live scenario via the ScenarioToggle
3. Navigate to Portfolio page
4. Observe all previous holdings are gone and cash is back to $10,000
**Expected:** Either persist portfolio across scenarios, or show a clear warning before resetting
**Actual:** Portfolio is silently reset with no user confirmation or warning

#### H-3: Sell tab disabled state is confusing for new traders

**Affected page/component:** PlayerDetail (Trading Card)
**Description:** On the PlayerDetail page trading card, the Sell tab is disabled when the user doesn't hold any shares (`disabled={!holding}`). However, there's no tooltip or explanation for why the tab is disabled. A new user who just completed onboarding and navigates to a player detail page might not understand why they can't click "Sell."
**Steps to reproduce:**
1. Navigate to any player detail page without owning shares
2. Observe the Sell tab is grayed out (opacity 0.5, cursor: not-allowed)
3. No tooltip or label explains why it's disabled
**Expected:** A tooltip or helper text explains "You need to own shares to sell"
**Actual:** Tab is simply disabled with no explanation

#### H-4: Timeline page "Today" and "This Week" time filters likely show no results

**Affected page/component:** Timeline
**Description:** The Timeline page has time filters for "Today" and "This Week" that compare against `new Date()`. However, the scenario data is static with hardcoded timestamps (e.g., from December 2024 or specific NFL game dates). Since these timestamps are in the past, filtering by "Today" or "This Week" will almost certainly show an empty state: "No events match your filters."
**Steps to reproduce:**
1. Navigate to Timeline page (home route `/`)
2. Select "Today" from the Time filter dropdown
3. Observe empty state with no events
4. Select "This Week" - same empty result
**Expected:** Time filters should be relative to the scenario's date range, or clearly labeled as demo data
**Actual:** Filters compare against the actual current date, making them non-functional for demo data

#### H-5: PlayerCard moveReason truncation can cut mid-word with misleading ellipsis

**Affected page/component:** PlayerCard
**Description:** In `PlayerCard.tsx` (line 141), `moveReason` is truncated with `substring(0, 60)` and appended with `...`. This hard truncation doesn't respect word boundaries, so text can be cut mid-word (e.g., "Patrick Mahomes threw his third touch..." instead of "Patrick Mahomes threw his third..."). Additionally, if the reason is exactly 60 characters or shorter, the ellipsis is still appended unconditionally.
**Steps to reproduce:**
1. Browse the Market page
2. Look at any PlayerCard with a moveReason
3. Observe text may be cut mid-word
**Expected:** Truncation respects word boundaries and only adds ellipsis if actually truncated
**Actual:** Hard `substring(0, 60)` always followed by `...`

#### H-6: Mission player selector only shows first 12 players

**Affected page/component:** DailyMission
**Description:** In `DailyMission.tsx` (line 245), the player selector `players.slice(0, 12)` only shows the first 12 players. There's no scroll, pagination, or "show more" button. Users cannot pick from players beyond the first 12, limiting strategy options and potentially frustrating informed users.
**Steps to reproduce:**
1. Navigate to Mission page
2. Observe only 12 players are shown in the selector
3. No way to access remaining players
**Expected:** All players available for selection, or a search/filter to find specific players
**Actual:** Only first 12 players shown with no way to see more

#### H-7: TimelineDebugger only visible in dev mode

**Affected page/component:** TimelineDebugger
**Description:** The `TimelineDebugger` component checks `isDevMode()` and returns `null` if not in dev mode (line 13). Dev mode requires `?dev=true` URL parameter or localStorage flag. Regular users cannot access the Timeline Debugger functionality (play, pause, scrub) described in the Scenario Explorer persona, making Live scenario's timeline controls invisible to normal users.
**Steps to reproduce:**
1. Switch to Live scenario
2. Look for Timeline Debugger controls
3. No debugger is visible without `?dev=true` query parameter
**Expected:** Timeline controls should be accessible in Live mode for all users, or at minimum the scenario should auto-play visibly
**Actual:** Timeline Debugger is hidden behind dev mode flag

#### H-8: ESPN Live scenario (default) shows empty app with no feedback on refresh *(browser-confirmed)*

**Affected page/component:** ScenarioToggle, SimulationContext, Timeline
**Source:** Dogfood browser test — ISSUE-003
**Description:** The "ESPN Live" demo scenario is the default selected tab when the app loads. It shows all-zero counters (Events: 0, TDs: 0, INTs: 0, Stats: 0, News: 0, Trades: 0) and "No events match your filters" on the Timeline. This means a new user's very first impression of the app is a completely empty page. Clicking the "Refresh ESPN news" button (circular arrow) disables the button briefly but produces no visible result — no data, no loading spinner, no success/error toast, and no console errors. The user has no way to know whether the refresh attempted and failed or if the feature is simply non-functional. This is likely caused by the ESPN API proxy failing silently (see Console Errors section, item #3), but the UX impact is severe because it's the default scenario.
**Steps to reproduce:**
1. Load http://localhost:5173/ fresh — ESPN Live is selected by default
2. Observe all counters at 0 and "No events match your filters"
3. Click the refresh button next to the ESPN tab — button disables briefly, then re-enables with no change
**Expected:** Either (a) ESPN Live loads real data, or (b) a clear error state with a fallback, or (c) a different scenario is the default
**Actual:** Empty page, silent refresh failure, no user feedback
**Screenshot evidence:** `dogfood-output/screenshots/issue-001-espn-live-clipped.png`, `dogfood-output/screenshots/issue-003-espn-after-refresh.png`

---

### Medium

#### M-1: PlayerCard sparkline chart has no accessible alternative

**Affected page/component:** PlayerCard
**Description:** The Recharts `LineChart` sparkline in PlayerCard renders as SVG with no `aria-label`, `role`, or `<title>` element. Screen readers have no way to convey the price trend information shown by the sparkline.
**Steps to reproduce:**
1. Navigate to Market page
2. Use a screen reader to examine any PlayerCard
3. The sparkline chart conveys no information
**Expected:** Chart should have `aria-label` describing the trend (e.g., "7-day price trend: up 5.2%")
**Actual:** Silent SVG element with no accessible description

#### M-2: Content tile type badges use global class names instead of CSS module classes

**Affected page/component:** PlayerDetail
**Description:** In `PlayerDetail.tsx` (line 483), content tile type badges use `className={... ${tile.type}}` which adds a raw class like `article`, `video`, `analysis`, or `news`. The CSS module defines `.tile-type.article`, `.tile-type.video`, etc. However, since the parent class `.tile-type` is properly module-referenced but the type class is raw, the color-coded styling for different content types won't apply correctly with CSS modules.
**Steps to reproduce:**
1. Navigate to any PlayerDetail page with content tiles
2. Observe that all content type badges have the same default styling
3. No color differentiation between article (blue), video (purple), analysis (orange), news (green)
**Expected:** Each content type has distinct color-coded background and text
**Actual:** Raw class name (e.g., `article`) doesn't match CSS module hashed class

#### M-3: DailyMission result-chip status class uses raw string

**Affected page/component:** DailyMission
**Description:** In `DailyMission.tsx` (lines 111, 135), the result chip uses `className={... ${status}}` where `status` is `'correct'` or `'incorrect'`. These are raw strings, but if the CSS module defines `.correct` and `.incorrect` classes, they would need to be `styles['correct']` and `styles['incorrect']` respectively. This means correct/incorrect visual feedback may not render.
**Steps to reproduce:**
1. Navigate to Mission page
2. Complete all 6 picks (3 risers, 3 fallers)
3. Click "Reveal Results!"
4. Observe result chips may not show green (correct) or red (incorrect) styling
**Expected:** Correct predictions shown in green, incorrect in red
**Actual:** Raw class names may not match CSS module hashed classes

#### M-4: Market sidebar sticky positioning may overlap with sticky header

**Affected page/component:** Market
**Description:** The market sidebar has `position: sticky; top: 16px;` but the header is also `position: sticky; top: 0;` with `z-index: 100`. The sidebar's `top: 16px` doesn't account for the header height (64px defined as `--header-height`), so on scroll, the sidebar will slide under the sticky header.
**Steps to reproduce:**
1. Navigate to Market page on desktop (>1200px wide)
2. Scroll down the page
3. Observe the sidebar leaderboard starts to tuck under the sticky header
**Expected:** Sidebar sticks below the header (`top: calc(var(--header-height) + 16px)`)
**Actual:** Sidebar sticks at `top: 16px`, overlapping with the 64px-tall sticky header

#### M-5: PlayerDetail price chart tooltip shows truncated headline for all entries

**Affected page/component:** PlayerDetail (Price Chart)
**Description:** The Recharts Tooltip formatter (lines 371-379) always truncates the headline to 40 characters and appends `...`. If a headline is shorter than 40 characters, the ellipsis is still misleadingly appended. Also, the tooltip label is hidden (`labelStyle={{ display: 'none' }}`) so there's no date context for the hovered price point.
**Steps to reproduce:**
1. Navigate to any PlayerDetail page
2. Hover over points on the price history chart
3. Observe tooltip shows truncated text even for short headlines, and no date
**Expected:** Tooltip shows full headline (or smart truncation) and date context
**Actual:** Always truncated to 40 chars + "..." with no timestamp shown

#### M-6: Leaderboard "col-trader" column lacks avatar-name alignment on mobile

**Affected page/component:** Leaderboard
**Description:** The trader column in the leaderboard table uses `span` elements for avatar and name but the parent `col-trader` has no flex layout. The avatar emoji and name text are inline, which may cause inconsistent vertical alignment across browsers, especially when emoji rendering varies.
**Steps to reproduce:**
1. Navigate to Leaderboard page
2. Observe trader column - avatar and name alignment may be inconsistent
**Expected:** Avatar and name vertically centered and consistently aligned
**Actual:** Inline elements without explicit flex alignment

#### M-7: Toast notifications don't support keyboard dismissal

**Affected page/component:** Toast, ToastProvider
**Description:** Toast notifications auto-dismiss after 3 seconds but cannot be dismissed manually via keyboard (no focus, no Escape handler, no close button accessible via Tab). The Toast component is rendered outside normal content flow, so screen reader users may not be aware of its appearance.
**Steps to reproduce:**
1. Buy a share to trigger a toast
2. Try to dismiss the toast via keyboard
3. No keyboard interaction possible
**Expected:** Toast should have `role="alert"` or `role="status"` and optionally support Escape to dismiss
**Actual:** No ARIA role and no keyboard dismiss support

#### M-8: Watchlist page remove button has poor touch target

**Affected page/component:** Watchlist
**Description:** The remove button on watchlist cards is a small icon button overlaid on the card. While it has `aria-label`, the visual target area may be small, especially on mobile. The button is positioned absolutely and may be hard to tap accurately on touch devices.
**Steps to reproduce:**
1. Add players to watchlist
2. Visit Watchlist page on a mobile viewport
3. Try to tap the X remove button
**Expected:** Touch target is at least 44x44px per WCAG guidelines
**Actual:** Button size is determined by the SVG icon with no minimum touch padding defined

#### M-9: Scenario toggle doesn't indicate data loading state between switches

**Affected page/component:** ScenarioToggle, ScenarioContext
**Description:** When switching scenarios, the data is loaded asynchronously (`scenarioLoaders[scenario]()` returns a Promise). During loading, `scenarioLoading` is set to `true`, but the ScenarioToggle component doesn't check this state — the tab appears active immediately while data may still be loading. Only the Market page shows a skeleton loader during this brief gap.
**Steps to reproduce:**
1. Click rapidly between different scenario tabs
2. The tab highlights instantly but page content may briefly show stale data
**Expected:** Some loading indicator on the scenario toggle or a brief transition state
**Actual:** Tab highlights immediately; possible flash of stale content before new data loads

#### M-10: Total Value label and dollar amount clipped at right edge of header *(browser-confirmed)*

**Affected page/component:** Layout (Header), ScenarioToggle
**Source:** Dogfood browser test — ISSUE-001
**Description:** The "TOTAL VALUE" label and dollar amount in the top-right corner of the header are truncated by the viewport edge. The label shows "TO..." or "TOTAL VALU..." and the amount shows "$11,0..." or "$10,000.0..." instead of the full text. This happens because the demo scenario tabs and other header elements (LIVE badge, ESPN badge, refresh button) consume too much horizontal space. The issue is worst on ESPN Live and Live Game scenarios. On Midweek (no extra badges), the balance renders correctly.
**Steps to reproduce:**
1. Load http://localhost:5173/ with ESPN Live or Live Game scenario selected
2. Observe top-right corner — "TOTAL VALUE" and dollar amount are clipped
3. Switch to Midweek scenario — the full "$11,005.00" is visible
**Expected:** Total Value always fully visible regardless of which scenario tab is selected
**Actual:** Text overflows and is clipped when scenario tabs have extra badges
**Screenshot evidence:** `dogfood-output/screenshots/issue-001-espn-live-clipped.png`, `dogfood-output/screenshots/issue-001-live-game-clipped.png`

#### M-11: All page content renders below the fold — initial viewport appears blank *(browser-confirmed)*

**Affected page/component:** Layout, all pages
**Source:** Dogfood browser test — ISSUE-002
**Description:** On every page (Timeline, Portfolio, Watchlist, Mission, Leaderboard), the header area — logo, demo scenario tabs, Help button, balance, navigation bar — consumes approximately 120px of vertical space. This pushes all meaningful page content below the initial viewport. When a user navigates to any page, they first see what appears to be a completely blank/dark page and must scroll down to discover actual content. This is especially confusing on Portfolio, Watchlist, and Leaderboard where the initial viewport shows only dark empty space, giving the impression the page is broken. Related to M-4 (sticky sidebar positioning) but is a broader layout issue affecting all pages.
**Steps to reproduce:**
1. Navigate to http://localhost:5173/portfolio — viewport shows an empty dark page
2. Navigate to http://localhost:5173/leaderboard — viewport shows empty dark boxes
3. Scroll down on any page to reveal the actual content below the fold
**Expected:** Page content is immediately visible without scrolling
**Actual:** Header consumes all above-the-fold space; content appears only after scroll
**Screenshot evidence:** `dogfood-output/screenshots/issue-002-portfolio-full.png`, `dogfood-output/screenshots/issue-002-leaderboard-full.png`

---

### Low

#### L-1: PlayerDetail page EventMarkerPopup position may overflow viewport

**Affected page/component:** PlayerDetail
**Description:** The `EventMarkerPopup` position is calculated as `{ x: cx, y: cy + 20 }` from the chart coordinate. There's no boundary checking, so if an event marker is near the right or bottom edge of the chart, the popup may overflow the chart container or viewport.
**Steps to reproduce:**
1. Navigate to a PlayerDetail page with event markers on the right side of the chart
2. Click a marker near the chart edge
3. Popup may be partially or fully clipped
**Expected:** Popup repositions to stay within viewport bounds
**Actual:** Popup renders at a fixed offset from the marker regardless of viewport boundaries

#### L-2: Portfolio holdings header and row columns don't match on responsive breakpoints

**Affected page/component:** Portfolio
**Description:** At the 900px breakpoint, the grid changes to `1.5fr 1fr 1fr 1fr` (4 columns) and hides "Avg Cost" and "Value" columns. At 600px, it further reduces to 3 columns hiding "Shares." The `nth-child` selectors used to hide columns are fragile — if column order changes, the wrong columns will be hidden.
**Steps to reproduce:**
1. View Portfolio page with holdings at 768px viewport width
2. Observe that the hidden columns may cause header/row misalignment
**Expected:** Column hiding is based on class names rather than nth-child position
**Actual:** `nth-child` selectors couple visual layout to DOM order

#### L-3: Search input on Market page uses `type="search"` but Timeline uses `type="text"`

**Affected page/component:** Market, Timeline
**Description:** The Market search input uses `type="search"` (which provides native clear button in some browsers), while the Timeline search input uses `type="text"`. This inconsistency means the search UX differs between pages.
**Steps to reproduce:**
1. Go to Market page — search input may show native clear (X) button in Safari/Chrome
2. Go to Timeline page — search input has no clear button
**Expected:** Consistent input type across all search fields
**Actual:** `type="search"` on Market, `type="text"` on Timeline

#### L-4: LiveTicker fallback text is hardcoded to "Chiefs vs Bills"

**Affected page/component:** LiveTicker
**Description:** In `LiveTicker.tsx` (line 62), the fallback text reads "MNF: Chiefs vs Bills - Live updates as they happen." This hardcoded string doesn't reflect the actual Live scenario data, which may feature different teams.
**Steps to reproduce:**
1. Switch to Live scenario
2. If no events are loaded yet, observe the ticker
3. Shows "Chiefs vs Bills" regardless of actual scenario matchup
**Expected:** Fallback text should be dynamic or generic (e.g., "Live updates as they happen")
**Actual:** Hardcoded team names that may not match the scenario

#### L-5: PlayoffAnnouncementModal uses mock portfolio data for buyback calculations

**Affected page/component:** PlayoffAnnouncementModal
**Description:** In `PlayoffAnnouncementModal.tsx` (lines 9-14), the buyback proceeds are calculated using `MOCK_BUYBACK_HOLDINGS` — hardcoded mock data — rather than the user's actual portfolio from `TradingContext`. This means the buyback modal always shows the same shares/proceeds regardless of what the user actually holds.
**Steps to reproduce:**
1. Buy different amounts of eliminated-team players
2. Switch to Playoffs scenario
3. Observe buyback modal shows hardcoded share counts (e.g., 5 shares of Diggs, 8 shares of Stroud)
**Expected:** Modal shows actual user holdings for buyback calculations
**Actual:** Shows mock data that doesn't reflect user's real trades

#### L-6: Leaderboard "Weekly Gain" column header suggests time-limited data that is static

**Affected page/component:** Leaderboard
**Description:** The leaderboard header says "Weekly Gain" (line 70) but the gain values are computed from the current session's trades, not a rolling 7-day window. Since this is a demo app with no backend, "Weekly Gain" is misleading — it's really "Session Gain" or "Current Gain."
**Steps to reproduce:**
1. Navigate to Leaderboard page
2. Observe "Weekly Gain" column header
3. Values reflect current session trades, not a weekly time window
**Expected:** Column header accurately describes the data (e.g., "Gain" or "Session Gain")
**Actual:** "Weekly Gain" implies time-based tracking that doesn't exist

#### L-7: Raw enum "LEAGUE_TRADE" displayed in timeline event tags *(browser-confirmed)*

**Affected page/component:** Timeline
**Source:** Dogfood browser test — ISSUE-004
**Description:** Timeline events display raw machine-readable tag text "LEAGUE_TRADE" instead of a human-friendly label like "Trade." The Type filter dropdown correctly maps this to "Trades," but the badge rendered on individual timeline entries uses the internal enum value with an underscore. This looks unpolished and inconsistent with the dropdown labels.
**Steps to reproduce:**
1. Select "Live Game" scenario tab
2. Scroll down on the Timeline page
3. Observe "LEAGUE_TRADE" tag badges next to player names on trade events
**Expected:** Badge text reads "Trade" (matching the filter dropdown label)
**Actual:** Badge shows raw "LEAGUE_TRADE"
**Screenshot evidence:** `dogfood-output/screenshots/issue-004-league-trade-tag.png`

#### L-8: Player detail shows future-dated event relative to scenario date *(browser-confirmed)*

**Affected page/component:** PlayerDetail, scenario data
**Source:** Dogfood browser test — ISSUE-005
**Description:** On the Midweek scenario (labeled "Wed, Dec 4"), the Jameson Williams player detail page shows a price change entry dated "Dec 6, 10:00 AM" — two days in the future relative to the scenario's date. This breaks immersion of the demo scenario, as events should not occur after the scenario's current date.
**Steps to reproduce:**
1. Select "Midweek" scenario tab
2. Navigate to Market → click Jameson Williams
3. Scroll to "PRICE CHANGES" section
4. Observe "Dec 6, 10:00 AM" entry (2 days after the Dec 4 scenario date)
**Expected:** All events are dated at or before the scenario's current date
**Actual:** Entry from Dec 6 appears in a Dec 4 scenario
**Screenshot evidence:** `dogfood-output/screenshots/issue-005-future-date.png`

#### L-9: Welcome banner uses debug-style dashed red border *(browser-confirmed)*

**Affected page/component:** Market (Welcome banner)
**Source:** Dogfood browser test — ISSUE-006
**Description:** The "Welcome to McQueen!" banner at the top of the Market page has a prominent dashed red border that looks like a debug/development styling artifact. The rest of the app uses solid, subtle borders — this dashed red border is visually inconsistent and gives the impression of a leftover development aid.
**Steps to reproduce:**
1. Navigate to http://localhost:5173/market
2. Observe the welcome banner has a red dashed border
**Expected:** Banner border is consistent with the app's design system (solid, subtle)
**Actual:** Red dashed border resembling a debug outline
**Screenshot evidence:** `dogfood-output/screenshots/issue-006-market-page.png`

---

## Console Errors

**Live browser session (dogfood):** No JavaScript errors or warnings were observed during the full browser walkthrough. The console only contained standard Vite HMR messages (`[vite] connecting...`, `[vite] connected.`) and a React DevTools recommendation. The ESPN Live refresh button did not produce any console errors, suggesting the fetch may be silently swallowed or the proxy is returning empty data rather than an error.

**Code analysis (potential issues):** Based on static analysis, the following potential console errors/warnings were identified:

1. **React key warning in PlayerCard sparkline:** The `sparklineData` array pushes `currentPrice` at the end but uses default numeric indices. This is fine for Recharts but could generate warnings if the data array is empty.

2. **Missing eslint-disable comments indicate known type issues:** Multiple `@typescript-eslint/no-explicit-any` suppressions in `PlayerDetail.tsx` (lines 370-371, 396-397, 439-440) suggest Recharts callback typing is imprecise — not a runtime error but contributes to type-safety debt.

3. **ESPN fetch errors in ESPN Live mode:** When switching to `espn-live` scenario, if the Vite proxy to `site.api.espn.com` fails (e.g., network issues), `console.error('ESPN fetch error:', error)` will fire (SimulationContext line 193). This is expected error handling but will appear in the console.

4. **Potential undefined access in Timeline:** `event.reason?.headline` uses optional chaining, but `event.reason?.type` comparisons (line 147) could still process events with no reason type, silently filtering them out of type-specific filters.

5. **No console warnings from React StrictMode:** The app does not use `<StrictMode>` wrapper in `main.tsx`, so double-render warnings won't appear, but this also means potential issues from effects won't surface during development.

---

## Pages Audited

| Page | Visited By | Issues Found (code) | Issues Found (browser) |
|------|-----------|---------------------|------------------------|
| Market | New User, Active Trader, Browser | C-2, H-5, M-1, M-4, L-3 | L-9 |
| PlayerDetail | New User, Active Trader, Browser | H-3, H-5, M-2, M-5, L-1 | L-8 |
| Portfolio | New User, Active Trader, Browser | H-2, L-2 | M-11 |
| Watchlist | Active Trader, Browser | M-8 | M-11 |
| Mission | Mission Player, Browser | H-6, M-3 | M-11 |
| Leaderboard | Mission Player, Browser | M-6, L-6 | M-11 |
| Timeline | New User, Scenario Explorer, Browser | H-4, H-7, L-3, L-4 | H-8, L-7, M-11 |
| Onboarding | New User | C-1, H-1 | — |
| ScenarioToggle | Scenario Explorer, Browser | M-9 | H-8, M-10 |
| PlayoffAnnouncementModal | Scenario Explorer | L-5 | — |

---

## Recommended Fix Priority

1. **C-1: Onboarding CSS module class not applied** — Fix immediately. Onboarding is the first-run experience and currently has broken styling. Change raw `onboarding-content` to `styles['onboarding-content']`.

2. **C-2: Nav link classes use raw strings** — Fix immediately. Navigation is completely unstyled, making the app unusable. Change all `nav-link` references to use `styles['nav-link']` and conditionally apply `styles['active']`.

3. **H-8: ESPN Live default scenario is empty with silent refresh failure** *(browser-confirmed)* — High priority. This is the first thing a new user sees. Either make ESPN Live work, show a clear error fallback, or change the default scenario to Midweek.

4. **H-1: Onboarding doesn't sync state back to provider** — High priority. First-trade guide never shows without a page refresh, breaking the new-user flow.

5. **H-2: Portfolio resets on scenario switch without warning** — High priority. Silent data loss is frustrating; add a confirmation dialog.

6. **H-4: Timeline time filters show empty results for demo data** — High priority. Two of three time filter options are non-functional, confusing users.

7. **H-7: TimelineDebugger hidden behind dev mode** — High priority for the Live scenario experience. Consider showing a simplified version for all users in Live mode.

8. **H-6: Mission selector limited to 12 players** — High priority. Limits mission gameplay; add search/filter or scrollable list.

9. **H-3: Sell tab disabled without explanation** — Important UX fix. Add tooltip text.

10. **H-5: PlayerCard moveReason hard truncation** — Moderate priority. Use word-boundary truncation.

11. **M-10: Total Value clipped in header** *(browser-confirmed)* — Moderate. Header layout needs to accommodate scenario tab badges without truncating the balance. May be fixable alongside M-4/M-11.

12. **M-11: Content below the fold on all pages** *(browser-confirmed)* — Moderate. Header consumes too much vertical space. Consider reducing header height or making content scroll independently.

13. **M-2: Content tile type badges unstyled** — Moderate. Fix CSS module class usage.

14. **M-3: Mission result-chip status class raw string** — Moderate. Fix CSS module class usage.

15. **M-4: Market sidebar overlaps sticky header** — Moderate. Update `top` value.

16. **M-1: PlayerCard sparkline not accessible** — Moderate. Add `aria-label`.

17. **M-7: Toast lacks keyboard/ARIA support** — Moderate accessibility fix.

18. **M-5: Chart tooltip always truncated** — Low-moderate. Smart truncation + date.

19. **M-6: Leaderboard avatar alignment** — Low-moderate. Add flex layout.

20. **M-8: Watchlist remove button touch target** — Low-moderate. Increase padding.

21. **M-9: Scenario toggle no loading indicator** — Low-moderate. Add brief loading state.

22. **L-7: LEAGUE_TRADE raw enum in timeline tags** *(browser-confirmed)* — Low. Map enum to display label.

23. **L-9: Welcome banner dashed red border** *(browser-confirmed)* — Low. Replace with solid border matching design system.

24. **L-1 through L-6, L-8** — Low priority polish items; address in subsequent sprints.

---

## Audit Category Coverage

| Category | Evaluated | Issues Found |
|----------|-----------|--------------|
| Visual bugs | Yes (code + browser) | C-1, C-2, M-2, M-3, M-4, M-6, **M-10**, **L-9** |
| Interaction bugs | Yes (code + browser) | H-1, H-2, H-3, H-4, H-7, **H-8** |
| UX friction | Yes (code + browser) | H-3, H-5, H-6, M-5, M-9, L-6, **M-11** |
| Data display issues | Yes (code + browser) | H-4, H-5, M-5, L-4, L-5, L-6, **L-7**, **L-8** |
| Accessibility gaps | Yes (code) | M-1, M-7, M-8, L-3 |
| Console errors | Yes (code + browser) | See Console Errors section |
| Performance issues | Yes (code + browser) | No significant issues found (lazy loading, skeleton states, memoization all in place) |
