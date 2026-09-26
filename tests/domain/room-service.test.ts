import { afterEach, describe, expect, it } from 'vitest';
import { RoomError } from '../../src/domain/errors.js';
import {
  DISCONNECT_GRACE_MS,
  MAX_ROUND_PROMPT_LENGTH,
  ROOM_TTL_MS,
} from '../../src/shared/constants.js';
import { serviceFixture, type ServiceFixture } from '../helpers.js';

let fixture: ServiceFixture | undefined;
afterEach(() => {
  fixture?.cleanup();
  fixture = undefined;
});

function setup(): ServiceFixture {
  fixture = serviceFixture();
  return fixture;
}

describe('RoomService lifecycle and authority', () => {
  it('trims nicknames, requires two connected members, and caps retained membership at 12', () => {
    const { service } = setup();
    const owner = service.create('  Owner  ');
    expect(owner.projection.self.nickname).toBe('Owner');
    expect(() => service.begin(owner.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'insufficient_participants' }),
    );

    for (let index = 2; index <= 12; index += 1) {
      service.join(owner.credentials.roomCode, `Guest ${String(index)}`);
    }
    expect(() => service.join(owner.credentials.roomCode, 'Guest 13')).toThrowError(
      expect.objectContaining({ code: 'room_full' }),
    );
    expect(service.begin(owner.credentials.sessionToken).phase).toBe('writing');
  });

  it('rejects oversized and phase-invalid participant input on the server', () => {
    const { service } = setup();
    expect(() => service.create('x'.repeat(41))).toThrowError(
      expect.objectContaining({ code: 'invalid_input' }),
    );
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    expect(() => service.saveDraft(owner.credentials.sessionToken, 'not started')).toThrowError(
      expect.objectContaining({ code: 'invalid_phase' }),
    );
    service.begin(owner.credentials.sessionToken);
    expect(() => service.saveDraft(owner.credentials.sessionToken, 'x'.repeat(501))).toThrowError(
      expect.objectContaining({ code: 'invalid_input' }),
    );
    expect(() => service.ready(owner.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'invalid_input' }),
    );
    expect(service.snapshot(guest.credentials.sessionToken).phase).toBe('writing');
  });

  it('authorizes ownership by opaque session rather than nickname', () => {
    const { service } = setup();
    const owner = service.create('Same name');
    const guest = service.join(owner.credentials.roomCode, 'Same name');

    expect(() => service.begin(guest.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'forbidden' }),
    );
    expect(() => service.snapshot('Same name')).toThrowError(
      expect.objectContaining({ code: 'session_not_found' }),
    );
    expect(service.begin(owner.credentials.sessionToken).phase).toBe('writing');
  });

  it('normalizes, validates, authorizes, projects, and replaces round prompts', () => {
    const { service } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');

    expect(() => service.begin(guest.credentials.sessionToken, 'Not mine')).toThrowError(
      expect.objectContaining({ code: 'forbidden' }),
    );
    expect(() => service.begin(owner.credentials.sessionToken, 'line one\nline two')).toThrowError(
      expect.objectContaining({ code: 'invalid_input' }),
    );
    expect(() => service.begin(owner.credentials.sessionToken, 'x'.repeat(MAX_ROUND_PROMPT_LENGTH + 1))).toThrowError(
      expect.objectContaining({ code: 'invalid_input' }),
    );

    const writing = service.begin(owner.credentials.sessionToken, '  What made you smile?  ');
    expect(writing.roundPrompt).toBe('What made you smile?');
    expect(service.snapshot(guest.credentials.sessionToken).roundPrompt).toBe('What made you smile?');
    const late = service.join(owner.credentials.roomCode, 'Late');
    expect(late.projection.roundPrompt).toBe('What made you smile?');
    expect(service.reconnect(guest.credentials.sessionToken).roundPrompt).toBe('What made you smile?');

    service.saveDraft(owner.credentials.sessionToken, 'Owner answer');
    service.saveDraft(guest.credentials.sessionToken, 'Guest answer');
    service.ready(owner.credentials.sessionToken);
    const reveal = service.ready(guest.credentials.sessionToken);
    expect(reveal.roundPrompt).toBe('What made you smile?');
    expect(service.snapshot(late.credentials.sessionToken).roundPrompt).toBe('What made you smile?');

    const replay = service.replay(owner.credentials.sessionToken, '  Next question  ');
    expect(replay.roundPrompt).toBe('Next question');
    expect(service.snapshot(guest.credentials.sessionToken).roundPrompt).toBe('Next question');
  });

  it('defaults omitted and whitespace-only round prompts to empty strings', () => {
    const { service } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    expect(service.begin(owner.credentials.sessionToken).roundPrompt).toBe('');
    service.saveDraft(owner.credentials.sessionToken, 'Owner answer');
    service.saveDraft(guest.credentials.sessionToken, 'Guest answer');
    service.ready(owner.credentials.sessionToken);
    service.ready(guest.credentials.sessionToken);
    expect(service.replay(owner.credentials.sessionToken, '   ').roundPrompt).toBe('');
  });

  it('keeps each draft private until the final Ready atomically reveals all notes', () => {
    const { service } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    service.begin(owner.credentials.sessionToken);
    service.saveDraft(owner.credentials.sessionToken, 'owner-private-phrase');
    service.saveDraft(guest.credentials.sessionToken, 'guest-private-phrase');

    const ownerView = service.snapshot(owner.credentials.sessionToken);
    const guestView = service.snapshot(guest.credentials.sessionToken);
    expect(ownerView.ownNote?.body).toBe('owner-private-phrase');
    expect(JSON.stringify(ownerView)).not.toContain('guest-private-phrase');
    expect(guestView.ownNote?.body).toBe('guest-private-phrase');
    expect(JSON.stringify(guestView)).not.toContain('owner-private-phrase');
    expect(ownerView.participants.every((participant) => !('body' in participant))).toBe(true);

    service.ready(owner.credentials.sessionToken);
    expect(service.snapshot(owner.credentials.sessionToken).phase).toBe('writing');
    const revealed = service.ready(guest.credentials.sessionToken);
    expect(revealed.phase).toBe('reveal');
    expect(revealed.revealedNotes).toEqual([
      expect.objectContaining({ nickname: 'Owner', body: 'owner-private-phrase' }),
      expect.objectContaining({ nickname: 'Guest', body: 'guest-private-phrase' }),
    ]);
    expect(service.ready(guest.credentials.sessionToken).phase).toBe('reveal');
  });

  it('lets Ready return to Edit only before reveal', () => {
    const { service } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    service.begin(owner.credentials.sessionToken);
    service.saveDraft(owner.credentials.sessionToken, 'first');
    service.ready(owner.credentials.sessionToken);
    expect(service.edit(owner.credentials.sessionToken).ownNote).toEqual({ body: 'first', ready: false });
    service.saveDraft(owner.credentials.sessionToken, 'second');
    service.ready(owner.credentials.sessionToken);
    service.saveDraft(guest.credentials.sessionToken, 'guest');
    service.ready(guest.credentials.sessionToken);
    expect(() => service.edit(owner.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'invalid_phase' }),
    );
  });

  it('keeps late joins waiting through reveal and includes them in a clean replay', () => {
    const { service } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    service.begin(owner.credentials.sessionToken);
    const late = service.join(owner.credentials.roomCode, 'Late');
    expect(late.projection.self.roundRole).toBe('waiting');
    expect(() => service.saveDraft(late.credentials.sessionToken, 'not yet')).toThrowError(
      expect.objectContaining({ code: 'not_active' }),
    );
    service.saveDraft(owner.credentials.sessionToken, 'one');
    service.saveDraft(guest.credentials.sessionToken, 'two');
    service.ready(owner.credentials.sessionToken);
    service.ready(guest.credentials.sessionToken);
    expect(service.snapshot(late.credentials.sessionToken).revealedNotes).toHaveLength(2);

    const replay = service.replay(owner.credentials.sessionToken);
    expect(replay.phase).toBe('writing');
    expect(replay.participants.every((participant) => participant.roundRole === 'active')).toBe(true);
    expect(JSON.stringify(replay)).not.toContain('one');
    expect(JSON.stringify(replay)).not.toContain('two');
  });

  it('restores within grace, drops unfinished work after grace, and retains a ready submission', () => {
    const { service, clock } = setup();
    const owner = service.create('Owner');
    const first = service.join(owner.credentials.roomCode, 'First');
    const second = service.join(owner.credentials.roomCode, 'Second');
    service.begin(owner.credentials.sessionToken);
    service.saveDraft(owner.credentials.sessionToken, 'owner note');
    service.ready(owner.credentials.sessionToken);
    service.saveDraft(first.credentials.sessionToken, 'unfinished');
    service.saveDraft(second.credentials.sessionToken, 'ready survives');
    service.ready(second.credentials.sessionToken);

    service.disconnect(first.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS - 1);
    expect(service.reconnect(first.credentials.sessionToken).self.roundRole).toBe('active');
    service.disconnect(first.credentials.sessionToken);
    service.disconnect(second.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS);
    const due = service.processDue();
    expect(due.changedRoomIds).toHaveLength(1);

    const ownerView = service.snapshot(owner.credentials.sessionToken);
    expect(ownerView.phase).toBe('reveal');
    expect(ownerView.revealedNotes?.map((note) => note.body)).toEqual([
      'owner note',
      'ready survives',
    ]);
    expect(service.reconnect(first.credentials.sessionToken).self.roundRole).toBe('waiting');
  });

  it('transfers ownership after grace to the longest-present connected guest', () => {
    const { service, clock } = setup();
    const owner = service.create('Owner');
    const first = service.join(owner.credentials.roomCode, 'First');
    service.join(owner.credentials.roomCode, 'Second');
    service.disconnect(owner.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS);
    service.processDue();

    const firstView = service.snapshot(first.credentials.sessionToken);
    expect(firstView.self.isOwner).toBe(true);
    const formerOwner = service.reconnect(owner.credentials.sessionToken);
    expect(formerOwner.self.isOwner).toBe(false);
    expect(() => service.begin(owner.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'forbidden' }),
    );
  });

  it('transfers an overdue disconnected owner when the first guest later reconnects', () => {
    const { service, clock } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    service.disconnect(owner.credentials.sessionToken);
    service.disconnect(guest.credentials.sessionToken);
    clock.advance(DISCONNECT_GRACE_MS);
    service.processDue();

    expect(service.reconnect(guest.credentials.sessionToken).self.isOwner).toBe(true);
    expect(service.reconnect(owner.credentials.sessionToken).self.isOwner).toBe(false);
  });

  it('lets only the owner remove a guest and re-evaluates reveal once', () => {
    const { service } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    const blocker = service.join(owner.credentials.roomCode, 'Blocker');
    service.begin(owner.credentials.sessionToken);
    service.saveDraft(owner.credentials.sessionToken, 'owner');
    service.ready(owner.credentials.sessionToken);
    service.saveDraft(guest.credentials.sessionToken, 'guest');
    service.ready(guest.credentials.sessionToken);

    expect(() => service.remove(guest.credentials.sessionToken, blocker.credentials.participantId)).toThrowError(
      expect.objectContaining({ code: 'forbidden' }),
    );
    const revealed = service.remove(owner.credentials.sessionToken, blocker.credentials.participantId);
    expect(revealed.phase).toBe('reveal');
    expect(revealed.revealedNotes).toHaveLength(2);
    expect(() => service.snapshot(blocker.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'session_not_found' }),
    );
  });

  it('does not extend room activity for disconnects and expires all room data at 24 hours', () => {
    const { service, store, clock } = setup();
    const owner = service.create('Owner');
    const room = store.findByCode(owner.credentials.roomCode);
    expect(room).not.toBeNull();
    const initialExpiry = room?.expiresAt;
    clock.advance(1_000);
    service.disconnect(owner.credentials.sessionToken);
    expect(store.findByCode(owner.credentials.roomCode)?.expiresAt).toBe(initialExpiry);

    clock.advance(ROOM_TTL_MS - 1_000);
    const result = service.processDue();
    expect(result.expiredRoomIds).toEqual([room?.id]);
    expect(store.findByCode(owner.credentials.roomCode)).toBeNull();
    expect(() => service.snapshot(owner.credentials.sessionToken)).toThrowError(RoomError);
  });

  it('deletes the room and cascades every session immediately', () => {
    const { service, store } = setup();
    const owner = service.create('Owner');
    const guest = service.join(owner.credentials.roomCode, 'Guest');
    expect(() => service.delete(guest.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'forbidden' }),
    );
    service.delete(owner.credentials.sessionToken);
    expect(store.list()).toHaveLength(0);
    expect(() => service.snapshot(owner.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'session_not_found' }),
    );
    expect(() => service.snapshot(guest.credentials.sessionToken)).toThrowError(
      expect.objectContaining({ code: 'session_not_found' }),
    );
  });
});
