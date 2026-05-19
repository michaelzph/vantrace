import React from 'react';
import { Box, Text } from 'ink';
import type { Session, Event, Completion } from '@vantrace/core';
import { pad, formatDate, formatTime, revStr, formatActionData, riskColor, outcomeStr, outcomeColor } from './format.js';

interface Props {
  session: Session | undefined;
  events: Event[];
  completions: Map<string, Completion>;
}

export function SessionDetail({ session, events, completions }: Props) {
  if (!session) {
    return <Text color="red">Session not found.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} flexWrap="wrap">
        <Text bold>Session: </Text><Text>{session.id}  </Text>
        <Text bold>Agent: </Text><Text>{session.agent}  </Text>
        <Text bold>CWD: </Text><Text>{session.cwd}  </Text>
        <Text bold>Started: </Text><Text>{formatDate(session.started_at)}  </Text>
        <Text bold>Status: </Text>
        <Text color={session.status === 'active' ? 'green' : 'gray'}>{session.status}</Text>
      </Box>

      {events.length === 0 ? (
        <Text color="gray">No events recorded.</Text>
      ) : (
        <Box flexDirection="column">
          <Box>
            <Text bold color="cyan">{pad('SEQ', 5)}</Text>
            <Text bold color="cyan">{pad('TIME', 10)}</Text>
            <Text bold color="cyan">{pad('ACTION', 17)}</Text>
            <Text bold color="cyan">{pad('RISK', 8)}</Text>
            <Text bold color="cyan">{pad('REV', 5)}</Text>
            <Text bold color="cyan">{pad('OUT', 5)}</Text>
            <Text bold color="cyan">DATA</Text>
          </Box>
          {events.map(e => {
            const completion = completions.get(e.id);
            const dataWidth = Math.max(20, (process.stdout.columns ?? 80) - 50);
            return (
              <Box key={e.id}>
                <Text>{pad(String(e.seq), 5)}</Text>
                <Text>{pad(formatTime(e.created_at), 10)}</Text>
                <Text>{pad(e.action_type, 17)}</Text>
                <Text color={riskColor(e.risk_level)}>{pad(e.risk_level ?? '?', 8)}</Text>
                <Text>{pad(revStr(e.reversible), 5)}</Text>
                <Text color={outcomeColor(completion?.outcome)}>{pad(outcomeStr(completion?.outcome), 5)}</Text>
                <Text color="gray">{formatActionData(e.action_data, dataWidth)}</Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
