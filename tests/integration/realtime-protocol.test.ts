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
let fakeClock: FakeClock | undefined;
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
  fakeClock = new FakeClock();
  const service = new RoomService(store, fakeClock, new DeterministicIdentities());
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

  it('transports round prompts, rejects invalid values, and accepts omitted replay fields', async () => {
    await setup();
    const owner = await post('/api/rooms', { nickname: 'Owner' });
    const guest = await post(`/api/rooms/${owner.credentials.roomCode}/join`, { nickname: 'Guest' });
    const ownerClient = await connect(owner.credentials.sessionToken);
    const guestClient = await connect(guest.credentials.sessionToken);

    guestClient.send({ id: 'forbidden-prompt', type: 'begin', prompt: 'Not authorized' });
    const forbidden = await guestClient.waitFor(
      (message) => record(message)?.type === 'error' && record(message)?.id === 'forbidden-prompt',
    );
    expect(record(record(forbidden)?.error)?.code).toBe('forbidden');

    ownerClient.send({ id: 'invalid-newline', type: 'begin', prompt: 'one\ntwo' });
    const newline = await ownerClient.waitFor(
      (message) => record(message)?.type === 'error' && record(message)?.id === 'invalid-newline',
    );
    expect(record(record(newline)?.error)).toEqual({
      code: 'invalid_input',
      message: 'Round prompt must be a single line of at most 200 characters.',
    });
    ownerClient.send({ id: 'invalid-long', type: 'begin', prompt: 'x'.repeat(201) });
    const long = await ownerClient.waitFor(
      (message) => record(message)?.type === 'error' && record(message)?.id === 'invalid-long',
    );
    expect(record(record(long)?.error)?.code).toBe('invalid_input');

    ownerClient.send({ id: 'prompted-begin', type: 'begin', prompt: '  A shared question?  ' });
    await ownerClient.waitFor(isAck('prompted-begin'));
    const writing = await guestClient.waitFor(snapshotWithPhase('writing'));
    expect(record(record(writing)?.room)?.roundPrompt).toBe('A shared question?');

    ownerClient.send({ id: 'owner-prompt-draft', type: 'save_draft', body: 'Owner answer' });
    guestClient.send({ id: 'guest-prompt-draft', type: 'save_draft', body: 'Guest answer' });
    await ownerClient.waitFor(isAck('owner-prompt-draft'));
    await guestClient.waitFor(isAck('guest-prompt-draft'));
    ownerClient.send({ id: 'owner-prompt-ready', type: 'ready' });
    guestClient.send({ id: 'guest-prompt-ready', type: 'ready' });
    await ownerClient.waitFor(isAck('owner-prompt-ready'));
    await guestClient.waitFor(isAck('guest-prompt-ready'));
    const reveal = await guestClient.waitFor(snapshotWithPhase('reveal'));
    expect(record(record(reveal)?.room)?.roundPrompt).toBe('A shared question?');
    const revealVersion = roomVersion(reveal);

    ownerClient.send({ id: 'omitted-replay', type: 'replay' });
    await ownerClient.waitFor(isAck('omitted-replay'));
    const replay = await guestClient.waitFor(
      (message) => snapshotWithPhase('writing')(message) && roomVersion(message) > revealVersion,
    );
    expect(record(record(replay)?.room)?.roundPrompt).toBe('');
  });

  it('drives the complete owner, waiting, replay, transfer, removal, and deletion flow', async () => {
    await setup();
    const owner = await post('/api/rooms', { nickname: 'Owner' });
    const guest = await post(`/api/rooms/${owner.credentials.roomCode}/join`, { nickname: 'Guest' });
    const ownerClient = await connect(owner.credentials.sessionToken);
    const guestClient = await connect(guest.credentials.sessionToken);

    ownerClient.send({ id: 'begin-full', type: 'begin' });
    await ownerClient.waitFor(isAck('begin-full'));
    const firstWriting = await guestClient.waitFor(snapshotWithPhase('writing'));

    const late = await post(`/api/rooms/${owner.credentials.roomCode}/join`, { nickname: 'Late' });
    let lateClient = await connect(late.credentials.sessionToken);
    const lateWaiting = await lateClient.waitFor((message) => {
      const room = record(record(message)?.room);
      return record(message)?.type === 'snapshot' && record(room?.self)?.roundRole === 'waiting';
    });
    expect(record(record(lateWaiting)?.room)?.phase).toBe('writing');

    guestClient.send({ id: 'guest-first-draft', type: 'save_draft', body: 'first version' });
    await guestClient.waitFor(isAck('guest-first-draft'));
    guestClient.send({ id: 'guest-first-ready', type: 'ready' });
    await guestClient.waitFor(isAck('guest-first-ready'));
    guestClient.send({ id: 'guest-edit', type: 'edit' });
    await guestClient.waitFor(isAck('guest-edit'));
    guestClient.send({ id: 'guest-final-draft', type: 'save_draft', body: 'guest final' });
    await guestClient.waitFor(isAck('guest-final-draft'));
    guestClient.send({ id: 'guest-final-ready', type: 'ready' });
    await guestClient.waitFor(isAck('guest-final-ready'));

    await lateClient.close();
    clients.splice(clients.indexOf(lateClient), 1);
    lateClient = await connect(late.credentials.sessionToken);
    const restoredWaiting = await lateClient.waitFor((message) => {
      const room = record(record(message)?.room);
      return record(message)?.type === 'snapshot' && record(room?.self)?.roundRole === 'waiting';
    });
    expect(record(record(restoredWaiting)?.room)?.phase).toBe('writing');

    ownerClient.send({ id: 'owner-draft-full', type: 'save_draft', body: 'owner final' });
    await ownerClient.waitFor(isAck('owner-draft-full'));
    ownerClient.send({ id: 'owner-ready-full', type: 'ready' });
    await ownerClient.waitFor(isAck('owner-ready-full'));
    const reveal = await lateClient.waitFor(snapshotWithPhase('reveal'));
    const revealVersion = roomVersion(reveal);
    expect(JSON.stringify(reveal)).toContain('owner final');
    expect(JSON.stringify(reveal)).toContain('guest final');

    ownerClient.send({ id: 'replay-full', type: 'replay' });
    await ownerClient.waitFor(isAck('replay-full'));
    const replayWriting = await guestClient.waitFor(
      (message) => snapshotWithPhase('writing')(message) && roomVersion(message) > revealVersion,
    );
    const replayVersion = roomVersion(replayWriting);
    const replayRoom = record(record(replayWriting)?.room);
    expect((replayRoom?.participants as unknown[] | undefined)?.length).toBe(3);

    await ownerClient.close();
    clients.splice(clients.indexOf(ownerClient), 1);
    const ownerDisconnected = await guestClient.waitFor((message) => {
      const room = record(record(message)?.room);
      const participants = room?.participants as Array<Record<string, unknown>> | undefined;
      return roomVersion(message) > replayVersion && participants?.some((person) => person.id === owner.credentials.participantId && person.connected === false) === true;
    });
    const disconnectVersion = roomVersion(ownerDisconnected);
    fakeClock?.advance(60_000);
    server?.runMaintenance();
    const transferred = await guestClient.waitFor((message) => {
      const room = record(record(message)?.room);
      const self = record(room?.self);
      return roomVersion(message) > disconnectVersion && self?.isOwner === true;
    });
    expect(record(record(transferred)?.room)?.phase).toBe('writing');

    const formerOwner = await connect(owner.credentials.sessionToken);
    const formerSnapshot = await formerOwner.waitFor((message) => {
      const room = record(record(message)?.room);
      const self = record(room?.self);
      return record(message)?.type === 'snapshot' && self?.isOwner === false && self?.roundRole === 'waiting';
    });
    expect(formerSnapshot).toBeTruthy();
    const formerClosed = new Promise<number>((resolve) => formerOwner.socket.once('close', (code) => resolve(code)));
    guestClient.send({ id: 'remove-former', type: 'remove', participantId: owner.credentials.participantId });
    await guestClient.waitFor(isAck('remove-former'));
    expect(await formerClosed).toBe(1008);
    clients.splice(clients.indexOf(formerOwner), 1);

    guestClient.send({ id: 'guest-round-two', type: 'save_draft', body: 'guest round two' });
    lateClient.send({ id: 'late-round-two', type: 'save_draft', body: 'late round two' });
    await guestClient.waitFor(isAck('guest-round-two'));
    await lateClient.waitFor(isAck('late-round-two'));
    guestClient.send({ id: 'guest-round-two-ready', type: 'ready' });
    lateClient.send({ id: 'late-round-two-ready', type: 'ready' });
    await guestClient.waitFor(isAck('guest-round-two-ready'));
    await lateClient.waitFor(isAck('late-round-two-ready'));
    const secondReveal = await guestClient.waitFor((message) => snapshotWithPhase('reveal')(message) && roomVersion(message) > replayVersion);
    expect(JSON.stringify(secondReveal)).toContain('late round two');

    guestClient.send({ id: 'delete-full', type: 'delete_room' });
    await guestClient.waitFor(isAck('delete-full'));
    const ended = await lateClient.waitFor(isType('room_ended'));
    expect(record(ended)?.reason).toBe('deleted');
    expect(roomVersion(firstWriting)).toBeGreaterThan(0);
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
