export type RoomPhase = 'lobby' | 'writing' | 'reveal';

export interface Participant {
  id: string;
  nickname: string;
  sessionHash: string;
  joinedAt: number;
  joinedOrder: number;
  connected: boolean;
  disconnectDeadline: number | null;
}

export interface Note {
  body: string;
  ready: boolean;
}

export interface Round {
  id: string;
  number: number;
  activeParticipantIds: string[];
  notes: Record<string, Note>;
  revealedAt: number | null;
}

export interface Room {
  id: string;
  code: string;
  phase: RoomPhase;
  ownerParticipantId: string;
  participants: Participant[];
  round: Round | null;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  version: number;
}

export interface SessionIdentity {
  roomId: string;
  participantId: string;
}

export interface ParticipantSummary {
  id: string;
  nickname: string;
  connected: boolean;
  isOwner: boolean;
  roundRole: 'active' | 'waiting';
  ready: boolean;
}

export interface PrivateNoteProjection {
  body: string;
  ready: boolean;
}

export interface RevealedNoteProjection {
  participantId: string;
  nickname: string;
  body: string;
}

export interface RoomProjection {
  roomId: string;
  roomCode: string;
  phase: RoomPhase;
  version: number;
  self: {
    participantId: string;
    nickname: string;
    isOwner: boolean;
    roundRole: 'active' | 'waiting';
  };
  participants: ParticipantSummary[];
  ownNote?: PrivateNoteProjection;
  revealedNotes?: RevealedNoteProjection[];
  canBegin: boolean;
  canReplay: boolean;
}

export interface Credentials {
  roomCode: string;
  sessionToken: string;
  participantId: string;
}
