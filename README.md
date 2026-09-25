# Ceduljica

Ceduljica is a private-link sticky-note room for 2–12 people. One authoritative TypeScript process serves the responsive client, owns every room transition, and stores live room state in SQLite.

## Start with Docker Compose

Requirements: Docker Engine with Docker Compose v2.

```sh
cp .env.example .env   # optional; edit the published port if needed
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

Open <http://localhost:3000> (or the `CEDULJICA_PORT` selected in `.env`). A healthy deployment returns:

```sh
curl --fail http://localhost:3000/health
# {"status":"ok"}
```

Compose runs exactly one `app` process and mounts the named `ceduljica-data` volume at `/data`. The SQLite database is `/data/ceduljica.sqlite`; rebuilding or restarting the app does not remove it.

### Routine operation

Restart the application without removing its rooms:

```sh
docker compose restart app
```

Stop the deployment while preserving the SQLite volume:

```sh
docker compose down
```

After an ordinary restart, browsers reconnect with their opaque local session tokens and resynchronize from the server. Startup also removes rooms already past their 24-hour inactivity deadline. Server-accepted room actions extend that deadline; passive connection heartbeats do not. Owner-confirmed deletion removes the room, its sessions, and its notes immediately.

To update the local image, stop the service, retain the named volume, rebuild, and check health:

```sh
docker compose down
docker compose up --build -d
curl --fail http://localhost:3000/health
```

This release uses schema version 1 and performs an idempotent schema bootstrap. It has no operator-run migration command. Back up the named volume before replacing the application with a future release that documents a schema change.

### Deliberate data cleanup

`docker compose down` intentionally preserves data. To permanently remove every room and note, first stop the deployment and then explicitly remove its volume:

```sh
docker compose down --volumes
```

This is destructive and cannot be undone without a backup. For one room, prefer the owner's **Delete room** control.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `CEDULJICA_PORT` | `3000` | Host port published by Compose. |
| `HOST` | `0.0.0.0` | Container listen address; fixed by `compose.yaml`. |
| `PORT` | `3000` | Container HTTP port; fixed by `compose.yaml`. |
| `CEDULJICA_DB_PATH` | `/data/ceduljica.sqlite` | SQLite path on the persistent volume. |

Do not run multiple app replicas against this database. Ceduljica's lifecycle serialization is designed for one authoritative process; horizontal coordination and shared-database operation are outside this release.

## Internet exposure and privacy boundary

The Compose file publishes plain HTTP for local or trusted-network use. Before exposing Ceduljica to the internet, place it behind an HTTPS reverse proxy or ingress that:

- terminates TLS with a valid certificate;
- forwards HTTP requests and WebSocket upgrades to the single `app` service;
- redirects public HTTP to HTTPS; and
- preserves normal `Host`, `Upgrade`, and `Connection` forwarding behavior.

Ceduljica does not issue certificates or terminate TLS. Room links and browser-held session tokens are bearer secrets: avoid logging URLs or tokens at the proxy, and serve the public site only over HTTPS so browsers use secure `wss://` WebSockets. Rooms are unlisted, not end-to-end encrypted; the application process and SQLite operator can access room data. Nicknames are display labels, never authorization credentials.

## Local development and verification

Requirements: Node.js 22 or newer and npm.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

The browser suite uses the pinned development-only Playwright CLI. Install its Chromium browser once if the host does not already have it, then run the suite after a build:

```sh
npx playwright-cli install-browser chromium
npm run test:e2e
```

The browser check starts an isolated local server and temporary SQLite database. It covers independent desktop and phone contexts, create/join/begin/write/ready/edit/reveal/replay/delete, a late join and reconnect, privacy projections, focus and reduced motion, persistent mute, capacity, and 1-note/12-note reveal layouts.

Run the packaged smoke and restart check only after Compose is healthy:

```sh
docker compose up --build -d
curl --fail http://localhost:3000/health
npm run test:compose
docker compose down
```

`test:compose` creates a disposable room, verifies participant-specific privacy, restarts only the `app` service, reconnects both participants from the preserved SQLite volume, completes reveal, deletes the room, and confirms its sessions are gone. It does not remove the named volume. Deterministic unit and integration tests use an injected clock for the 60-second disconnect deadline and 24-hour expiry instead of waiting in real time.
