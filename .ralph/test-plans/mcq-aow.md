# Test Plan: mcq-aow -- Spec: UI Audit Repair Specification

## Summary

- **Bead:** `mcq-aow`
- **Feature:** Generate a structured specification and bead-creation script from the UI audit research, grouping 30 findings into ~8 dependency-ordered epics
- **Total Test Cases:** 28
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: Spec file exists at expected path

**Priority:** P0
**Type:** Functional

### Objective

Verify the primary deliverable file is created at the path dictated by the design notes.

### Preconditions

- Bead `mcq-aow` has been executed to completion

### Steps

1. Check for file at `.ralph/specs/ui-repair.md`
   **Expected:** File exists and is non-empty

2. Verify the file is valid UTF-8 markdown
   **Expected:** File parses without encoding errors

### Test Data

- Expected path: `.ralph/specs/ui-repair.md`

### Edge Cases

- Directory `.ralph/specs/` did not exist prior to execution — agent must have created it with `mkdir -p`

---

## TC-002: Bead creation script exists at expected path

**Priority:** P0
**Type:** Functional

### Objective

Verify the bead creation script deliverable is created at the correct path.

### Preconditions

- Bead `mcq-aow` has been executed to completion

### Steps

1. Check for file at `.ralph/specs/ui-repair-beads.sh`
   **Expected:** File exists and is non-empty

2. Verify the file starts with `#!/usr/bin/env bash`
   **Expected:** First line is the correct shebang

3. Verify the file contains `set -euo pipefail` near the top
   **Expected:** Strict error handling is enabled

### Test Data

- Expected path: `.ralph/specs/ui-repair-beads.sh`

### Edge Cases

- File should be executable or at least syntactically valid when run with `bash`

---

## TC-003: Spec document follows template structure — all 6 required sections present

**Priority:** P0
**Type:** Functional

### Objective

The spec template (`.ralph/SPEC_PROMPT.md`) mandates exactly 6 top-level sections. Verify all are present.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Search for `## 1. Executive Summary` heading
   **Expected:** Section exists with content beneath it

2. Search for `## 2. Current State` heading
   **Expected:** Section exists with content beneath it

3. Search for `## 3. Design Decisions` heading
   **Expected:** Section exists with content beneath it

4. Search for `## 4. Implementation Plan` heading
   **Expected:** Section exists with content beneath it

5. Search for `## 5. Risk Assessment` heading
   **Expected:** Section exists with content beneath it

6. Search for `## 6. Out of Scope` heading
   **Expected:** Section exists with content beneath it

### Test Data

- Template reference: `.ralph/SPEC_PROMPT.md`

### Edge Cases

- Sections must appear in the numbered order (1 through 6), not rearranged

---

## TC-004: Executive Summary accurately reflects audit totals

**Priority:** P1
**Type:** Functional

### Objective

The Executive Summary must correctly summarize the audit's severity counts and total issue count.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Read the Executive Summary section
   **Expected:** States 30 total issues found

2. Check severity breakdown is mentioned
   **Expected:** References 2 Critical, 8 High, 11 Medium, 9 Low (matching audit report)

3. Verify it mentions the recommended approach in 2-3 sentences
   **Expected:** A concise strategy summary is present (not just a repeat of the audit)

### Test Data

- Source counts from `.ralph/research/ui-audit.md`: Critical=2, High=8, Medium=11, Low=9, Total=30

### Edge Cases

- Summary should not inflate or deflate issue counts (e.g., counting sub-items as separate issues)

---

## TC-005: Current State section references actual source files for each affected area

**Priority:** P1
**Type:** Functional

### Objective

The spec template requires the Current State section to list file paths, what the code currently does, and what's wrong. Verify concrete file references are present.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Scan Section 2 for file path references
   **Expected:** Contains paths like `src/components/Onboarding/Onboarding.tsx`, `src/components/Layout/Layout.tsx`, `src/pages/PlayerDetail/PlayerDetail.tsx`, etc.

2. Verify each file path reference includes a description of current behavior
   **Expected:** Each file path is accompanied by text describing what the code does now and what's wrong

