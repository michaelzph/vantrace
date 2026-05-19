import { LedgerStore, annotate } from '@glassbox/core';
import { mapTool } from './mapper.js';

export interface HookPayload {
  session_id: string;
  cwd: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response?: unknown;
}

export function processHookPayload(payload: HookPayload, store: LedgerStore): void {
  if ('tool_response' in payload) return;

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
