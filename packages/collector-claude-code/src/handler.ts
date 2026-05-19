import { LedgerStore, annotate } from '@vantrace/core';
import { mapTool } from './mapper.js';

export interface HookPayload {
  session_id: string;
  cwd: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response?: unknown;
}

function parseOutcome(tool_response: unknown): { outcome: 'success' | 'error'; error_msg: string | null } {
  if (typeof tool_response !== 'object' || tool_response === null) {
    return { outcome: 'success', error_msg: null };
  }
  const r = tool_response as Record<string, unknown>;
  if (r['type'] === 'tool_error' || r['type'] === 'error' || 'error' in r) {
    const msg = typeof r['error'] === 'string' ? r['error'] :
                typeof r['message'] === 'string' ? r['message'] : null;
    return { outcome: 'error', error_msg: msg };
  }
  return { outcome: 'success', error_msg: null };
}

export function processHookPayload(payload: HookPayload, store: LedgerStore): void {
  if ('tool_response' in payload) {
    const { action_type } = mapTool(payload.tool_name, payload.tool_input);
    const event = store.findLastUncompletedEvent(payload.session_id, action_type);
    if (event) {
      const { outcome, error_msg } = parseOutcome(payload.tool_response);
      const completionInput: Parameters<typeof store.recordCompletion>[0] = { event_id: event.id, outcome };
      if (error_msg !== null) completionInput.error_msg = error_msg;
      store.recordCompletion(completionInput);
    }
    return;
  }

  store.getOrCreateSession(payload.session_id, {
    agent: 'claude-code',
    cwd: payload.cwd,
  });

  const { action_type, action_data } = mapTool(payload.tool_name, payload.tool_input);
  const { reversible, risk_level } = annotate(action_type, action_data);

  store.appendEvent({
    session_id: payload.session_id,
    agent: 'claude-code',
    action_type,
    action_data,
    reversible,
    risk_level,
  });
}
