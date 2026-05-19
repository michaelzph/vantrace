import type { LedgerStore } from '@vantrace/core';

type TextContent = { type: 'text'; text: string };
type ToolResult = { content: [TextContent] };

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }] };
}

export function makeListSessionsHandler(store: LedgerStore) {
  return async ({ limit = 20 }: { limit?: number }): Promise<ToolResult> => {
    const sessions = store.listSessions().slice(0, limit);
    return ok(sessions);
  };
}

export function makeGetSessionHandler(store: LedgerStore) {
  return async ({ session_id }: { session_id: string }): Promise<ToolResult> => {
    const session = store.getSession(session_id);
    if (!session) return err(`Session '${session_id}' not found`);
    return ok(session);
  };
}

export function makeGetEventsHandler(store: LedgerStore) {
  return async ({ session_id }: { session_id: string }): Promise<ToolResult> => {
    const events = store.getEvents(session_id);
    return ok(events);
  };
}
