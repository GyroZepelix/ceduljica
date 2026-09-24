import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RoomStore } from '../db/room-store.js';
import type { Clock } from '../shared/clock.js';
import {
  DISCONNECT_GRACE_MS,
  MAX_PARTICIPANTS,
  MIN_ROUND_PARTICIPANTS,
  ROOM_TTL_MS,
} from '../shared/constants.js';
import { RoomError } from './errors.js';
import { parseDraft, parseNickname, parseParticipantId } from './validation.js';
import type {
  Credentials,
  Participant,
  Room,
  RoomProjection,
  Round,
} from './types.js';

export interface CreatedSession {
  credentials: Credentials;
  projection: RoomProjection;
}

export interface IdentityFactory {
  id(): string;
  secret(): string;
}

const defaultIdentityFactory: IdentityFactory = {
  id: () => randomUUID(),
  secret: () => randomBytes(24).toString('base64url'),
};

export class RoomService {
  constructor(
    private readonly store: RoomStore,
    private readonly clock: Clock,
    private readonly identities: IdentityFactory = defaultIdentityFactory,
  ) {}

  create(nicknameInput: unknown): CreatedSession {
    const nickname = parseNickname(nicknameInput);
    const now = this.clock.now();
    const token = this.identities.secret();
    const participantId = this.identities.id();
    const participant: Participant = {
      id: participantId,
      nickname,
      sessionHash: hashToken(token),
      joinedAt: now,
      joinedOrder: 1,
      connected: true,
      disconnectDeadline: null,
    };
    const room: Room = {
      id: this.identities.id(),
      code: this.uniqueRoomCode(),
      phase: 'lobby',
      ownerParticipantId: participantId,
      participants: [participant],
      round: null,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + ROOM_TTL_MS,
      version: 1,
    };
    this.store.create(room);
    return this.createdSession(room, participant, token);
  }

  join(roomCode: string, nicknameInput: unknown): CreatedSession {
    const nickname = parseNickname(nicknameInput);
    const room = this.loadActiveByCode(roomCode);
    const deadlinesChanged = this.applyDeadlines(room, this.clock.now());
    if (room.participants.length >= MAX_PARTICIPANTS) {
      if (deadlinesChanged) this.store.save(room);
      throw new RoomError('room_full', 'This room already has 12 participants.');
    }

    const token = this.identities.secret();
    const participant: Participant = {
      id: this.identities.id(),
      nickname,
      sessionHash: hashToken(token),
      joinedAt: this.clock.now(),
      joinedOrder: nextJoinedOrder(room),
      connected: true,
      disconnectDeadline: null,
    };
    room.participants.push(participant);
    transferOrphanedOwnership(room);
    this.commit(room, true);
    return this.createdSession(room, participant, token);
  }

  reconnect(sessionToken: string): RoomProjection {
    const { room, participant } = this.loadByToken(sessionToken);
    const now = this.clock.now();
    this.applyDeadlines(room, now);
    const current = requireParticipant(room, participant.id);
    current.connected = true;
    current.disconnectDeadline = null;
    transferOrphanedOwnership(room);
    this.commit(room, true);
    return projectRoom(room, current.id);
  }

  disconnect(sessionToken: string): void {
    const { room, participant } = this.loadByToken(sessionToken);
    const now = this.clock.now();
    const deadlinesChanged = this.applyDeadlines(room, now);
    const current = requireParticipant(room, participant.id);
    if (!current.connected) {
      if (deadlinesChanged) this.store.save(room);
      return;
    }
    current.connected = false;
    current.disconnectDeadline = now + DISCONNECT_GRACE_MS;
    this.commit(room, false);
  }

  snapshot(sessionToken: string): RoomProjection {
    const { room, participant } = this.loadByToken(sessionToken);
    if (this.applyDeadlines(room, this.clock.now())) {
      this.store.save(room);
    }
    return projectRoom(room, participant.id);
  }

