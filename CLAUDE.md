# Vantrace — Claude Code Working Instructions

## What Is This Project

Vantrace is an AI Agent behavior audit framework.

**The problem it solves:** Every major agent framework (Claude Code,
OpenClaw, Hermes, etc.) is a black box — when something goes wrong,
there is no way to trace what happened. Vantrace captures every
action an agent takes as structured, immutable records, so humans
can audit, understand, and attribute behavior after the fact.

**Name origin:** Vantage point + Trace — see every move your AI
agent makes, from a vantage point.

**Primary target user:** Developers and teams who use Claude Code heavily.
**First agent integration:** Claude Code (via hooks mechanism).

**Tagline:** See every move your AI agent makes, from a vantage point.

For current development status, see docs/STATUS.md.

---

## Design Philosophy

These principles govern every architectural decision. Do not work
around them without a documented reason in docs/decisions/.

**Capture and understanding are separate layers.**
The collector layer only captures raw events. The core layer handles
understanding and annotation. They communicate through the standard
event schema. Changes to how Claude Code output is parsed must not
affect how events are stored in the Ledger.

**Store metadata, not content.**
action_data holds structured metadata (file paths, line deltas,
command names) — never file contents or command output. This keeps
the Ledger free of sensitive data and bounded in size.

**The Ledger is append-only.**
The events table accepts only INSERT. UPDATE and DELETE are forbidden.
This is the foundation of audit trustworthiness. To correct an event,
append a new event of type `correction` that references the original
by ID.

**Local first.**
All data lives on the user's machine (~/.vantrace/ or .vantrace/
inside the project). Nothing is sent to any external service,
including the local model used for semantic annotation.

---

## Monorepo Structure

```
vantrace/
├── packages/
│   ├── core/                    # Core logic — no external deps except better-sqlite3
│   ├── collector-claude-code/   # Claude Code hooks integration
│   ├── mcp-server/              # MCP server (v2, not yet in scope)
│   └── cli/                     # Command-line viewer
├── docs/
│   ├── STATUS.md                # Current progress and next steps (dynamic)
│   └── decisions/               # Architecture Decision Records (ADRs)
├── examples/
├── pnpm-workspace.yaml
└── CLAUDE.md
```

**npm scope:** `@vantrace`
- `@vantrace/core`
- `@vantrace/collector-claude-code`
- `@vantrace/mcp-server`
- `@vantrace/cli` (also published as global binary `vantrace`)

**Dependency constraints:**
- `core` may only depend on `better-sqlite3` and `nanoid`. No agent
  SDKs, LLM SDKs, or UI frameworks.
- `collector-*` packages may depend on `core`. The reverse is forbidden.
- Each collector handles exactly one agent's raw data format.

---

## Tech Stack

| Concern         | Choice                          |
|-----------------|---------------------------------|
| Language        | TypeScript (strict mode always) |
| Package manager | pnpm + workspaces               |
| Database        | better-sqlite3 (synchronous)    |
| Testing         | Vitest                          |
| CLI rendering   | ink (React for CLI)             |
| Bundling        | tsup                            |

---

## Schema Reference

The schema is the single source of truth. When in doubt, check
`packages/core/src/schema.ts` before making assumptions.

**events table columns:**
`id, session_id, seq, created_at, agent, agent_ver, action_type,
action_data (JSON), reversible (0/1/NULL), risk_level, parent_id,
policy_tags (JSON), policy_result`

**action_type values:**
`file_read, file_write, file_delete, bash_execute, web_search,
mcp_tool_call, agent_thinking, user_message, agent_message`

**sessions table columns:**
`id, started_at, ended_at, agent, task, cwd, status`

---

## Naming Conventions

| Target           | Convention           | Example                   |
|------------------|----------------------|---------------------------|
| File names       | kebab-case           | `ledger-store.ts`         |
| Classes          | PascalCase           | `LedgerStore`             |
| Functions        | camelCase            | `appendEvent`             |
| Database fields  | snake_case           | `action_type`             |
| Constants        | SCREAMING_SNAKE_CASE | `MAX_BATCH_SIZE`          |

---

## Testing Conventions

- Every core function must have a corresponding test.
- Test files live in `__tests__/` inside the same package directory.
- Test file naming: `<module-name>.test.ts`
- Use a real SQLite in-memory database for tests. Do not mock the
  database layer.
- Do not mock the file system unless absolutely necessary; use
  temporary directories instead.

---

## When You Are Uncertain

1. Check `packages/core/src/schema.ts` first — it is the single
   source of truth for all types.
2. If unsure about an `action_data` shape, look up the corresponding
   type in schema.ts. Do not invent new shapes in collector packages.
3. If a decision would violate the design philosophy above, stop and
   raise it as a question rather than working around it silently.
4. For architectural decisions that have already been made, see
   `docs/decisions/`.