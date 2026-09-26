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

## Production deployment

Production on `himmel` uses `compose.yaml` together with `compose.production.yaml`. The override removes the local-development host port and joins the existing external `reverse-proxy` network as `ceduljica`; the base file continues to provide the health check, restart policy, single app process, and `ceduljica-data` volume.

Bootstrap the public checkout as `rocky`, but do not start the base Compose topology by itself:

```sh
git clone https://github.com/GyroZepelix/ceduljica.git /opt/services/fun-postit
cd /opt/services/fun-postit
install -m 600 .env.production.example .env
```

The server-local `.env` is non-secret and must contain only this production selection:

```dotenv
COMPOSE_FILE=compose.yaml:compose.production.yaml
```

Configure these GitHub repository Actions secrets:

| Name | Purpose |
| --- | --- |
| `DEPLOY_SSH_PRIVATE_KEY` | Dedicated private key whose matching public key alone is authorized for `rocky`. |
| `DEPLOY_SSH_HOST` | Real public SSH endpoint; never the Cloudflare-proxied application hostname. |
| `DEPLOY_SSH_PORT` | Public SSH port. |
| `DEPLOY_SSH_USER` | Exact value `rocky`. |
| `DEPLOY_SSH_KNOWN_HOSTS` | Independently verified known-hosts line for the endpoint and port. |

Store all five values as repository secrets so GitHub masks them in Actions logs. Do not derive the pinned host value inside the workflow, reuse another private key, or enable SSH agent forwarding. The workflow writes the dedicated key and known-hosts material to temporary mode-0600 files, requires strict host-key checking, and removes those files when the job exits.

A push to `master` or a manual **Deploy production** run enters the same non-cancelling production concurrency group. The job uses plain OpenSSH, verifies `himmel`, the exact checkout path, branch, origin, clean status, and `.env`, then runs:

```sh
git pull --ff-only origin master
docker compose config --quiet
docker compose up -d --build
```

Deployment fails if the fast-forwarded checkout does not equal the triggering full GitHub SHA or if the single container does not become healthy within the bounded wait. It never resets or cleans the checkout and never removes the volume.

The separately managed Caddy route is intentionally only:

```caddyfile
ceduljica.dgjalic.com {
	reverse_proxy ceduljica:3000
}
```

Apply or change that shared-ingress route only through its validated, rollback-protected operator procedure. Production acceptance must confirm trusted HTTPS, `/health`, WebSocket create/join behavior, the `reverse-proxy` alias, the named `/data` volume, and the absence of both a published container port and a host listener on TCP 3000.

Record the previous and deployed Git SHAs for each activation. Rebuilding a previous SHA is a manual, approved rollback only while its database expectations remain compatible. This release uses idempotent schema version 1; before deploying any future schema migration, establish a separate backup and rollback decision. Never use `docker compose down --volumes` in deployment or rollback.

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
