import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { SqliteRoomStore } from '../db/sqlite-room-store.js';
import { RoomService } from '../domain/room-service.js';
import { SystemClock } from '../shared/clock.js';
import { CeduljicaServer } from './http-server.js';

const databasePath = process.env.CEDULJICA_DB_PATH ?? './data/ceduljica.sqlite';
const port = parsePort(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '0.0.0.0';
mkdirSync(dirname(resolve(databasePath)), { recursive: true });
const store = new SqliteRoomStore(databasePath);
const rooms = new RoomService(store, new SystemClock());
rooms.recoverAfterRestart();
const server = new CeduljicaServer(rooms);

await server.listen(port, host);
process.stdout.write(`Ceduljica listening on http://${host}:${String(port)}\n`);

let stopping = false;
async function stop(): Promise<void> {
  if (stopping) return;
  stopping = true;
  await server.close();
  store.close();
}

process.on('SIGINT', () => {
  void stop().then(() => process.exit(0));
});
process.on('SIGTERM', () => {
  void stop().then(() => process.exit(0));
});

function parsePort(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  return parsed;
}
