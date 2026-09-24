import type { Room, SessionIdentity } from '../domain/types.js';

export interface RoomStore {
  create(room: Room): void;
  save(room: Room): void;
  delete(roomId: string): boolean;
  findById(roomId: string): Room | null;
  findByCode(code: string): Room | null;
  findSession(sessionHash: string): SessionIdentity | null;
  list(): Room[];
}
