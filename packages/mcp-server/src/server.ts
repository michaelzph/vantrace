import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
import { LedgerStore } from '@vantrace/core';
import {
  makeListSessionsHandler,
  makeGetSessionHandler,
  makeGetEventsHandler,
} from './tools.js';

function getDbPath(): string {
  return process.env['VANTRACE_DB'] ?? join(homedir(), '.vantrace', 'vantrace.db');
}

async function main(): Promise<void> {
  let store: LedgerStore;
  try {
    const dbPath = getDbPath();
    mkdirSync(dirname(dbPath), { recursive: true });
    store = new LedgerStore(dbPath);
  } catch (e) {
    console.error('vantrace-mcp: failed to initialize:', e instanceof Error ? e.message : e);
    process.exit(1);
    return;
  }

  process.on('SIGINT', () => { store.close(); process.exit(0); });
  process.on('SIGTERM', () => { store.close(); process.exit(0); });

  const server = new McpServer({ name: 'vantrace', version: '0.1.0' });

  server.tool(
    'list_sessions',
    'List recent Vantrace audit sessions. Returns sessions in descending order by start time.',
    { limit: z.number().int().positive().optional().describe('Max sessions to return (default 20)') },
    makeListSessionsHandler(store)
  );

  server.tool(
    'get_session',
    'Get metadata for a specific Vantrace session by ID.',
    { session_id: z.string().describe('The session ID') },
    makeGetSessionHandler(store)
  );

  server.tool(
    'get_events',
    'Get all recorded tool-call events for a Vantrace session.',
    { session_id: z.string().describe('The session ID') },
    makeGetEventsHandler(store)
  );

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (e) {
    console.error('vantrace-mcp: failed to start server:', e instanceof Error ? e.message : e);
    store.close();
    process.exit(1);
  }
}

main();
