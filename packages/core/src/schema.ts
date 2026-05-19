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
  | 'agent_message'
  | 'correction';

export type RiskLevel = 'low' | 'medium' | 'high';
export type SessionStatus = 'active' | 'completed' | 'aborted';
export type SessionOutcome = 'success' | 'partial' | 'failed';

// --- Typed action_data shapes ---

export interface FileReadData    { path: string | null }
export interface FileWriteData   { path: string | null; operation: 'create' | 'patch' | 'replace' | null }
export interface FileDeleteData  { path: string | null }
export interface BashExecuteData { command: string | null }
export interface WebSearchData   { query?: string | null; url?: string | null }
export interface McpToolCallData { server: string; tool: string; input_keys: string[] }
export interface AgentThinkingData { phase: 'planning' | 'reasoning' | 'reflection' | null; decision: string | null; alternatives: string[]; confidence: 'high' | 'medium' | 'low' | null }
export interface UserMessageData  { length: number }
export interface AgentMessageData { length: number }
export interface CorrectionData   { target_event_id: string; reason: string }

// --- result_data shapes (stored in completions, populated from PostToolUse) ---

export interface BashResultData  { exit_code: number | null; stdout_lines: number | null; stderr_lines: number | null; duration_ms: number | null }
export interface FileReadResultData  { size_bytes: number | null }
export interface FileWriteResultData { lines_added: number | null; lines_removed: number | null }
export interface WebSearchResultData { results_count: number | null }

export type ResultData =
  | BashResultData
  | FileReadResultData
  | FileWriteResultData
  | WebSearchResultData
  | Record<string, never>;

// --- Core interfaces ---

export interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  agent: string;
  task: string | null;
  cwd: string;
  status: SessionStatus;
  outcome: SessionOutcome | null;
  user_rating: number | null;
}

export interface Event {
  id: string;
  session_id: string;
  seq: number;
  created_at: string;
  agent: string;
  agent_ver: string | null;
  action_type: ActionType;
  action_data: Record<string, unknown>;
  reversible: 0 | 1 | null;
  risk_level: RiskLevel | null;
  parent_ids: string[] | null;
  policy_tags: string[] | null;
  policy_result: string | null;
}

export interface Completion {
  event_id: string;
  outcome: 'success' | 'error';
  error_msg: string | null;
  result_data: ResultData | null;
  created_at: string;
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
  parent_ids?: string[];
  policy_tags?: string[];
  policy_result?: string;
}

export interface Annotation {
  reversible: 0 | 1 | null;
  risk_level: RiskLevel;
}

export interface RecordCompletionInput {
  event_id: string;
  outcome: 'success' | 'error';
  error_msg?: string;
  result_data?: ResultData;
}
