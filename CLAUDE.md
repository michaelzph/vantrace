# Vantrace — Claude Code Working Instructions

## What Is This Project

Vantrace is the behavior data layer for AI agents.

**The problem it solves:** Every major agent framework (Claude Code,
OpenClaw, Hermes, etc.) is a black box — when something goes wrong,
there is no way to trace what happened. More importantly, the rich
behavioral data agents generate is simply discarded, making it
impossible to diagnose inefficiencies or improve agent performance
over time.

Vantrace captures every action an agent takes as structured,
immutable records — so you can audit the past, understand the
present, and improve the future.

**Name origin:** Vantage point + Trace — see every move your AI
agent makes, from a vantage point.

**Primary target user:** Developers and teams who use Claude Code heavily.
**First agent integration:** Claude Code (via hooks mechanism).

**Tagline:** See every move your AI agent makes, from a vantage point.

**Three-phase value:**
- Audit the past    — v1: capture and review agent behavior
- Understand the present — v1.5: diagnose patterns and inefficiencies
- Improve the future    — v2: optimize agents using behavior data

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

**Exception:** agent_thinking events store structured reasoning
metadata (decision, alternatives, phase) because this is essential
for future agent optimization. Still no raw prompt/completion text.

**The Ledger is append-only.**
The events table accepts only INSERT. UPDATE and DELETE are forbidden.
This is the foundation of audit trustworthiness. To correct an event,
append a new event of type `correction` that references the original
by ID.

**Local first.**
All data lives on the user's machine (~/.vantrace/ or .vantrace/
inside the project). Nothing is sent to any external service.
This applies to future analytics and optimization features too —
all processing happens locally unless the user explicitly opts in.

**Schema stability matters.**
The events and sessions tables are the foundation of Vantrace's
long-term data value. Migrations that break existing data are
unacceptable after v1.0. Design schema fields for future use cases
(optimization, training data export), not just current audit needs.

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

### events table

| Column        | Type           | Notes                                          |
|---------------|----------------|------------------------------------------------|
| id            | TEXT PK        | nanoid                                         |
| session_id    | TEXT           | FK → sessions.id                              |
| seq           | INTEGER        | Sequence within session, for ordering          |
| created_at    | INTEGER        | Unix timestamp in milliseconds                 |
| agent         | TEXT           | e.g. 'claude-code', 'codex'                   |
| agent_ver     | TEXT           | Agent version string                           |
| action_type   | TEXT           | See action_type values below                   |
| action_data   | TEXT (JSON)    | Structured metadata, schema varies by type     |
| reversible    | INTEGER        | 0 = irreversible, 1 = reversible, NULL = unknown |
| risk_level    | TEXT           | 'low' \| 'medium' \| 'high' \| NULL           |
| parent_ids    | TEXT (JSON)    | Array of parent event IDs (causal chain)       |
| policy_tags   | TEXT (JSON)    | Array of matched policy names                  |
| policy_result | TEXT           | 'pass' \| 'warn' \| 'block' \| NULL           |

**Note:** `parent_ids` is a JSON array (not a single `parent_id`)
to support multi-causal relationships where multiple prior events
together trigger a decision.

### action_type values and action_data shapes

```typescript
file_read:      { path: string, size_bytes: number }

file_write:     { path: string,
                  operation: 'create' | 'replace' | 'patch',
                  lines_added: number, lines_removed: number }

file_delete:    { path: string }

bash_execute:   { command: string, exit_code: number,
                  stdout_lines: number, stderr_lines: number,
                  duration_ms: number }

web_search:     { query: string, results_count: number }

mcp_tool_call:  { server: string, tool: string,
                  input_keys: string[],
                  success: boolean }

agent_thinking: { phase: 'planning' | 'reasoning' | 'reflection',
                  decision: string,
                  alternatives: string[],
                  confidence: 'high' | 'medium' | 'low' | null }

user_message:   { length: number }
agent_message:  { length: number }
correction:     { target_event_id: string, reason: string }
```

### sessions table

| Column      | Type    | Notes                                              |
|-------------|---------|----------------------------------------------------|
| id          | TEXT PK | nanoid                                             |
| started_at  | INTEGER | Unix timestamp in milliseconds                     |
| ended_at    | INTEGER | NULL if session still active                       |
| agent       | TEXT    | e.g. 'claude-code'                                |
| task        | TEXT    | Description extracted from first user message      |
| cwd         | TEXT    | Working directory                                  |
| status      | TEXT    | 'active' \| 'completed' \| 'aborted'              |
| outcome     | TEXT    | 'success' \| 'partial' \| 'failed' \| NULL        |
| user_rating | INTEGER | 1–5, NULL if not rated. Explicit user feedback.    |

**outcome** and **user_rating** are essential for future agent
optimization (implicit and explicit feedback signals). Capture
them from day one even if v1 does not surface them in the UI.

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
5. When in doubt about schema changes: prefer adding nullable columns
   over restructuring existing ones. Schema stability is a hard
   requirement after v1.0.