3. Cross-reference against the key source files listed in the bead's design notes
   **Expected:** At minimum, all 15 key source files from the design notes are referenced somewhere in the spec

### Test Data

- Key source files from design notes: `Onboarding.tsx`, `Layout.tsx`, `PlayerDetail.tsx`, `Market.tsx`, `DailyMission.tsx`, `TradingContext.tsx`, `OnboardingProvider.tsx`, `Timeline.tsx`, `ScenarioToggle/`, `TimelineDebugger/`, `Toast/`, `Watchlist/`, `Leaderboard/`, `LiveTicker/`, `PlayerCard/`

### Edge Cases

- Paths should reference `.tsx` or `.module.css` files as appropriate (the codebase uses TypeScript + CSS Modules, not `.jsx` + `.css` as in AGENT.md defaults)

---

## TC-006: All 30 audit issues are accounted for in the Implementation Plan

**Priority:** P0
**Type:** Functional

### Objective

Every issue from the audit (C-1, C-2, H-1 through H-8, M-1 through M-11, L-1 through L-9) must map to at least one bead in the Implementation Plan.

### Preconditions

- `.ralph/specs/ui-repair.md` exists
- `.ralph/research/ui-audit.md` is the source of truth for issue IDs

### Steps

1. Collect all issue IDs referenced in Section 4 (Implementation Plan)
   **Expected:** The union of all bead descriptions/design notes covers all 30 IDs: C-1, C-2, H-1, H-2, H-3, H-4, H-5, H-6, H-7, H-8, M-1, M-2, M-3, M-4, M-5, M-6, M-7, M-8, M-9, M-10, M-11, L-1, L-2, L-3, L-4, L-5, L-6, L-7, L-8, L-9

2. Verify no issue ID appears without being assigned to a bead
   **Expected:** Zero orphaned issue IDs

### Test Data

- Full list of 30 issue IDs from the audit

### Edge Cases

- Multiple issues may be grouped into a single bead (per SPEC_PROMPT rule 8: "batch related fixes that affect the same component")
- No issue should be silently dropped — if deferred, it must appear in Section 6 (Out of Scope) with justification

---

## TC-007: Implementation Plan contains approximately 8 epics

**Priority:** P1
**Type:** Functional

### Objective

The design notes specify ~8 epics. Verify the spec groups work into roughly that number.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Count the number of `### Epic:` headings in Section 4
   **Expected:** Between 7 and 10 epics (approximately 8, with reasonable flexibility)

2. Verify epic titles roughly correspond to the suggested groupings
   **Expected:** Epics cover: CSS Module Fixes, Layout/Header Repair, Onboarding/First-Run, Trading UX, Timeline/Scenario, Mission/Leaderboard, Accessibility, Minor Polish (names may vary)

### Test Data

- Suggested epics from design notes (8 total)

### Edge Cases

- Agent may split or merge epics if justified; the count need not be exactly 8 but should be close
- Each epic must contain at least one bead

---

## TC-008: Epic ordering follows dependency chain — CSS Module Fixes first, Minor Polish last

**Priority:** P0
**Type:** Functional

### Objective

The design notes specify a dependency order. CSS Module Fixes (Critical path) must come first, and Minor Polish must come last.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Identify the first epic in Section 4
   **Expected:** First epic is CSS Module Fixes (or equivalent name covering C-1, C-2, M-2, M-3)

2. Identify the last epic in Section 4
   **Expected:** Last epic is Minor Polish (or equivalent name covering M-5, L-1, L-2, L-3, L-5, L-9)

3. Verify Layout/Header Repair comes after CSS Module Fixes
   **Expected:** Layout epic appears after CSS Module epic (it depends on Epic 1)

4. Verify Accessibility epic comes after functional fix epics
   **Expected:** Accessibility epic appears after CSS, Layout, Trading, and Timeline epics

### Test Data

- Suggested ordering: 1) CSS Module, 2) Layout/Header, 3) Onboarding, 4) Trading UX, 5) Timeline/Scenario, 6) Mission/Leaderboard, 7) Accessibility, 8) Minor Polish

### Edge Cases

