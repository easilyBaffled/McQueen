# Spec: ui-repair

## 1. Executive Summary

The UI audit identified **30 issues** across the McQueen app: **2 Critical**, **8 High**, **11 Medium**, and **9 Low**. These span CSS module class bugs (broken styling in onboarding and navigation), layout problems (header overflow, content below the fold), UX friction (silent portfolio reset, disabled tabs without explanation), data display issues (hardcoded strings, broken time filters), and accessibility gaps (missing ARIA attributes, poor touch targets).

The recommended approach is a dependency-ordered rollout across 8 epics. CSS module fixes come first because they are Critical-severity and block correct rendering site-wide. Layout/header repairs follow since they depend on correct CSS module usage. Remaining epics (onboarding, trading UX, timeline/scenario, mission/leaderboard, accessibility, polish) are parallelizable after the CSS foundation is solid.

## 2. Current State

### CSS Modules — Onboarding & Layout (C-1, C-2, M-2, M-3)

- **`src/components/Onboarding/Onboarding.tsx`** (line 146): The content wrapper uses a raw string `onboarding-content` and conditional `highlight-${currentStep.highlight}` instead of `styles['onboarding-content']`. The component imports `styles from './Onboarding.module.css'` but this div bypasses it. The CSS defines `.onboarding-content { padding: 20px 40px 40px; text-align: center; }` which is never applied.
- **`src/components/Onboarding/Onboarding.module.css`** (line 65): Defines `.onboarding-content` with padding and text-align that cannot match the raw class name in the TSX.
- **`src/components/Layout/Layout.tsx`** (lines 78, 89, 99, 109, 119, 129): All six `NavLink` components use raw string `nav-link` and `active` classes. The component imports `styles from './Layout.module.css'` which defines `.nav-link` and `.nav-link.active` styles. Navigation links render completely unstyled.
- **`src/components/Layout/Layout.module.css`** (lines 161–181): Defines `.nav-link` with padding, font-weight, colors, and `.nav-link.active` with primary color background — none of which apply because the TSX uses raw strings.
- **`src/pages/PlayerDetail/PlayerDetail.tsx`** (line 483): Content tile type badges use `className={... ${tile.type}}` where `tile.type` is a raw string like `article`, `video`, etc. The CSS module defines `.tile-type.article`, `.tile-type.video` etc. with color-coded backgrounds that don't apply.
- **`src/components/DailyMission/DailyMission.tsx`** (lines 111, 135): Result chip uses `className={... ${status}}` where `status` is `'correct'` or `'incorrect'`. If the CSS module defines these classes, they won't match the raw strings. **Verification note:** The module CSS does define `.correct` and `.incorrect` classes for green/red backgrounds on result chips.

### Layout & Header (M-4, M-10, M-11)

- **`src/pages/Market/Market.module.css`** (line 133–134): Market sidebar has `position: sticky; top: 16px;` but the header is sticky at `top: 0` with height `var(--header-height)` (64px). The sidebar slides under the header on scroll.
- **`src/components/Layout/Layout.module.css`** (lines 34–44): Header is `position: sticky; top: 0; z-index: 100;` with `height: var(--header-height)`.
- **`src/components/Layout/Layout.tsx`**: The layout structure is `header` + optional `LiveTicker` + `nav` + `main`. The header (~64px) plus nav (~48px with padding) consume ~120px before main content begins. On pages with little above-the-fold content (Portfolio, Watchlist, Leaderboard), users see a mostly empty dark viewport and must scroll to find content.
- **`src/components/Layout/Layout.module.css`** (lines 46–56): `header-left` and `header-right` both have `flex: 1`. When scenario tabs include extra badges (LIVE, ESPN), the center section expands and clips the "TOTAL VALUE" label at the right edge.

### Onboarding & First-Run (H-1, H-8)

- **`src/components/Onboarding/OnboardingProvider.tsx`** (lines 27–38): `hasCompletedOnboarding` and `showFirstTradeGuide` are initialized from localStorage via `useState`. The provider exposes `markOnboardingComplete` (lines 46–52) which updates state, but `Onboarding.tsx` does not call it — instead it writes to localStorage directly and dispatches a `CustomEvent` (line 28). The provider never listens for this event, so `showFirstTradeGuide` stays `false` until page refresh.
- **`src/components/Onboarding/Onboarding.tsx`** (lines 24–29): `handleComplete` sets localStorage keys and dispatches `'mcqueen-onboarding-complete'` custom event, but does not call the provider's `markOnboardingComplete`.
- **`src/components/ScenarioToggle/ScenarioToggle.tsx`** (lines 9–47): ESPN Live is the last scenario in the tabs array. The default scenario is determined by `ScenarioContext` initialization. When ESPN Live is selected, the app shows all-zero counters and "No events match your filters" because no ESPN data loads. The refresh button triggers `refreshEspnNews()` but produces no visible result.

### Trading UX (H-2, H-3, H-5)

- **`src/context/TradingContext.tsx`** (lines 64–71): On `scenarioVersion` change, portfolio is reset to `startingPortfolio` and cash to `INITIAL_CASH`. No confirmation dialog or warning. All user trades are silently lost.
- **`src/pages/PlayerDetail/PlayerDetail.tsx`** (line 688): The Sell tab is `disabled={!holding}` with no tooltip or helper text explaining why it's disabled. New users see a grayed-out tab with no context.
- **`src/components/PlayerCard/PlayerCard.tsx`** (line 140): `moveReason.substring(0, 60)` always appends `...` regardless of whether the string was actually truncated, and doesn't respect word boundaries.

### Timeline & Scenario (H-4, H-7, M-9, L-4, L-7, L-8)

