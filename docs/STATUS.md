# Glassbox — Development Status

> This file is updated at the end of every development session.
> It is the source of truth for current progress and next steps.
> Last updated: 2026-05-19

---

## Current Focus

Implementing `@glassbox/collector-claude-code` — the Claude Code
hooks integration that captures tool invocations into the Ledger.

---

## Completed

- [x] Project naming (Glassbox)
- [x] Architecture design (five-module monorepo)
- [x] Event schema design (events + sessions tables)
- [x] CLAUDE.md and STATUS.md created
- [x] Monorepo scaffold (pnpm workspace, tsconfig, root package.json)
- [x] `@glassbox/core` — schema.ts (TypeScript types)
- [x] `@glassbox/core` — ledger-store.ts (SQLite CRUD, append-only)
- [x] `@glassbox/core` — annotator.ts (reversibility classification)

---

## In Progress

- [ ] `@glassbox/collector-claude-code` — hooks integration
  - PreToolUse hook: capture tool name + input metadata
  - PostToolUse hook: capture exit status and output metadata
  - Tool name → action_type mapping (Read/Write/Bash/WebSearch/MCP)

---

## Up Next

- [ ] `@glassbox/cli` — `glassbox sessions` command
- [ ] `@glassbox/cli` — `glassbox session <id>` command

---

## Backlog (v2)

- [ ] Policy engine (YAML rules, block/warn/log modes)
- [ ] Causal chain analysis (parent_id graph traversal)
- [ ] Time-travel audit UI
- [ ] `@glassbox/collector-codex` — OpenAI Codex CLI integration
- [ ] `@glassbox/collector-openhands` — OpenHands integration
- [ ] `@glassbox/mcp-server` — expose Ledger via MCP

---

## Known Issues / Open Questions

- Claude Code hooks API has no stability guarantee from Anthropic.
  The collector parser must be kept thin so updates only require
  changing the parser, not core.
- The `glassbox` binary name on npm is likely taken. Check before
  publishing `@glassbox/cli`. Fallback: `glassbox-cli`.
- Reversibility classification for `bash_execute` uses heuristics
  (command prefix matching). Edge cases will need a manual override
  mechanism.

---

## Architecture Decisions Log

| ADR | Title | Status |
|-----|-------|--------|
| 001 | Append-only Ledger | Accepted |
| 002 | Metadata not content | Accepted |
| 003 | Monorepo with per-agent collectors | Accepted |

Full ADR documents: `docs/decisions/`

---

## How to Update This File

At the end of each Claude Code session, ask:

> "Update STATUS.md to reflect what we completed today and what
> the next step is."

Keep the Completed list factual (only things that are tested and
working). Keep In Progress to at most 5 items. Move everything
else to Backlog.
