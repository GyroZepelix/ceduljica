import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SqliteRoomStore } from '../src/db/sqlite-room-store.js';
import { RoomService, type IdentityFactory } from '../src/domain/room-service.js';
import type { Clock } from '../src/shared/clock.js';

export class FakeClock implements Clock {
  constructor(private value = 1_700_000_000_000) {}

  now(): number {
    return this.value;
  }

  advance(milliseconds: number): void {
    this.value += milliseconds;
  }
}

export class DeterministicIdentities implements IdentityFactory {
  private sequence = 0;

  id(): string {
    this.sequence += 1;
    const suffix = this.sequence.toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${suffix}`;
  }

  secret(): string {
    this.sequence += 1;
    return `token_${this.sequence.toString().padStart(4, '0')}_${'x'.repeat(24)}`;
  }
}

export interface ServiceFixture {
  clock: FakeClock;
  store: SqliteRoomStore;
  service: RoomService;
  cleanup(): void;
}

export function serviceFixture(path = ':memory:'): ServiceFixture {
  const clock = new FakeClock();
  const store = new SqliteRoomStore(path);
  const service = new RoomService(store, clock, new DeterministicIdentities());
  return {
    clock,
    store,
    service,
    cleanup: () => store.close(),
  };
}

export function temporaryDatabase(): { directory: string; path: string; cleanup(): void } {
  const directory = mkdtempSync(join(tmpdir(), `ceduljica-${randomUUID()}-`));
  return {
    directory,
    path: join(directory, 'rooms.sqlite'),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}
