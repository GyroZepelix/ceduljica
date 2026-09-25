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

### 2026-09-25: 02.01 execution start

- Starting HEAD: `b06f913f219fb96ef96d883f6c7ad159240901f3`; index/worktree clean. T01 is approved and unchanged. Implementation performed directly by the assigned twin-astra, without implementation delegation.
- Protocol 2.2.1 and planned item resolution verified. T02 checkpoint recorded in the index. Parent confirmed success-only advance to unchecked 02.02 is permitted, but its execution is not.
- Existing localhost:33000 build/rooms and ignored prior evidence are protected. Focused browser verification will use only a new disposable database and unused loopback port; no Compose restart or volume operation.
- Read source confirms a persisted opaque round ID already exists; expose that ID as additive presentation metadata, with no new stored round field or SQL migration. Normalize avatar slots before service projections/membership changes and save with existing transactional persistence without activity/expiry changes.

## Completion and handoff

Record changed paths, compatibility approach, scoped evidence, failures, and residual uncertainty. After scoped checks pass, mark 02.01 complete and advance the index to 02.02; do not mark T02 or whole-plan verification complete. Do not overwrite prior attempts, commit, run Dream, push, or archive automatically. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.

### 2026-09-25: 02.01 completed

Implemented directly by the assigned twin-astra; no delegated implementation, image calls, dependencies, migrations, or SQL schema changes. T01 asset bytes and completed packet remain unchanged.

#### Delivered boundaries

- `avatarSlot` is assigned authoritatively from 0-11 and projected for participants and revealed authors. Retained disconnected people reserve their slot; only actual removal frees one. Legacy normalization sorts by joined order/ID, reserves valid existing slots first, and fills missing/invalid/duplicate slots deterministically. It saves through the existing SQLite room/session transaction without modifying activity, expiry, phase, notes, owner, or version solely for presentation. Tests cover normalization before snapshot, join, removal, deadline processing and restart.
- The existing persisted opaque round ID is now projected as `roundId`; no extra stored round identity was necessary. Replay during writing remains the same round. Round-keyed editors reset when reconnect missed reveal.
- Twelve original vector character/color combinations replace client ID hashing and repeat beside revealed authors. Names/textual status remain accessible; Owner is an explicit double-outline stamp.
- Writing and ready preview are standalone yellow notes; controls stay in normal flow. Reveal uses one full-width track and server note order with expanding cards. The 500-character multiline editor retains Ready/Edit and 600 ms debounce behavior, cancels pending debounce on Ready/unmount, protects newer typing from delayed draft echoes, and cannot continue a pending Ready chain into another round. Edit returns focus to the textarea.
- Flights contain only blank decorative paper, never private body text or controls. Authoritative state/focus is immediate. Effects last 480 ms with an independent 520 ms cleanup timer; round/room changes, disconnect, reduced-motion changes and unmount interrupt them. Restoration, late join, rejection and snapshot churn do not manufacture stale exits.

#### Exact changed-path ownership

- Source: `src/domain/types.ts`, `src/domain/room-service.ts`, `src/domain/avatar-slots.ts`, `src/client/Avatar.tsx`, `src/client/NoteFlight.tsx`, `src/client/RoomScreen.tsx`, `src/client/styles.css`.
- Checks: `tests/domain/avatar-slots.test.ts`, `tests/integration/avatar-compatibility.test.ts`, `tests/client/room-screen.test.tsx`, `tests/client/room-transitions.test.tsx`, `tests/e2e/note-first-focused.js`, `tests/e2e/run-browser-contract.sh`, `eslint.config.js`. The runner adds explicit script/session selection and an unused-port preflight; the browser sandbox script follows existing exact-path ESLint exclusions.
- Guidance/progress: `design/README.md`, this packet, `implementation/index.md`, and `plan.md` execution handoff only. No changes to App snapshot consumption, transport commands, SQLite schema/store implementation, dependency manifests, original PNGs, discovery, archive, wiki, or Compose configuration.

#### Commands and verdicts

