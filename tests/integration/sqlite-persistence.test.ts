import { describe, expect, it } from 'vitest';
import { SqliteRoomStore } from '../../src/db/sqlite-room-store.js';
import { RoomService } from '../../src/domain/room-service.js';
import type { Round } from '../../src/domain/types.js';
import { DISCONNECT_GRACE_MS, ROOM_TTL_MS } from '../../src/shared/constants.js';
import { DeterministicIdentities, FakeClock, temporaryDatabase } from '../helpers.js';

describe('SQLite persistence', () => {
  it('reconstructs room, session, draft, and round state after an ordinary restart', () => {
    const database = temporaryDatabase();
    const clock = new FakeClock();
    const identities = new DeterministicIdentities();
    let store = new SqliteRoomStore(database.path);
    let service = new RoomService(store, clock, identities);
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    service.begin(owner.credentials.sessionToken, '  Persist this question  ');
    service.saveDraft(owner.credentials.sessionToken, 'persisted private owner draft');
    service.saveDraft(guest.credentials.sessionToken, 'persisted private guest draft');
    service.ready(guest.credentials.sessionToken);
    store.close();

    store = new SqliteRoomStore(database.path);
    service = new RoomService(store, clock, identities);
    expect(service.recoverAfterRestart()).toHaveLength(1);
    const ownerView = service.reconnect(owner.credentials.sessionToken);
    const guestView = service.reconnect(guest.credentials.sessionToken);
    expect(ownerView.roundPrompt).toBe('Persist this question');
    expect(guestView.roundPrompt).toBe('Persist this question');
    expect(ownerView.ownNote?.body).toBe('persisted private owner draft');
    expect(JSON.stringify(ownerView)).not.toContain('persisted private guest draft');
    expect(guestView.ownNote).toEqual({ body: 'persisted private guest draft', ready: true });
    expect(JSON.stringify(guestView)).not.toContain('persisted private owner draft');

    store.close();
    database.cleanup();
  });

  it('projects an empty prompt from a stored legacy round without rewriting the schema', () => {
    const database = temporaryDatabase();
    const clock = new FakeClock();
    const identities = new DeterministicIdentities();
    let store = new SqliteRoomStore(database.path);
    let service = new RoomService(store, clock, identities);
    const owner = service.create('Owner');
    service.join(owner.credentials.roomCode, 'Guest');
    service.begin(owner.credentials.sessionToken, 'Temporary prompt');
    const stored = store.findByCode(owner.credentials.roomCode);
    expect(stored?.round).not.toBeNull();
    if (!stored?.round) throw new Error('Expected a stored round.');
    delete (stored.round as Partial<Round>).prompt;
    store.save(stored);
    store.close();

    store = new SqliteRoomStore(database.path);
    service = new RoomService(store, clock, identities);
    expect(service.snapshot(owner.credentials.sessionToken).roundPrompt).toBe('');

    store.close();
    database.cleanup();
  });

  it('persists deadline outcomes transactionally and removes expired room/session rows', () => {
    const database = temporaryDatabase();
    const clock = new FakeClock();
    const identities = new DeterministicIdentities();
    let store = new SqliteRoomStore(database.path);
    let service = new RoomService(store, clock, identities);
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    service.begin(owner.credentials.sessionToken);
    service.saveDraft(owner.credentials.sessionToken, 'owner ready');
    service.ready(owner.credentials.sessionToken);
    service.disconnect(guest.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS);
    service.processDue();
    expect(service.snapshot(owner.credentials.sessionToken).phase).toBe('reveal');
    store.close();

    store = new SqliteRoomStore(database.path);
    service = new RoomService(store, clock, identities);
    expect(service.snapshot(owner.credentials.sessionToken).revealedNotes).toHaveLength(1);
    clock.advance(ROOM_TTL_MS);
    expect(service.processDue().expiredRoomIds).toHaveLength(1);
    expect(store.list()).toHaveLength(0);
    expect(() => service.snapshot(owner.credentials.sessionToken)).toThrow();

    store.close();
    database.cleanup();
  });

  it('removes rooms that expired while the service was offline during startup recovery', () => {
    const database = temporaryDatabase();
    const clock = new FakeClock();
    let store = new SqliteRoomStore(database.path);
    let service = new RoomService(store, clock, new DeterministicIdentities());
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    store.close();

    clock.advance(ROOM_TTL_MS);
    store = new SqliteRoomStore(database.path);
    service = new RoomService(store, clock, new DeterministicIdentities());
    expect(service.recoverAfterRestart()).toEqual([]);
    expect(store.list()).toEqual([]);
    expect(() => service.snapshot(owner.credentials.sessionToken)).toThrow();
    expect(() => service.snapshot(guest.credentials.sessionToken)).toThrow();

    store.close();
    database.cleanup();
  });

  it('rolls back aggregate and session writes together on a constraint failure', () => {
    const database = temporaryDatabase();
    const clock = new FakeClock();
    const store = new SqliteRoomStore(database.path);
    const service = new RoomService(store, clock, new DeterministicIdentities());
    const owner = service.create('Owner');
    const before = store.findByCode(owner.credentials.roomCode);
    expect(before).not.toBeNull();
    if (!before) throw new Error('Expected room.');
    const corrupted = structuredClone(before);
    corrupted.participants.push({
      ...corrupted.participants[0]!,
      id: '00000000-0000-4000-8000-999999999999',
    });

    expect(() => store.save(corrupted)).toThrow();
    const after = store.findByCode(owner.credentials.roomCode);
    expect(after?.participants).toHaveLength(1);
    expect(service.snapshot(owner.credentials.sessionToken).self.nickname).toBe('Owner');

    store.close();
    database.cleanup();
  });
});
