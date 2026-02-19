#!/usr/bin/env bash
# ralph.sh -- Loop runner for AI-assisted development via Cursor headless CLI.
# Reads ready beads from `bd`, fills a prompt template, and invokes the agent.
#
# Usage:
#   ./ralph.sh                     # Process the next ready bead (default: 1)
#   ./ralph.sh --all               # Process all ready beads (up to --max)
#   ./ralph.sh --epic mcq-a1b2     # Only beads under a specific epic
#   ./ralph.sh --type bug          # Only beads of a given type
#   ./ralph.sh --max 5             # Process up to 5 beads
#   ./ralph.sh --dry-run           # Show what would run without executing
#   ./ralph.sh --help              # Show this help message

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

RALPH_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_TEMPLATE="${RALPH_DIR}/.ralph/PROMPT.md"
QA_PROMPT_TEMPLATE="${RALPH_DIR}/.ralph/QA_PROMPT.md"
AGENT_MD="${RALPH_DIR}/.ralph/AGENT.md"
TEST_PLANS_DIR="${RALPH_DIR}/.ralph/test-plans"
PROGRESS_LOG="${RALPH_DIR}/.ralph/progress.txt"
EXECUTION_LOG="${RALPH_DIR}/.ralph/ralph.log"
AGENT_MODEL="${AGENT_MODEL:-opus-4.6-thinking}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ts() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
  local msg="[$(ts)] $*"
  echo "$msg" >> "$EXECUTION_LOG"
}

say() { echo "$@"; }

die() { say "ERROR: $*"; log "ERROR: $*"; exit 1; }

format_duration() {
  local secs=$1
  if (( secs >= 3600 )); then
    printf '%dh %dm' $((secs / 3600)) $(((secs % 3600) / 60))
  elif (( secs >= 60 )); then
    printf '%dm %ds' $((secs / 60)) $((secs % 60))
  else
    printf '%ds' "$secs"
  fi
}

format_estimate() {
  local mins=$1
  if [[ -z "$mins" || "$mins" == "null" || "$mins" == "0" ]]; then
    echo "—"
  elif (( mins >= 60 )); then
    local rem=$((mins % 60))
    if (( rem > 0 )); then
      printf '%dh %dm' $((mins / 60)) "$rem"
    else
      printf '%dh' $((mins / 60))
    fi
  else
    printf '%dm' "$mins"
  fi
}

BOX_W=54

print_pickup() {
  local idx=$1 total=$2 id=$3 title=$4 btype=$5 est_mins=$6
  local est_str
  est_str=$(format_estimate "$est_mins")
  local header
  header=$(printf '─ PICKING UP [%d/%d] ' "$idx" "$total")

  say ""
  say "  ┌${header}$(printf '─%.0s' $(seq 1 $((BOX_W - ${#header} - 1))))┐"
  say "  │  ${id} · ${title}"
  say "  │  type: ${btype}  ·  est: ${est_str}"
  say "  └$(printf '─%.0s' $(seq 1 $BOX_W))┘"
}

print_done() {
  local idx=$1 total=$2 id=$3 title=$4 duration_s=$5
  local dur_str
  dur_str=$(format_duration "$duration_s")
  local header
  header=$(printf '─ DONE [%d/%d] ' "$idx" "$total")

  say ""
  say "  ┌${header}$(printf '─%.0s' $(seq 1 $((BOX_W - ${#header} - 1))))┐"
  say "  │  ${id} · ${title}"
  say "  │  duration: ${dur_str}  ·  status: closed"
  say "  └$(printf '─%.0s' $(seq 1 $BOX_W))┘"
}

print_fail() {
  local idx=$1 total=$2 id=$3 title=$4 duration_s=$5 exit_code=$6
  local dur_str
  dur_str=$(format_duration "$duration_s")
  local header
  header=$(printf '─ FAILED [%d/%d] ' "$idx" "$total")

  say ""
  say "  ┌${header}$(printf '─%.0s' $(seq 1 $((BOX_W - ${#header} - 1))))┐"
  say "  │  ${id} · ${title}"
  say "  │  duration: ${dur_str}  ·  exit: ${exit_code}"
  say "  └$(printf '─%.0s' $(seq 1 $BOX_W))┘"
}

