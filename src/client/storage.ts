import type { StoredSession } from './types.js';

const SESSION_KEY = 'ceduljica:session';
const MUTED_KEY = 'ceduljica:muted';

export function loadSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const session = value as Partial<StoredSession>;
    return typeof session.roomCode === 'string' &&
      typeof session.sessionToken === 'string' &&
      typeof session.participantId === 'string'
      ? {
          roomCode: session.roomCode,
          sessionToken: session.sessionToken,
          participantId: session.participantId,
        }
      : null;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function loadMuted(): boolean {
  return window.localStorage.getItem(MUTED_KEY) === 'true';
}

export function saveMuted(muted: boolean): void {
  window.localStorage.setItem(MUTED_KEY, String(muted));
}
