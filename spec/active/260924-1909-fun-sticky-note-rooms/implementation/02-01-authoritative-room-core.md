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

No attempts recorded.

## Completion and handoff

On success, record changed paths, protocol and schema decisions, scoped check results, privacy evidence, residual uncertainty, and `02.02` as the exact next slice. Update the index checkbox and Current only after scoped acceptance passes. Do not mark T02 complete until `02.02` passes its focused segment review. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