print_summary() {
  local total=$1 ok=$2 fail=$3 elapsed=$4
  shift 4

  local elapsed_str
  elapsed_str=$(format_duration "$elapsed")

  say ""
  say "  ══════════════════════════════════════════════════════════"
  say "   Ralph run complete · ${total} processed · ${ok} ok · ${fail} failed"
  say "   Total time: ${elapsed_str}"
  say "  ──────────────────────────────────────────────────────────"

  while [[ $# -ge 4 ]]; do
    local r_status=$1 r_id=$2 r_dur=$3 r_title=$4
    shift 4
    local r_dur_str
    r_dur_str=$(format_duration "$r_dur")
    printf '   %-4s  %-14s %8s   %s\n' "$r_status" "$r_id" "$r_dur_str" "$r_title"
  done

  say "  ══════════════════════════════════════════════════════════"
  say ""
}

usage() {
  cat <<'EOF'
ralph.sh -- AI agent loop runner for McQueen

Usage:
  ./ralph.sh [OPTIONS]

Options:
  --all             Process all ready beads (up to --max)
  --epic <id>       Only process beads under the given epic
  --type <type>     Only process beads of the given type (task, bug, feature, ...)
  --max  <n>        Maximum beads to process (default: 1, or unlimited with --all)
  --dry-run         Print what would be done, but don't execute
  --help            Show this help message

Environment:
  CURSOR_API_KEY    Required. Your Cursor API key for headless CLI access.

Examples:
  ./ralph.sh                         # Process next ready bead
  ./ralph.sh --all --max 3           # Process up to 3 ready beads
  ./ralph.sh --type bug              # Process the next ready bug
  ./ralph.sh --epic mcq-a1b2 --all   # Process all tasks in an epic
  ./ralph.sh --dry-run               # Preview without executing
EOF
  exit 0
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

PROCESS_ALL=false
FILTER_EPIC=""
FILTER_TYPE=""
MAX_BEADS=1
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)      PROCESS_ALL=true; shift ;;
    --epic)     FILTER_EPIC="$2"; shift 2 ;;
    --type)     FILTER_TYPE="$2"; shift 2 ;;
    --max)      MAX_BEADS="$2"; shift 2 ;;
    --dry-run)  DRY_RUN=true; shift ;;
    --help|-h)  usage ;;
    *)          die "Unknown option: $1 (try --help)" ;;
  esac
done

# If --all without explicit --max, set a generous upper bound
if $PROCESS_ALL && [[ "$MAX_BEADS" -eq 1 ]]; then
  MAX_BEADS=100
fi

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------

command -v bd   >/dev/null 2>&1 || die "bd (beads CLI) is not installed. Install with: brew install beads"
command -v agent >/dev/null 2>&1 || die "Cursor CLI (agent) is not installed. Install with: curl https://cursor.com/install -fsSL | bash"
command -v jq   >/dev/null 2>&1 || die "jq is required. Install with: brew install jq"

[[ -n "${CURSOR_API_KEY:-}" ]] || die "CURSOR_API_KEY environment variable is not set."
[[ -f "$PROMPT_TEMPLATE" ]]    || die "Prompt template not found: $PROMPT_TEMPLATE"
[[ -f "$QA_PROMPT_TEMPLATE" ]] || die "QA prompt template not found: $QA_PROMPT_TEMPLATE"
[[ -f "$AGENT_MD" ]]           || die "Agent conventions not found: $AGENT_MD"

# Make sure beads is initialized
[[ -d "${RALPH_DIR}/.beads" ]] || die ".beads/ directory not found. Run: bd init --quiet --prefix mcq"

# Ensure test-plans output directory exists
mkdir -p "$TEST_PLANS_DIR"

# ---------------------------------------------------------------------------
# Fetch ready beads
# ---------------------------------------------------------------------------

say "  Fetching ready beads..."
log "Fetching ready beads..."

BD_READY_JSON=$(bd ready --json 2>/dev/null) || die "bd ready --json failed"

BEAD_COUNT=$(echo "$BD_READY_JSON" | jq 'length')

if [[ "$BEAD_COUNT" -eq 0 ]]; then
  say "  No ready beads found. Nothing to do."
  log "No ready beads found."
  exit 0
