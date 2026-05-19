# Vantrace — Development Status

> This file is updated at the end of every development session.
> It is the source of truth for current progress and next steps.
> Last updated: 2026-05-19

---

## Current Focus

Glassbox MVP is complete. All four packages are implemented and
wired together end-to-end. Next focus: policy engine (v2).

---

## Completed

- [x] Project naming (Vantrace)
- [x] Architecture design (five-module monorepo)
- [x] Event schema design (events + sessions tables)
- [x] CLAUDE.md and STATUS.md created
- [x] Monorepo scaffold (pnpm workspace, tsconfig, root package.json)
- [x] `@vantrace/core` — schema.ts (TypeScript types)
- [x] `@vantrace/core` — ledger-store.ts (SQLite, append-only)
- [x] `@vantrace/core` — annotator.ts (reversibility classification)
- [x] `@vantrace/core` — completions table (findLastUncompletedEvent, recordCompletion, getCompletions)
- [x] `@vantrace/collector-claude-code` — PreToolUse hook: captures tool name + input metadata
- [x] `@vantrace/collector-claude-code` — PostToolUse hook: records success/error outcome per event
- [x] `@vantrace/collector-claude-code` — tool name → action_type mapping
- [x] `@vantrace/cli` — `vantrace sessions` command
- [x] `@vantrace/cli` — `vantrace session <id>` command with OUT column (ok/err/?)
- [x] `@vantrace/mcp-server` — list_sessions, get_session, get_events (includes outcome + error_msg)
- [x] MCP server wired into Claude Code project settings

---

## In Progress

_(nothing — MVP is complete)_

---

## Up Next

- [ ] Policy engine — YAML rules, block/warn/log modes
- [ ] Causal chain analysis — parent_id graph traversal

---

## Backlog (v2)

- [ ] Policy engine (YAML rules, block/warn/log modes)
- [ ] Causal chain analysis (parent_id graph traversal)
- [ ] Time-travel audit UI
- [ ] `@vantrace/collector-codex` — OpenAI Codex CLI integration
- [ ] `@vantrace/collector-openhands` — OpenHands integration
- [ ] `@vantrace/mcp-server` — expose Ledger via MCP

---

## Known Issues / Open Questions

- Claude Code hooks API has no stability guarantee from Anthropic.
  The collector parser must be kept thin so updates only require
  changing the parser, not core.
- Reversibility classification for `bash_execute` uses heuristics
  (command prefix matching). Edge cases will need a manual override
  mechanism.

---

## Architecture Decisions Log

| ADR | Title                                  | Status   |
|-----|----------------------------------------|----------|
| 001 | Append-only Ledger                     | Accepted |
| 002 | Metadata not content                   | Accepted |
| 003 | Monorepo with per-agent collectors     | Accepted |

Full ADR documents: `docs/decisions/`

---

## How to Update This File

At the end of each Claude Code session, ask:

> "Update docs/STATUS.md to reflect what we completed today
> and what the next step is."

Keep the Completed list factual (only things that are tested and
working). Keep In Progress to at most 5 items. Move everything
else to Backlog.