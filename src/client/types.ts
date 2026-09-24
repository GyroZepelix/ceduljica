import type { Credentials, RoomProjection } from '../domain/types.js';

export interface CreatedSession {
  credentials: Credentials;
  projection: RoomProjection;
}

export interface StoredSession {
  roomCode: string;
  sessionToken: string;
  participantId: string;
}

export type RoomCommand =
  | { type: 'begin' }
  | { type: 'save_draft'; body: string }
  | { type: 'ready' }
  | { type: 'edit' }
  | { type: 'remove'; participantId: string }
  | { type: 'replay' }
  | { type: 'delete_room' };

export interface ServerProblem {
  code: string;
  message: string;
}

export type TerminalReason = 'deleted' | 'expired' | 'removed' | 'ended';