fi

say "  Found $BEAD_COUNT ready bead(s)."
log "Found $BEAD_COUNT ready bead(s)."

# ---------------------------------------------------------------------------
# Filter beads
# ---------------------------------------------------------------------------

FILTERED="$BD_READY_JSON"

if [[ -n "$FILTER_TYPE" ]]; then
  FILTERED=$(echo "$FILTERED" | jq --arg t "$FILTER_TYPE" '[.[] | select(.type == $t)]')
  local_count=$(echo "$FILTERED" | jq 'length')
  say "  Filtered by type=$FILTER_TYPE: ${local_count} bead(s)."
  log "Filtered by type=$FILTER_TYPE: ${local_count} bead(s)."
fi

if [[ -n "$FILTER_EPIC" ]]; then
  FILTERED=$(echo "$FILTERED" | jq --arg e "$FILTER_EPIC" '[.[] | select(.id | startswith($e))]')
  local_count=$(echo "$FILTERED" | jq 'length')
  say "  Filtered by epic=$FILTER_EPIC: ${local_count} bead(s)."
  log "Filtered by epic=$FILTER_EPIC: ${local_count} bead(s)."
fi

# Apply --max limit
FILTERED=$(echo "$FILTERED" | jq --argjson m "$MAX_BEADS" '.[0:$m]')
PROCESS_COUNT=$(echo "$FILTERED" | jq 'length')

if [[ "$PROCESS_COUNT" -eq 0 ]]; then
  say "  No beads match the given filters. Nothing to do."
  log "No beads match filters."
  exit 0
fi

say "  Will process $PROCESS_COUNT bead(s)."
log "Will process $PROCESS_COUNT bead(s)."

# ---------------------------------------------------------------------------
# Build prompt from template
# ---------------------------------------------------------------------------

# Replace bead placeholders in a template string.
fill_placeholders() {
  local template="$1"
  local id="$2" title="$3" type="$4" priority="$5"
  local description="$6" acceptance="$7" design="$8"

  template="${template//\{\{BEAD_ID\}\}/$id}"
  template="${template//\{\{BEAD_TITLE\}\}/$title}"
  template="${template//\{\{BEAD_TYPE\}\}/$type}"
  template="${template//\{\{BEAD_PRIORITY\}\}/$priority}"
  template="${template//\{\{BEAD_DESCRIPTION\}\}/$description}"
  template="${template//\{\{BEAD_ACCEPTANCE\}\}/$acceptance}"
  template="${template//\{\{BEAD_DESIGN\}\}/$design}"

  echo "$template"
}

build_qa_prompt() {
  local bead_json="$1"
  local id title type priority description acceptance design

  id=$(echo "$bead_json" | jq -r '.id // "unknown"')
  title=$(echo "$bead_json" | jq -r '.title // "No title"')
  type=$(echo "$bead_json" | jq -r '.type // "task"')
  priority=$(echo "$bead_json" | jq -r '.priority // "unset"')
  description=$(echo "$bead_json" | jq -r '.description // "No description provided."')
  acceptance=$(echo "$bead_json" | jq -r '.acceptance // "Not specified."')
  design=$(echo "$bead_json" | jq -r '.design // "None."')

  local prompt
  prompt=$(<"$QA_PROMPT_TEMPLATE")
  prompt=$(fill_placeholders "$prompt" "$id" "$title" "$type" "$priority" "$description" "$acceptance" "$design")

  echo "$prompt"
}

build_prompt() {
  local bead_json="$1"
  local test_plan_content="${2:-No test plan was generated for this bead. Rely on the acceptance criteria directly.}"
  local id title type priority description acceptance design

  id=$(echo "$bead_json" | jq -r '.id // "unknown"')
  title=$(echo "$bead_json" | jq -r '.title // "No title"')
  type=$(echo "$bead_json" | jq -r '.type // "task"')
  priority=$(echo "$bead_json" | jq -r '.priority // "unset"')
  description=$(echo "$bead_json" | jq -r '.description // "No description provided."')
  acceptance=$(echo "$bead_json" | jq -r '.acceptance // "Not specified."')
  design=$(echo "$bead_json" | jq -r '.design // "None."')

  local prompt
  prompt=$(<"$PROMPT_TEMPLATE")
  prompt=$(fill_placeholders "$prompt" "$id" "$title" "$type" "$priority" "$description" "$acceptance" "$design")

  # Inject the pre-generated test plan
  prompt="${prompt//\{\{TEST_PLAN\}\}/$test_plan_content}"

  # Append the agent conventions as context
  prompt="${prompt}

---

## Project Conventions (from .ralph/AGENT.md)

$(<"$AGENT_MD")"

  echo "$prompt"
}

