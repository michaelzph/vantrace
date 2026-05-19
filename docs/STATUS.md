# Glassbox — Development Status

> This file is updated at the end of every development session.
> It is the source of truth for current progress and next steps.
> Last updated: 2026-05-19

---

## Current Focus

MVP is complete. All three packages are implemented and tested. Next focus: polish and v2 features.

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
- [x] `@glassbox/collector-claude-code` — hooks integration
  - [x] PreToolUse hook: capture tool name + input metadata
  - [x] PostToolUse hook: exit 0 silently (capture deferred to v2)
  - [x] Tool name → action_type mapping (Read/Write/Edit/MultiEdit/NotebookEdit/Bash/WebSearch/WebFetch/MCP)
- [x] `@glassbox/cli` — `glassbox sessions` command
- [x] `@glassbox/cli` — `glassbox session <id>` command

---

## In Progress

(none)

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

- PostToolUse capture is not implemented (deferred to v2). Only PreToolUse events are recorded.
  Failed tool calls still appear as events in the Ledger.
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
