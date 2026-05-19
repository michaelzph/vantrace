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

  describe('getOrCreateSession', () => {
    it('creates a session when id does not exist', () => {
      const session = store.getOrCreateSession('ext-123', { agent: 'claude-code', cwd: '/tmp' });
      expect(session.id).toBe('ext-123');
      expect(session.agent).toBe('claude-code');
      expect(session.status).toBe('active');
    });

    it('returns existing session without creating a duplicate', () => {
      store.getOrCreateSession('ext-456', { agent: 'claude-code', cwd: '/tmp' });
      store.getOrCreateSession('ext-456', { agent: 'claude-code', cwd: '/tmp' });
      const all = store.listSessions().filter(s => s.id === 'ext-456');
      expect(all).toHaveLength(1);
    });

    it('returns the existing session on second call (cwd not overwritten)', () => {
      const first = store.getOrCreateSession('ext-789', { agent: 'claude-code', cwd: '/a' });
      const second = store.getOrCreateSession('ext-789', { agent: 'claude-code', cwd: '/b' });
      expect(second.id).toBe('ext-789');
      expect(second.cwd).toBe('/a');
    });
  });

  describe('completions', () => {
    describe('findLastUncompletedEvent', () => {
      it('returns undefined when no events exist', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        const result = store.findLastUncompletedEvent(session.id, 'file_read');
        expect(result).toBeUndefined();
      });

      it('returns the last event of matching action_type', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: { path: '/a' } });
        const e2 = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: { path: '/b' } });
        const result = store.findLastUncompletedEvent(session.id, 'file_read');
        expect(result?.id).toBe(e2.id);
      });

      it('skips events that already have a completion', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        const e1 = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: { path: '/a' } });
        const e2 = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: { path: '/b' } });
        store.recordCompletion({ event_id: e2.id, outcome: 'success' });
        const result = store.findLastUncompletedEvent(session.id, 'file_read');
        expect(result?.id).toBe(e1.id);
      });

      it('returns undefined when all events are completed', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        const e1 = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: {} });
        store.recordCompletion({ event_id: e1.id, outcome: 'success' });
        expect(store.findLastUncompletedEvent(session.id, 'file_read')).toBeUndefined();
      });

      it('does not cross action_type boundaries', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_write', action_data: {} });
        expect(store.findLastUncompletedEvent(session.id, 'file_read')).toBeUndefined();
      });
    });

    describe('recordCompletion', () => {
      it('stores outcome and created_at', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        const e = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'bash_execute', action_data: {} });
        store.recordCompletion({ event_id: e.id, outcome: 'error', error_msg: 'exit 1' });
        const map = store.getCompletions(session.id);
        const c = map.get(e.id);
        expect(c?.outcome).toBe('error');
        expect(c?.error_msg).toBe('exit 1');
        expect(c?.created_at).toBeTruthy();
      });

      it('is idempotent — duplicate recordCompletion does not throw', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        const e = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: {} });
        store.recordCompletion({ event_id: e.id, outcome: 'success' });
        expect(() => store.recordCompletion({ event_id: e.id, outcome: 'success' })).not.toThrow();
      });
    });

    describe('getCompletions', () => {
      it('returns empty map when no completions', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: {} });
        const map = store.getCompletions(session.id);
        expect(map.size).toBe(0);
      });

      it('returns map keyed by event_id for all completions in session', () => {
        const session = store.createSession({ agent: 'claude-code', cwd: '/tmp' });
        const e1 = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_read', action_data: {} });
        const e2 = store.appendEvent({ session_id: session.id, agent: 'claude-code', action_type: 'file_write', action_data: {} });
        store.recordCompletion({ event_id: e1.id, outcome: 'success' });
        store.recordCompletion({ event_id: e2.id, outcome: 'error', error_msg: 'permission denied' });
        const map = store.getCompletions(session.id);
        expect(map.size).toBe(2);
        expect(map.get(e1.id)?.outcome).toBe('success');
        expect(map.get(e2.id)?.error_msg).toBe('permission denied');
      });
    });
  });
});
