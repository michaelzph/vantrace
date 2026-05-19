import type { ActionType, Annotation } from './schema.js';

const SAFE_PREFIXES = [
  'ls', 'cat', 'echo', 'grep', 'find', 'pwd', 'which', 'head', 'tail',
  'wc', 'sort', 'uniq', 'diff', 'file', 'stat', 'du', 'df',
  'git status', 'git log', 'git diff', 'git show', 'git branch',
];

const DESTRUCTIVE_PREFIXES = [
  'rm', 'git reset', 'git push', 'git rebase', 'git clean',
  'drop table', 'truncate', 'pkill', 'kill',
];

const STATE_CHANGE_PREFIXES = [
  'mkdir', 'cp', 'mv', 'chmod', 'chown', 'touch', 'ln',
  'npm', 'pnpm', 'yarn', 'pip', 'brew',
  'git commit', 'git add', 'git checkout', 'git stash',
  'git merge', 'git tag',
];

export function annotate(
  action_type: ActionType,
  action_data: Record<string, unknown>
): Annotation {
  switch (action_type) {
    case 'file_read':
      return { reversible: 1, risk_level: 'low' };

    case 'file_write':
      return { reversible: 0, risk_level: 'medium' };

    case 'file_delete':
      return { reversible: 0, risk_level: 'high' };

    case 'web_search':
      return { reversible: 1, risk_level: 'low' };

    case 'agent_thinking':
    case 'user_message':
    case 'agent_message':
      return { reversible: 1, risk_level: 'low' };

    case 'mcp_tool_call':
      return { reversible: null, risk_level: 'medium' };

    case 'bash_execute': {
      const command = typeof action_data['command'] === 'string'
        ? action_data['command'].trim().toLowerCase()
        : '';
      if (DESTRUCTIVE_PREFIXES.some(p => command.startsWith(p + ' ') || command === p)) {
        return { reversible: 0, risk_level: 'high' };
      }
      if (SAFE_PREFIXES.some(p => command.startsWith(p + ' ') || command === p)) {
        return { reversible: 1, risk_level: 'low' };
      }
      if (STATE_CHANGE_PREFIXES.some(p => command.startsWith(p + ' ') || command === p)) {
        return { reversible: 0, risk_level: 'medium' };
      }
      return { reversible: null, risk_level: 'medium' };
    }
  }
}
