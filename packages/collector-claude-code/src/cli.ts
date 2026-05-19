import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { LedgerStore } from '@glassbox/core';
import { processHookPayload } from './handler.js';
import type { HookPayload } from './handler.js';

function getDbPath(): string {
  return process.env['GLASSBOX_DB'] ?? join(homedir(), '.glassbox', 'glassbox.db');
}

async function main(): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (!raw) return;

  let payload: HookPayload;
  try {
    payload = JSON.parse(raw) as HookPayload;
  } catch {
    return;
  }

  const dbPath = getDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });
  const store = new LedgerStore(dbPath);

  try {
    processHookPayload(payload, store);
  } catch {
    // Never let errors block Claude Code
  } finally {
    store.close();
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(0));
