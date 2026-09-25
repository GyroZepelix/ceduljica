# Slice 02.01: Integrate avatar identity and note-first rooms

Plan: `../plan.md`
Implementation index: `./index.md`
Segment: `T02 - Deliver and prove the note-first room experience`
Assurance: medium - stable presentation identity touches persistence/projections, and phase animation must preserve private drafts, server authority, and focus.
Review required now: scoped checks; focused T02 and final contract-quality reviews follow 02.02.

## Outcome

Existing and new rooms have stable distinct character avatars, a standalone sticky-note composer, safe Ready/Edit and note flights, an open centered reveal with author avatars, and a readable Owner stamp. Focused compatibility, lifecycle, and client tests pass.

## Why this slice exists now

T01 provides approved artwork and shared primitives. This slice integrates them with real participant identity and authoritative room transitions before the separate full browser/Compose verification session.

## Relevant context

- R04-R11 apply, using approved T01 assets. Primary annotation mapping: 0007-0012, with shared artwork/folds retained.
- `src/domain/types.ts` currently has no avatar slot; `RoomService` owns create/join/remove and participant-specific projections. SQLite stores the serialized room aggregate transactionally.
- Existing client modulo-four hashing permits collisions. Allocating from current participant list indexes would recolor survivors after removal. A retained disconnected participant still owns its identity and may have an eligible ready note.
- Replay changes `reveal` to `writing`; it does not start a new round while already writing. A reconnect may miss the intervening reveal, so add a minimal round identifier only if needed to distinguish restoration into a different round without treating every room-version update as an entry.
- Current `RoomScreen.tsx` removes the rail on reveal, but CSS still reserves the right-hand grid column. Fix the board region, not just alignment within the left track.
- Parent-plan sections to load on conflict or uncertainty: Requirements, Design / Stable participant identity, Design / Phase-aware presentation, Decision Log, Acceptance criteria, Testing decisions and evidence classification.

## Constraints and non-goals

- Implementation and all UI/SVG corrective delegation use `twin-astra`, never `twin` or `worker`.
- No change to game rules, capacity, eligibility, owner authority, meaningful activity, privacy, session identity, or retained note order. No avatar picker.
- Preserve existing stored room/round/session data. Normalize missing presentation metadata compatibly; never assume a TypeScript cast populates it. No migration or dependency without explicit approval.
- Maintain one server-assigned distinct slot for each retained participant, including disconnected members. Reuse a freed slot only after actual removal, without recoloring survivors.
- Animations do not delay phase focus or server snapshots and never leave old interactive editors. Reduced motion does not depend on animation events. Reconnect/late join must not invent a note or replay stale transitions.
- Preserve approved artwork, semantic labels, mobile People actions, dialog focus/return, mute, and editor submission behavior. No new image batch without approval.

## Expected source and test areas

- `src/domain/types.ts`, `src/domain/room-service.ts`, `src/db/sqlite-room-store.ts`, and any necessary shared presentation types.
- `src/client/RoomScreen.tsx`, `src/client/App.tsx`, `src/client/styles.css`, and reusable T01 components.
- `tests/domain/room-service.test.ts`, `tests/domain/concurrent-lifecycle.test.ts`, `tests/integration/sqlite-persistence.test.ts`, `tests/integration/realtime-protocol.test.ts`, and `tests/client/`.
- Current design guidance where the implemented layout, Owner stamp, or avatar contract supersedes earlier mockups.

These paths are navigation hints. Inspect affected callers, fixtures, and projections before editing.

## Acceptance and checks

- Acceptance: a 12-person room has 12 distinct variants; all clients and reveal authors agree. Reload/reconnect/replay/restart and actual remove/rejoin preserve survivor identity.
- Acceptance: legacy schema-v1 serialized rooms lacking new metadata load and remain usable without altered notes, credentials, owner, phase, or expiry semantics. Ordinary transactional persistence retains assigned metadata.
- Acceptance: standalone yellow editor and frozen-note preview replace the enclosing white phase card; controls remain accessible. Preserve 500-character multiline input and Ready/Edit ordering.
- Acceptance: real new rounds fly in once; reveal applies/focuses immediately with an inert outgoing decoration. Snapshot churn, rejection, Ready/Edit, late join, restoration, new round, deletion, and unmount cause no lost drafts or stale interaction. Reduced motion is immediate.
- Acceptance: reveal removes the empty grid track, uses existing stable order and readable expanding note layouts, repeats correct author identity, and displays a legible Owner stamp.
- Check: `npm test -- tests/domain/room-service.test.ts tests/domain/concurrent-lifecycle.test.ts tests/integration/sqlite-persistence.test.ts tests/integration/realtime-protocol.test.ts` plus new avatar/legacy fixtures.
- Check: `npm test -- tests/client/room-screen.test.tsx tests/client/responsive-contract.test.ts` plus new focused transition tests.
- Check: all common checks from the index.
- Check: focused built-browser owner/guest writing, Ready/Edit, reveal, replay, and representative phone/desktop geometry; reserve the full visual/Compose matrix for 02.02.

## Attempt log

No attempts recorded.

## Completion and handoff

Record changed paths, compatibility approach, scoped evidence, failures, and residual uncertainty. After scoped checks pass, mark 02.01 complete and advance the index to 02.02; do not mark T02 or whole-plan verification complete. Do not overwrite prior attempts, commit, run Dream, push, or archive automatically. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
