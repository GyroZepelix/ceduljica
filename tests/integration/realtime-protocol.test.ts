import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket, type RawData } from 'ws';
import { SqliteRoomStore } from '../../src/db/sqlite-room-store.js';
import { RoomService } from '../../src/domain/room-service.js';
import { CeduljicaServer } from '../../src/server/http-server.js';
import { DeterministicIdentities, FakeClock } from '../helpers.js';

interface CreatedResponse {
  credentials: {
    roomCode: string;
    sessionToken: string;
    participantId: string;
  };
}

class ProtocolClient {
  readonly messages: unknown[] = [];
  private readonly waiters = new Set<() => void>();

  constructor(readonly socket: WebSocket) {
    socket.on('message', (data) => {
      this.messages.push(JSON.parse(rawDataToText(data)) as unknown);
      for (const waiter of this.waiters) waiter();
    });
  }

  send(body: unknown): void {
    this.socket.send(JSON.stringify(body));
  }

  async waitFor(predicate: (message: unknown) => boolean): Promise<unknown> {
    const existing = this.messages.find(predicate);
    if (existing !== undefined) return existing;
    return await new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.waiters.delete(check);
        reject(new Error(`Timed out waiting for message. Received: ${JSON.stringify(this.messages)}`));
      }, 2_000);
      const check = (): void => {
        const match = this.messages.find(predicate);
        if (match === undefined) return;
        clearTimeout(timeout);
        this.waiters.delete(check);
        resolve(match);
      };
      this.waiters.add(check);
    });
  }

  async close(): Promise<void> {
    if (this.socket.readyState === WebSocket.CLOSED) return;
    await new Promise<void>((resolve) => {
      this.socket.once('close', () => resolve());
      this.socket.close();
    });
  }
}

let server: CeduljicaServer | undefined;
let store: SqliteRoomStore | undefined;
let baseUrl = '';
const clients: ProtocolClient[] = [];

afterEach(async () => {
  await Promise.all(clients.splice(0).map(async (client) => client.close()));
  await server?.close();
  store?.close();
  server = undefined;
  store = undefined;
});

async function setup(): Promise<RoomService> {
  store = new SqliteRoomStore(':memory:');
  const service = new RoomService(store, new FakeClock(), new DeterministicIdentities());
  server = new CeduljicaServer(service);
  const port = await server.listen(0);
  baseUrl = `http://127.0.0.1:${String(port)}`;
  return service;
}

async function post(path: string, body: unknown): Promise<CreatedResponse> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as CreatedResponse;
}

async function connect(token: string): Promise<ProtocolClient> {
  const url = new URL('/ws', baseUrl);
  url.protocol = 'ws:';
  url.searchParams.set('token', token);
  const socket = new WebSocket(url);
  const client = new ProtocolClient(socket);
  clients.push(client);
  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', reject);
  });
  await client.waitFor(isType('snapshot'));
  return client;
}

function isType(type: string): (message: unknown) => boolean {
  return (message) => record(message)?.type === type;
}

function isAck(id: string): (message: unknown) => boolean {
  return (message) => record(message)?.type === 'ack' && record(message)?.id === id;
}

function snapshotWithPhase(phase: string): (message: unknown) => boolean {
  return (message) => {
    const value = record(message);
    return value?.type === 'snapshot' && record(value.room)?.phase === phase;
  };
}

function roomVersion(message: unknown): number {
  const version = record(record(message)?.room)?.version;
  return typeof version === 'number' ? version : -1;
}

