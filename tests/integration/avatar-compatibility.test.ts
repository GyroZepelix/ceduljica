import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { SqliteRoomStore } from '../../src/db/sqlite-room-store.js';
import { RoomService } from '../../src/domain/room-service.js';
import { DeterministicIdentities, FakeClock, temporaryDatabase } from '../helpers.js';

for (const trigger of ['snapshot', 'join', 'remove', 'processDue', 'restart'] as const) {
  describe(`legacy avatar normalization before ${trigger}`, () => {
    it('persists additive metadata in schema v1 without losing notes, sessions, or changing expiry rules', () => {
      const database = temporaryDatabase();
      const clock = new FakeClock();
      const identities = new DeterministicIdentities();
      let store = new SqliteRoomStore(database.path);
      try {
        let service = new RoomService(store, clock, identities);
        const owner = service.create('Owner');
        const guest = service.join(owner.credentials.roomCode, 'Guest');
        const third = service.join(owner.credentials.roomCode, 'Third');
        service.begin(owner.credentials.sessionToken);
        service.saveDraft(owner.credentials.sessionToken, 'line one\nline two');
        service.saveDraft(guest.credentials.sessionToken, 'ready private body');
        service.ready(guest.credentials.sessionToken);
        const legacy = store.findByCode(owner.credentials.roomCode)!;
        for (const person of legacy.participants) Reflect.deleteProperty(person, 'avatarSlot');
        store.save(legacy);
        store.close();
        store = new SqliteRoomStore(database.path);
        service = new RoomService(store, clock, identities);
        clock.advance(1234);
        if (trigger === 'snapshot') service.snapshot(owner.credentials.sessionToken);
        if (trigger === 'join') service.join(owner.credentials.roomCode, 'Fourth');
        if (trigger === 'remove') service.remove(owner.credentials.sessionToken, guest.credentials.participantId);
        if (trigger === 'processDue') service.processDue();
        if (trigger === 'restart') service.recoverAfterRestart();
        const normalized = store.findByCode(owner.credentials.roomCode)!;
        expect(normalized.participants.find((person) => person.id === owner.credentials.participantId)?.avatarSlot).toBe(0);
        expect(normalized.participants.find((person) => person.id === third.credentials.participantId)?.avatarSlot).toBe(2);
        expect(normalized.round?.id).toBe(legacy.round?.id);
        expect(normalized.round?.notes[owner.credentials.participantId]).toEqual({ body: 'line one\nline two', ready: false });
        expect(normalized.ownerParticipantId).toBe(legacy.ownerParticipantId);
        expect(normalized.createdAt).toBe(legacy.createdAt);
        expect(normalized.phase).toBe('writing');
        if (trigger !== 'join' && trigger !== 'remove') {
          expect(normalized.expiresAt).toBe(legacy.expiresAt);
          expect(normalized.lastActivityAt).toBe(legacy.lastActivityAt);
          if (trigger !== 'restart') {
            const withoutMetadata = structuredClone(normalized);
            for (const person of withoutMetadata.participants) Reflect.deleteProperty(person, 'avatarSlot');
            expect(withoutMetadata).toEqual(legacy);
          }
        } else {
          expect(normalized.lastActivityAt).toBe(clock.now());
          expect(normalized.expiresAt - legacy.expiresAt).toBe(1234);
        }
        store.close();
        store = new SqliteRoomStore(database.path);
        service = new RoomService(store, clock, identities);
        const restored = service.reconnect(owner.credentials.sessionToken);
        expect(restored.ownNote?.body).toBe('line one\nline two');
        expect(restored.roundId).toBe(legacy.round?.id);
        expect(restored.participants.map((person) => person.avatarSlot)).toEqual(normalized.participants.map((person) => person.avatarSlot));
        expect(JSON.stringify(restored)).not.toContain('ready private body');
        if (trigger !== 'remove') expect(service.reconnect(guest.credentials.sessionToken).ownNote).toEqual({ body: 'ready private body', ready: true });
        const raw = new Database(database.path, { readonly: true });
        expect(raw.prepare('SELECT version FROM schema_version').get()).toEqual({ version: 1 });
        expect(raw.prepare('SELECT COUNT(*) AS count FROM sessions').get()).toEqual({ count: normalized.participants.length });
        raw.close();
      } finally {
        store.close();
        database.cleanup();
      }
    });
  });
}
