import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerStore } from '@vantrace/core';
import {
  makeListSessionsHandler,
  makeGetSessionHandler,
  makeGetEventsHandler,
} from '../src/tools.js';

describe('makeListSessionsHandler', () => {
  let store: LedgerStore;

  beforeEach(() => {
    store = new LedgerStore(':memory:');
  });

  it('returns empty array when no sessions', async () => {
    const handler = makeListSessionsHandler(store);
    const result = await handler({});
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toEqual([]);
  });

  it('returns sessions in descending order', async () => {
    store.createSession({ agent: 'claude-code', cwd: '/a' });
    store.createSession({ agent: 'claude-code', cwd: '/b' });
    const handler = makeListSessionsHandler(store);
    const result = await handler({});
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].cwd).toBe('/b');
  });

  it('respects limit param', async () => {
    for (let i = 0; i < 5; i++) {
      store.createSession({ agent: 'claude-code', cwd: `/p${i}` });
    }
    const handler = makeListSessionsHandler(store);
    const result = await handler({ limit: 3 });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(3);
  });
});

describe('makeGetSessionHandler', () => {
  let store: LedgerStore;

  beforeEach(() => {
    store = new LedgerStore(':memory:');
  });

  it('returns session data for existing id', async () => {
    const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
    const handler = makeGetSessionHandler(store);
    const result = await handler({ session_id: session.id });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed.id).toBe(session.id);
    expect(parsed.cwd).toBe('/tmp');
    expect(parsed.status).toBe('active');
  });

  it('returns error text for unknown id', async () => {
    const handler = makeGetSessionHandler(store);
    const result = await handler({ session_id: 'does-not-exist' });
    expect(result.content[0]!.text).toContain('not found');
  });
});

describe('makeGetEventsHandler', () => {
  let store: LedgerStore;

  beforeEach(() => {
    store = new LedgerStore(':memory:');
  });

  it('returns empty array when session has no events', async () => {
    const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
    const handler = makeGetEventsHandler(store);
    const result = await handler({ session_id: session.id });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toEqual([]);
  });

  it('returns events in seq order', async () => {
    const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
    store.appendEvent({
      session_id: session.id,
      agent: 'claude-code',
      action_type: 'file_read',
      action_data: { path: '/a.ts' },
    });
    store.appendEvent({
      session_id: session.id,
      agent: 'claude-code',
      action_type: 'file_write',
      action_data: { path: '/b.ts' },
    });
    const handler = makeGetEventsHandler(store);
    const result = await handler({ session_id: session.id });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].seq).toBe(1);
    expect(parsed[1].seq).toBe(2);
    expect(parsed[0].action_type).toBe('file_read');
  });

  it('returns empty array for unknown session_id', async () => {
    const handler = makeGetEventsHandler(store);
    const result = await handler({ session_id: 'ghost' });
    const parsed = JSON.parse(result.content[0]!.text);
    expect(parsed).toEqual([]);
  });
});
