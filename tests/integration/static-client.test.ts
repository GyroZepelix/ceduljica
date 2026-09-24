import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CeduljicaServer } from '../../src/server/http-server.js';
import { serviceFixture, type ServiceFixture } from '../helpers.js';

let fixture: ServiceFixture | undefined;
let server: CeduljicaServer | undefined;
const temporaryRoots: string[] = [];

afterEach(async () => {
  await server?.close();
  fixture?.cleanup();
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
  server = undefined;
  fixture = undefined;
});

describe('built client delivery', () => {
  it('serves assets and the SPA fallback without shadowing API routes', async () => {
    fixture = serviceFixture();
    const root = join(process.cwd(), `.tmp-client-${String(process.pid)}-${String(Date.now())}`);
    temporaryRoots.push(root);
    mkdirSync(join(root, 'assets'), { recursive: true });
    writeFileSync(join(root, 'index.html'), '<!doctype html><main>Ceduljica app</main>');
    writeFileSync(join(root, 'assets', 'app.js'), 'window.CEDULJICA = true;');
    server = new CeduljicaServer(fixture.service, { staticRoot: root });
    const port = await server.listen(0);
    const origin = `http://127.0.0.1:${String(port)}`;

    const landing = await fetch(`${origin}/room/private-code`);
    expect(landing.status).toBe(200);
    expect(landing.headers.get('cache-control')).toBe('no-store');
    expect(await landing.text()).toContain('Ceduljica app');

    const asset = await fetch(`${origin}/assets/app.js`);
    expect(asset.headers.get('content-type')).toContain('text/javascript');
    expect(await asset.text()).toContain('CEDULJICA');

    const missingApi = await fetch(`${origin}/api/not-a-route`);
    expect(missingApi.status).toBe(404);
    expect(missingApi.headers.get('content-type')).toContain('application/json');
  });
});
