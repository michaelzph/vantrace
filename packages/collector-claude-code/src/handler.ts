import { LedgerStore, annotate, type ResultData } from '@vantrace/core';
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

function extractResultData(action_type: string, tool_response: unknown): ResultData | null {
  if (typeof tool_response !== 'object' || tool_response === null) return null;
  const r = tool_response as Record<string, unknown>;

  switch (action_type) {
    case 'bash_execute': {
      const output = typeof r['output'] === 'string' ? r['output'] : null;
      return {
        exit_code: typeof r['exit_code'] === 'number' ? r['exit_code'] : null,
        stdout_lines: output !== null ? output.split('\n').filter(l => l.length > 0).length : null,
        stderr_lines: typeof r['stderr'] === 'string' ? r['stderr'].split('\n').filter(l => l.length > 0).length : null,
        duration_ms: typeof r['duration_ms'] === 'number' ? r['duration_ms'] : null,
      };
    }
    case 'file_read': {
      return {
        size_bytes: typeof r['size'] === 'number' ? r['size'] : null,
      };
    }
    case 'file_write': {
      return {
        lines_added: typeof r['lines_added'] === 'number' ? r['lines_added'] : null,
        lines_removed: typeof r['lines_removed'] === 'number' ? r['lines_removed'] : null,
      };
    }
    case 'web_search': {
      return {
        results_count: typeof r['results_count'] === 'number' ? r['results_count'] : null,
      };
    }
    default:
      return null;
  }
}

export function processHookPayload(payload: HookPayload, store: LedgerStore): void {
  if ('tool_response' in payload) {
    const { action_type } = mapTool(payload.tool_name, payload.tool_input);
    const event = store.findLastUncompletedEvent(payload.session_id, action_type);
    if (event) {
      const { outcome, error_msg } = parseOutcome(payload.tool_response);
      const result_data = extractResultData(action_type, payload.tool_response);
      const completionInput: Parameters<typeof store.recordCompletion>[0] = { event_id: event.id, outcome };
      if (error_msg !== null) completionInput.error_msg = error_msg;
      if (result_data !== null) completionInput.result_data = result_data;
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
