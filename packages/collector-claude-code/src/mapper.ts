import type { ActionType } from '@vantrace/core';

export interface MappedAction {
  action_type: ActionType;
  action_data: Record<string, unknown>;
}

export function mapTool(
  tool_name: string,
  tool_input: Record<string, unknown>
): MappedAction {
  if (tool_name.startsWith('mcp__')) {
    const parts = tool_name.split('__');
    return {
      action_type: 'mcp_tool_call',
      action_data: {
        tool: tool_name,
        server: parts[1] || 'unknown',
        operation: parts[2] || 'unknown',
      },
    };
  }

  switch (tool_name) {
    case 'Read':
      return {
        action_type: 'file_read',
        action_data: { path: tool_input['file_path'] ?? null },
      };

    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      return {
        action_type: 'file_write',
        action_data: { path: tool_input['file_path'] ?? null },
      };

    case 'NotebookEdit':
      return {
        action_type: 'file_write',
        action_data: { path: tool_input['notebook_path'] ?? null },
      };

    case 'Bash': {
      const cmd = tool_input['command'];
      return {
        action_type: 'bash_execute',
        action_data: {
          command: typeof cmd === 'string' ? cmd.slice(0, 500) : null,
        },
      };
    }

    case 'WebSearch':
      return {
        action_type: 'web_search',
        action_data: { query: tool_input['query'] ?? null },
      };

    case 'WebFetch':
      return {
        action_type: 'web_search',
        action_data: { url: tool_input['url'] ?? null },
      };

    case 'Think':
    case 'ThinkingTool':
      return {
        action_type: 'agent_thinking',
        action_data: {},
      };

    default:
      return {
        action_type: 'mcp_tool_call',
        action_data: { tool: tool_name },
      };
  }
}