  begin(sessionToken: string): RoomProjection {
    return this.mutate(sessionToken, true, (room, actor) => {
      requireOwner(room, actor.id);
      if (room.phase === 'writing') return;
      if (room.phase !== 'lobby') {
        throw new RoomError('invalid_phase', 'A round can only begin from the lobby.');
      }
      room.round = createRound(room, 1, this.identities.id());
      room.phase = 'writing';
    });
  }

  saveDraft(sessionToken: string, bodyInput: unknown): RoomProjection {
    const body = parseDraft(bodyInput);
    return this.mutate(sessionToken, true, (room, actor) => {
      const note = requireWritableNote(room, actor.id);
      if (note.ready) {
        throw new RoomError('already_ready', 'Select Edit before changing a ready note.');
      }
      note.body = body;
    });
  }

  ready(sessionToken: string): RoomProjection {
    return this.mutate(sessionToken, true, (room, actor, now) => {
      if (room.phase === 'reveal' && room.round?.notes[actor.id]?.ready === true) return;
      const note = requireWritableNote(room, actor.id);
      if (note.ready) return;
      if (note.body.trim().length === 0) {
        throw new RoomError('invalid_input', 'A note must not be empty.');
      }
      note.ready = true;
      revealIfReady(room, now);
    });
  }

  edit(sessionToken: string): RoomProjection {
    return this.mutate(sessionToken, true, (room, actor) => {
      const note = requireWritableNote(room, actor.id);
      if (!note.ready) return;
      note.ready = false;
    });
  }

  remove(sessionToken: string, participantIdInput: unknown): RoomProjection {
    const participantId = parseParticipantId(participantIdInput);
    return this.mutate(sessionToken, true, (room, actor, now) => {
      requireOwner(room, actor.id);
      if (room.phase === 'reveal') {
        throw new RoomError('invalid_phase', 'Participants cannot be removed after reveal.');
      }
      if (participantId === actor.id) {
        throw new RoomError('forbidden', 'The owner cannot remove themself.');
      }
      const index = room.participants.findIndex((candidate) => candidate.id === participantId);
      if (index < 0) return;
      room.participants.splice(index, 1);
      if (room.round) {
        room.round.activeParticipantIds = room.round.activeParticipantIds.filter(
          (id) => id !== participantId,
        );
        delete room.round.notes[participantId];
        revealIfReady(room, now);
      }
    });
  }

  replay(sessionToken: string): RoomProjection {
    return this.mutate(sessionToken, true, (room, actor) => {
      requireOwner(room, actor.id);
      if (room.phase === 'writing') return;
      if (room.phase !== 'reveal' || !room.round) {
        throw new RoomError('invalid_phase', 'Replay is available only after reveal.');
      }
      room.round = createRound(room, room.round.number + 1, this.identities.id());
      room.phase = 'writing';
    });
  }

  delete(sessionToken: string): string {
    const { room, participant } = this.loadByToken(sessionToken);
    requireOwner(room, participant.id);
    this.store.delete(room.id);
    return room.id;
  }

  processDue(): { expiredRoomIds: string[]; changedRoomIds: string[] } {
    const now = this.clock.now();
    const expiredRoomIds: string[] = [];
    const changedRoomIds: string[] = [];
    for (const room of this.store.list()) {
      if (room.expiresAt <= now) {
        this.store.delete(room.id);
        expiredRoomIds.push(room.id);
      } else if (this.applyDeadlines(room, now)) {
        this.store.save(room);
        changedRoomIds.push(room.id);
      }
    }
    return { expiredRoomIds, changedRoomIds };
  }

  recoverAfterRestart(): string[] {
    const now = this.clock.now();
    const changedRoomIds: string[] = [];
    for (const room of this.store.list()) {
      if (room.expiresAt <= now) {
        this.store.delete(room.id);
        continue;
      }
      let changed = this.applyDeadlines(room, now);
      for (const participant of room.participants) {
        if (participant.connected) {
          participant.connected = false;
          participant.disconnectDeadline = now + DISCONNECT_GRACE_MS;
          changed = true;
        }
      }
      if (changed) {
        room.version += 1;
        this.store.save(room);
        changedRoomIds.push(room.id);
      }
    }
    return changedRoomIds;
  }

