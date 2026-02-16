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
AGENT_MD="${RALPH_DIR}/.ralph/AGENT.md"
PROGRESS_LOG="${RALPH_DIR}/.ralph/progress.txt"
EXECUTION_LOG="${RALPH_DIR}/.ralph/ralph.log"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ts() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
  local msg="[$(ts)] $*"
  echo "$msg"
  echo "$msg" >> "$EXECUTION_LOG"
}

die() { log "ERROR: $*"; exit 1; }

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
[[ -f "$AGENT_MD" ]]           || die "Agent conventions not found: $AGENT_MD"

# Make sure beads is initialized
[[ -d "${RALPH_DIR}/.beads" ]] || die ".beads/ directory not found. Run: bd init --quiet --prefix mcq"

# ---------------------------------------------------------------------------
# Fetch ready beads
# ---------------------------------------------------------------------------

log "Fetching ready beads..."

BD_READY_JSON=$(bd ready --json 2>/dev/null) || die "bd ready --json failed"

# bd ready --json returns an array of issue objects
BEAD_COUNT=$(echo "$BD_READY_JSON" | jq 'length')

if [[ "$BEAD_COUNT" -eq 0 ]]; then
  log "No ready beads found. Nothing to do."
  exit 0
fi

log "Found $BEAD_COUNT ready bead(s)."

# ---------------------------------------------------------------------------
# Filter beads
# ---------------------------------------------------------------------------

FILTERED="$BD_READY_JSON"

if [[ -n "$FILTER_TYPE" ]]; then
  FILTERED=$(echo "$FILTERED" | jq --arg t "$FILTER_TYPE" '[.[] | select(.type == $t)]')
  log "Filtered by type=$FILTER_TYPE: $(echo "$FILTERED" | jq 'length') bead(s)."
fi

if [[ -n "$FILTER_EPIC" ]]; then
  # Match beads whose id starts with the epic prefix (e.g., mcq-a1b2.*)
  FILTERED=$(echo "$FILTERED" | jq --arg e "$FILTER_EPIC" '[.[] | select(.id | startswith($e))]')
  log "Filtered by epic=$FILTER_EPIC: $(echo "$FILTERED" | jq 'length') bead(s)."
fi

# Apply --max limit
FILTERED=$(echo "$FILTERED" | jq --argjson m "$MAX_BEADS" '.[0:$m]')
PROCESS_COUNT=$(echo "$FILTERED" | jq 'length')

if [[ "$PROCESS_COUNT" -eq 0 ]]; then
  log "No beads match the given filters. Nothing to do."
  exit 0
fi

log "Will process $PROCESS_COUNT bead(s)."

# ---------------------------------------------------------------------------
# Build prompt from template
# ---------------------------------------------------------------------------

build_prompt() {
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
  prompt=$(<"$PROMPT_TEMPLATE")

  # Replace placeholders
  prompt="${prompt//\{\{BEAD_ID\}\}/$id}"
  prompt="${prompt//\{\{BEAD_TITLE\}\}/$title}"
  prompt="${prompt//\{\{BEAD_TYPE\}\}/$type}"
  prompt="${prompt//\{\{BEAD_PRIORITY\}\}/$priority}"
  prompt="${prompt//\{\{BEAD_DESCRIPTION\}\}/$description}"
  prompt="${prompt//\{\{BEAD_ACCEPTANCE\}\}/$acceptance}"
  prompt="${prompt//\{\{BEAD_DESIGN\}\}/$design}"

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

for i in $(seq 0 $((PROCESS_COUNT - 1))); do
  BEAD_JSON=$(echo "$FILTERED" | jq ".[$i]")
  BEAD_ID=$(echo "$BEAD_JSON" | jq -r '.id')
  BEAD_TITLE=$(echo "$BEAD_JSON" | jq -r '.title')

  log "────────────────────────────────────────"
  log "Processing [$((i + 1))/$PROCESS_COUNT]: $BEAD_ID -- $BEAD_TITLE"

  if $DRY_RUN; then
    log "[DRY RUN] Would claim and process: $BEAD_ID"
    echo ""
    echo "--- Prompt preview for $BEAD_ID ---"
    build_prompt "$BEAD_JSON" | head -30
    echo "... (truncated) ..."
    echo ""
    continue
  fi

  # Claim the bead
  log "Claiming $BEAD_ID..."
  if ! bd update "$BEAD_ID" --claim --json 2>/dev/null; then
    log "WARNING: Failed to claim $BEAD_ID. Skipping."
    FAILURES=$((FAILURES + 1))
    continue
  fi

  # Build the filled prompt
  FILLED_PROMPT=$(build_prompt "$BEAD_JSON")

  # Invoke Cursor headless CLI
  log "Invoking Cursor agent for $BEAD_ID..."
  AGENT_START=$(date +%s)

  AGENT_OUTPUT=""
  AGENT_EXIT=0
  AGENT_OUTPUT=$(agent -p --force "$FILLED_PROMPT" 2>&1) || AGENT_EXIT=$?

  AGENT_END=$(date +%s)
  AGENT_DURATION=$(( AGENT_END - AGENT_START ))

  if [[ $AGENT_EXIT -eq 0 ]]; then
    log "Agent completed $BEAD_ID successfully in ${AGENT_DURATION}s."

    # Close the bead
    bd close "$BEAD_ID" --reason "Completed by Ralph" --json 2>/dev/null || true

    # Append to progress log
    echo "$(ts) | $BEAD_ID | DONE | $BEAD_TITLE" >> "$PROGRESS_LOG"

    SUCCESSES=$((SUCCESSES + 1))
  else
    log "Agent FAILED on $BEAD_ID (exit=$AGENT_EXIT, ${AGENT_DURATION}s)."

    # Reopen the bead with failure notes
    FAIL_NOTE="Ralph failed (exit=$AGENT_EXIT) at $(ts). Duration: ${AGENT_DURATION}s."
    bd update "$BEAD_ID" --status open --notes "$FAIL_NOTE" --json 2>/dev/null || true

    # Append to progress log
    echo "$(ts) | $BEAD_ID | FAIL | $BEAD_TITLE (exit=$AGENT_EXIT)" >> "$PROGRESS_LOG"

    FAILURES=$((FAILURES + 1))
  fi

  # Log a snippet of the agent output
  log "Agent output (last 10 lines):"
  echo "$AGENT_OUTPUT" | tail -10 >> "$EXECUTION_LOG"

  log ""
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

log "════════════════════════════════════════"
log "Ralph run complete."
log "  Processed: $PROCESS_COUNT"
log "  Succeeded: $SUCCESSES"
log "  Failed:    $FAILURES"
log "════════════════════════════════════════"

if [[ $FAILURES -gt 0 ]]; then
  exit 1
fi