- **`src/pages/Timeline/Timeline.tsx`** (lines 159–169): "Today" and "This Week" filters compare against `new Date()`. Scenario data has hardcoded timestamps from December 2024, so these filters always show empty results.
- **`src/components/TimelineDebugger/TimelineDebugger.tsx`** (line 13): Returns `null` if `!isDevMode()`. Regular users cannot access timeline playback controls in Live mode.
- **`src/components/ScenarioToggle/ScenarioToggle.tsx`**: When switching scenarios, the tab highlights immediately but `scenarioLoading` state is not reflected in the toggle UI. Possible flash of stale content.
- **`src/components/LiveTicker/LiveTicker.tsx`** (line 62): Fallback text is hardcoded to `"MNF: Chiefs vs Bills - Live updates as they happen"`.
- **`src/pages/Timeline/Timeline.tsx`** (line 68): `getEventTypeLabel` returns `reason?.eventType || reason?.type || 'event'`, which for `league_trade` type events returns the raw string `league_trade` (displayed as the badge text). The Type filter dropdown correctly maps this to "Trades" but the badge shows the raw internal type.
- **`src/pages/PlayerDetail/PlayerDetail.tsx`**: Price change entries can have timestamps that fall after the scenario's narrative date (e.g., Dec 6 events in a Dec 4 Midweek scenario). This is a data-level issue.

### Mission & Leaderboard (H-6, M-6, L-6)

- **`src/components/DailyMission/DailyMission.tsx`** (line 245): `players.slice(0, 12)` limits the player selector to only 12 players with no scroll, pagination, or search.
- **`src/pages/Leaderboard/Leaderboard.tsx`** (lines 89–94): Trader column uses inline `span` elements for avatar and name with no explicit flex alignment. Vertical alignment inconsistency across browsers.
- **`src/pages/Leaderboard/Leaderboard.tsx`** (line 70): Column header says "Weekly Gain" but values are session-based, not a rolling 7-day window.

### Accessibility (M-1, M-7, M-8)

- **`src/components/PlayerCard/PlayerCard.tsx`** (lines 126–137): The sparkline `LineChart` SVG has no `aria-label`, `role`, or accessible alternative. Screen readers get no information about the price trend.
- **`src/components/Toast/Toast.tsx`** (line 12): Toast container has `role="status"` and `aria-live="polite"` (the audit was partially wrong about missing roles), but toasts have no keyboard dismissal (no Escape handler, no focus management). The close button exists but is not keyboard-focusable in the normal tab flow since toasts appear outside the main content.
- **`src/pages/Watchlist/Watchlist.tsx`** (lines 139–149): Remove button is a positioned overlay with no explicit minimum size. Touch target may be smaller than the WCAG-recommended 44x44px.

### Minor Polish (M-5, L-1, L-2, L-3, L-5, L-9)

- **`src/pages/PlayerDetail/PlayerDetail.tsx`** (lines 371–379): Tooltip formatter always truncates headline to 40 chars + `"..."` even for short strings, and hides the date label.
- **`src/pages/PlayerDetail/PlayerDetail.tsx`** (line 162): `EventMarkerPopup` position is `{ x: cx, y: cy + 20 }` with no viewport boundary checking.
- **`src/pages/Portfolio/Portfolio.tsx`**: Uses `nth-child` selectors for responsive column hiding, which is fragile if column order changes.
- **`src/pages/Market/Market.tsx`** (line 131): Search input uses `type="search"`. **`src/pages/Timeline/Timeline.tsx`** (line 299): Search input uses `type="text"`. Inconsistent search UX.
- **`src/components/PlayoffAnnouncementModal/PlayoffAnnouncementModal.tsx`** (lines 9–14): Uses `MOCK_BUYBACK_HOLDINGS` hardcoded data instead of the user's actual portfolio from `TradingContext`.
- **`src/pages/Market/Market.module.css`** (lines 152–166): Welcome banner has `border: 1px solid var(--color-primary)`. **Discrepancy note:** The audit reported a "dashed red border" but the CSS uses `solid`. The `--color-primary` variable is a red color, making the border visually prominent and debug-like even though it's technically solid. The fix should use a subtle border regardless.

## 3. Design Decisions

### Decision 1: ESPN Live Default Scenario Handling (H-8)

- **Decision:** Change the default scenario from ESPN Live to Midweek, and add an empty-state fallback with a clear error message for ESPN Live when data fails to load.
- **Options considered:**
  1. Fix the ESPN API proxy to reliably load data.
  2. Change the default scenario to Midweek and add an error fallback for ESPN Live.
  3. Remove the ESPN Live scenario entirely.
- **Rationale:** Option 1 requires backend changes outside the scope of this UI repair. Option 3 removes a valuable feature. Option 2 ensures new users see populated data on first load while preserving ESPN Live for users who select it manually.
- **Trade-offs:** Users who want real ESPN data must manually select the tab. The ESPN Live tab may still show empty results if the proxy is down, but the error state will now be explicit rather than silent.

### Decision 2: Portfolio Reset on Scenario Switch (H-2)

- **Decision:** Add a confirmation dialog before resetting portfolio when switching scenarios. The dialog warns about data loss and offers "Switch & Reset" or "Cancel."
- **Options considered:**
  1. Persist portfolio across scenarios (separate portfolio per scenario).
  2. Add a confirmation dialog before resetting.
  3. Keep the current silent reset behavior.
- **Rationale:** Option 1 would require significant refactoring of `TradingContext` and localStorage schema for per-scenario portfolios. Option 2 is the minimal change that prevents user frustration. Option 3 is unacceptable UX — users lose trades with no warning.
- **Trade-offs:** Per-scenario portfolios would be ideal but is out of scope for this repair pass. The dialog adds one click of friction to scenario switching but prevents accidental data loss.

### Decision 3: TimelineDebugger Visibility (H-7)

- **Decision:** Keep TimelineDebugger behind the dev-mode gate but add a simplified auto-play indicator for regular users when in Live or Super Bowl scenarios.
- **Options considered:**
  1. Show the full TimelineDebugger to all users.
  2. Keep it dev-only but add a simplified "simulation playing" indicator visible to all.
  3. Keep it dev-only with no changes.
- **Rationale:** The TimelineDebugger exposes raw simulation internals (tick numbers, history points) that would confuse non-developer users. A simplified indicator (e.g., a small "Simulation playing" badge with a play/pause toggle) gives users awareness of live progression without the debugging UI.
- **Trade-offs:** The full scrubbing/rewind functionality remains dev-only. Regular users get play awareness but not full control.

### Decision 4: Timeline Time Filter Approach (H-4)