- PASS: `npm test -- tests/domain/room-service.test.ts tests/domain/concurrent-lifecycle.test.ts tests/domain/avatar-slots.test.ts tests/integration/sqlite-persistence.test.ts tests/integration/avatar-compatibility.test.ts tests/integration/realtime-protocol.test.ts tests/client/room-screen.test.tsx tests/client/responsive-contract.test.ts tests/client/room-transitions.test.tsx` (9 files, 44 tests).
- PASS: `npm run lint`; `npm run typecheck`; `npm test` (11 files, 48 tests); `npm run build`; `git diff --check`.
- PASS: `CEDULJICA_E2E_PORT=43124 CEDULJICA_E2E_SESSION=ceduljica-02-01 CEDULJICA_E2E_SCRIPT=tests/e2e/note-first-focused.js npm run test:e2e`. New disposable SQLite and loopback runtime, desktop owner 1440x1000 plus reduced-motion guest 320x800. Verified Begin/Ready/Edit, heading/editor focus, debounce/reload, private projections/DOM, stable author identity, reveal/replay/deletion, no horizontal overflow for 500-character unbroken text, no browser page errors, and actual normal/reduced flight behavior. Reveal geometry: one `1180px` grid track, board and region both 1180px, board center 720px equals viewport center 720px.
- PASS: `uv run spec/scripts/manage-spec-item.py --root . validate --operational` (no warnings). Markdown/link/fence and final diff checks also run for evidence bookkeeping.
- Browser screenshot evidence (synthetic content only, ignored local evidence preserved): `.playwright-cli/02-01-1790343950426-desktop-writing.png`, `-desktop-ready.png`, `-phone-writing.png`, `-desktop-reveal-flight.png`, `-desktop-reveal.png`, `-phone-reveal.png` (all suffixes share the full prefix). Implementer inspected the writing/ready/phone captures and settled desktop reveal; this is not final human visual approval. Earlier passing captures at prefix `02-01-1790343778344` remain preserved.
- Final build assets stayed byte-identical after the last JSX indentation-only edit (`index-BCA2wNZR.js`, `index-BASx-qId.css`), so the immediately preceding focused browser pass remains applicable.
- Review cadence: no independent gate is scheduled for ordinary 02.01 at medium assurance. Focused T02 and independent final whole-contract reviews remain after 02.02; zero review reruns here.

#### Failures corrected during this attempt

- Initial transition tests used a global fake-timer count and counted React/testing-library scheduling as application timers (2 failures). Replaced that assertion with explicit ownership/cleanup checks for the flight's 520 ms timer; all transition tests pass.
- Initial lint caught test-only typing/act callback mistakes and the newly added Playwright sandbox script missing its existing-style exact-path exclusion. Corrected; final lint/typecheck pass.
- First focused browser attempt failed before creating a room because `URL` is unavailable in the Playwright CLI outer sandbox. Used the existing runner's origin extraction pattern; reruns pass. The failure's disposable runtime/database was trap-cleaned. No prior evidence was overwritten.

#### Runtime preservation and remaining work

- Handoff runtime context was stale: before browser verification, port 33000 refused connection, while `docker compose ps` showed the existing healthy `fun-postit-app-1` on port 3000 (up 52 minutes). Parent explicitly approved preserving 3000 exactly as found and continuing only disposable 43124 checks. No cause for the discrepancy is inferred.
- Before/after `curl --fail http://127.0.0.1:3000/health` returned `{"status":"ok"}`; after verification the same named container was still healthy/up 56 minutes. Read-only inspect recorded container `332247402fa0749d9904eb5e2dc8c6e1c846794c7a8298250be607d4a4fcb5d2`, started `2026-09-25T12:49:25.114294421Z`, with named volume `fun-postit_ceduljica-data` mounted at `/data`. No Compose/container/volume/config change, restart, or unknown-process stop occurred. The owned runner closed only its browser/server and removed its fresh temporary database directory; 43124 has no listener afterward.
- Scoped implementation checks pass. Native 200% zoom, the complete browser/1-12-note visual matrix, packaged Compose assets/restart acceptance, final user visual approval and both scheduled reviews remain explicitly unproven here and assigned to 02.02. Ordinary SQLite close/reopen compatibility is proven, not packaged restart.
- Mark only 02.01 complete and advance once to unchecked Current 02.02. T02 and final verification remain incomplete. Stop for Gamemaster's separately authorized Dream/checkpoint phases; none invoked, staged, committed, pushed or archived by this assignment.
