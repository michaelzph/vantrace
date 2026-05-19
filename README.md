# Vantrace

See every move your AI agent makes, from a vantage point.

Vantrace captures every action Claude Code takes — file reads, writes, bash commands, web searches — as structured, immutable records in a local SQLite database. When something goes wrong, you can trace exactly what happened.

---

## What it captures

| Action | What's recorded |
|--------|----------------|
| File read | path |
| File write / edit | path, risk level |
| Bash command | command (first 500 chars) |
| Web search / fetch | query or URL |
| MCP tool call | server, operation |

Each event gets: timestamp, sequence number, reversibility flag, risk level (`low` / `medium` / `high`), and outcome (`ok` / `err`).

Data stays on your machine at `~/.vantrace/vantrace.db`. Nothing is sent anywhere.

---

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

---

## Quick start

**1. Clone and build**

```bash
git clone https://github.com/your-org/vantrace.git
cd vantrace
pnpm install
pnpm build
```

**2. Wire hooks into a project**

Run the setup script from your vantrace directory, pointing it at the project you want to audit:

```bash
./scripts/setup.sh /path/to/your/project
```

This creates `.claude/settings.json` in that project with the correct hook configuration.

**3. Use Claude Code normally**

Start a Claude Code session in your project. Vantrace captures events in the background — no change to your workflow.

**4. View what happened**

```bash
# List all sessions
node packages/cli/dist/cli.js sessions

# Inspect a specific session
node packages/cli/dist/cli.js session <session-id>
```

---

## CLI output

```
SESSION ID              STARTED       STATUS  EVENTS CWD
9b7a27f6-8145-4fe4-bd0b…05-19 20:25   active  55     /Users/you/your-project
```

```
SEQ  TIME      ACTION           RISK    REV  OUT  DATA
1    20:25:53  file_read        low     yes  ok   path: /your-project/src/main…
2    20:26:56  bash_execute     low     yes  ok   command: git log --oneline -15
3    20:27:17  file_write       medium  no   ok   path: /your-project/src/main…
```

- **REV**: whether the action can be undone (`yes` / `no` / `?`)
- **OUT**: outcome from PostToolUse (`ok` / `err` / `?` if not yet recorded)

---

## MCP server (optional)

Vantrace includes an MCP server so Claude Code can query the audit log during a session:

```json
{
  "mcpServers": {
    "vantrace": {
      "command": "node",
      "args": ["/path/to/vantrace/packages/mcp-server/dist/server.js"]
    }
  }
}
```

Tools exposed: `list_sessions`, `get_session`, `get_events`.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VANTRACE_DB` | `~/.vantrace/vantrace.db` | Path to the SQLite database |

---

## How it works

```
Claude Code
  └── PreToolUse hook  ──→  collector  ──→  LedgerStore (SQLite)
  └── PostToolUse hook ──→  collector  ──→  completions table
                                               ↓
                                          CLI / MCP server
```

The collector is a thin Node.js process that receives hook payloads via stdin, maps them to the event schema, and appends to the database. The core database layer is append-only — no event is ever updated or deleted.
