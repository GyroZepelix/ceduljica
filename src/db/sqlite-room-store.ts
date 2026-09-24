import Database from 'better-sqlite3';
import type { Room, SessionIdentity } from '../domain/types.js';
import type { RoomStore } from './room-store.js';

const SCHEMA_VERSION = 1;

interface RoomRow {
  state_json: string;
}

interface SessionRow {
  room_id: string;
  participant_id: string;
}

export class SqliteRoomStore implements RoomStore {
  private readonly database: Database.Database;

  constructor(path: string) {
    this.database = new Database(path);
    this.database.pragma('foreign_keys = ON');
    this.database.pragma('busy_timeout = 5000');
    this.bootstrap();
  }

  close(): void {
    this.database.close();
  }

  create(room: Room): void {
    this.writeRoom(room, true);
  }

  save(room: Room): void {
    this.writeRoom(room, false);
  }

  delete(roomId: string): boolean {
    return this.database.prepare('DELETE FROM rooms WHERE id = ?').run(roomId).changes > 0;
  }

  findById(roomId: string): Room | null {
    const row = this.database
      .prepare('SELECT state_json FROM rooms WHERE id = ?')
      .get(roomId) as RoomRow | undefined;
    return row ? deserializeRoom(row.state_json) : null;
  }

  findByCode(code: string): Room | null {
    const row = this.database
      .prepare('SELECT state_json FROM rooms WHERE code = ?')
      .get(code) as RoomRow | undefined;
    return row ? deserializeRoom(row.state_json) : null;
  }

  findSession(sessionHash: string): SessionIdentity | null {
    const row = this.database
      .prepare('SELECT room_id, participant_id FROM sessions WHERE token_hash = ?')
      .get(sessionHash) as SessionRow | undefined;
    return row ? { roomId: row.room_id, participantId: row.participant_id } : null;
  }

  list(): Room[] {
    const rows = this.database.prepare('SELECT state_json FROM rooms ORDER BY id').all() as RoomRow[];
    return rows.map((row) => deserializeRoom(row.state_json));
  }

  private bootstrap(): void {
    const initialize = this.database.transaction(() => {
      this.database.exec(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          state_json TEXT NOT NULL,
          last_activity_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,
          room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
          participant_id TEXT NOT NULL,
          UNIQUE(room_id, participant_id)
        );
      `);
      const row = this.database.prepare('SELECT version FROM schema_version').get() as
        | { version: number }
        | undefined;
      if (!row) {
        this.database.prepare('INSERT INTO schema_version(version) VALUES (?)').run(SCHEMA_VERSION);
      } else if (row.version !== SCHEMA_VERSION) {
        throw new Error(
          `Unsupported SQLite schema version ${String(row.version)}; expected ${SCHEMA_VERSION}.`,
        );
      }
    });
    initialize();
  }

  private writeRoom(room: Room, insertOnly: boolean): void {
    const transaction = this.database.transaction(() => {
      const values = [
        room.id,
        room.code,
        JSON.stringify(room),
        room.lastActivityAt,
        room.expiresAt,
      ] as const;
      if (insertOnly) {
        this.database
          .prepare(
            `INSERT INTO rooms(id, code, state_json, last_activity_at, expires_at)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(...values);
      } else {
        const result = this.database
          .prepare(
            `UPDATE rooms
             SET code = ?, state_json = ?, last_activity_at = ?, expires_at = ?
             WHERE id = ?`,
          )
          .run(room.code, values[2], room.lastActivityAt, room.expiresAt, room.id);
        if (result.changes !== 1) throw new Error(`Room ${room.id} does not exist.`);
      }
      this.database.prepare('DELETE FROM sessions WHERE room_id = ?').run(room.id);
      const insertSession = this.database.prepare(
        `INSERT INTO sessions(token_hash, room_id, participant_id) VALUES (?, ?, ?)`,
      );
      for (const participant of room.participants) {
        insertSession.run(participant.sessionHash, room.id, participant.id);
      }
    });
    transaction();
  }
}

function deserializeRoom(serialized: string): Room {
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== 'object') throw new Error('Stored room state is invalid.');
  return parsed as Room;
}
