import React from 'react';
import { Box, Text } from 'ink';
import type { Session } from '@vantrace/core';
import { pad, formatDate } from './format.js';

interface Props {
  sessions: Session[];
  eventCounts: Map<string, number>;
}

export function SessionsList({ sessions, eventCounts }: Props) {
  if (sessions.length === 0) {
    return <Text color="gray">No sessions found. Run Claude Code with Vantrace hooks enabled.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">{pad('SESSION ID', 24)}</Text>
        <Text bold color="cyan">{pad('STARTED', 14)}</Text>
        <Text bold color="cyan">{pad('STATUS', 8)}</Text>
        <Text bold color="cyan">{pad('EVENTS', 7)}</Text>
        <Text bold color="cyan">CWD</Text>
      </Box>
      {sessions.map(s => {
        const cwdWidth = Math.max(20, (process.stdout.columns ?? 80) - 53);
        return (
          <Box key={s.id}>
            <Text>{pad(s.id, 24)}</Text>
            <Text>{pad(formatDate(s.started_at), 14)}</Text>
            <Text color={s.status === 'active' ? 'green' : 'gray'}>{pad(s.status, 8)}</Text>
            <Text>{pad(String(eventCounts.get(s.id) ?? 0), 7)}</Text>
            <Text color="gray">{pad(s.cwd, cwdWidth).trimEnd()}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
