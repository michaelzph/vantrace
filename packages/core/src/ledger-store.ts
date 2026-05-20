import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import type {
  Session,
  Event,
  Completion,
  ResultData,
  CreateSessionInput,
  AppendEventInput,
  RecordCompletionInput,
} from './schema.js';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  started_at  TEXT NOT NULL,
  ended_at    TEXT,
  agent       TEXT NOT NULL,
  task        TEXT,
  cwd         TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  outcome     TEXT,
  user_rating INTEGER
);

CREATE TABLE IF NOT EXISTS events (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL REFERENCES sessions(id),
  seq           INTEGER NOT NULL,
  created_at    TEXT NOT NULL,
  agent         TEXT NOT NULL,
  agent_ver     TEXT,
  action_type   TEXT NOT NULL,
  action_data   TEXT NOT NULL,
  reversible    INTEGER,
  risk_level    TEXT,
  parent_id     TEXT,
  parent_ids    TEXT,
  policy_tags   TEXT,
  policy_result TEXT
);

CREATE TABLE IF NOT EXISTS completions (
  event_id    TEXT PRIMARY KEY REFERENCES events(id),
  outcome     TEXT NOT NULL CHECK (outcome IN ('success', 'error')),
  error_msg   TEXT,
  result_data TEXT,
  created_at  TEXT NOT NULL
);
`;

export class LedgerStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA_SQL);
    runMigrations(this.db);
  }

  createSession(input: CreateSessionInput): Session {
    const session: Session = {
      id: nanoid(),
      started_at: new Date().toISOString(),
      ended_at: null,
      agent: input.agent,
      task: input.task ?? null,
      cwd: input.cwd,
      status: 'active',
      outcome: null,
      user_rating: null,
    };
    this.db
      .prepare(
        `INSERT INTO sessions (id, started_at, ended_at, agent, task, cwd, status, outcome, user_rating)
         VALUES (@id, @started_at, @ended_at, @agent, @task, @cwd, @status, @outcome, @user_rating)`
      )
      .run(session);
    return session;
  }

  endSession(id: string): void {
    this.db
      .prepare(
        `UPDATE sessions SET ended_at = @ended_at, status = 'ended' WHERE id = @id`
      )
      .run({ id, ended_at: new Date().toISOString() });
  }

  getSession(id: string): Session | undefined {
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(id) as Record<string, unknown> | undefined;
    return row ? rowToSession(row) : undefined;
  }

  getOrCreateSession(id: string, input: CreateSessionInput): Session {
    const existing = this.getSession(id);
    if (existing) return existing;
    const session: Session = {
      id,
      started_at: new Date().toISOString(),
      ended_at: null,
      agent: input.agent,
      task: input.task ?? null,
      cwd: input.cwd,
      status: 'active',
      outcome: null,
      user_rating: null,
    };
    this.db
      .prepare(
        `INSERT OR IGNORE INTO sessions (id, started_at, ended_at, agent, task, cwd, status, outcome, user_rating)
         VALUES (@id, @started_at, @ended_at, @agent, @task, @cwd, @status, @outcome, @user_rating)`
      )
      .run(session);
    return this.getSession(id)!;
  }

  listSessions(): Session[] {
    const rows = this.db
      .prepare(`SELECT * FROM sessions ORDER BY started_at DESC, rowid DESC`)
      .all() as Record<string, unknown>[];
    return rows.map(rowToSession);
  }

  appendEvent(input: AppendEventInput): Event {
    const seq = nextSeq(this.db, input.session_id);
    const event: Event = {
      id: nanoid(),
      session_id: input.session_id,
      seq,
      created_at: new Date().toISOString(),
      agent: input.agent,
      agent_ver: input.agent_ver ?? null,
      action_type: input.action_type,
      action_data: input.action_data,
      reversible: input.reversible ?? null,
      risk_level: input.risk_level ?? null,
      parent_ids: input.parent_ids ?? null,
      policy_tags: input.policy_tags ?? null,
      policy_result: input.policy_result ?? null,
    };
    this.db
      .prepare(
        `INSERT INTO events
           (id, session_id, seq, created_at, agent, agent_ver, action_type,
            action_data, reversible, risk_level, parent_ids, policy_tags, policy_result)
         VALUES
           (@id, @session_id, @seq, @created_at, @agent, @agent_ver, @action_type,
            @action_data, @reversible, @risk_level, @parent_ids, @policy_tags, @policy_result)`
      )
      .run({
        ...event,
        action_data: JSON.stringify(event.action_data),
        parent_ids: event.parent_ids ? JSON.stringify(event.parent_ids) : null,
        policy_tags: event.policy_tags ? JSON.stringify(event.policy_tags) : null,
      });
    return event;
  }

  getEvents(session_id: string): Event[] {
    const rows = this.db
      .prepare(`SELECT * FROM events WHERE session_id = ? ORDER BY seq ASC`)
      .all(session_id) as Record<string, unknown>[];
    return rows.map(rowToEvent);
  }

  findLastUncompletedEvent(session_id: string, action_type: string): Event | undefined {
    const row = this.db
      .prepare(
        `SELECT * FROM events
         WHERE session_id = ? AND action_type = ?
           AND NOT EXISTS (SELECT 1 FROM completions WHERE completions.event_id = events.id)
         ORDER BY seq DESC LIMIT 1`
      )
      .get(session_id, action_type) as Record<string, unknown> | undefined;
    return row ? rowToEvent(row) : undefined;
  }

  recordCompletion(input: RecordCompletionInput): void {
    this.db
      .prepare(
        `INSERT OR IGNORE INTO completions (event_id, outcome, error_msg, result_data, created_at)
         VALUES (@event_id, @outcome, @error_msg, @result_data, @created_at)`
      )
      .run({
        event_id: input.event_id,
        outcome: input.outcome,
        error_msg: input.error_msg ?? null,
        result_data: input.result_data ? JSON.stringify(input.result_data) : null,
        created_at: new Date().toISOString(),
      });
  }

  getCompletions(session_id: string): Map<string, Completion> {
    const rows = this.db
      .prepare(
        `SELECT c.* FROM completions c
         JOIN events e ON e.id = c.event_id
         WHERE e.session_id = ?`
      )
      .all(session_id) as Array<Record<string, unknown>>;
    const map = new Map<string, Completion>();
    for (const row of rows) {
      let result_data: ResultData | null = null;
      if (row['result_data']) {
        try { result_data = JSON.parse(row['result_data'] as string); } catch { /* empty */ }
      }
      const c: Completion = {
        event_id: row['event_id'] as string,
        outcome: row['outcome'] as Completion['outcome'],
        error_msg: (row['error_msg'] as string | null) ?? null,
        result_data,
        created_at: row['created_at'] as string,
      };
      map.set(c.event_id, c);
    }
    return map;
  }

  close(): void {
    this.db.close();
  }
}

function nextSeq(db: Database.Database, session_id: string): number {
  const row = db
    .prepare(`SELECT COALESCE(MAX(seq), 0) AS max_seq FROM events WHERE session_id = ?`)
    .get(session_id) as { max_seq: number };
  return row.max_seq + 1;
}

function addColumnIfMissing(db: Database.Database, table: string, column: string, definition: string): void {
  const cols = (db.pragma(`table_info(${table})`) as Array<{ name: string }>).map(r => r.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function runMigrations(db: Database.Database): void {
  addColumnIfMissing(db, 'sessions',    'outcome',     'TEXT');
  addColumnIfMissing(db, 'sessions',    'user_rating', 'INTEGER');
  addColumnIfMissing(db, 'events',      'parent_ids',  'TEXT');
  addColumnIfMissing(db, 'completions', 'result_data', 'TEXT');
}

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row['id'] as string,
    started_at: row['started_at'] as string,
    ended_at: (row['ended_at'] as string | null) ?? null,
    agent: row['agent'] as string,
    task: (row['task'] as string | null) ?? null,
    cwd: row['cwd'] as string,
    status: row['status'] as Session['status'],
    outcome: (row['outcome'] as Session['outcome']) ?? null,
    user_rating: (row['user_rating'] as number | null) ?? null,
  };
}

function rowToEvent(row: Record<string, unknown>): Event {
  let action_data: Record<string, unknown> = {};
  try {
    action_data = JSON.parse(row['action_data'] as string);
  } catch {
    // Fallback to empty object if JSON parse fails
  }

  let policy_tags: string[] | null = null;
  if (row['policy_tags']) {
    try {
      policy_tags = JSON.parse(row['policy_tags'] as string);
    } catch {
      // Fallback to null if JSON parse fails
    }
  }

  let parent_ids: string[] | null = null;
  if (row['parent_ids']) {
    try {
      parent_ids = JSON.parse(row['parent_ids'] as string);
    } catch {
      // Fallback to null if JSON parse fails
    }
  }

  return {
    id: row['id'] as string,
    session_id: row['session_id'] as string,
    seq: row['seq'] as number,
    created_at: row['created_at'] as string,
    agent: row['agent'] as string,
    agent_ver: (row['agent_ver'] as string | null) ?? null,
    action_type: row['action_type'] as Event['action_type'],
    action_data,
    reversible: (row['reversible'] as 0 | 1 | null) ?? null,
    risk_level: (row['risk_level'] as Event['risk_level']) ?? null,
    parent_ids,
    policy_tags,
    policy_result: (row['policy_result'] as string | null) ?? null,
  };
}