- **Decision:** Make "Today" and "This Week" filters relative to the scenario's latest event timestamp rather than `new Date()`.
- **Options considered:**
  1. Remove the "Today" and "This Week" filters entirely.
  2. Make filters relative to the scenario's date range.
  3. Keep current behavior and add "(demo)" label.
- **Rationale:** Option 2 makes the filters functional and meaningful within demo scenarios. The latest timestamp in the scenario data serves as "now" for filtering purposes, making "Today" show events from that simulated day.
- **Trade-offs:** Filters will not align with the user's actual current date, but this is consistent with the demo nature of the app. A small "(demo time)" label clarifies this.

## 4. Implementation Plan

### Epic 1: CSS Module Class Fixes (C-1, C-2, M-2, M-3)

*Critical path — no dependencies. All subsequent epics may depend on correct CSS module usage.*

#### Bead 1: Fix Onboarding content wrapper CSS module class (C-1)

- **Type:** bug
- **Priority:** P0
- **Estimate:** 15
- **Dependencies:** none
- **Description:** The onboarding content wrapper div on line 146 of `Onboarding.tsx` uses a raw string `onboarding-content` instead of `styles['onboarding-content']`. The highlight class `highlight-${currentStep.highlight}` is also raw. Fix both to use CSS module references so that padding, text-align, and highlight styles apply correctly. Audit issue: C-1.
- **Acceptance Criteria:**
  1. Content wrapper div uses `styles['onboarding-content']` instead of raw `onboarding-content`
  2. Highlight classes use `styles[`highlight-${currentStep.highlight}`]` (or the highlight classes are defined in the module and referenced via `styles`)
  3. Onboarding content area displays with `padding: 20px 40px 40px` and `text-align: center`
  4. Existing tests pass
- **Design Notes:** Modify `src/components/Onboarding/Onboarding.tsx` line 146. Change `className={\`onboarding-content ${...}\`}` to `className={\`${styles['onboarding-content']} ${currentStep.highlight ? styles[\`highlight-${currentStep.highlight}\`] || '' : ''}\`}`. If highlight classes (`highlight-virtual`, `highlight-colors`, `highlight-cta`) don't exist in `Onboarding.module.css`, either add them or remove the conditional class (they appear unused in the current CSS). Verify the fix by checking that the `onboarding-content` padding and text-align are applied.

#### Bead 2: Fix Layout nav link CSS module classes (C-2)

- **Type:** bug
- **Priority:** P0
- **Estimate:** 15
- **Dependencies:** none
- **Description:** All six `NavLink` components in `Layout.tsx` use raw `nav-link` and `active` strings. Since the component uses CSS Modules, these must be changed to `styles['nav-link']` and `styles['active']` respectively. This is Critical because navigation is completely unstyled. Audit issue: C-2.
- **Acceptance Criteria:**
  1. All six `NavLink` components use `styles['nav-link']` for the base class
  2. Active state uses `styles['active']` via the `isActive` callback
  3. Navigation links display with correct padding, font-weight, and active state highlighting
  4. Existing tests pass
- **Design Notes:** Modify `src/components/Layout/Layout.tsx` lines 78, 89, 99, 109, 119, 129. Change `className={({ isActive }) => \`nav-link ${isActive ? 'active' : ''}\`}` to `className={({ isActive }) => \`${styles['nav-link']} ${isActive ? styles['active'] : ''}\`}`. The CSS module already defines `.nav-link` (padding, font-weight, color, border-radius, transition) and `.nav-link.active` (primary color background, white text).

#### Bead 3: Fix PlayerDetail content tile type badge CSS module classes (M-2)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 15
- **Dependencies:** none
- **Description:** Content tile type badges in `PlayerDetail.tsx` line 483 use `${tile.type}` as a raw class name alongside the module-referenced `styles['tile-type']`. The CSS module defines `.tile-type.article`, `.tile-type.video`, etc. with color-coded backgrounds. Fix to use CSS module references for the type classes. Audit issue: M-2.
- **Acceptance Criteria:**
  1. Content tile type badges use `styles[tile.type]` or equivalent CSS module reference
  2. Different content types (article, video, analysis, news) show distinct color-coded backgrounds
  3. Existing tests pass
- **Design Notes:** Modify `src/pages/PlayerDetail/PlayerDetail.tsx` line 483. Change `className={\`${styles['tile-type']} ${tile.type}\`}` to `className={\`${styles['tile-type']} ${styles[tile.type] || ''}\`}`. Verify that `PlayerDetail.module.css` defines classes for each tile type (`.article`, `.video`, `.analysis`, `.news`). If the CSS uses compound selectors like `.tile-type.article`, the module may need individual classes or the compound selector approach may work — test both.

#### Bead 4: Fix DailyMission result-chip status CSS module classes (M-3)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 15
- **Dependencies:** none
- **Description:** Result chips in `DailyMission.tsx` (lines 111 and 135) append `${status}` as a raw class where `status` is `'correct'` or `'incorrect'`. Fix to use `styles[status]` for proper CSS module references. Audit issue: M-3.
- **Acceptance Criteria:**
  1. Result chips use `styles[status]` or `styles['correct']`/`styles['incorrect']` instead of raw strings
  2. Correct predictions display with green styling, incorrect with red
  3. Existing tests pass
- **Design Notes:** Modify `src/components/DailyMission/DailyMission.tsx` lines 111 and 135. Change `className={\`${styles['result-chip']} ${status}\`}` to `className={\`${styles['result-chip']} ${status ? styles[status] : ''}\`}`. Verify that `DailyMission.module.css` defines `.correct` and `.incorrect` classes with appropriate green/red backgrounds.

---

### Epic 2: Layout & Header Repair (M-4, M-10, M-11)

*Depends on Epic 1 (CSS module fixes must be in place for layout classes to work correctly).*

#### Bead 5: Fix Market sidebar sticky positioning to account for header (M-4)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 10
- **Dependencies:** none
- **Description:** The market sidebar has `top: 16px` for its sticky positioning, but the sticky header is 64px tall. On scroll, the sidebar slides under the header. Update the `top` value to account for the header height. Audit issue: M-4.
- **Acceptance Criteria:**
  1. Market sidebar sticks below the header on scroll, not behind it
  2. Sidebar top value uses `calc(var(--header-height) + 16px)` or equivalent
  3. Sidebar remains correctly positioned across different viewport sizes
