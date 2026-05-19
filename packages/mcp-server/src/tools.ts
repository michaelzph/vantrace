import type { LedgerStore } from '@vantrace/core';

type TextContent = { type: 'text'; text: string };
type ToolResult = { content: TextContent[]; isError?: boolean };

function ok(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: 'text', text: msg }], isError: true };
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
    if (!store.getSession(session_id)) return err(`Session '${session_id}' not found`);
    const events = store.getEvents(session_id);
    const completions = store.getCompletions(session_id);
    const enriched = events.map(e => ({
      ...e,
      outcome: completions.get(e.id)?.outcome ?? null,
      error_msg: completions.get(e.id)?.error_msg ?? null,
    }));
    return ok(enriched);
  };
}
