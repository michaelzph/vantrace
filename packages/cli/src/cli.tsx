import React from 'react';
import { render } from 'ink';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { existsSync } from 'node:fs';
import { LedgerStore } from '@vantrace/core';
import { SessionsList } from './sessions-list.js';
import { SessionDetail } from './session-detail.js';

const args = process.argv.slice(2);
const dbPath = process.env['VANTRACE_DB'] ?? join(homedir(), '.vantrace', 'vantrace.db');

if (!existsSync(dbPath)) {
  console.error(`No Vantrace database found at: ${dbPath}`);
  console.error('Run Claude Code with Vantrace hooks enabled first.');
  process.exit(1);
}

const store = new LedgerStore(dbPath);

const cmd = args[0];

if (cmd === 'session' && args[1]) {
  const sessionId = args[1];
  const session = store.getSession(sessionId);
  const events = store.getEvents(sessionId);
  const completions = store.getCompletions(sessionId);
  store.close();
  render(<SessionDetail session={session} events={events} completions={completions} />);
} else if (cmd === 'sessions' || cmd === undefined) {
  const sessions = store.listSessions();
  const eventCounts = new Map<string, number>();
  for (const s of sessions) {
    eventCounts.set(s.id, store.getEvents(s.id).length);
  }
  store.close();
  render(<SessionsList sessions={sessions} eventCounts={eventCounts} />);
} else {
  store.close();
  console.error(`Unknown command: ${cmd}`);
  console.error('Usage:');
  console.error('  vantrace sessions          List all sessions');
  console.error('  vantrace session <id>      Show events for a session');
  process.exit(1);
}