- Epics 4, 5, 6 are marked "independent" in design notes — their relative order is flexible
- Epics 1-2-3 have strict dependency ordering

---

## TC-009: Each bead has all required fields per template

**Priority:** P0
**Type:** Functional

### Objective

The SPEC_PROMPT template mandates that every bead includes: Type, Priority, Estimate, Dependencies, Description, Acceptance Criteria, and Design Notes.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. For each bead in Section 4, verify `**Type:**` field exists with value `task`, `bug`, or `chore`
   **Expected:** Every bead has a Type field with a valid value

2. Verify `**Priority:**` field exists with value P0, P1, P2, or P3
   **Expected:** Every bead has a Priority field

3. Verify `**Estimate:**` field exists with a numeric value in minutes
   **Expected:** Every bead has an estimate

4. Verify `**Dependencies:**` field exists (may be "none")
   **Expected:** Every bead declares its dependencies

5. Verify `**Description:**` field exists with substantive content
   **Expected:** Every bead has a multi-sentence description

6. Verify `**Acceptance Criteria:**` field exists with at least one numbered criterion
   **Expected:** Every bead has at least one measurable AC

7. Verify `**Design Notes:**` field exists with file path references
   **Expected:** Every bead has design notes referencing specific source files to modify

### Test Data

- Template field requirements from `.ralph/SPEC_PROMPT.md`

### Edge Cases

- A bead with no dependencies should explicitly say "none" rather than omitting the field
- Estimate should be between 5 and 60 minutes per the "keep beads small" rule

---

## TC-010: Critical issues (C-1, C-2) are assigned P0 priority beads

**Priority:** P0
**Type:** Functional

### Objective

The two Critical severity issues from the audit must be mapped to P0 (blocks release) priority beads.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Find the bead(s) covering C-1 (Onboarding CSS module class not applied)
   **Expected:** Bead priority is P0

2. Find the bead(s) covering C-2 (Nav link classes use raw strings)
   **Expected:** Bead priority is P0

### Test Data

- C-1: Onboarding CSS module class not applied to content wrapper
- C-2: Nav link classes use raw strings instead of CSS module references

### Edge Cases

- If C-1 and C-2 are combined into one bead (same component pattern), that bead must still be P0

---

## TC-011: Issue-to-epic mapping matches design notes grouping

**Priority:** P1
**Type:** Functional

### Objective

Verify that the specific issue-to-epic assignments from the design notes are respected.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Verify Epic 1 (CSS Module Fixes) contains issues C-1, C-2, M-2, M-3
   **Expected:** All four issues appear in beads under this epic

2. Verify Epic 2 (Layout/Header Repair) contains issues M-4, M-10, M-11
   **Expected:** All three issues appear in beads under this epic

3. Verify Epic 3 (Onboarding/First-Run) contains issues H-1, H-8
   **Expected:** Both issues appear in beads under this epic

4. Verify Epic 4 (Trading UX) contains issues H-2, H-3, H-5
   **Expected:** All three issues appear in beads under this epic

5. Verify Epic 5 (Timeline/Scenario) contains issues H-4, H-7, M-9, L-4, L-7, L-8
   **Expected:** All six issues appear in beads under this epic

6. Verify Epic 6 (Mission/Leaderboard) contains issues H-6, M-6, L-6
   **Expected:** All three issues appear in beads under this epic

7. Verify Epic 7 (Accessibility) contains issues M-1, M-7, M-8
   **Expected:** All three issues appear in beads under this epic

8. Verify Epic 8 (Minor Polish) contains issues M-5, L-1, L-2, L-3, L-5, L-9
   **Expected:** All six issues appear in beads under this epic

### Test Data

- Full issue-to-epic mapping from design notes

### Edge Cases

- Agent may reassign an issue to a different epic if justified in Design Decisions section, but this should be explicitly called out

---

## TC-012: Bead creation script is syntactically valid bash

**Priority:** P0
**Type:** Functional

### Objective

The shell script must parse without syntax errors. A broken script cannot populate the tracker.

### Preconditions

- `.ralph/specs/ui-repair-beads.sh` exists