- **Design Notes:** Modify `src/pages/Market/Market.module.css` line 134. Change `top: 16px;` to `top: calc(var(--header-height) + 16px);`. The `--header-height` CSS variable is defined globally. Also account for the nav bar height if it's also sticky — check `Layout.module.css` to see if the nav is sticky (it isn't — only the header is sticky).

#### Bead 6: Fix header Total Value clipping on scenarios with badges (M-10)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 20
- **Dependencies:** Bead 2 (nav link fix)
- **Description:** The header's "TOTAL VALUE" label and dollar amount are clipped at the right edge when scenario tabs include LIVE/ESPN badges. The `header-left` and `header-right` sections both have `flex: 1` while `header-center` has `flex: 2`. When center content expands, it squeezes the right section. Audit issue: M-10.
- **Acceptance Criteria:**
  1. "TOTAL VALUE" label and dollar amount are fully visible on all scenarios including ESPN Live and Live Game
  2. Header layout does not overflow on desktop viewports (>768px)
  3. Mobile responsive layout still works correctly
- **Design Notes:** Modify `src/components/Layout/Layout.module.css`. Options: (a) Change `header-right` to `flex: 0 0 auto; min-width: fit-content;` to prevent it from shrinking. (b) Add `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` to the balance value as a safety net. (c) Reduce `header-center` from `flex: 2` to `flex: 1 1 auto` with `min-width: 0; overflow: hidden;` so the center shrinks before the right. Approach (a) + (c) is recommended.

#### Bead 7: Reduce header/nav vertical footprint to show content above the fold (M-11)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 25
- **Dependencies:** Bead 6
- **Description:** The header (~64px) plus nav (~48px with padding) plus potential LiveTicker push all page content below the initial viewport. Users see what appears to be a blank dark page. Reduce the vertical space consumed by the header area so content is visible without scrolling. Audit issue: M-11.
- **Acceptance Criteria:**
  1. Main page content is visible in the initial viewport without scrolling on standard desktop viewports (1080p+)
  2. Header height is reduced or nav is made more compact
  3. All header elements (logo, scenario toggle, help button, balance) remain accessible
  4. Mobile layout still works
- **Design Notes:** Modify `src/components/Layout/Layout.module.css`. Options: (a) Reduce `--header-height` from 64px to ~52px and reduce nav padding from `12px 24px` to `8px 24px`. (b) Combine header and nav into a single row. (c) Make the nav scrollable horizontally with reduced height. Approach (a) is safest — reduce padding/heights by ~20% across header and nav. Also reduce `main-content` padding from `24px` to `16px 24px` to reclaim vertical space.

---

### Epic 3: Onboarding & First-Run (H-1, H-8)

*Depends on Epic 1 (Bead 1 — onboarding CSS must be fixed first).*

#### Bead 8: Sync Onboarding completion with OnboardingProvider state (H-1)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 20
- **Dependencies:** Bead 1
- **Description:** When onboarding completes, the `OnboardingProvider`'s state doesn't update because `Onboarding.tsx` writes to localStorage directly instead of calling the provider's `markOnboardingComplete`. The `FirstTradeGuide` won't appear until page refresh. Fix `Onboarding.tsx` to call the provider's method. Audit issue: H-1.
- **Acceptance Criteria:**
  1. After completing onboarding, `hasCompletedOnboarding` in the provider updates to `true` without page refresh
  2. `FirstTradeGuide` appears on the Market page immediately after onboarding completion
  3. The `showFirstTradeGuide` state activates within the same session
  4. Existing onboarding tests pass
- **Design Notes:** Modify `src/components/Onboarding/Onboarding.tsx`. Import `useOnboarding` from `OnboardingProvider`. In `handleComplete`, call `markOnboardingComplete()` from the context instead of (or in addition to) writing localStorage directly. The provider's `markOnboardingComplete` already handles localStorage + state updates. Remove the redundant `localStorage.setItem` calls and `CustomEvent` dispatch from `handleComplete` if they become unnecessary, or keep them as a fallback for backwards compatibility. The `Onboarding` component is rendered inside the `OnboardingProvider` tree, so the context is available.

#### Bead 9: Change default scenario from ESPN Live to Midweek and add ESPN empty-state fallback (H-8)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 25
- **Dependencies:** none
- **Description:** ESPN Live as the default scenario shows an empty first impression with zero counters and no events. Change the default to Midweek so new users see populated data. Add an empty-state fallback for ESPN Live that shows a clear message when no data loads. The scenario default is set in `ScenarioContext`. Audit issue: H-8.
- **Acceptance Criteria:**
  1. App loads with Midweek scenario selected by default
  2. When ESPN Live is selected and has no data, a clear empty state message appears (not just "No events match your filters")
  3. The ESPN refresh button shows loading state and, on failure, displays an error message
  4. User can still manually select ESPN Live from the scenario toggle
- **Design Notes:** Modify `src/context/ScenarioContext.tsx` — change the default scenario initial state from `'espn-live'` to `'midweek'`. Add an empty-state component or message in `src/pages/Timeline/Timeline.tsx` that detects when the current scenario is `espn-live` and there are zero events, showing a message like "ESPN Live data is loading... Click refresh to fetch the latest news." Check `src/context/SimulationContext.tsx` for where `espnError` is set and ensure it propagates to the UI.

---

### Epic 4: Trading UX (H-2, H-3, H-5)

*Independent — no cross-epic dependencies.*

#### Bead 10: Add confirmation dialog before portfolio reset on scenario switch (H-2)

- **Type:** task
- **Priority:** P1
- **Estimate:** 30
- **Dependencies:** none
- **Description:** When users switch scenarios, their portfolio is silently reset (TradingContext lines 64–71). Add a confirmation dialog warning about data loss. The dialog should appear only when the user has a non-empty portfolio. Audit issue: H-2.
- **Acceptance Criteria:**
  1. Switching scenarios when portfolio is non-empty shows a confirmation dialog
  2. Dialog warns "Switching scenarios will reset your portfolio and cash to defaults"
  3. Dialog has "Switch & Reset" and "Cancel" buttons
  4. Clicking "Cancel" keeps the current scenario and portfolio intact
  5. Clicking "Switch & Reset" proceeds with the scenario change and portfolio reset
  6. Switching scenarios when portfolio is empty does not show the dialog
