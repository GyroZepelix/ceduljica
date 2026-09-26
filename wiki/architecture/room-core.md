# Authoritative room core

Read this page when changing Ceduljica room lifecycle behavior, real-time client integration, participant privacy, persistence, or deadline handling.

## Authority and privacy

- `RoomService` is the sole authority for room phases, round membership, readiness, reveal, owner actions, reconnect deadlines, replay, deletion, and expiry. Clients submit commands and render projections; they do not derive or assert authoritative state.
- Every HTTP session response and WebSocket snapshot is produced for one authenticated participant. During writing, `ownNote` may contain that participant's draft, but another participant's note body is absent from the projection; reveal projections include all eligible named notes.
- Nicknames are display data, never authorization. Create and join return opaque participant session tokens; SQLite stores only their SHA-256 hashes and resolves them through the session lookup.

## Persistence and timing

- One Node process serially executes synchronous room commands and persists the complete room aggregate plus its hashed-token session lookup in one SQLite transaction. This design is intentionally single-process and does not provide horizontal coordination.
- SQLite schema v1 has `schema_version`, `rooms`, and `sessions`. The room row stores serialized authoritative state plus meaningful-activity and expiry timestamps; deleting a room cascades its session rows.
- Time-dependent behavior uses an injected clock. A 60-second disconnect deadline controls active-round removal and owner transfer, while 24-hour expiry advances only on accepted meaningful actions; passive WebSocket ping and disconnect handling do not extend room lifetime.
- Startup recovery treats formerly connected participants as disconnected with a fresh grace deadline, preserving unexpired room and round state for authoritative reconnect and resynchronization.

## Round prompt boundary and legacy compatibility

- Each `Round` owns one normalized prompt string. Owners submit the optional prompt only with the authoritative `begin` or `replay` command; `RoomService` trims it, rejects carriage returns/newlines and values over 200 characters, and stores it atomically with the new round. Client drafts remain local until that transition, and replay never copies the completed round's prompt into the next input.
- `RoomProjection.roundPrompt` is participant-independent shared context, unlike private note bodies. It is available to every authenticated participant during writing and reveal, including ready writers and late-join waiters, while participant-specific note privacy remains unchanged.
- The prompt is additive data inside the existing schema-v1 serialized room aggregate. Older command shapes may omit `prompt`, and older stored rounds may lack the property; both project an empty string without a SQL migration or eager room rewrite.

Sources: `src/domain/validation.ts`, `src/domain/room-service.ts`, `src/domain/types.ts`, `src/server/protocol.ts`, `src/db/sqlite-room-store.ts`, `tests/domain/room-service.test.ts`, `tests/integration/realtime-protocol.test.ts`, and `tests/integration/sqlite-persistence.test.ts`.

## Stable avatar identity and legacy compatibility

- `RoomService` allocates one room-local `avatarSlot` from 0-11 for each retained participant and projects it in participant summaries and revealed author records. Disconnected participants still reserve their slots, including eligible ready authors; only actual membership removal frees a slot. Never derive identity from client list order or participant-ID hashing.
- `normalizeAvatarSlots` runs before service projection or membership mutation, including startup/deadline processing. It orders legacy participants by joined order and ID, reserves valid existing assignments first, and deterministically fills missing, duplicate, or invalid slots. Normalize before removal or join so legacy survivors cannot be recolored.
- Avatar metadata is additive inside the schema-v1 serialized room aggregate and uses the existing transactional room/session save. Normalization alone does not change notes, credentials, membership, owner, phase, room version, meaningful activity, or expiry. Test legacy aggregates and ordinary close/reopen persistence when changing this boundary; a TypeScript cast does not populate missing stored fields.

Sources: `src/domain/avatar-slots.ts`, `src/domain/room-service.ts`, `src/domain/types.ts`, `tests/domain/avatar-slots.test.ts`, `tests/integration/avatar-compatibility.test.ts`. These presentation additions describe the tested 02.01 working tree after `b06f913f219fb96ef96d883f6c7ad159240901f3`, not final packaged or visual acceptance.

## Transport and verification seams