### Steps

1. Run `bash -n .ralph/specs/ui-repair-beads.sh` (syntax check only, no execution)
   **Expected:** Exit code 0, no syntax errors reported

### Test Data

- N/A

### Edge Cases

- Multi-line strings with single quotes, double quotes, newlines, and special characters (e.g., `$`, backticks) are common sources of syntax errors in heredocs and `$'...'` strings

---

## TC-013: Bead creation script creates epics before child beads

**Priority:** P0
**Type:** Functional

### Objective

The script must create epic-type beads first so their IDs can be referenced as `--parent` for child beads.

### Preconditions

- `.ralph/specs/ui-repair-beads.sh` exists

### Steps

1. Identify all `bd create` commands with `-t epic`
   **Expected:** There are approximately 8 epic creation commands

2. Verify each epic creation command captures its ID (e.g., `EPIC_ID=$(bd create ... --silent)`)
   **Expected:** Every epic create uses `--silent` and assigns to a variable

3. Verify each subsequent child bead creation references `--parent "$EPIC_VAR"`
   **Expected:** Every non-epic bead has a `--parent` flag referencing an epic variable

4. Verify no child bead `bd create` command appears before its parent epic's `bd create`
   **Expected:** Epic creation always precedes its children in script order

### Test Data

- N/A

### Edge Cases

- Variable names should be descriptive (e.g., `EPIC_CSS_ID`, not `E1`)

---

## TC-014: Bead creation script wires inter-bead dependencies with --deps

**Priority:** P1
**Type:** Functional

### Objective

Beads that depend on other beads (e.g., Layout epic depends on CSS Module epic) must use `--deps` to declare this.

### Preconditions

- `.ralph/specs/ui-repair-beads.sh` exists

### Steps

1. Find beads in Epic 2 (Layout/Header Repair)
   **Expected:** At least one bead in this epic has `--deps` referencing a bead from Epic 1

2. Find beads in Epic 3 (Onboarding/First-Run)
   **Expected:** At least one bead in this epic has `--deps` referencing a bead from Epic 1

3. Verify Epic 7 (Accessibility) beads depend on functional fix beads
   **Expected:** Accessibility beads have `--deps` referencing earlier beads as appropriate

4. Verify Epic 1 (CSS Module Fixes) beads have no cross-epic dependencies
   **Expected:** CSS Module beads either have `--deps` to sibling beads within the epic or no `--deps` at all

### Test Data

- Dependency chain from design notes: Epic 2 depends on Epic 1; Epic 3 depends on Epic 1; Epic 7 after functional fixes; Epics 4, 5, 6 independent

### Edge Cases

- `--deps` should reference the variable holding the bead ID, not a hardcoded string

---

## TC-015: Bead creation script uses --silent flag on all bd create calls

**Priority:** P1
**Type:** Functional

### Objective

Per the SPEC_PROMPT template, every `bd create` call must use `--silent` to capture the bead ID.

### Preconditions

- `.ralph/specs/ui-repair-beads.sh` exists

### Steps

1. Count all `bd create` invocations in the script
   **Expected:** A positive number (at least 8 epics + child beads)

2. Verify every `bd create` invocation includes `--silent`
   **Expected:** 100% of `bd create` calls have `--silent`

3. Verify every `bd create` result is captured in a variable via `$(...)`
   **Expected:** Pattern `VAR=$(bd create ... --silent)` for every invocation

### Test Data

- N/A

### Edge Cases

- The last bead creation might omit `--silent` if nothing depends on it, but the template requires it uniformly

---

## TC-016: Bead creation script ends with a summary echo

**Priority:** P2
**Type:** Functional

### Objective

Per the SPEC_PROMPT template, the script must end with an echo summarizing how many beads were created.

### Preconditions

- `.ralph/specs/ui-repair-beads.sh` exists

### Steps

1. Read the last few lines of the script
   **Expected:** An `echo` statement reporting the total number of beads created (e.g., `echo "Created X beads across Y epics"`)

### Test Data

- N/A

### Edge Cases

- The count in the echo should match the actual number of `bd create` calls in the script

---

