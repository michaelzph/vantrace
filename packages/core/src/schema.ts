// packages/core/src/schema.ts

export type ActionType =
  | 'file_read'
  | 'file_write'
  | 'file_delete'
  | 'bash_execute'
  | 'web_search'
  | 'mcp_tool_call'
  | 'agent_thinking'
  | 'user_message'
  | 'agent_message';

export type RiskLevel = 'low' | 'medium' | 'high';

export type SessionStatus = 'active' | 'ended';

export interface Session {
  id: string;
  started_at: string;       // ISO 8601
  ended_at: string | null;
  agent: string;
  task: string | null;
  cwd: string;
  status: SessionStatus;
}

export interface Event {
  id: string;
  session_id: string;
  seq: number;
  created_at: string;       // ISO 8601
  agent: string;
  agent_ver: string | null;
  action_type: ActionType;
  action_data: Record<string, unknown>;
  reversible: 0 | 1 | null;
  risk_level: RiskLevel | null;
  parent_id: string | null;
  policy_tags: string[] | null;
  policy_result: string | null;
}

export interface CreateSessionInput {
  agent: string;
  task?: string;
  cwd: string;
}

export interface AppendEventInput {
  session_id: string;
  agent: string;
  agent_ver?: string;
  action_type: ActionType;
  action_data: Record<string, unknown>;
  reversible?: 0 | 1 | null;
  risk_level?: RiskLevel | null;
  parent_id?: string;
  policy_tags?: string[];
  policy_result?: string;
}

export interface Annotation {
  reversible: 0 | 1 | null;
  risk_level: RiskLevel;
}

export interface Completion {
  event_id: string;
  outcome: 'success' | 'error';
  error_msg: string | null;
  created_at: string;
}

export interface RecordCompletionInput {
  event_id: string;
  outcome: 'success' | 'error';
  error_msg?: string;
}
