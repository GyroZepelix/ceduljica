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

## Transport and verification seams

- Built-in Node HTTP exposes health, create, join, and authenticated session snapshot routes. The `ws` command channel validates input, returns acknowledgements or sanitized errors, and broadcasts a newly computed participant-specific snapshot after state changes.
- The responsive client should reconnect with its opaque session token, replace local server state with each authoritative snapshot, and keep only its own editable draft locally; it must not infer another participant's hidden note or fabricate owner, phase, readiness, or reveal state.
- Domain tests use a fake clock and deterministic identities; integration tests cover participant-specific HTTP/WebSocket privacy, reconnect resynchronization, SQLite restart reconstruction, expiry/deletion cleanup, transaction rollback, and coincident lifecycle orderings.

Sources: `src/domain/room-service.ts`, `src/db/sqlite-room-store.ts`, `src/server/http-server.ts`, `tests/domain/`, `tests/integration/`, and `spec/active/260924-1909-fun-sticky-note-rooms/implementation/02-01-authoritative-room-core.md`.