## TC-017: Design notes reference specific file paths (not vague descriptions)

**Priority:** P1
**Type:** Functional

### Objective

SPEC_PROMPT rule 1 states: "Every bead's design notes must reference the actual source files to modify or create." Verify this is followed.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Select 5 beads at random from Section 4 and read their Design Notes
   **Expected:** Each contains at least one file path starting with `src/`

2. For bead(s) covering C-1, verify design notes reference `src/components/Onboarding/Onboarding.tsx` and `Onboarding.module.css`
   **Expected:** Both files mentioned with specific guidance (e.g., "change raw `onboarding-content` to `styles['onboarding-content']`")

3. For bead(s) covering C-2, verify design notes reference `src/components/Layout/Layout.tsx` and `Layout.module.css`
   **Expected:** Both files mentioned with specific line-level or pattern-level guidance

4. For bead(s) covering M-4, verify design notes reference `src/pages/Market/Market.tsx` and/or its CSS
   **Expected:** Mentions updating `top` value to account for header height

### Test Data

- Source file paths from audit report

### Edge Cases

- Design notes should not reference files that don't exist in the codebase (agent was supposed to verify findings against actual source)

---

## TC-018: Beads follow AGENT.md conventions in their guidance

**Priority:** P1
**Type:** Functional

### Objective

SPEC_PROMPT rule 4 requires proposed code to align with `.ralph/AGENT.md`. Verify the spec doesn't contradict project conventions.

### Preconditions

- `.ralph/specs/ui-repair.md` exists
- `.ralph/AGENT.md` is the authoritative conventions reference

### Steps

1. Verify no bead proposes introducing CSS-in-JS, Tailwind, or styled-components
   **Expected:** All styling guidance uses CSS Modules or co-located CSS files

2. Verify no bead proposes adding Redux, Zustand, or other state libraries
   **Expected:** State management guidance uses React Context or local state only

3. Verify no bead proposes class components
   **Expected:** All component guidance uses functional components with hooks

4. Verify CSS class names in design notes use `kebab-case`
   **Expected:** No camelCase or PascalCase CSS class names proposed

### Test Data

- Convention rules from `.ralph/AGENT.md`

### Edge Cases

- The codebase uses `.tsx` + `.module.css` (CSS Modules) which is a slight divergence from AGENT.md's `.jsx` + `.css` convention — the spec should follow the actual codebase pattern, not the AGENT.md default

---

## TC-019: Bead estimates are reasonable (5-60 minutes each)

**Priority:** P2
**Type:** Functional

### Objective

SPEC_PROMPT says "keep beads small" (completable in 5-15 minutes) and "estimate conservatively" (factor in test-writing). Verify estimates are in a reasonable range.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Collect all `**Estimate:**` values from Section 4
   **Expected:** Every value is a number in minutes

2. Verify no estimate is less than 5 minutes
   **Expected:** Minimum estimate is 5 minutes (even trivial changes need testing)

3. Verify no estimate exceeds 60 minutes
   **Expected:** Maximum estimate is 60 minutes (larger beads should be split)

4. Compute the total estimated time across all beads
   **Expected:** Total is reasonable for 30 issues (roughly 300-600 minutes total)

### Test Data

- N/A

### Edge Cases

- Beads that batch multiple related issues into one fix may have higher estimates — up to 45-60 minutes is acceptable if justified

---

## TC-020: Design Decisions section contains at least one non-trivial decision

**Priority:** P1
**Type:** Functional

### Objective

Section 3 must document non-trivial choices. Several decisions are implied by the audit (e.g., how to handle ESPN Live default scenario, whether to persist portfolio across scenarios).

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Read Section 3 (Design Decisions)
   **Expected:** At least 2-3 decisions are documented

2. For each decision, verify it includes: Decision, Options considered, Rationale, Trade-offs
   **Expected:** All four sub-fields present per the template format

3. Verify at least one decision addresses H-8 (ESPN Live default scenario being empty)
   **Expected:** A decision about whether to fix ESPN Live, change default scenario, or add fallback

