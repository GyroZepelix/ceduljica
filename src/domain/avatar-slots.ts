import { MAX_PARTICIPANTS } from '../shared/constants.js';
import type { Participant, Room } from './types.js';

export function availableAvatarSlot(participants: Participant[]): number {
  const used = new Set(participants.map((participant) => participant.avatarSlot));
  for (let slot = 0; slot < MAX_PARTICIPANTS; slot += 1) {
    if (!used.has(slot)) return slot;
  }
  throw new Error('No avatar slot available for retained membership.');
}

/** Upgrade legacy serialized aggregates without changing membership or room activity. */
export function normalizeAvatarSlots(room: Room): boolean {
  const ordered = room.participants.slice().sort((left, right) =>
    left.joinedOrder - right.joinedOrder || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  const reserved: Participant[] = [];
  const missing: Participant[] = [];
  for (const participant of ordered) {
    const slot = participant.avatarSlot;
    if (Number.isInteger(slot) && slot >= 0 && slot < MAX_PARTICIPANTS &&
        !reserved.some((existing) => existing.avatarSlot === slot)) {
      reserved.push(participant);
    } else {
      missing.push(participant);
    }
  }
  // Reserve all valid existing assignments first, even in partially upgraded rooms.
  for (const participant of missing) {
    participant.avatarSlot = availableAvatarSlot(reserved);
    reserved.push(participant);
  }
  return missing.length > 0;
}
