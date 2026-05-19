#!/usr/bin/env bash
# Wire Vantrace hooks into a project's Claude Code settings.
# Usage: ./scripts/setup.sh [project-dir]
# Default project-dir: current working directory

set -euo pipefail

VANTRACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COLLECTOR="$VANTRACE_DIR/packages/collector-claude-code/dist/cli.js"
PROJECT_DIR="${1:-$(pwd)}"
SETTINGS_FILE="$PROJECT_DIR/.claude/settings.json"

if [ ! -f "$COLLECTOR" ]; then
  echo "error: collector not built. Run 'pnpm build' from $VANTRACE_DIR first." >&2
  exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
  echo "error: project directory not found: $PROJECT_DIR" >&2
  exit 1
fi

mkdir -p "$PROJECT_DIR/.claude"

if [ -f "$SETTINGS_FILE" ]; then
  echo "note: $SETTINGS_FILE already exists."
  echo "Add the following hook entry to both PreToolUse and PostToolUse:"
  echo ""
  node -e "console.log(JSON.stringify({type:'command',command:'node',args:['$COLLECTOR'],timeout:10}, null, 2))"
  echo ""
  echo "Collector path: $COLLECTOR"
  exit 0
fi

node -e "
const hook = { type: 'command', command: 'node', args: ['$COLLECTOR'], timeout: 10 };
const entry = { matcher: '.*', hooks: [hook] };
const settings = { hooks: { PreToolUse: [entry], PostToolUse: [entry] } };
console.log(JSON.stringify(settings, null, 2));
" > "$SETTINGS_FILE"

echo "created $SETTINGS_FILE"

# Link CLI globally so 'vantrace' works as a command
if ! command -v vantrace &>/dev/null; then
  echo ""
  echo "linking vantrace CLI globally..."
  (cd "$VANTRACE_DIR/packages/cli" && pnpm link --global) 2>/dev/null \
    && echo "linked: 'vantrace' is now available as a global command" \
    || echo "note: global link failed — run 'pnpm link --global' manually from $VANTRACE_DIR/packages/cli"
fi

echo ""
echo "Vantrace is set up for: $PROJECT_DIR"
echo "Database: \${VANTRACE_DB:-~/.vantrace/vantrace.db}"
echo ""
echo "To view captured events after a Claude Code session:"
echo "  vantrace sessions"
echo "  vantrace session <session-id>"
