import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { Duplex } from 'node:stream';
import { URL } from 'node:url';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import type { RoomService } from '../domain/room-service.js';
import { RoomError } from '../domain/errors.js';
import { clientCommandSchema, type ClientCommand } from './protocol.js';

const MAX_HTTP_BODY_BYTES = 16 * 1024;
const MAX_WS_PAYLOAD_BYTES = 4 * 1024;

interface ConnectedSocket {
  socket: WebSocket;
  token: string;
  roomId: string;
}

export class CeduljicaServer {
  private readonly server: Server;
  private readonly sockets = new Set<ConnectedSocket>();
  private readonly webSockets = new WebSocketServer({ noServer: true, maxPayload: MAX_WS_PAYLOAD_BYTES });
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly rooms: RoomService) {
    this.server = createServer((request, response) => {
      void this.handleHttp(request, response);
    });
    this.server.on('upgrade', (request, socket, head) => {
      this.handleUpgrade(request, socket, head);
    });
    this.webSockets.on('connection', (socket, request) => {
      this.handleConnection(socket, request);
    });
  }

  async listen(port: number, host = '127.0.0.1'): Promise<number> {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => reject(error);
      this.server.once('error', onError);
      this.server.listen(port, host, () => {
        this.server.off('error', onError);
        resolve();
      });
    });
    this.timer = setInterval(() => this.tick(), 1_000);
    this.timer.unref();
    const address = this.server.address();
    if (!address || typeof address === 'string') throw new Error('HTTP server has no TCP address.');
    return address.port;
  }

  async close(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const token of new Set([...this.sockets].map((connection) => connection.token))) {
      try {
        this.rooms.disconnect(token);
      } catch {
        // The room may already have ended.
      }
    }
    for (const connection of this.sockets) connection.socket.terminate();
    this.sockets.clear();
    await new Promise<void>((resolve) => this.webSockets.close(() => resolve()));
    if (!this.server.listening) return;
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  runMaintenance(): void {
    this.tick();
  }

  private async handleHttp(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(response, 200, { status: 'ok' });
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/rooms') {
        const body = await readJsonBody(request);
        const result = this.rooms.create(property(body, 'nickname'));
        sendJson(response, 201, result);
        return;
      }
      const joinMatch = /^\/api\/rooms\/([^/]+)\/join$/.exec(url.pathname);
      if (request.method === 'POST' && joinMatch?.[1]) {
        const body = await readJsonBody(request);
        const result = this.rooms.join(decodeURIComponent(joinMatch[1]), property(body, 'nickname'));
        sendJson(response, 201, result);
        return;
      }
      if (request.method === 'GET' && url.pathname === '/api/session') {
        sendJson(response, 200, this.rooms.snapshot(bearerToken(request)));
        return;
      }
      sendJson(response, 404, { error: { code: 'not_found', message: 'Route not found.' } });
    } catch (error) {
      sendError(response, error);
    }
  }

  private handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname !== '/ws') throw new RoomError('session_not_found', 'Session not found.');
      const token = url.searchParams.get('token');
      if (!token) throw new RoomError('session_not_found', 'Session not found.');
      this.rooms.roomIdForSession(token);
      this.webSockets.handleUpgrade(request, socket, head, (webSocket) => {
        this.webSockets.emit('connection', webSocket, request);
      });
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
      socket.destroy();
    }
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) throw new RoomError('session_not_found', 'Session not found.');
      const roomId = this.rooms.roomIdForSession(token);
      const connection = { socket, token, roomId };
      this.sockets.add(connection);
      this.rooms.reconnect(token);
      this.sendSnapshot(connection);
      this.broadcastRoom(roomId, connection);
      socket.on('message', (data, isBinary) => {
        this.handleMessage(connection, data, isBinary);
      });
      socket.on('close', () => {
        this.sockets.delete(connection);
        if (![...this.sockets].some((candidate) => candidate.token === token)) {
          try {
            this.rooms.disconnect(token);
            this.broadcastRoom(roomId);
          } catch {
            // The room may have been deleted or expired while the socket was closing.
          }
        }
      });
    } catch {
      socket.close(1008, 'session not found');
    }
  }

  private handleMessage(
    connection: ConnectedSocket,
    data: RawData,
    isBinary: boolean,
  ): void {
    let requestId: string | undefined;
    try {
      if (isBinary) throw new RoomError('invalid_input', 'Binary messages are not supported.');
      const parsedJson: unknown = JSON.parse(rawDataToText(data));
      if (parsedJson && typeof parsedJson === 'object' && 'id' in parsedJson) {
        const possibleId = (parsedJson as { id?: unknown }).id;
        if (typeof possibleId === 'string') requestId = possibleId;
      }
      const parsed = clientCommandSchema.safeParse(parsedJson);
      if (!parsed.success) throw new RoomError('invalid_input', 'Invalid command.');
      this.executeCommand(connection, parsed.data);
    } catch (error) {
      const normalized = normalizeError(error);
      sendSocket(connection.socket, {
        type: 'error',
        ...(requestId ? { id: requestId } : {}),
        error: normalized,
      });
    }
  }

  private executeCommand(connection: ConnectedSocket, command: ClientCommand): void {
    if (command.type === 'ping') {
      sendSocket(connection.socket, { type: 'pong', id: command.id });
      return;
    }
    if (command.type === 'delete_room') {
      const roomId = this.rooms.delete(connection.token);
      sendSocket(connection.socket, { type: 'ack', id: command.id });
      this.terminateRoom(roomId, 'deleted');
      return;
    }

    switch (command.type) {
      case 'begin':
        this.rooms.begin(connection.token);
        break;
      case 'save_draft':
        this.rooms.saveDraft(connection.token, command.body);
        break;
      case 'ready':
        this.rooms.ready(connection.token);
        break;
      case 'edit':
        this.rooms.edit(connection.token);
        break;
      case 'remove':
        this.rooms.remove(connection.token, command.participantId);
        break;
      case 'replay':
        this.rooms.replay(connection.token);
        break;
    }
    sendSocket(connection.socket, { type: 'ack', id: command.id });
    this.broadcastRoom(connection.roomId);
  }

  private sendSnapshot(connection: ConnectedSocket): void {
    sendSocket(connection.socket, { type: 'snapshot', room: this.rooms.snapshot(connection.token) });
  }

  private broadcastRoom(roomId: string, except?: ConnectedSocket): void {
    for (const connection of this.sockets) {
      if (connection.roomId !== roomId || connection === except) continue;
      try {
        this.sendSnapshot(connection);
      } catch {
        connection.socket.close(1008, 'session ended');
      }
    }
  }

  private tick(): void {
    const result = this.rooms.processDue();
    for (const roomId of result.changedRoomIds) this.broadcastRoom(roomId);
    for (const roomId of result.expiredRoomIds) this.terminateRoom(roomId, 'expired');
  }

  private terminateRoom(roomId: string, reason: 'deleted' | 'expired'): void {
    for (const connection of [...this.sockets]) {
      if (connection.roomId !== roomId) continue;
      sendSocket(connection.socket, { type: 'room_ended', reason });
      connection.socket.close(1000, `room ${reason}`);
      this.sockets.delete(connection);
    }
  }
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > MAX_HTTP_BODY_BYTES) throw new RoomError('invalid_input', 'Request body is too large.');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new RoomError('invalid_input', 'Request body must be valid JSON.');
  }
}

function rawDataToText(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  return Buffer.from(data).toString('utf8');
}

function property(value: unknown, key: string): unknown {
  return value && typeof value === 'object' && key in value
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function bearerToken(request: IncomingMessage): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new RoomError('session_not_found', 'Session not found.');
  }
  return authorization.slice('Bearer '.length);
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  const serialized = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(serialized),
    'cache-control': 'no-store',
  });
  response.end(serialized);
}

function sendError(response: ServerResponse, error: unknown): void {
  const normalized = normalizeError(error);
  const status =
    normalized.code === 'internal_error'
      ? 500
      : normalized.code === 'room_not_found' || normalized.code === 'session_not_found'
        ? 404
        : normalized.code === 'forbidden'
          ? 403
          : normalized.code === 'room_full'
            ? 409
            : 400;
  sendJson(response, status, { error: normalized });
}

function normalizeError(error: unknown): { code: string; message: string } {
  return error instanceof RoomError
    ? { code: error.code, message: error.message }
    : { code: 'internal_error', message: 'The server could not complete the request.' };
}

function sendSocket(socket: WebSocket, body: unknown): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(body));
}
