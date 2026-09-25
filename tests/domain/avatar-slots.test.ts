import { afterEach, describe, expect, it } from 'vitest';
import { normalizeAvatarSlots } from '../../src/domain/avatar-slots.js';
import { DISCONNECT_GRACE_MS } from '../../src/shared/constants.js';
import { serviceFixture } from '../helpers.js';

const fixtures: ReturnType<typeof serviceFixture>[] = [];
function setup() {
  const fixture = serviceFixture();
  fixtures.push(fixture);
  return fixture;
}
afterEach(() => fixtures.splice(0).forEach((fixture) => fixture.cleanup()));

const slots = (view: ReturnType<ReturnType<typeof serviceFixture>['service']['snapshot']>) =>
  Object.fromEntries(view.participants.map((person) => [person.id, person.avatarSlot]));

describe('authoritative room-local avatars', () => {
  it('agrees across 12 sessions, reserves disconnected identities, and reuses only actually removed slots', () => {
    const { service, clock } = setup();
    const owner = service.create('Owner');
    const sessions = [owner, ...Array.from({ length: 11 }, (_, index) => service.join(owner.credentials.roomCode, `Guest ${index}`))];
    const initial = slots(service.snapshot(owner.credentials.sessionToken));
    expect(Object.values(initial)).toEqual(Array.from({ length: 12 }, (_, index) => index));
    for (const session of sessions) expect(slots(service.snapshot(session.credentials.sessionToken))).toEqual(initial);
    const removed = sessions[4]!;
    service.disconnect(removed.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS);
    service.processDue();
    expect(() => service.join(owner.credentials.roomCode, 'Too many')).toThrow(/12/);
    expect(slots(service.reconnect(removed.credentials.sessionToken))).toEqual(initial);
    service.remove(owner.credentials.sessionToken, removed.credentials.participantId);
    const replacement = service.join(owner.credentials.roomCode, 'Replacement');
    const expected = { ...initial };
    delete expected[removed.credentials.participantId];
    expected[replacement.credentials.participantId] = initial[removed.credentials.participantId]!;
    expect(slots(replacement.projection)).toEqual(expected);
  });

  it('retains disconnected ready author identity and stable slots through replay; writing replay is not another round', () => {
    const { service, clock } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    const waiting = service.join(owner.credentials.roomCode, 'Waiting');
    const writing = service.begin(owner.credentials.sessionToken);
    const initial = slots(writing);
    service.saveDraft(guest.credentials.sessionToken, 'retained ready body');
    service.ready(guest.credentials.sessionToken);
    service.disconnect(guest.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS);
    service.processDue();
    service.saveDraft(owner.credentials.sessionToken, 'owner body');
    service.ready(owner.credentials.sessionToken);
    service.saveDraft(waiting.credentials.sessionToken, 'third body');
    const revealed = service.ready(waiting.credentials.sessionToken);
    expect(revealed.roundId).toBe(writing.roundId);
    expect(revealed.revealedNotes?.map((note) => [note.participantId, note.avatarSlot])).toEqual(Object.entries(initial));
    expect(revealed.participants.find((person) => person.id === guest.credentials.participantId)?.connected).toBe(false);
    const replay = service.replay(owner.credentials.sessionToken);
    expect(slots(replay)).toEqual(initial);
    expect(replay.roundId).not.toBe(writing.roundId);
    expect(service.replay(owner.credentials.sessionToken).roundId).toBe(replay.roundId);
    expect(JSON.stringify(replay)).not.toContain('retained ready body');
  });

  it('normalizes deterministically, reserving valid slots before filling missing, duplicate, and invalid metadata', () => {
    const { service, store } = setup();
    const owner = service.create('Owner');
    for (let index = 0; index < 4; index++) service.join(owner.credentials.roomCode, `Guest ${index}`);
    const room = store.findByCode(owner.credentials.roomCode)!;
    Reflect.deleteProperty(room.participants[0]!, 'avatarSlot');
    room.participants[1]!.avatarSlot = 0;
    room.participants[2]!.avatarSlot = 0;
    room.participants[3]!.avatarSlot = 99;
    room.participants[4]!.avatarSlot = 5;
    const reversed = structuredClone(room);
    reversed.participants.reverse();
    expect(normalizeAvatarSlots(room)).toBe(true);
    expect(normalizeAvatarSlots(reversed)).toBe(true);
    expect(room.participants.map((person) => person.avatarSlot)).toEqual([1, 0, 2, 3, 5]);
    expect(reversed.participants.reverse()).toEqual(room.participants);
    expect(normalizeAvatarSlots(room)).toBe(false);
  });
});
