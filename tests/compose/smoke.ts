import { execFileSync } from 'node:child_process';
import { WebSocket, type RawData } from 'ws';

interface CreatedSession {
  credentials: {
    roomCode: string;
    sessionToken: string;
    participantId: string;
  };
}

interface MessageRecord {
  type?: unknown;
  id?: unknown;
  room?: unknown;
  reason?: unknown;
  error?: unknown;
}

class Client {
  readonly messages: unknown[] = [];
  private readonly waiters = new Set<() => void>();
  private sequence = 0;

  private constructor(readonly socket: WebSocket) {
    socket.on('message', (data) => {
      this.messages.push(JSON.parse(text(data)) as unknown);
      for (const waiter of this.waiters) waiter();
    });
  }

  static async connect(baseUrl: URL, token: string): Promise<Client> {
    const url = new URL('/ws', baseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('token', token);
    const socket = new WebSocket(url);
    const client = new Client(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once('open', () => resolve());
      socket.once('error', reject);
    });
    await client.waitFor((message) => record(message).type === 'snapshot');
    return client;
  }

  async command(body: Record<string, unknown>): Promise<void> {
    const id = `compose-${String(++this.sequence)}`;
    this.socket.send(JSON.stringify({ id, ...body }));
    const response = record(await this.waitFor((message) => {
      const value = record(message);
      return value.id === id && (value.type === 'ack' || value.type === 'error');
    }));
    if (response.type === 'error') throw new Error(`Compose command failed: ${JSON.stringify(response.error)}`);
  }

  async waitFor(predicate: (message: unknown) => boolean, timeoutMs = 10_000): Promise<unknown> {
    const existing = this.messages.find(predicate);
    if (existing !== undefined) return existing;
    return await new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(check);
        reject(new Error(`Timed out waiting for Compose message. Received: ${JSON.stringify(this.messages)}`));
      }, timeoutMs);
      const check = (): void => {
        const found = this.messages.find(predicate);
        if (found === undefined) return;
        clearTimeout(timer);
        this.waiters.delete(check);
        resolve(found);
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

const baseUrl = new URL(process.env.COMPOSE_BASE_URL ?? 'http://127.0.0.1:3000');
let owner: Client | undefined;
let guest: Client | undefined;

try {
  await waitForHealth();
  const ownerSession = await create('/api/rooms', 'Compose Owner');
  const guestSession = await create(
    `/api/rooms/${encodeURIComponent(ownerSession.credentials.roomCode)}/join`,
    'Compose Guest',
  );
  owner = await Client.connect(baseUrl, ownerSession.credentials.sessionToken);
  guest = await Client.connect(baseUrl, guestSession.credentials.sessionToken);

  await owner.command({ type: 'begin' });
  await owner.command({ type: 'save_draft', body: 'compose owner persisted draft' });
  await guest.command({ type: 'save_draft', body: 'compose guest persisted draft' });
  await guest.command({ type: 'ready' });

  const ownerBeforeRestart = await authenticatedSnapshot(ownerSession.credentials.sessionToken);
  assert(!ownerBeforeRestart.includes('compose guest persisted draft'), 'Owner snapshot disclosed the guest draft before reveal.');
  assert(ownerBeforeRestart.includes('compose owner persisted draft'), 'Owner draft was missing before restart.');

  await owner.close();
  await guest.close();
  owner = undefined;
  guest = undefined;

  execFileSync('docker', ['compose', 'restart', 'app'], { stdio: 'inherit' });
  await waitForHealth(30_000);

  owner = await Client.connect(baseUrl, ownerSession.credentials.sessionToken);
  guest = await Client.connect(baseUrl, guestSession.credentials.sessionToken);
  const ownerRestored = await latestSnapshot(owner);
  const guestRestored = await latestSnapshot(guest);
  assert(JSON.stringify(ownerRestored).includes('compose owner persisted draft'), 'Owner draft did not survive Compose restart.');
  assert(!JSON.stringify(ownerRestored).includes('compose guest persisted draft'), 'Restored owner projection disclosed guest draft.');
  assert(JSON.stringify(guestRestored).includes('compose guest persisted draft'), 'Ready guest draft did not survive Compose restart.');
  assert(!JSON.stringify(guestRestored).includes('compose owner persisted draft'), 'Restored guest projection disclosed owner draft.');

  await owner.command({ type: 'ready' });
  const reveal = await guest.waitFor((message) => {
    const room = record(record(message).room);
    return record(message).type === 'snapshot' && room.phase === 'reveal';
  });
  const revealText = JSON.stringify(reveal);
  assert(revealText.includes('compose owner persisted draft'), 'Reveal omitted owner note after restart.');
  assert(revealText.includes('compose guest persisted draft'), 'Reveal omitted guest note after restart.');

  await owner.command({ type: 'delete_room' });
  const ended = record(await guest.waitFor((message) => record(message).type === 'room_ended'));
  assert(ended.reason === 'deleted', 'Guest did not receive deletion notification.');
  const removedSession = await fetch(new URL('/api/session', baseUrl), {
    headers: { authorization: `Bearer ${ownerSession.credentials.sessionToken}` },
  });
  assert(removedSession.status === 404, `Deleted owner session returned ${String(removedSession.status)}.`);

  process.stdout.write('Compose smoke passed: two-client privacy, restart persistence, resynchronization, reveal, and deletion.\n');
} finally {
  await Promise.all([owner?.close(), guest?.close()]);
}

async function create(path: string, nickname: string): Promise<CreatedSession> {
  const response = await fetch(new URL(path, baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  if (response.status !== 201) throw new Error(`Create/join returned ${String(response.status)}: ${await response.text()}`);
  return (await response.json()) as CreatedSession;
}

async function authenticatedSnapshot(token: string): Promise<string> {
  const response = await fetch(new URL('/api/session', baseUrl), {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Snapshot returned ${String(response.status)}.`);
  return await response.text();
}

async function latestSnapshot(client: Client): Promise<unknown> {
  return await client.waitFor((message) => record(message).type === 'snapshot');
}

async function waitForHealth(timeoutMs = 15_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(new URL('/health', baseUrl));
      if (response.ok) return;
    } catch {
      // Restart temporarily refuses connections.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Compose service did not become healthy at ${baseUrl.href}.`);
}

function record(value: unknown): MessageRecord & Record<string, unknown> {
  return value && typeof value === 'object' ? (value as MessageRecord & Record<string, unknown>) : {};
}

function text(data: RawData): string {
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString('utf8');
  return Buffer.from(data).toString('utf8');
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
