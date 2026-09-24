# Dream learnings: 260924-1909-fun-sticky-note-rooms

Work item: `260924-1909-fun-sticky-note-rooms`

> Historical snapshot: this ledger records what Dream retained at each Gamemaster checkpoint. Current source, plans, verification, outcomes, and current dynamic destinations remain authoritative.

<!-- dream-checkpoints:start -->

## Gamemaster checkpoint: 260924-1909-fun-sticky-note-rooms/01.01

Date: 2026-09-24
Dream log: [2026-09-24-2216-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-01-01.md](../2026-09-24-2216-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-01-01.md)
Outcome: episodic recall only

## Gamemaster checkpoint: 260924-1909-fun-sticky-note-rooms/02.01

Date: 2026-09-24
Dream log: [2026-09-24-2252-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-02-01.md](../2026-09-24-2252-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-02-01.md)
Outcome: retained learning

### Authoritative room core contract

- **Exact written text:**
  > # Authoritative room core
  >
  > Read this page when changing Ceduljica room lifecycle behavior, real-time client integration, participant privacy, persistence, or deadline handling.
  >
  > ## Authority and privacy
  >
  > - `RoomService` is the sole authority for room phases, round membership, readiness, reveal, owner actions, reconnect deadlines, replay, deletion, and expiry. Clients submit commands and render projections; they do not derive or assert authoritative state.
  > - Every HTTP session response and WebSocket snapshot is produced for one authenticated participant. During writing, `ownNote` may contain that participant's draft, but another participant's note body is absent from the projection; reveal projections include all eligible named notes.
  > - Nicknames are display data, never authorization. Create and join return opaque participant session tokens; SQLite stores only their SHA-256 hashes and resolves them through the session lookup.
  >
  > ## Persistence and timing
  >
  > - One Node process serially executes synchronous room commands and persists the complete room aggregate plus its hashed-token session lookup in one SQLite transaction. This design is intentionally single-process and does not provide horizontal coordination.
  > - SQLite schema v1 has `schema_version`, `rooms`, and `sessions`. The room row stores serialized authoritative state plus meaningful-activity and expiry timestamps; deleting a room cascades its session rows.
  > - Time-dependent behavior uses an injected clock. A 60-second disconnect deadline controls active-round removal and owner transfer, while 24-hour expiry advances only on accepted meaningful actions; passive WebSocket ping and disconnect handling do not extend room lifetime.
  > - Startup recovery treats formerly connected participants as disconnected with a fresh grace deadline, preserving unexpired room and round state for authoritative reconnect and resynchronization.
  >
  > ## Transport and verification seams
  >
  > - Built-in Node HTTP exposes health, create, join, and authenticated session snapshot routes. The `ws` command channel validates input, returns acknowledgements or sanitized errors, and broadcasts a newly computed participant-specific snapshot after state changes.
  > - The responsive client should reconnect with its opaque session token, replace local server state with each authoritative snapshot, and keep only its own editable draft locally; it must not infer another participant's hidden note or fabricate owner, phase, readiness, or reveal state.
  > - Domain tests use a fake clock and deterministic identities; integration tests cover participant-specific HTTP/WebSocket privacy, reconnect resynchronization, SQLite restart reconstruction, expiry/deletion cleanup, transaction rollback, and coincident lifecycle orderings.
  >
  > Sources: `src/domain/room-service.ts`, `src/db/sqlite-room-store.ts`, `src/server/http-server.ts`, `tests/domain/`, `tests/integration/`, and `spec/active/260924-1909-fun-sticky-note-rooms/implementation/02-01-authoritative-room-core.md`.
- **Destination and classification:** `wiki/architecture/room-core.md` - `Topic-specific dynamic knowledge`
- **Session evidence or selection reason:** The completed 02.01 packet, authoritative source, and 20 passing domain/integration tests establish the room authority, privacy projection, persistence, timing, and protocol boundaries; the canonical plan also proposed documenting these after verified implementation.
- **Expected future benefit:** Client and server work can preserve the privacy and authority boundaries, use the intended reconnect contract, and choose the correct deterministic verification seams without reconstructing the architecture from multiple source files.
- **Why this tier:** These are stable, repository-specific contracts likely to guide several room, client, persistence, and deployment tasks, but they are too component-specific for a repository-wide convention and too well-supported for a tentative observation.

## Gamemaster checkpoint: 260924-1909-fun-sticky-note-rooms/02.02

Date: 2026-09-24
Dream log: [2026-09-24-2332-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-02-02.md](../2026-09-24-2332-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-02-02.md)
Outcome: retained learning

### Responsive client integration contract

- **Exact written text:**
  > ## Transport and verification seams
  >
  > - Built-in Node HTTP exposes health, create, join, and authenticated session snapshot routes. The `ws` command channel validates input, returns acknowledgements or sanitized errors, and broadcasts a newly computed participant-specific snapshot after state changes. The same server serves the Vite production output from `dist/client` with an SPA fallback while preserving JSON 404s for unknown API routes.
  > - `RoomRealtime` reconnects with the opaque session token, rejects pending commands when the socket drops, verifies the session over HTTP, and applies bounded retry delay. Every accepted snapshot replaces client server-state; a rejected command triggers an authoritative refresh instead of an optimistic phase, owner, readiness, or reveal transition.
  > - Domain tests use a fake clock and deterministic identities; integration tests cover participant-specific HTTP/WebSocket privacy, reconnect resynchronization, SQLite restart reconstruction, expiry/deletion cleanup, transaction rollback, coincident lifecycle orderings, the complete owner/waiting/replay/transfer/removal flow, and static client delivery.
  >
  > ## Responsive client boundary
  >
  > - The React client keeps only the current participant's editable draft outside the server projection. Before reveal, UI components receive no other note body; after reveal, they render only the server-provided stable named-note order.
  > - Desktop participant rails and mobile `People` disclosures render the same authoritative participant list and owner action handler. Keep both paths in sync when adding status or owner controls; mobile CSS hides the rail, and desktop CSS hides the disclosure.
  > - Phase changes move focus to the new heading. Modal content is portaled while the application root is inert, traps focus, restores the opener, and gives destructive confirmation a safe initial action.
  > - Motion is CSS-only and removed under `prefers-reduced-motion`. Optional synthesized sounds require an earlier user gesture, expose all state through simultaneous text and visuals, persist mute locally, and close the audio context when muted.
  >
  > Sources: `src/domain/room-service.ts`, `src/db/sqlite-room-store.ts`, `src/server/http-server.ts`, `src/client/`, `tests/domain/`, `tests/integration/`, `tests/client/`, `spec/active/260924-1909-fun-sticky-note-rooms/implementation/02-01-authoritative-room-core.md`, and `spec/active/260924-1909-fun-sticky-note-rooms/implementation/02-02-responsive-realtime-client.md`.
- **Destination and classification:** `wiki/architecture/room-core.md` - `Topic-specific dynamic knowledge`
- **Session evidence or selection reason:** The completed 02.02 packet, current source, 28 passing tests, real-server phone/desktop Playwright evidence, and the passed focused T02 review establish the production client boundary, reconnect behavior, shared responsive controls, focus handling, and sound/motion constraints.
- **Expected future benefit:** Client, protocol, and deployment work can preserve server authority and hidden-note privacy, keep desktop and mobile owner controls aligned, use the intended reconnect reconciliation path, and avoid regressing modal, reduced-motion, or sound activation behavior.
- **Why this tier:** These are stable, repository-specific integration contracts likely to guide later client and deployment changes within the existing room architecture page; they are too component-specific for a repository-wide convention and too well-supported for a tentative observation.
