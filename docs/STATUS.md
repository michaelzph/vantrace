# Vantrace — Development Status

> This file is updated at the end of every development session.
> It is the source of truth for current progress and next steps.
> Last updated: 2026-05-20

---

## Product Vision

Vantrace is the behavior data layer for AI agents.

```
Audit the past         →  v1    capture and review agent behavior
Understand the present →  v1.5  diagnose patterns and inefficiencies
Improve the future     →  v2    optimize agents using behavior data
```

The audit capability is the entry point. The data accumulated is
the long-term asset. Every schema decision should serve all three
phases, not just the current one.

---

## Current Focus

Schema gaps are closed. The implementation now matches the CLAUDE.md spec
and accumulated data is ready for v1.5 analytics.

Next: `vantrace audit <id>` CLI command — a human-readable session summary
report that presents what an agent did in a single session.

---

## Completed

- [x] Project naming, architecture design, CLAUDE.md, STATUS.md
- [x] Monorepo scaffold (pnpm workspace, tsconfig, root package.json)
- [x] `@vantrace/core` — schema.ts (TypeScript types)
- [x] `@vantrace/core` — ledger-store.ts (SQLite, append-only)
- [x] `@vantrace/core` — annotator.ts (reversibility classification)
- [x] `@vantrace/core` — completions table (PreToolUse → PostToolUse linkage)
- [x] `@vantrace/collector-claude-code` — PreToolUse hook: captures tool name + input metadata
- [x] `@vantrace/collector-claude-code` — PostToolUse hook: records success/error outcome
- [x] `@vantrace/collector-claude-code` — tool name → action_type mapping
- [x] `@vantrace/cli` — `vantrace sessions` command
- [x] `@vantrace/cli` — `vantrace session <id>` command with OUT column
- [x] `@vantrace/mcp-server` — list_sessions, get_session, get_events
- [x] MCP server wired into Claude Code project settings
- [x] README, LICENSE (MIT), .gitignore, scripts/setup.sh
- [x] Published to GitHub (michaelzph/vantrace), topics set
- [x] Schema gaps closed — `parent_ids` array, `session.outcome/user_rating`, `completions.result_data`
- [x] collector: `file_write` operation field (`create`/`patch`), `mcp_tool_call` input_keys
- [x] collector: PostToolUse extracts `stdout_lines`, `size_bytes`, `exit_code`, `results_count` into result_data

---

## Up Next (immediate)

## Up Next (immediate)

- [ ] `vantrace audit <id>` CLI command — human-readable session summary report
- [ ] `sessions.task` field — capture from first user message (needs hook or startup event)
- [ ] `agent_thinking` action type — blocked on Claude Code exposing thinking blocks in hooks

## Up Next (after above)

- [ ] v1.5: `vantrace insights` command — session stats, inefficiency detection

---

## v1.5 Backlog — Diagnostic Analytics

> Goal: surface patterns in accumulated behavior data.
> No ML required — pure statistical analysis over the Ledger.

- [ ] Session statistics (avg steps per task type, tool usage breakdown)
- [ ] Inefficiency detection (repeated read-write cycles on same file)
- [ ] Irreversible action report (frequency, context, task correlation)
- [ ] Agent thinking analysis (decision confidence distribution)
- [ ] `vantrace insights` CLI command

---

## v2 Backlog — Agent Optimization

> Goal: use accumulated behavior data to improve agent performance.
> All processing local unless user explicitly opts in.

- [ ] Implicit feedback signal (user corrections → reward signal)
- [ ] Explicit feedback collection (user_rating on session close)
- [ ] Training data export (successful trajectories → JSONL for SFT)
- [ ] Personal optimization suggestions (based on local history)
- [ ] CLAUDE.md auto-improvement suggestions

---

## Long-term Backlog

- [ ] Policy engine (YAML rules, block/warn/log modes)
- [ ] Causal chain analysis (parent_ids graph traversal)
- [ ] Time-travel audit UI (web)
- [ ] `@vantrace/collector-codex` — OpenAI Codex CLI integration
- [ ] `@vantrace/collector-openhands` — OpenHands integration
- [ ] Federated analytics (privacy-preserving, opt-in)

---

## Known Issues / Open Questions

- Claude Code hooks API has no stability guarantee from Anthropic.
  The collector parser must be kept thin so updates only require
  changing the parser, not core.
- Reversibility classification for `bash_execute` uses heuristics
  (command prefix matching). Edge cases will need a manual override
  mechanism.
- `agent_thinking` data availability depends on whether the agent
  exposes its reasoning. Claude Code exposes thinking blocks;
  other agents may not. Collector must handle absence gracefully.
- `user_rating` collection UX is undefined for v1. Options:
  (a) prompt on session end in CLI, (b) explicit `vantrace rate`
  command, (c) infer from user behavior. Decision deferred to v1.5.
- `bash_execute` PostToolUse currently provides outcome (ok/err) but
  not exit_code / stdout_lines / duration_ms — these require parsing
  Claude Code's tool_response format, which needs investigation.

---

## Architecture Decisions Log

| ADR | Title                                       | Status   |
|-----|---------------------------------------------|----------|
| 001 | Append-only Ledger                          | Accepted |
| 002 | Metadata not content                        | Accepted |
| 003 | Monorepo with per-agent collectors          | Accepted |
| 004 | parent_ids as array for multi-causal chains | Accepted |
| 005 | Schema fields for optimization from day one | Accepted |

Full ADR documents: `docs/decisions/`

---

## How to Update This File

At the end of each Claude Code session, ask:

> "Update docs/STATUS.md to reflect what we completed today
> and what the next step is."

Keep the Completed list factual (only things that are tested and
working). Keep In Progress to at most 5 items. Move everything
else to the appropriate backlog section.
