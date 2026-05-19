# 🔭 Vantrace

> See every move your AI agent makes, from a vantage point.

Vantrace is an open-source audit framework for AI agents. It captures every action Claude Code takes — file reads, writes, bash commands, web searches — as structured, immutable records in a local SQLite database. When something goes wrong, you can trace exactly what happened.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)](https://pnpm.io/)

---

## 🤔 Why Vantrace?

AI agent frameworks are black boxes. When an agent deletes a file, runs an unexpected command, or makes changes you didn't anticipate — there's no audit trail. Vantrace fixes that.

- **Immutable log** — events are append-only; nothing is ever updated or deleted
- **Local-first** — all data lives on your machine; nothing is sent anywhere
- **Structured** — every action is typed, risk-classified, and reversibility-annotated
- **Passive** — hooks into Claude Code transparently; zero workflow change

---

## 📋 What it captures

| Action | Recorded fields |
|--------|----------------|
| 📖 File read | path |
| ✏️ File write / edit | path, risk level |
| 💻 Bash command | command (first 500 chars) |
| 🌐 Web search / fetch | query or URL |
| 🔧 MCP tool call | server, operation |

Each event includes: timestamp, sequence number, reversibility (`yes` / `no`), risk level (`low` / `medium` / `high`), and outcome (`ok` / `err`).

---

## 🚀 Quick start

**1. Clone and build**

```bash
git clone https://github.com/your-org/vantrace.git
cd vantrace
pnpm install
pnpm build
```

**2. Wire hooks into a project**

```bash
./scripts/setup.sh /path/to/your/project
```

This creates `.claude/settings.json` in your project with the correct hook configuration, and installs `vantrace` as a global command.

**3. Use Claude Code normally**

Start a Claude Code session. Vantrace captures events in the background — no change to your workflow.

**4. View what happened**

```bash
vantrace sessions
vantrace session <session-id>
```

---

## 🖥️ CLI output

```
SESSION ID              STARTED       STATUS  EVENTS CWD
9b7a27f6-8145-4fe4-bd0b…05-19 20:25   active  55     /your/project
```

```
SEQ  TIME      ACTION           RISK    REV  OUT  DATA
1    20:25:53  file_read        low     yes  ok   path: /your/project/src/main…
2    20:26:56  bash_execute     low     yes  ok   command: git log --oneline -15
3    20:27:17  file_write       medium  no   ok   path: /your/project/src/main…
4    20:28:32  bash_execute     high    no   err  command: rm -rf /tmp/build
```

- **REV** — whether the action can be undone (`yes` / `no` / `?`)
- **OUT** — outcome recorded by PostToolUse hook (`ok` / `err` / `?` pending)

---

## 🏗️ Architecture

```
Claude Code
  ├── PreToolUse hook  ──→  collector  ──→  LedgerStore (SQLite, append-only)
  └── PostToolUse hook ──→  collector  ──→  completions table
                                                ↓
                                         CLI  /  MCP server
```

The collector is a thin Node.js process that receives hook payloads via stdin, maps them to the event schema, and appends to the database. No event is ever modified or deleted.

**Packages:**

| Package | Role |
|---------|------|
| `@vantrace/core` | LedgerStore, schema, reversibility annotator |
| `@vantrace/collector-claude-code` | Claude Code hooks integration |
| `@vantrace/cli` | Terminal viewer (`vantrace` binary) |
| `@vantrace/mcp-server` | MCP server for in-session queries |

---

## 🔌 MCP server (optional)

Expose the audit log to Claude Code itself during a session:

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

Tools: `list_sessions`, `get_session`, `get_events`.

---

## ⚙️ Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VANTRACE_DB` | `~/.vantrace/vantrace.db` | Path to the SQLite database |

---

## 📦 Tech stack

TypeScript (strict) · pnpm workspaces · better-sqlite3 · Vitest · ink · tsup

---

## 📄 License

[MIT](./LICENSE)