4. Verify at least one decision addresses H-2 (portfolio reset on scenario switch)
   **Expected:** A decision about persisting vs. resetting portfolio with/without confirmation

### Test Data

- Issues requiring design decisions: H-2 (portfolio reset), H-7 (TimelineDebugger visibility), H-8 (ESPN Live default)

### Edge Cases

- Trivial CSS class name fixes (C-1, C-2) don't need design decisions — the fix is obvious

---

## TC-021: Risk Assessment identifies cross-cutting concerns

**Priority:** P1
**Type:** Functional

### Objective

Section 5 must flag beads likely to cause regressions and cross-cutting concerns.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Read Section 5 (Risk Assessment)
   **Expected:** Section is non-empty with substantive content

2. Verify it identifies CSS Module fixes as potentially affecting multiple components
   **Expected:** Mentions that CSS Module class name changes could break styling if not applied comprehensively

3. Verify it mentions the TradingContext changes (H-2) as high regression risk
   **Expected:** Portfolio/trading state changes flagged as risky since they affect multiple pages

4. Verify it identifies beads that might need human review
   **Expected:** At least one bead is flagged for human review (e.g., H-8 ESPN Live decision, H-7 dev mode gate)

### Test Data

- N/A

### Edge Cases

- Risk assessment should not be a mere re-listing of issues; it should analyze interaction between fixes

---

## TC-022: Out of Scope section exists and justifies any deferrals

**Priority:** P2
**Type:** Functional

### Objective

Section 6 must list any findings deferred from this spec and explain why.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Read Section 6 (Out of Scope)
   **Expected:** Section exists (even if it says "None — all 30 issues are addressed")

2. If any issues were deferred, verify each has a justification
   **Expected:** Each deferred item explains why (e.g., "needs backend support", "requires product decision")

3. Verify no Critical or High issues are deferred without strong justification
   **Expected:** C-1, C-2, H-1 through H-8 are all addressed in the Implementation Plan, not deferred

### Test Data

- N/A

### Edge Cases

- Console error findings and performance notes from the audit are not numbered issues — deferring them is acceptable

---

## TC-023: Bead creation script bd create commands include all required flags

**Priority:** P1
**Type:** Functional

### Objective

Per SPEC_PROMPT, each bead's `bd create` command must include title, `-d`, `--acceptance`, `--design`, `-p`, `-t`, `-e`, `--parent`, and optionally `--deps` and `-l`.

### Preconditions

- `.ralph/specs/ui-repair-beads.sh` exists

### Steps

1. Select 3 child bead `bd create` commands at random
   **Expected:** Each includes: title (positional or `--title`), `-d` (description), `--acceptance`, `--design`, `-p` (priority 0-4), `-t` (type), `-e` (estimate), `--parent`

2. Verify priority values are integers 0-4
   **Expected:** `-p` flag followed by 0, 1, 2, 3, or 4

3. Verify type values are valid
   **Expected:** `-t` flag followed by `task`, `bug`, or `chore` for child beads; `epic` for epic beads

4. Verify estimate values are positive integers
   **Expected:** `-e` flag followed by a number > 0

### Test Data

- N/A

### Edge Cases

- Multi-line description strings must be properly quoted (heredoc or `$'...'` syntax)
- Single quotes in description text must be escaped

---

## TC-024: Spec title and SPEC_NAME match design notes

**Priority:** P2
**Type:** Functional

### Objective

The spec document must use `SPEC_NAME=ui-repair` as specified in the design notes.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. Read the first heading of the spec
   **Expected:** Title is `# Spec: ui-repair` (or a variant like `# Spec: UI Repair` — the key value `ui-repair` must appear)

2. Verify the filename matches
   **Expected:** File is named exactly `ui-repair.md`, not `ui_repair.md` or `uiRepair.md`

3. Verify the bead script filename matches
   **Expected:** File is named exactly `ui-repair-beads.sh`

### Test Data

- SPEC_NAME from design notes: `ui-repair`

### Edge Cases

- Case sensitivity: the template uses `{{SPEC_NAME}}` literally, so `ui-repair` should appear in the heading

---

## TC-025: Beads touching more than 3-4 files are split

