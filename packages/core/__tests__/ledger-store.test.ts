import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerStore } from '../src/ledger-store.js';

describe('LedgerStore', () => {
  let store: LedgerStore;

  beforeEach(() => {
    store = new LedgerStore(':memory:');
  });

  describe('createSession', () => {
    it('returns a session with generated id and active status', () => {
      const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
      expect(session.id).toMatch(/^[a-z0-9_-]+$/i);
      expect(session.agent).toBe('claude-code');
      expect(session.cwd).toBe('/tmp');
      expect(session.status).toBe('active');
      expect(session.ended_at).toBeNull();
      expect(session.task).toBeNull();
    });

    it('stores optional task field', () => {
      const session = store.createSession({ agent: 'claude-code', cwd: '/tmp', task: 'fix bug' });
      expect(session.task).toBe('fix bug');
    });
  });

  describe('endSession', () => {
    it('sets ended_at and status to ended', () => {
      const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
      store.endSession(session.id);
      const updated = store.getSession(session.id);
      expect(updated?.status).toBe('ended');
      expect(updated?.ended_at).not.toBeNull();
    });
  });

  describe('appendEvent', () => {
    it('returns event with auto-incremented seq', () => {
      const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
      const e1 = store.appendEvent({
        session_id: session.id,
        agent: 'claude-code',
        action_type: 'file_read',
        action_data: { path: '/tmp/foo.ts' },
      });
      const e2 = store.appendEvent({
        session_id: session.id,
        agent: 'claude-code',
        action_type: 'file_write',
        action_data: { path: '/tmp/foo.ts', line_delta: 5 },
      });
      expect(e1.seq).toBe(1);
      expect(e2.seq).toBe(2);
    });

    it('stores action_data as structured object', () => {
      const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
      const event = store.appendEvent({
        session_id: session.id,
        agent: 'claude-code',
        action_type: 'bash_execute',
        action_data: { command: 'ls', args: ['-la'] },
      });
      expect(event.action_data).toEqual({ command: 'ls', args: ['-la'] });
    });

    it('throws when session_id does not exist', () => {
      expect(() =>
        store.appendEvent({
          session_id: 'nonexistent',
          agent: 'claude-code',
          action_type: 'file_read',
          action_data: {},
        })
      ).toThrow();
    });
  });

  describe('listSessions', () => {
    it('returns all sessions ordered by started_at desc', () => {
      store.createSession({ agent: 'claude-code', cwd: '/a' });
      store.createSession({ agent: 'claude-code', cwd: '/b' });
      const sessions = store.listSessions();
      expect(sessions).toHaveLength(2);
      expect((sessions[0]?.started_at ?? '') >= (sessions[1]?.started_at ?? '')).toBe(true);
    });
  });

  describe('getEvents', () => {
    it('returns events for a session in seq order', () => {
      const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
      store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: {} });
      store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_write', action_data: {} });
      const events = store.getEvents(session.id);
      expect(events).toHaveLength(2);
      expect(events[0]?.seq).toBe(1);
      expect(events[1]?.seq).toBe(2);
    });

    it('returns empty array for unknown session', () => {
      expect(store.getEvents('nonexistent')).toEqual([]);
    });
  });
});