- **Design Notes:** This requires coordination between `ScenarioContext` and `TradingContext`. Option A: Add a `confirmScenarioSwitch` callback to `ScenarioContext` that checks with `TradingContext` before switching. Option B: Add a `beforeScenarioChange` hook. The simplest approach: modify `src/components/ScenarioToggle/ScenarioToggle.tsx` to check if portfolio is non-empty (via `useTrading`) before calling `setScenario`. If non-empty, show a simple `window.confirm()` dialog or a styled modal. For MVP, `window.confirm()` is acceptable; a styled modal can follow in a polish pass. Modify the `onClick` handler and `handleMobileSelect` function.

#### Bead 11: Add tooltip explanation to disabled Sell tab (H-3)

- **Type:** task
- **Priority:** P1
- **Estimate:** 15
- **Dependencies:** none
- **Description:** The Sell tab on PlayerDetail is disabled when `!holding` but has no explanation. Add a tooltip that says "You need to own shares to sell" when the user hovers over the disabled tab. Audit issue: H-3.
- **Acceptance Criteria:**
  1. Hovering over the disabled Sell tab shows a tooltip "You need to own shares to sell"
  2. The tooltip uses the existing `Tooltip` component from `Onboarding.tsx` or a similar approach
  3. The tooltip disappears when the mouse leaves the tab
  4. When the Sell tab is enabled (user holds shares), no tooltip appears
- **Design Notes:** Modify `src/pages/PlayerDetail/PlayerDetail.tsx` around line 681–692. Wrap the disabled Sell button in a tooltip container. The project already has a `Tooltip` component exported from `Onboarding.tsx` — reuse it or add a `title` attribute to the button. The simplest fix is adding `title="You need to own shares to sell"` to the disabled button element. A styled tooltip is better UX but more complex.

