import type { RoomProjection } from '../domain/types.js';
import type { CreatedSession, RoomCommand, ServerProblem, StoredSession, TerminalReason } from './types.js';

export class ApiError extends Error {
  constructor(readonly problem: ServerProblem) {
    super(problem.message);
    this.name = 'ApiError';
  }
}

export async function createRoom(nickname: string): Promise<CreatedSession> {
  return await postSession('/api/rooms', nickname);
}

export async function joinRoom(roomCode: string, nickname: string): Promise<CreatedSession> {
  return await postSession(`/api/rooms/${encodeURIComponent(roomCode)}/join`, nickname);
}

export async function getSession(sessionToken: string): Promise<RoomProjection> {
  const response = await fetch('/api/session', {
    headers: { authorization: `Bearer ${sessionToken}` },
  });
  return await parseResponse<RoomProjection>(response);
}

async function postSession(path: string, nickname: string): Promise<CreatedSession> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  return await parseResponse<CreatedSession>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();
  if (!response.ok) throw new ApiError(problemFrom(payload));
  return payload as T;
}

function problemFrom(payload: unknown): ServerProblem {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error;
    if (error && typeof error === 'object') {
      const code = 'code' in error ? (error as { code?: unknown }).code : undefined;
      const message = 'message' in error ? (error as { message?: unknown }).message : undefined;
      if (typeof code === 'string' && typeof message === 'string') return { code, message };
    }
  }
  return { code: 'network_error', message: 'Ceduljica could not complete that request.' };
}

interface RealtimeCallbacks {
  onSnapshot: (room: RoomProjection) => void;
  onStatus: (status: 'connecting' | 'online' | 'offline') => void;
  onTerminal: (reason: TerminalReason) => void;
  onProblem: (problem: ServerProblem) => void;
}

interface PendingCommand {
  resolve: () => void;
  reject: (problem: ServerProblem) => void;
}

export class RoomRealtime {
  private socket: WebSocket | null = null;
  private stopped = false;
  private retryTimer: number | null = null;
  private retryDelay = 500;
  private sequence = 0;
  private readonly pending = new Map<string, PendingCommand>();

  constructor(
    private readonly session: StoredSession,
    private readonly callbacks: RealtimeCallbacks,
  ) {}

  start(): void {
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.retryTimer !== null) window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.rejectPending({ code: 'offline', message: 'Connection closed.' });
    this.socket?.close();
    this.socket = null;
  }

  async send(command: RoomCommand): Promise<void> {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new ApiError({ code: 'offline', message: 'Connection lost — trying again.' });
    }
    const id = `client-${Date.now().toString(36)}-${String(++this.sequence)}`;
    return await new Promise<void>((resolve, reject) => {
      this.pending.set(id, {
        resolve,
        reject: (problem) => reject(new ApiError(problem)),
      });
      socket.send(JSON.stringify({ id, ...command }));
    });
  }

  private connect(): void {
    if (this.stopped) return;
    this.callbacks.onStatus('connecting');
    const url = new URL('/ws', window.location.href);
    url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('token', this.session.sessionToken);
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.addEventListener('open', () => {
      this.retryDelay = 500;
      this.callbacks.onStatus('online');
    });
    socket.addEventListener('message', (event) => {
      this.receive(event.data);
    });
    socket.addEventListener('close', (event) => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.rejectPending({ code: 'offline', message: 'Connection lost — trying again.' });
      if (this.stopped) return;
      if (event.code === 1008) {
        this.callbacks.onTerminal('removed');
        return;
      }
      this.callbacks.onStatus('offline');
      void this.verifySessionAndRetry();
    });
  }

  private async verifySessionAndRetry(): Promise<void> {
    try {
      const room = await getSession(this.session.sessionToken);
      if (this.stopped) return;
      this.callbacks.onSnapshot(room);
    } catch (error) {
      if (this.stopped) return;
      if (
        error instanceof ApiError &&
        (error.problem.code === 'room_not_found' || error.problem.code === 'session_not_found')
      ) {
        this.stopped = true;
        this.callbacks.onTerminal('ended');
        return;
      }
    }
    this.retryTimer = window.setTimeout(() => this.connect(), this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, 5_000);
  }

  private receive(data: unknown): void {
    if (typeof data !== 'string') return;
    let message: unknown;
    try {
      message = JSON.parse(data) as unknown;
    } catch {
      return;
    }
    if (!message || typeof message !== 'object' || !('type' in message)) return;
    const value = message as Record<string, unknown>;
    if (value.type === 'snapshot' && isRoomProjection(value.room)) {
      this.callbacks.onSnapshot(value.room);
      return;
    }
    if (value.type === 'room_ended' && (value.reason === 'deleted' || value.reason === 'expired')) {
      this.stopped = true;
      this.callbacks.onTerminal(value.reason);
      return;
    }
    if ((value.type === 'ack' || value.type === 'error') && typeof value.id === 'string') {
      const command = this.pending.get(value.id);
      if (!command) return;
      this.pending.delete(value.id);
      if (value.type === 'ack') command.resolve();
      else {
        const problem = problemFrom({ error: value.error });
        command.reject(problem);
        this.callbacks.onProblem(problem);
      }
    }
  }

  private rejectPending(problem: ServerProblem): void {
    for (const command of this.pending.values()) command.reject(problem);
    this.pending.clear();
  }
}

function isRoomProjection(value: unknown): value is RoomProjection {
  if (!value || typeof value !== 'object') return false;
  const room = value as Partial<RoomProjection>;
  return (
    typeof room.roomId === 'string' &&
    typeof room.roomCode === 'string' &&
    (room.phase === 'lobby' || room.phase === 'writing' || room.phase === 'reveal') &&
    typeof room.version === 'number' &&
    Array.isArray(room.participants) &&
    room.self !== undefined
  );
}