**Priority:** P2
**Type:** Functional

### Objective

SPEC_PROMPT rule 3 says "A bead that touches more than 3-4 files is probably too large. Split it."

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. For each bead in Section 4, count the distinct source files mentioned in its Design Notes
   **Expected:** No bead references more than 4 files to modify

2. If a bead references more than 4 files, verify it has been split into sub-beads
   **Expected:** Large scopes are decomposed into smaller beads

### Test Data

- N/A

### Edge Cases

- A bead may reference files for context/reading without modifying them — only files being modified count toward the limit

---

## TC-026: Acceptance criteria are measurable and specific

**Priority:** P1
**Type:** Functional

### Objective

Each bead's acceptance criteria must be concrete enough for an agent to verify completion. Vague criteria like "UI looks good" are insufficient.

### Preconditions

- `.ralph/specs/ui-repair.md` exists

### Steps

1. For the bead covering C-1, read acceptance criteria
   **Expected:** Criteria include specific checks like "Onboarding content wrapper uses `styles['onboarding-content']`" and "Content has padding `20px 40px 40px` and `text-align: center`"

2. For the bead covering C-2, read acceptance criteria
   **Expected:** Criteria include checks like "All NavLink components use `styles['nav-link']`" and "Active nav link shows primary color background"

3. For the bead covering H-2, read acceptance criteria
   **Expected:** Criteria include "Confirmation dialog appears before portfolio reset on scenario switch" or equivalent observable behavior

4. Spot-check 3 additional beads' acceptance criteria
   **Expected:** Each criterion describes an observable, testable outcome — not implementation details

### Test Data

- N/A

### Edge Cases

- Criteria should not over-specify implementation (e.g., "use useState" is implementation, not acceptance)
- Each bead should have at least 1 criterion, ideally 2-3

---

## TC-027: Codebase verification — spec agent explored source files and findings match reality

**Priority:** P1
**Type:** Integration

### Objective

The bead description says "Explore the current codebase to verify each finding against actual source files." Verify the spec reflects actual code state, not just parroting the audit.

### Preconditions

- `.ralph/specs/ui-repair.md` exists
- Source files are accessible

### Steps

1. For C-1, verify the spec's Current State section confirms that `Onboarding.tsx` actually uses a raw string `onboarding-content` (not already fixed)
   **Expected:** Spec states the current code and confirms the issue is present

2. For C-2, verify the spec confirms `Layout.tsx` uses raw `nav-link` strings
   **Expected:** Spec references the actual line numbers or code patterns found

3. For M-4, verify the spec confirms the sidebar's `top: 16px` value
   **Expected:** Spec states the current sticky positioning value

4. Check for any note about findings that could NOT be verified (e.g., if a file was already fixed or doesn't match the audit description)
   **Expected:** Any discrepancies between audit and actual code are noted in the spec (in Current State or Out of Scope)

### Test Data

- Source files: `src/components/Onboarding/Onboarding.tsx`, `src/components/Layout/Layout.tsx`, `src/pages/Market/Market.tsx`

### Edge Cases

- If a finding was already fixed between audit and spec generation, the spec should note this and either drop or adjust the bead

---

## TC-028: No production code or test code was written

**Priority:** P0
**Type:** Functional

### Objective

This bead is a specification task only. The agent must NOT have modified any source files under `src/`, written test files, or changed configuration.

### Preconditions

- Bead `mcq-aow` has been executed

### Steps

1. Run `git diff --name-only` to see all modified files
   **Expected:** Only files under `.ralph/specs/` are modified or created (specifically `ui-repair.md` and `ui-repair-beads.sh`)

2. Verify no files under `src/` were modified
   **Expected:** Zero changes to production source code

3. Verify no test files were created or modified
   **Expected:** No `.test.ts`, `.test.tsx`, `.spec.ts`, `.cy.ts` files changed

4. Verify no `package.json` or config files were modified
   **Expected:** No dependency or configuration changes

### Test Data

- N/A

### Edge Cases

- The agent may have created `.ralph/specs/` directory — this is expected and allowed
- Reading source files for verification is fine; modifying them is not