  roomIdForSession(sessionToken: string): string {
    return this.loadByToken(sessionToken).room.id;
  }

  private mutate(
    token: string,
    meaningful: boolean,
    transition: (room: Room, actor: Participant, now: number) => void,
  ): RoomProjection {
    const { room, participant } = this.loadByToken(token);
    const now = this.clock.now();
    const deadlinesChanged = this.applyDeadlines(room, now);
    const actor = requireParticipant(room, participant.id);
    try {
      if (!actor.connected) {
        throw new RoomError('forbidden', 'Reconnect before sending room actions.');
      }
      transition(room, actor, now);
    } catch (error) {
      if (deadlinesChanged) this.store.save(room);
      throw error;
    }
    this.commit(room, meaningful);
    return projectRoom(room, actor.id);
  }

  private loadByToken(token: string): { room: Room; participant: Participant } {
    if (typeof token !== 'string' || token.length < 20 || token.length > 200) {
      throw new RoomError('session_not_found', 'Session not found.');
    }
    const identity = this.store.findSession(hashToken(token));
    if (!identity) throw new RoomError('session_not_found', 'Session not found.');
    const room = this.store.findById(identity.roomId);
    if (!room || room.expiresAt <= this.clock.now()) {
      if (room) this.store.delete(room.id);
      throw new RoomError('room_not_found', 'Room not found.');
    }
    const participant = room.participants.find((candidate) => candidate.id === identity.participantId);
    if (!participant) throw new RoomError('session_not_found', 'Session not found.');
    return { room, participant };
  }

  private loadActiveByCode(code: string): Room {
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(code)) {
      throw new RoomError('room_not_found', 'Room not found.');
    }
    const room = this.store.findByCode(code);
    if (!room || room.expiresAt <= this.clock.now()) {
      if (room) this.store.delete(room.id);
      throw new RoomError('room_not_found', 'Room not found.');
    }
    return room;
  }

  private commit(room: Room, meaningful: boolean): void {
    room.version += 1;
    if (meaningful) {
      room.lastActivityAt = this.clock.now();
      room.expiresAt = room.lastActivityAt + ROOM_TTL_MS;
    }
    this.store.save(room);
  }

  private applyDeadlines(room: Room, now: number): boolean {
    let changed = false;
    const due = room.participants
      .filter(
        (participant) =>
          !participant.connected &&
          participant.disconnectDeadline !== null &&
          participant.disconnectDeadline <= now,
      )
      .sort((left, right) => left.joinedOrder - right.joinedOrder);

    for (const participant of due) {
      participant.disconnectDeadline = null;
      changed = true;
      if (room.phase === 'writing' && room.round?.activeParticipantIds.includes(participant.id)) {
        const note = room.round.notes[participant.id];
        if (!note?.ready) {
          room.round.activeParticipantIds = room.round.activeParticipantIds.filter(
            (id) => id !== participant.id,
          );
          delete room.round.notes[participant.id];
        }
      }
    }

    if (transferOrphanedOwnership(room)) changed = true;
    if (changed) {
      revealIfReady(room, now);
      room.version += 1;
    }
    return changed;
  }

  private uniqueRoomCode(): string {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.identities.secret();
      if (!this.store.findByCode(code)) return code;
    }
    throw new Error('Unable to allocate a unique room code.');
  }

  private createdSession(room: Room, participant: Participant, token: string): CreatedSession {
    return {
      credentials: {
        roomCode: room.code,
        sessionToken: token,
        participantId: participant.id,
      },
      projection: projectRoom(room, participant.id),
    };
  }
}

function createRound(room: Room, number: number, id: string): Round {
  const active = room.participants.filter((participant) => participant.connected);
  if (active.length < MIN_ROUND_PARTICIPANTS) {
    throw new RoomError(
      'insufficient_participants',
      'At least two connected participants are required.',
    );
  }
  return {
    id,
    number,
    activeParticipantIds: active.map((participant) => participant.id),
    notes: Object.fromEntries(
      active.map((participant) => [participant.id, { body: '', ready: false }]),
    ),
    revealedAt: null,
  };
}