# ---------------------------------------------------------------------------
# Process each bead
# ---------------------------------------------------------------------------

SUCCESSES=0
FAILURES=0
RUN_START=$(date +%s)

# Accumulate results for the final summary table.
# Each completed bead appends 4 tokens: status id duration title
RESULTS=()

for i in $(seq 0 $((PROCESS_COUNT - 1))); do
  BEAD_JSON=$(echo "$FILTERED" | jq ".[$i]")
  BEAD_ID=$(echo "$BEAD_JSON" | jq -r '.id')
  BEAD_TITLE=$(echo "$BEAD_JSON" | jq -r '.title')
  BEAD_TYPE=$(echo "$BEAD_JSON" | jq -r '.issue_type // .type // "task"')
  BEAD_EST=$(echo "$BEAD_JSON" | jq -r '.estimated_minutes // 0')
  IDX=$((i + 1))

  if $DRY_RUN; then
    print_pickup "$IDX" "$PROCESS_COUNT" "$BEAD_ID" "$BEAD_TITLE" "$BEAD_TYPE" "$BEAD_EST"
    say "  [DRY RUN] Would claim and process: $BEAD_ID"
    say ""
    say "  --- QA prompt preview (first 20 lines) ---"
    DRY_QA=$(build_qa_prompt "$BEAD_JSON")
    echo "$DRY_QA" | head -20
    say "  ... (truncated) ..."
    say ""
    say "  --- Implementation prompt preview (first 30 lines) ---"
    DRY_PREVIEW=$(build_prompt "$BEAD_JSON" "(test plan would be injected here)")
    echo "$DRY_PREVIEW" | head -30
    say "  ... (truncated) ..."
    continue
  fi

  # Claim the bead
  log "Claiming $BEAD_ID"
  if ! bd update "$BEAD_ID" --claim 2>/dev/null >> "$EXECUTION_LOG"; then
    say ""
    say "  WARNING: Failed to claim $BEAD_ID. Skipping."
    log "WARNING: Failed to claim $BEAD_ID. Skipping."
    FAILURES=$((FAILURES + 1))
    RESULTS+=("SKIP" "$BEAD_ID" "0" "$BEAD_TITLE")
    continue
  fi

  print_pickup "$IDX" "$PROCESS_COUNT" "$BEAD_ID" "$BEAD_TITLE" "$BEAD_TYPE" "$BEAD_EST"

  # ------------------------------------------------------------------
  # Phase 1: QA Test Plan Generation
  # ------------------------------------------------------------------

  TEST_PLAN_FILE="${TEST_PLANS_DIR}/${BEAD_ID}.md"
  TEST_PLAN_CONTENT=""

  say "  [QA] Generating test plan for ${BEAD_ID}..."
  log "Phase 1 (QA): Generating test plan for $BEAD_ID"

  QA_FILLED=$(build_qa_prompt "$BEAD_JSON")
  QA_START=$(date +%s)

  QA_OUTPUT=""
  QA_EXIT=0
  QA_OUTPUT=$(agent -p --model "$AGENT_MODEL" --force "$QA_FILLED" 2>&1) || QA_EXIT=$?

  QA_END=$(date +%s)
  QA_DURATION=$(( QA_END - QA_START ))

  echo "$QA_OUTPUT" | tail -20 >> "$EXECUTION_LOG"

  if [[ $QA_EXIT -eq 0 ]] && [[ -f "$TEST_PLAN_FILE" ]]; then
    TEST_PLAN_CONTENT=$(<"$TEST_PLAN_FILE")
    log "QA plan generated for $BEAD_ID in $(format_duration $QA_DURATION) -> $TEST_PLAN_FILE"
    say "  [QA] Test plan ready ($(format_duration $QA_DURATION))"
  else
    log "WARNING: QA agent failed or did not produce $TEST_PLAN_FILE (exit=$QA_EXIT, $(format_duration $QA_DURATION)). Proceeding without test plan."
    say "  [QA] WARNING: Test plan generation failed (exit=$QA_EXIT). Proceeding without test plan."
  fi

  # ------------------------------------------------------------------
  # Phase 2: Implementation (Red-Green-Refactor + Verify)
  # ------------------------------------------------------------------

  FILLED_PROMPT=$(build_prompt "$BEAD_JSON" "$TEST_PLAN_CONTENT")

  say "  [IMPL] Agent working on ${BEAD_ID}..."
  log "Phase 2 (IMPL): Invoking Cursor agent for $BEAD_ID"
  AGENT_START=$(date +%s)

  AGENT_OUTPUT=""
  AGENT_EXIT=0
  AGENT_OUTPUT=$(agent -p --model "$AGENT_MODEL" --force "$FILLED_PROMPT" 2>&1) || AGENT_EXIT=$?

  AGENT_END=$(date +%s)
  AGENT_DURATION=$(( AGENT_END - AGENT_START ))
  TOTAL_DURATION=$(( QA_DURATION + AGENT_DURATION ))

  echo "$AGENT_OUTPUT" | tail -20 >> "$EXECUTION_LOG"

  if [[ $AGENT_EXIT -eq 0 ]]; then
    log "Agent completed $BEAD_ID in $(format_duration $TOTAL_DURATION) (QA=$(format_duration $QA_DURATION) + IMPL=$(format_duration $AGENT_DURATION))"

    bd close "$BEAD_ID" --reason "Completed by Ralph" 2>/dev/null >> "$EXECUTION_LOG" || true

    echo "$(ts) | $BEAD_ID | DONE | $BEAD_TITLE" >> "$PROGRESS_LOG"

    print_done "$IDX" "$PROCESS_COUNT" "$BEAD_ID" "$BEAD_TITLE" "$TOTAL_DURATION"
    SUCCESSES=$((SUCCESSES + 1))
    RESULTS+=("ok" "$BEAD_ID" "$TOTAL_DURATION" "$BEAD_TITLE")
  else
    log "Agent FAILED on $BEAD_ID (exit=$AGENT_EXIT, QA=$(format_duration $QA_DURATION) + IMPL=$(format_duration $AGENT_DURATION))"

    FAIL_NOTE="Ralph failed (exit=$AGENT_EXIT) at $(ts). Duration: $(format_duration $TOTAL_DURATION)."
    bd update "$BEAD_ID" --status open --notes "$FAIL_NOTE" 2>/dev/null >> "$EXECUTION_LOG" || true

    echo "$(ts) | $BEAD_ID | FAIL | $BEAD_TITLE (exit=$AGENT_EXIT)" >> "$PROGRESS_LOG"

    print_fail "$IDX" "$PROCESS_COUNT" "$BEAD_ID" "$BEAD_TITLE" "$TOTAL_DURATION" "$AGENT_EXIT"
    FAILURES=$((FAILURES + 1))
    RESULTS+=("FAIL" "$BEAD_ID" "$TOTAL_DURATION" "$BEAD_TITLE")
  fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

RUN_END=$(date +%s)
RUN_ELAPSED=$(( RUN_END - RUN_START ))

log "Ralph run complete. Processed=$PROCESS_COUNT Succeeded=$SUCCESSES Failed=$FAILURES Elapsed=$(format_duration $RUN_ELAPSED)"

# ${RESULTS[@]} on an empty array fails with set -u in bash < 4.4 (macOS default)
if [[ ${#RESULTS[@]} -gt 0 ]]; then
  print_summary "$PROCESS_COUNT" "$SUCCESSES" "$FAILURES" "$RUN_ELAPSED" "${RESULTS[@]}"
else
  print_summary "$PROCESS_COUNT" "$SUCCESSES" "$FAILURES" "$RUN_ELAPSED"
fi

if [[ $FAILURES -gt 0 ]]; then
  exit 1
fi
