import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerStore } from '@glassbox/core';
import { processHookPayload } from '../src/handler.js';
import type { HookPayload } from '../src/handler.js';

describe('processHookPayload', () => {
  let store: LedgerStore;

  beforeEach(() => {
    store = new LedgerStore(':memory:');
  });

  it('creates a session on first call and appends an event', () => {
    const payload: HookPayload = {
      session_id: 'cc-sess-001',
      cwd: '/tmp/project',
      tool_name: 'Read',
      tool_input: { file_path: '/tmp/project/foo.ts' },
    };

    processHookPayload(payload, store);

    const session = store.getSession('cc-sess-001');
    expect(session).toBeDefined();
    expect(session?.agent).toBe('claude-code');
    expect(session?.cwd).toBe('/tmp/project');

    const events = store.getEvents('cc-sess-001');
    expect(events).toHaveLength(1);
    expect(events[0]?.action_type).toBe('file_read');
    expect(events[0]?.action_data).toEqual({ path: '/tmp/project/foo.ts' });
    expect(events[0]?.reversible).toBe(1);
    expect(events[0]?.risk_level).toBe('low');
  });

  it('reuses existing session on subsequent calls', () => {
    const payload: HookPayload = {
      session_id: 'cc-sess-002',
      cwd: '/tmp',
      tool_name: 'Read',
      tool_input: { file_path: '/tmp/a.ts' },
    };

    processHookPayload(payload, store);
    processHookPayload({ ...payload, tool_input: { file_path: '/tmp/b.ts' } }, store);

    const sessions = store.listSessions().filter(s => s.id === 'cc-sess-002');
    expect(sessions).toHaveLength(1);

    const events = store.getEvents('cc-sess-002');
    expect(events).toHaveLength(2);
  });

  it('maps Bash command and annotates correctly', () => {
    const payload: HookPayload = {
      session_id: 'cc-sess-003',
      cwd: '/tmp',
      tool_name: 'Bash',
      tool_input: { command: 'rm -rf dist' },
    };

    processHookPayload(payload, store);

    const events = store.getEvents('cc-sess-003');
    expect(events[0]?.action_type).toBe('bash_execute');
    expect(events[0]?.action_data).toEqual({ command: 'rm -rf dist' });
    expect(events[0]?.reversible).toBe(0);
    expect(events[0]?.risk_level).toBe('high');
  });

  it('ignores PostToolUse payloads (has tool_response field)', () => {
    const payload: HookPayload = {
      session_id: 'cc-sess-004',
      cwd: '/tmp',
      tool_name: 'Read',
      tool_input: { file_path: '/tmp/foo.ts' },
      tool_response: { type: 'text', text: 'file contents here' },
    };

    processHookPayload(payload, store);

    const events = store.getEvents('cc-sess-004');
    expect(events).toHaveLength(0);
  });

  it('sets seq correctly for multiple events', () => {
    const payload: HookPayload = {
      session_id: 'cc-sess-005',
      cwd: '/tmp',
      tool_name: 'Read',
      tool_input: { file_path: '/tmp/a.ts' },
    };

    processHookPayload(payload, store);
    processHookPayload({ ...payload, tool_name: 'Write', tool_input: { file_path: '/tmp/b.ts' } }, store);

    const events = store.getEvents('cc-sess-005');
    expect(events[0]?.seq).toBe(1);
    expect(events[1]?.seq).toBe(2);
  });
});