function requireWritableNote(room: Room, participantId: string): { body: string; ready: boolean } {
  if (room.phase !== 'writing' || !room.round) {
    throw new RoomError('invalid_phase', 'Notes can only be changed during writing.');
  }
  if (!room.round.activeParticipantIds.includes(participantId)) {
    throw new RoomError('not_active', 'This participant is waiting for the next round.');
  }
  const note = room.round.notes[participantId];
  if (!note) throw new RoomError('not_active', 'This participant has no active note.');
  return note;
}

function revealIfReady(room: Room, now: number): boolean {
  if (room.phase !== 'writing' || !room.round || room.round.activeParticipantIds.length === 0) {
    return false;
  }
  if (
    room.round.activeParticipantIds.every(
      (participantId) => room.round?.notes[participantId]?.ready === true,
    )
  ) {
    room.phase = 'reveal';
    room.round.revealedAt = now;
    return true;
  }
  return false;
}

function projectRoom(room: Room, participantId: string): RoomProjection {
  const self = requireParticipant(room, participantId);
  const activeIds = new Set(room.round?.activeParticipantIds ?? []);
  const connectedCount = room.participants.filter((participant) => participant.connected).length;
  const projection: RoomProjection = {
    roomId: room.id,
    roomCode: room.code,
    phase: room.phase,
    version: room.version,
    self: {
      participantId: self.id,
      nickname: self.nickname,
      isOwner: room.ownerParticipantId === self.id,
      roundRole: activeIds.has(self.id) ? 'active' : 'waiting',
    },
    participants: room.participants
      .slice()
      .sort((left, right) => left.joinedOrder - right.joinedOrder)
      .map((participant) => ({
        id: participant.id,
        nickname: participant.nickname,
        connected: participant.connected,
        isOwner: room.ownerParticipantId === participant.id,
        roundRole: activeIds.has(participant.id) ? 'active' : 'waiting',
        ready: room.round?.notes[participant.id]?.ready === true,
      })),
    canBegin:
      room.phase === 'lobby' &&
      self.connected &&
      room.ownerParticipantId === self.id &&
      connectedCount >= 2,
    canReplay:
      room.phase === 'reveal' &&
      self.connected &&
      room.ownerParticipantId === self.id &&
      connectedCount >= 2,
  };

  if (room.phase === 'writing' && activeIds.has(self.id)) {
    const own = room.round?.notes[self.id];
    if (own) projection.ownNote = { body: own.body, ready: own.ready };
  }
  if (room.phase === 'reveal' && room.round) {
    projection.revealedNotes = room.round.activeParticipantIds.flatMap((activeId) => {
      const participant = room.participants.find((candidate) => candidate.id === activeId);
      const note = room.round?.notes[activeId];
      return participant && note
        ? [{ participantId: activeId, nickname: participant.nickname, body: note.body }]
        : [];
    });
  }
  return projection;
}

function requireParticipant(room: Room, participantId: string): Participant {
  const participant = room.participants.find((candidate) => candidate.id === participantId);
  if (!participant) throw new RoomError('session_not_found', 'Session not found.');
  return participant;
}

function requireOwner(room: Room, participantId: string): void {
  if (room.ownerParticipantId !== participantId) {
    throw new RoomError('forbidden', 'Only the owner may perform this action.');
  }
}

function nextJoinedOrder(room: Room): number {
  return room.participants.reduce((highest, participant) => Math.max(highest, participant.joinedOrder), 0) + 1;
}

function transferOrphanedOwnership(room: Room): boolean {
  const owner = room.participants.find((participant) => participant.id === room.ownerParticipantId);
  if (!owner || owner.connected || owner.disconnectDeadline !== null) return false;
  const successor = room.participants
    .filter((participant) => participant.id !== owner.id && participant.connected)
    .sort((left, right) => left.joinedOrder - right.joinedOrder)[0];
  if (!successor) return false;
  room.ownerParticipantId = successor.id;
  return true;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
