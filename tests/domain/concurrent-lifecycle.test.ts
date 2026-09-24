import { afterEach, describe, expect, it } from 'vitest';
import { DISCONNECT_GRACE_MS } from '../../src/shared/constants.js';
import { serviceFixture, type ServiceFixture } from '../helpers.js';

let fixture: ServiceFixture | undefined;
afterEach(() => fixture?.cleanup());

describe('coincident lifecycle transitions', () => {
  it.each(['deadline-first', 'ready-first'] as const)(
    'produces one deterministic reveal when Ready and a deadline coincide (%s)',
    (order) => {
      fixture = serviceFixture();
      const { service, store, clock } = fixture;
      const owner = service.create('Owner');
      const readyGuest = service.join(owner.credentials.roomCode, 'Ready guest');
      const unfinished = service.join(owner.credentials.roomCode, 'Unfinished');
      service.begin(owner.credentials.sessionToken);
      service.saveDraft(owner.credentials.sessionToken, 'owner');
      service.saveDraft(readyGuest.credentials.sessionToken, 'guest');
      service.ready(readyGuest.credentials.sessionToken);
      service.disconnect(unfinished.credentials.sessionToken);
      clock.advance(DISCONNECT_GRACE_MS);

      if (order === 'deadline-first') {
        service.processDue();
        service.ready(owner.credentials.sessionToken);
      } else {
        service.ready(owner.credentials.sessionToken);
        service.processDue();
      }

      const first = service.snapshot(owner.credentials.sessionToken);
      const storedVersion = store.findByCode(owner.credentials.roomCode)?.version;
      service.processDue();
      const second = service.snapshot(owner.credentials.sessionToken);
      expect(first.phase).toBe('reveal');
      expect(first.revealedNotes?.map((note) => note.body)).toEqual(['owner', 'guest']);
      expect(second.revealedNotes).toEqual(first.revealedNotes);
      expect(store.findByCode(owner.credentials.roomCode)?.version).toBe(storedVersion);
    },
  );

  it('resolves owner removal of the last blocker without duplicate reveal transitions', () => {
    fixture = serviceFixture();
    const { service, store } = fixture;
    const owner = service.create('Owner');
    const readyGuest = service.join(owner.credentials.roomCode, 'Ready');
    const blocker = service.join(owner.credentials.roomCode, 'Blocker');
    service.begin(owner.credentials.sessionToken);
    service.saveDraft(owner.credentials.sessionToken, 'owner');
    service.saveDraft(readyGuest.credentials.sessionToken, 'ready');
    service.ready(owner.credentials.sessionToken);
    service.ready(readyGuest.credentials.sessionToken);
    const revealed = service.remove(owner.credentials.sessionToken, blocker.credentials.participantId);
    const version = store.findByCode(owner.credentials.roomCode)?.version;

    expect(revealed.phase).toBe('reveal');
    expect(revealed.revealedNotes).toHaveLength(2);
    expect(service.ready(readyGuest.credentials.sessionToken).phase).toBe('reveal');
    expect(store.findByCode(owner.credentials.roomCode)?.version).toBe((version ?? 0) + 1);
  });
});
