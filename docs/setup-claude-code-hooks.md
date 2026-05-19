# Setting Up Claude Code Hooks

After building Vantrace, wire the hook binary into your Claude Code project.

## 1. Build the hook binary

From the vantrace repo root:

```bash
pnpm build
```

## 2. Add hooks to your project's Claude Code settings

Create or edit `.claude/settings.json` in the project you want to audit:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["/absolute/path/to/vantrace/packages/collector-claude-code/dist/cli.js"]
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "node",
            "args": ["/absolute/path/to/vantrace/packages/collector-claude-code/dist/cli.js"]
          }
        ]
      }
    ]
  }
}
```

Replace `/absolute/path/to/vantrace` with the actual path to your vantrace repo.

## 3. Verify events are being captured

After a Claude Code session, inspect the Ledger:

```bash
node -e "
import { LedgerStore } from './packages/core/dist/index.js';
const store = new LedgerStore(process.env.HOME + '/.vantrace/vantrace.db');
const sessions = store.listSessions();
console.log('Sessions:', sessions.length);
for (const s of sessions) {
  const events = store.getEvents(s.id);
  console.log(s.id, '-', events.length, 'events');
}
store.close();
" --input-type=module
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VANTRACE_DB` | `~/.vantrace/vantrace.db` | Path to the SQLite database |