function rawDataToText(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  return Buffer.from(data).toString('utf8');
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

describe('real-time participant-specific protocol', () => {
  it('resynchronizes clients and never sends another draft before reveal', async () => {
    await setup();
    const owner = await post('/api/rooms', { nickname: 'Owner' });
    const guest = await post(`/api/rooms/${owner.credentials.roomCode}/join`, { nickname: 'Guest' });
    const ownerClient = await connect(owner.credentials.sessionToken);
    const guestClient = await connect(guest.credentials.sessionToken);

    ownerClient.send({ id: 'begin', type: 'begin' });
    await ownerClient.waitFor(isAck('begin'));
    const initialWriting = await guestClient.waitFor(snapshotWithPhase('writing'));
    const initialVersion = roomVersion(initialWriting);
    ownerClient.send({ id: 'owner-draft', type: 'save_draft', body: 'transport-owner-secret' });
    await ownerClient.waitFor(isAck('owner-draft'));
    const guestWriting = await guestClient.waitFor(
      (message) => snapshotWithPhase('writing')(message) && roomVersion(message) > initialVersion,
    );
    expect(JSON.stringify(guestWriting)).not.toContain('transport-owner-secret');
    expect(JSON.stringify(guestClient.messages)).not.toContain('transport-owner-secret');

    const endpoint = await fetch(`${baseUrl}/api/session`, {
      headers: { authorization: `Bearer ${guest.credentials.sessionToken}` },
    });
    expect(endpoint.status).toBe(200);
    expect(await endpoint.text()).not.toContain('transport-owner-secret');

    guestClient.send({ id: 'guest-draft', type: 'save_draft', body: 'transport-guest-secret' });
    await guestClient.waitFor(isAck('guest-draft'));
    const ownerAfterGuestDraft = await ownerClient.waitFor(
      (message) => snapshotWithPhase('writing')(message) && roomVersion(message) > roomVersion(guestWriting),
    );
    expect(JSON.stringify(ownerAfterGuestDraft)).not.toContain('transport-guest-secret');
    expect(JSON.stringify(ownerClient.messages)).not.toContain('transport-guest-secret');
    guestClient.send({ id: 'guest-ready', type: 'ready' });
    await guestClient.waitFor(isAck('guest-ready'));
    ownerClient.send({ id: 'owner-ready', type: 'ready' });
    await ownerClient.waitFor(isAck('owner-ready'));
    const reveal = await guestClient.waitFor(snapshotWithPhase('reveal'));
    expect(JSON.stringify(reveal)).toContain('transport-owner-secret');
    expect(JSON.stringify(reveal)).toContain('transport-guest-secret');
  });

  it('rejects invalid/unauthorized protocol input, reconnects with state, and broadcasts deletion', async () => {
    const service = await setup();
    const owner = await post('/api/rooms', { nickname: 'Owner' });
    const guest = await post(`/api/rooms/${owner.credentials.roomCode}/join`, { nickname: 'Guest' });
    const ownerClient = await connect(owner.credentials.sessionToken);
    let guestClient = await connect(guest.credentials.sessionToken);

    guestClient.send({ id: 'forbidden', type: 'begin' });
    const forbidden = await guestClient.waitFor(
      (message) => record(message)?.type === 'error' && record(message)?.id === 'forbidden',
    );
    expect(record(record(forbidden)?.error)?.code).toBe('forbidden');
    guestClient.send({ id: 'unknown', type: 'invent_state', phase: 'reveal' });
    const invalid = await guestClient.waitFor(
      (message) => record(message)?.type === 'error' && record(message)?.id === 'unknown',
    );
    expect(record(record(invalid)?.error)?.code).toBe('invalid_input');

    ownerClient.send({ id: 'begin', type: 'begin' });
    await ownerClient.waitFor(isAck('begin'));
    guestClient.send({ id: 'draft', type: 'save_draft', body: 'reconnect draft' });
    await guestClient.waitFor(isAck('draft'));
    await guestClient.close();
    clients.splice(clients.indexOf(guestClient), 1);
    guestClient = await connect(guest.credentials.sessionToken);
    const restored = await guestClient.waitFor(
      (message) => JSON.stringify(message).includes('reconnect draft'),
    );
    expect(record(record(restored)?.room)?.phase).toBe('writing');
    expect(service.roomIdForSession(guest.credentials.sessionToken)).toBeTruthy();

    ownerClient.send({ id: 'delete', type: 'delete_room' });
    await ownerClient.waitFor(isAck('delete'));
    const ended = await guestClient.waitFor(isType('room_ended'));
    expect(record(ended)?.reason).toBe('deleted');
  });
});