- Built-in Node HTTP exposes health, create, join, and authenticated session snapshot routes. The `ws` command channel validates input, returns acknowledgements or sanitized errors, and broadcasts a newly computed participant-specific snapshot after state changes. The same server serves the Vite production output from `dist/client` with an SPA fallback while preserving JSON 404s for unknown API routes.
- `RoomRealtime` reconnects with the opaque session token, rejects pending commands when the socket drops, verifies the session over HTTP, and applies bounded retry delay. Every accepted snapshot replaces client server-state; a rejected command triggers an authoritative refresh instead of an optimistic phase, owner, readiness, or reveal transition.
- Domain tests use a fake clock and deterministic identities; integration tests cover participant-specific HTTP/WebSocket privacy, reconnect resynchronization, SQLite restart reconstruction, expiry/deletion cleanup, transaction rollback, coincident lifecycle orderings, the complete owner/waiting/replay/transfer/removal flow, and static client delivery.

## Packaged deployment boundary

- `compose.yaml` runs one `app` service, publishes a configurable host port, and mounts the named `ceduljica-data` volume at `/data`; the application stores SQLite at `/data/ceduljica.sqlite`. Ordinary `restart`, rebuild, and `down` operations retain the volume.
- The multi-stage `Dockerfile` compiles native SQLite support in the full pinned Node 26 Bookworm build image, then copies only production modules and built output into a non-root Node 26 slim runtime. Container and Compose health checks call `/health` only after database bootstrap and startup expiry cleanup complete.
- `README.md` is the operator contract: use one app process, preserve the volume for routine operation, require an explicit `down --volumes` only for total data destruction, and put internet-facing deployments behind HTTPS termination that forwards WebSocket upgrades. Room links and session tokens remain bearer secrets; the service is unlisted, not end-to-end encrypted.
- `tests/e2e/` proves multi-context browser behavior and responsive/accessibility fixtures. `tests/compose/smoke.ts` creates a disposable two-client room against Compose, checks pre-reveal privacy, restarts only the app, verifies SQLite-backed resynchronization, completes reveal, and deletes the room without removing the volume.

## Responsive client boundary

- The React client keeps only the current participant's editable draft outside the server projection. Before reveal, UI components receive no other note body; after reveal, they render only the server-provided stable named-note order.
- Desktop participant rails and mobile `People` disclosures render the same authoritative participant list and owner action handler. Keep both paths in sync when adding status or owner controls; mobile CSS hides the rail, and desktop CSS hides the disclosure.
- The projection exposes the existing persisted opaque `roundId`. Key writing editors and new-round presentation to room/round identity, not room version: reconnect can miss reveal, while replay during writing remains the same round. Round-keyed unmount cancels pending debounce and prevents a pending save-then-Ready chain from continuing into a later round; delayed draft echoes must not overwrite newer local typing.
- Phase or round changes move focus to the current heading immediately; Edit returns focus to the textarea. Modal content is portaled while the application root is inert, traps focus, restores the opener, and gives destructive confirmation a safe initial action.
- `NoteFlight` retains only presentation metadata and renders blank, aria-hidden, pointer-transparent paper behind content, never an old editor or private draft. CSS performs the 480 ms flight; React removes it independently after 520 ms and interrupts on newer phase/round/room, disconnect, reduced-motion preference, or unmount. Initial restoration, late join, same-round snapshot churn, and rejected commands must not manufacture stale exits or delay authoritative state, focus, or controls.
- Reduced motion omits flight overlays and freezes the canvas motif without depending on animation events. Optional synthesized sounds require an earlier user gesture, expose all state through simultaneous text and visuals, persist mute locally, and close the audio context when muted. The round-aware editor and flight boundary is covered by `tests/client/room-transitions.test.tsx`; complete visual and packaged acceptance is separate from these scoped tests.

Sources: `src/domain/room-service.ts`, `src/db/sqlite-room-store.ts`, `src/server/http-server.ts`, `src/client/`, `Dockerfile`, `compose.yaml`, `README.md`, `tests/domain/`, `tests/integration/`, `tests/client/`, `tests/e2e/`, `tests/compose/`, `spec/archive/260924-1909-fun-sticky-note-rooms/implementation/02-01-authoritative-room-core.md`, `spec/archive/260924-1909-fun-sticky-note-rooms/implementation/02-02-responsive-realtime-client.md`, and `spec/archive/260924-1909-fun-sticky-note-rooms/implementation/03-01-compose-system-verification.md`.