#### Bead 12: Fix PlayerCard moveReason truncation to respect word boundaries (H-5)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 15
- **Dependencies:** none
- **Description:** `PlayerCard.tsx` line 140 uses `substring(0, 60)` which cuts mid-word, and unconditionally appends `...`. Fix to truncate at word boundaries and only add ellipsis when actually truncated. Audit issue: H-5.
- **Acceptance Criteria:**
  1. `moveReason` truncation respects word boundaries (doesn't cut mid-word)
  2. Ellipsis `...` is only appended when the text was actually truncated (length > limit)
  3. Short move reasons display without trailing `...`
- **Design Notes:** Modify `src/components/PlayerCard/PlayerCard.tsx` line 140. Replace `player.moveReason.substring(0, 60)}...` with a helper: `{truncateAtWord(player.moveReason, 60)}`. Implement `truncateAtWord` as: find the last space before position 60, slice there, append `...`. If the full string is ≤60 chars, return it unchanged. This can be an inline function or extracted to `src/utils/`.

---

### Epic 5: Timeline & Scenario (H-4, H-7, M-9, L-4, L-7, L-8)

*Independent — no cross-epic dependencies.*

#### Bead 13: Fix Timeline time filters to use scenario-relative dates (H-4)

- **Type:** bug
- **Priority:** P1
- **Estimate:** 20
- **Dependencies:** none
- **Description:** The "Today" and "This Week" time filters compare against `new Date()`, but scenario data uses hardcoded timestamps from the past. Change the filters to be relative to the latest event timestamp in the current scenario data. Audit issue: H-4.
- **Acceptance Criteria:**
  1. "Today" filter shows events from the same day as the scenario's latest event timestamp
  2. "This Week" filter shows events from the 7 days leading up to the scenario's latest timestamp
  3. "All Time" filter continues to show all events
  4. Filters work correctly across all demo scenarios
- **Design Notes:** Modify `src/pages/Timeline/Timeline.tsx` lines 159–169. Instead of `const now = new Date()`, compute `const scenarioNow = new Date(allEvents[0]?.timestamp || Date.now())` (since events are sorted newest-first, `allEvents[0]` is the latest). Use `scenarioNow` for "Today" and "This Week" comparisons. The filter section is in the `filteredEvents` useMemo.

#### Bead 14: Add simplified live simulation indicator for non-dev users (H-7)

- **Type:** task
- **Priority:** P2
- **Estimate:** 25
- **Dependencies:** none
- **Description:** The `TimelineDebugger` is hidden behind `isDevMode()`. Add a simplified indicator visible to all users in Live and Super Bowl scenarios showing that a simulation is running. This could be a small badge or bar showing "Simulation playing" with a play/pause toggle. Audit issue: H-7.
- **Acceptance Criteria:**
  1. In Live or Super Bowl scenarios, a visible indicator shows the simulation is active
  2. The indicator includes a play/pause toggle
  3. The full TimelineDebugger with scrubbing/rewind remains dev-only
  4. The indicator does not appear in non-live scenarios (Midweek, Playoffs when not live)
- **Design Notes:** Modify `src/components/TimelineDebugger/TimelineDebugger.tsx`. Add a second rendering path: when `!isDevMode()` and scenario is `live` or `superbowl`, return a minimal `<div>` with a play/pause button and "Live simulation" label. Use the existing `isPlaying` / `setIsPlaying` from `useSimulation()`. Style with the existing `TimelineDebugger.module.css` — add new classes for the simplified view (e.g., `.simple-indicator`).

#### Bead 15: Add loading state to ScenarioToggle during scenario switches (M-9)

- **Type:** task
- **Priority:** P2
- **Estimate:** 15
- **Dependencies:** none
- **Description:** When switching scenarios, the tab highlights instantly but data may still be loading (`scenarioLoading` is `true`). Add a brief visual loading indicator to the active tab. Audit issue: M-9.
- **Acceptance Criteria:**
  1. During scenario loading, the active tab shows a subtle loading indicator (e.g., pulsing opacity or a small spinner)
  2. The loading state clears when data has finished loading
  3. Quick switches between scenarios don't cause visual glitches
- **Design Notes:** Modify `src/components/ScenarioToggle/ScenarioToggle.tsx`. Import `scenarioLoading` from `useScenario()`. Add a conditional class to the active tab: `${scenarioLoading ? styles['loading'] : ''}`. Add the `.loading` class to `ScenarioToggle.module.css` with a subtle pulse animation. Check `ScenarioContext` to confirm `scenarioLoading` is exposed.

#### Bead 16: Replace hardcoded LiveTicker fallback text (L-4)

- **Type:** bug
- **Priority:** P2
- **Estimate:** 10
- **Dependencies:** none
- **Description:** The LiveTicker fallback text is hardcoded to "MNF: Chiefs vs Bills - Live updates as they happen." Replace with a generic or data-driven fallback. Audit issue: L-4.
- **Acceptance Criteria:**
  1. Fallback text does not reference specific team names
  2. Fallback reads something like "Live updates as they happen" or derives from scenario metadata
- **Design Notes:** Modify `src/components/LiveTicker/LiveTicker.tsx` line 62. Change `"MNF: Chiefs vs Bills - Live updates as they happen"` to a generic string like `"Live game updates as they happen"`. Optionally pull the matchup description from `currentData` via `useScenario()` if available.

#### Bead 17: Map raw event type strings to display labels in Timeline (L-7)

- **Type:** bug
- **Priority:** P2
- **Estimate:** 15
- **Dependencies:** none
- **Description:** Timeline event badges display raw strings like `league_trade` instead of human-readable labels like "Trade". The `getEventTypeLabel` function returns `reason?.type` which includes underscores and internal naming. Audit issue: L-7.
- **Acceptance Criteria:**
  1. `league_trade` displays as "Trade" in timeline event badges
  2. `game_event` displays as the specific event type (TD, INT, Stats) or "Game Update"
  3. `news` displays as "News"
  4. All displayed labels match the type filter dropdown labels for consistency
- **Design Notes:** Modify `src/pages/Timeline/Timeline.tsx` function `getEventTypeLabel` (line 67–69). Add a mapping: `const TYPE_DISPLAY_LABELS: Record<string, string> = { league_trade: 'Trade', game_event: 'Game Update', news: 'News' }; return reason?.eventType?.toUpperCase() || TYPE_DISPLAY_LABELS[reason?.type || ''] || 'Event';`. This ensures `league_trade` maps to "Trade" and is consistent with `TYPE_FILTERS` labels.

#### Bead 18: Filter out future-dated events relative to scenario date (L-8)

- **Type:** bug
- **Priority:** P3
- **Estimate:** 15
- **Dependencies:** Bead 13
- **Description:** In Midweek scenario (labeled "Wed, Dec 4"), some price change entries are dated Dec 6, which breaks demo immersion. Add filtering or labeling for events that fall after the scenario's narrative date. Audit issue: L-8.
- **Acceptance Criteria:**
  1. Price changes in PlayerDetail timeline do not show events dated after the scenario's current narrative date
  2. Or, events are visually marked as "upcoming" if they fall after the scenario date
- **Design Notes:** This is a data-level issue — the scenario data in `src/data/midweek.json` may contain entries with future timestamps. Since we cannot modify scenario data per AGENT.md rules, the fix should be in the display layer. Modify `src/pages/PlayerDetail/PlayerDetail.tsx` in the price timeline section: filter `chartData` to exclude entries where `timestamp > scenarioDate`. The scenario date can be derived from the latest non-future event timestamp or from scenario metadata. This bead depends on Bead 13 establishing the "scenario now" pattern.

---

### Epic 6: Mission & Leaderboard (H-6, M-6, L-6)

*Independent — no cross-epic dependencies.*

#### Bead 19: Add search/filter and expand player selector in DailyMission (H-6)

- **Type:** task
- **Priority:** P1
- **Estimate:** 30
- **Dependencies:** none
- **Description:** The mission player selector only shows 12 players (`players.slice(0, 12)`). Add a search input to filter players by name/team, and show all matching players in a scrollable container. Audit issue: H-6.
- **Acceptance Criteria:**
  1. All available players are accessible in the selector (not limited to 12)
  2. A search/filter input allows typing to filter players by name or team
  3. Player list is scrollable when showing many results
  4. Existing pick functionality (riser/faller buttons) continues to work
- **Design Notes:** Modify `src/components/DailyMission/DailyMission.tsx`. Add a `searchQuery` state. Replace `players.slice(0, 12)` (line 245) with `players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.team.toLowerCase().includes(searchQuery.toLowerCase()))`. Add a search input above the selector chips. Add `max-height: 300px; overflow-y: auto;` to the `.selector-chips` class in `DailyMission.module.css`. Keep the initial view showing the first 12 players if no search query, but allow scrolling/searching to access all.

#### Bead 20: Fix Leaderboard trader column alignment (M-6)

- **Type:** bug
- **Priority:** P2
- **Estimate:** 10
- **Dependencies:** none
- **Description:** The trader column uses inline `span` elements for avatar and name without explicit flex alignment. Fix by adding flex layout to the column span. Audit issue: M-6.
- **Acceptance Criteria:**
  1. Avatar emoji and trader name are vertically centered and consistently aligned
  2. Alignment is consistent across different browsers
- **Design Notes:** Modify `src/pages/Leaderboard/Leaderboard.module.css`. Add to `.col-trader`: `display: flex; align-items: center; gap: 8px;`. This ensures the avatar `span` and name `span` are properly aligned. Verify that the `.trader-avatar` class doesn't already have conflicting styles.

#### Bead 21: Rename "Weekly Gain" column header to "Gain" (L-6)

- **Type:** bug
- **Priority:** P3
- **Estimate:** 5
- **Dependencies:** none
- **Description:** The leaderboard "Weekly Gain" column header implies time-based tracking that doesn't exist in this demo app. Rename to "Gain" or "Session Gain" to accurately describe the data. Audit issue: L-6.
- **Acceptance Criteria:**
  1. Column header reads "Gain" instead of "Weekly Gain"
  2. No other functional changes
- **Design Notes:** Modify `src/pages/Leaderboard/Leaderboard.tsx` line 70. Change `Weekly Gain` to `Gain`.

---

### Epic 7: Accessibility (M-1, M-7, M-8)

*Should be done after functional fixes (Epics 1–6) to avoid rework.*

#### Bead 22: Add accessible alternative to PlayerCard sparkline chart (M-1)

- **Type:** task
- **Priority:** P1
- **Estimate:** 15
- **Dependencies:** none
- **Description:** The Recharts sparkline in PlayerCard renders as SVG with no accessible description. Screen reader users get no information about the price trend. Add an `aria-label` describing the trend direction and magnitude. Audit issue: M-1.
- **Acceptance Criteria:**
  1. The sparkline chart container has an `aria-label` attribute describing the trend (e.g., "7-day price trend: up 5.2%")
  2. The chart has `role="img"` to indicate it's a non-interactive image
  3. Screen readers convey the price trend information
- **Design Notes:** Modify `src/components/PlayerCard/PlayerCard.tsx`. Wrap the `<ResponsiveContainer>` in a `<div>` with `role="img"` and `aria-label={\`7-day price trend: ${isUp ? 'up' : 'down'} ${Math.abs(player.changePercent).toFixed(1)}%\`}`. The sparkline data is already available — use `player.changePercent` for the label content.

#### Bead 23: Add keyboard dismissal and ARIA improvements to Toast (M-7)

- **Type:** task
- **Priority:** P1
- **Estimate:** 20
- **Dependencies:** none
- **Description:** Toast notifications cannot be dismissed via keyboard. The container already has `role="status"` and `aria-live="polite"`, but individual toasts lack focus management and keyboard support. Add Escape key handling and ensure the close button is reachable via Tab. Audit issue: M-7.
- **Acceptance Criteria:**
  1. Pressing Escape dismisses the most recent toast
  2. Individual toast close buttons are focusable via Tab
  3. The `role="status"` and `aria-live="polite"` on the container are preserved
  4. Toasts continue to auto-dismiss after the timeout
- **Design Notes:** Modify `src/components/Toast/Toast.tsx`. Add an `onKeyDown` handler to the toast container that listens for Escape and calls `removeToast` on the last toast. Ensure the close button has `tabIndex={0}` (it should be inherently focusable as a `<button>`). The close button already has `aria-label="Dismiss notification"` which is good. The main fix is adding the Escape key handler at the container level.

#### Bead 24: Increase Watchlist remove button touch target (M-8)

- **Type:** task
- **Priority:** P2
- **Estimate:** 10
- **Dependencies:** none
- **Description:** The remove button on watchlist cards is a small positioned icon. Increase its touch target to meet WCAG's 44x44px minimum for touch devices. Audit issue: M-8.
- **Acceptance Criteria:**
  1. Remove button has a minimum tap area of 44x44px
  2. Visual appearance can remain compact (the hit area can extend via padding)
  3. Button remains correctly positioned on the card
- **Design Notes:** Modify `src/pages/Watchlist/Watchlist.module.css`. Add to the `.remove-button` class: `min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center;`. The SVG icon inside can stay at its current size while the button's tap target grows. If the button is absolutely positioned, ensure the larger size doesn't cause layout issues.

---

### Epic 8: Minor Polish (M-5, L-1, L-2, L-3, L-5, L-9)

*Last priority — cosmetic improvements and edge cases.*

#### Bead 25: Fix PlayerDetail chart tooltip truncation and add date context (M-5)

- **Type:** bug
- **Priority:** P2
- **Estimate:** 15
- **Dependencies:** none
- **Description:** The price chart tooltip always truncates headlines to 40 characters with `...` appended unconditionally. Also, the tooltip label (date) is hidden. Fix truncation to be conditional and show the date. Audit issue: M-5.
- **Acceptance Criteria:**
  1. Tooltip shows the full headline when it's ≤40 characters (no trailing `...`)
  2. Tooltip truncates at word boundaries when headline is >40 characters
  3. Tooltip shows the date/time of the hovered price point
- **Design Notes:** Modify `src/pages/PlayerDetail/PlayerDetail.tsx` lines 369–379. For the formatter: `const headline = entry.reason?.headline || 'Price'; const display = headline.length > 40 ? headline.substring(0, headline.lastIndexOf(' ', 40)) + '...' : headline;`. Remove `labelStyle={{ display: 'none' }}` and instead format the label to show the date from `entry.timestamp`.

#### Bead 26: Add viewport boundary checking to EventMarkerPopup (L-1)

- **Type:** bug
- **Priority:** P3
- **Estimate:** 15
- **Dependencies:** none
- **Description:** The `EventMarkerPopup` position is set as `{ x: cx, y: cy + 20 }` with no boundary checking. Near the right or bottom edge, the popup may overflow the viewport. Audit issue: L-1.
- **Acceptance Criteria:**
  1. Popup repositions to stay within the chart container bounds
  2. If near the right edge, popup shifts left
  3. If near the bottom edge, popup shifts above the marker
- **Design Notes:** Modify `src/pages/PlayerDetail/PlayerDetail.tsx` in `handleEventClick` (line 162). After computing `{ x: cx, y: cy + 20 }`, check against the chart container bounds (available via `chartContainerRef`). Adjust position: if `cx + popupWidth > containerWidth`, shift left; if `cy + 20 + popupHeight > containerHeight`, place above (`cy - popupHeight - 10`). Estimate popup dimensions (e.g., 250x150px) or measure via a ref after rendering.

#### Bead 27: Make Portfolio responsive column hiding class-based instead of nth-child (L-2)

- **Type:** chore
- **Priority:** P3
- **Estimate:** 20
- **Dependencies:** none
- **Description:** Portfolio page uses `nth-child` selectors for responsive column hiding, which is fragile. Switch to class-based hiding for better maintainability. Audit issue: L-2.
- **Acceptance Criteria:**
  1. Responsive column hiding uses class names (e.g., `.col-avg-cost`, `.col-value`, `.col-shares`) instead of `nth-child`
  2. At 900px breakpoint, "Avg Cost" and "Value" columns are hidden
  3. At 600px breakpoint, "Shares" column is additionally hidden
  4. Header and row columns remain aligned at all breakpoints
- **Design Notes:** Modify `src/pages/Portfolio/Portfolio.tsx` to add class names to each column `span` in both the header and rows. Modify `src/pages/Portfolio/Portfolio.module.css` to replace `nth-child` selectors with class-based media queries (e.g., `@media (max-width: 900px) { .col-avg-cost, .col-value { display: none; } }`).

#### Bead 28: Standardize search input type across pages (L-3)

- **Type:** chore
- **Priority:** P3
- **Estimate:** 5
- **Dependencies:** none
- **Description:** Market uses `type="search"` while Timeline uses `type="text"` for search inputs. Standardize to `type="search"` for consistent browser behavior (native clear button). Audit issue: L-3.
- **Acceptance Criteria:**
  1. Both Market and Timeline search inputs use `type="search"`
  2. Search functionality is unchanged
- **Design Notes:** Modify `src/pages/Timeline/Timeline.tsx` line 299. Change `type="text"` to `type="search"`.

#### Bead 29: Replace mock buyback holdings with actual portfolio data (L-5)

- **Type:** bug
- **Priority:** P3
- **Estimate:** 20
- **Dependencies:** none
- **Description:** `PlayoffAnnouncementModal` uses `MOCK_BUYBACK_HOLDINGS` instead of the user's actual portfolio from `TradingContext`. Replace with real portfolio data. Audit issue: L-5.
- **Acceptance Criteria:**
  1. Buyback modal shows the user's actual holdings for eliminated-team players
  2. Buyback proceeds are calculated from actual shares and prices, not mock data
  3. If the user has no eliminated-team holdings, the buyback section shows "No holdings to buy back"
- **Design Notes:** Modify `src/components/PlayoffAnnouncementModal/PlayoffAnnouncementModal.tsx`. Import `useTrading` and `portfolio` from `TradingContext`. Replace references to `MOCK_BUYBACK_HOLDINGS` with `portfolio`. Filter to only show holdings for players in the `buybackPlayers` array. Remove the `MOCK_BUYBACK_HOLDINGS` constant.

#### Bead 30: Replace welcome banner debug-style border with subtle styling (L-9)

- **Type:** bug
- **Priority:** P3
- **Estimate:** 5
- **Dependencies:** none
- **Description:** The welcome banner on the Market page has `border: 1px solid var(--color-primary)` which renders as a prominent red border. Replace with a subtle border matching the app's design system. **Note:** The audit reported "dashed red border" but the actual CSS uses `solid` — the issue is that the red primary color makes it look like a debug artifact regardless of border style. Audit issue: L-9.
- **Acceptance Criteria:**
  1. Welcome banner border uses `var(--color-border)` or a similarly subtle color
  2. The banner blends with the app's design system (no debug-style appearance)
- **Design Notes:** Modify `src/pages/Market/Market.module.css` line 163. Change `border: 1px solid var(--color-primary);` to `border: 1px solid var(--color-border);`. Optionally add a left-border accent: `border-left: 3px solid var(--color-primary);` for visual interest without the full-border debug look.

---

## 5. Risk Assessment

### High Regression Risk

- **CSS Module Fixes (Beads 1–4):** These touch fundamental styling across onboarding, navigation, player detail, and daily mission. A typo in a `styles[...]` reference will cause a class to resolve to `undefined`, potentially breaking layouts. Risk mitigation: each bead should verify the rendered HTML has the correct hashed class names.
- **TradingContext Portfolio Reset (Bead 10):** The confirmation dialog adds logic to the scenario switch flow. If the dialog blocks async scenario loading or introduces race conditions with the `scenarioVersion` effect, portfolio state could become inconsistent. The `useEffect` on `scenarioVersion` (TradingContext lines 64–71) runs unconditionally — the dialog must prevent `setScenario` from being called until confirmed, not try to intercept the effect.
- **Onboarding Provider Sync (Bead 8):** Changing how onboarding completion is signaled touches the provider/consumer relationship. The `Onboarding` component must be verified to render inside the `OnboardingProvider` tree (it is — both are in the App component tree).

### Cross-Cutting Concerns

- **CSS Module Pattern:** Beads 1–4 all fix the same bug pattern (raw class strings in CSS Module components). A utility function or ESLint rule to catch this pattern going forward would prevent regression.
- **Header Layout (Beads 6–7):** Changes to header flex ratios and heights affect every page. These beads should be tested on all 6 nav pages and across all 5 scenarios.
- **Scenario-Relative Time (Beads 13, 18):** Both introduce the concept of "scenario now" as the latest event timestamp. This pattern should be consistent and potentially extracted to a shared utility.

### Beads Requiring Human Review

- **Bead 9 (ESPN Live default change):** Product decision — changing the default scenario changes the first impression. Confirm with stakeholders that Midweek is the preferred default.
- **Bead 14 (Simplified live indicator):** UX design decision — the visual treatment of the simplified indicator should match the app's aesthetic. A design review of the proposed UI would be beneficial.
- **Bead 10 (Confirmation dialog):** UX decision — `window.confirm()` vs. styled modal. The MVP approach (`window.confirm`) is functional but visually inconsistent with the app.

## 6. Out of Scope

- **Console error findings from the audit:** Items like React key warnings, TypeScript `@typescript-eslint/no-explicit-any` suppressions, and potential undefined access patterns are code quality issues, not UI bugs. These should be addressed in a separate technical debt spec.
- **Performance observations:** The audit found no significant performance issues (lazy loading, skeleton states, and memoization are in place). No performance beads are needed.
- **ESPN API proxy reliability:** The root cause of H-8 (empty ESPN Live) is likely the Vite proxy failing to reach `site.api.espn.com`. Fixing the proxy is a backend/infra concern outside this UI repair scope. The spec addresses the UI symptoms (empty state, missing feedback) but not the underlying API issue.
- **React StrictMode:** The audit noted the app doesn't use `<StrictMode>`. Adding it may surface additional issues but is a separate concern.
- **Per-scenario portfolio persistence:** The ideal fix for H-2 would be separate portfolios per scenario. This requires significant refactoring of `TradingContext` and localStorage schema — deferred to a future feature spec.
