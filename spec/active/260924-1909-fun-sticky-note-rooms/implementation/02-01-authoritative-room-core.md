# Slice 02.01: Build the authoritative room core and persistence

Plan: `../plan.md`
Implementation index: `./index.md`
Segment: `T02 - Implement the authoritative room service and approved client experience`
Assurance: medium - server authority, pre-reveal privacy, timing, and persistence failures can corrupt the shared experience or disclose note content.
Review required now: none; run scoped checks and preserve evidence for the T02 segment review.

## Outcome

A tested TypeScript service owns Ceduljica's room lifecycle, participant sessions, participant-specific real-time projections, SQLite persistence, and deterministic timing behavior through a minimal development harness.

## Why this slice exists now

The client must integrate against a stable server-owned contract. Establishing and testing privacy-filtered projections and lifecycle transitions first prevents UI state from becoming an accidental authority or hiding server disclosure defects.

## Relevant context

- T01 must be approved before this slice starts.
- R02 through R09 and R12 define room identity, membership, privacy, lifecycle, recovery, persistence, and validation.
- P004 selects one TypeScript process and SQLite; P005 makes participant-specific server projections the privacy boundary.
- Use an injectable clock for 60-second grace and 24-hour expiry behavior.
- Parent-plan sections to load on conflict or uncertainty: Requirements, Design, Testing decisions and seams, Risks and blockers.

## Constraints and non-goals

- Obtain approval before adding dependencies or creating or running a schema migration.
- Do not implement the final visual interface in this slice; a minimal harness may prove protocol behavior.
- Do not add accounts, public discovery, history, rich content, managed services, or horizontal coordination.
- Never authorize by nickname or trust a client-supplied owner, phase, readiness set, or reveal result.

## Expected source and test areas

- `package.json` and lockfile
- TypeScript, lint, test, and build configuration
- `src/domain/`
- `src/server/`
- `src/db/`
- `src/shared/`
- `tests/domain/`
- `tests/integration/`

These paths are navigation hints. Inspect other source or tests only when this slice or a credible regression path requires it.

## Acceptance and checks

- Acceptance: server commands cover create, join, begin, draft save, ready, edit, reveal, late join, disconnect, reconnect, removal, ownership transfer, replay, delete, and expiry with phase and permission validation.
- Acceptance: rooms enforce 2-person begin and a 12-participant cap; owner identity uses an opaque session token.
- Acceptance: non-authors never receive another note body before reveal in snapshots, events, or endpoints.
- Acceptance: final Ready, post-grace removal, and owner removal atomically re-evaluate reveal without duplicate reveal transitions.
- Acceptance: SQLite reconstructs unexpired rooms after an ordinary service restart and cleanup removes expired or deleted room data.
- Acceptance: the real-time protocol supports reconnect and authoritative resynchronization for the later client.
- Check: `npm run lint`
- Check: `npm run typecheck`
- Check: `npm test`
- Check: `npm run build`
- Check: `git diff --check`

## Attempt log

### Attempt 1 - completed

- Starting boundary: clean `HEAD fddc3c7e70b186e81e736302f9796cda3bb40c73`; no unrelated staged, modified, or untracked paths were present.
- Approval: the parent explicitly approved the exact runtime and development dependency versions plus the transactional, idempotent schema-v1 bootstrap before installation or schema execution. No additional package, table, service, or migration was introduced.
- Delivered paths: `package.json`, `package-lock.json`, TypeScript/ESLint configuration, `.gitignore`, `src/domain/`, `src/db/`, `src/server/`, `src/shared/`, `src/index.ts`, `tests/domain/`, `tests/integration/`, and `tests/helpers.ts`.
- Protocol: built-in Node HTTP handles health, room creation, join, and authenticated participant snapshots. `ws` accepts validated commands, emits acknowledgements or sanitized errors, and broadcasts a fresh participant-specific authoritative snapshot after state changes. Opaque room/session values are generated with cryptographic randomness in production; only SHA-256 session-token hashes are persisted.
- State and privacy: one synchronous `RoomService` owns create, join, begin, draft, ready/edit, reveal, waiting/late join, disconnect/reconnect, removal, transfer, replay, deletion, and expiry. Pre-reveal projections contain only the requesting participant's draft; direct domain, HTTP endpoint, and multi-client WebSocket tests assert that another participant's distinctive body is absent.
- Persistence and timing: schema v1 contains only `schema_version`, the serialized `rooms` aggregate with meaningful-activity/expiry columns, and hashed-token `sessions`; aggregate and session rewrites are one SQLite transaction. An injectable clock drives 60-second grace and 24-hour expiry. Restart recovery, cleanup, cascading deletion, rollback on a session constraint failure, coincident Ready/deadline orderings, owner removal, and no-duplicate reveal behavior are covered.
- Checks: `npm ci` passed (141 packages, zero audit vulnerabilities); `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` passed; `npm test` passed 4 files and 20 tests; an explicit final-newline/trailing-whitespace scan passed for all 22 untracked text files; `uv run spec/scripts/manage-spec-item.py --root . validate --operational` passed with one active item and no warnings. `tsx --version` and a native in-memory `better-sqlite3` query passed after the clean install.
- Review: none required for this ordinary non-final medium-assurance slice; the required focused implementation review remains at the T02 boundary after `02.02`. Review retries: zero.
- Residual uncertainty: the final responsive client, browser rendering, client accessibility, sound/motion, Compose restart, and Docker-volume operation belong to later packets and were not implemented or claimed here. The approved single-process boundary is enforced architecturally but not a distributed coordination guarantee.
- Progress: slice `02.01` is complete; T02 remains open; `Current` advanced exactly once to `02.02`.
- Exact next action: begin a fresh Implement assignment for `02.02`; do not start `03.01` until the complete T02 checks and focused segment review pass.

## Completion and handoff

On success, record changed paths, protocol and schema decisions, scoped check results, privacy evidence, residual uncertainty, and `02.02` as the exact next slice. Update the index checkbox and Current only after scoped acceptance passes. Do not mark T02 complete until `02.02` passes its focused segment review. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
