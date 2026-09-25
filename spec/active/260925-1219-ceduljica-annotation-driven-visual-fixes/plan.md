# Plan: Ceduljica annotation-driven visual fixes

Work item: `260925-1219-ceduljica-annotation-driven-visual-fixes`
Status: Planned
Created: 2026-09-25
Updated: 2026-09-25
Assurance: medium - visual changes cross live phase transitions and responsive accessibility; stable distinct avatars touch participant presentation identity; local changes remain recoverable without changing room rules.
Execution mode: sliced
Expected implementation sessions: 3

## Goal

Resolve all 13 annotations in capture `20260925-101448Z` with a recognizable, original Ceduljica visual language and a note-first room experience: warm supporting surfaces, a standalone writable sticky note, meaningful instructional art, distinct participant characters, and a centered shared reveal.

## Context and authority

- Confirmed initial discovery: [discovery.md](./discovery.md). The user approved the complete contract and three-session decomposition after discovery confirmation.
- Planning source baseline: `817997403e53bb230af8d86bce100cc687012aa4`. Only `.gitignore` changed since discovery baseline `5a4d821`; source, tests, and design are unchanged.
- React/Vite, one authoritative TypeScript service, SQLite schema v1, and local Docker Compose remain the operating environment. Target current desktop and phone browsers and 2 to 12 participants.
- Previous completed work remains immutable under `spec/archive/260924-1909-fun-sticky-note-rooms/`. This item does not reopen it.
- Annotation files are local, Git-ignored evidence at `.pi-annotations/20260925-101448Z/`; the sanitized mapping below is sufficient to retain scope if captures are unavailable. Do not retain or upload captured room links, participant content, or browser credentials.
- This plan is the sole implementation contract. Its index and packets are bounded projections. Existing design guidance remains valid except for the explicitly changed artwork reuse, paper surfaces, avatar, and layout treatments below.

## Requirements

| ID | Required outcome | Annotation coverage |
| --- | --- | --- |
| R01 | Recognizable Ceduljica hero and shared mascot artwork inspired by `design/concepts/`, replacing broken CSS approximations. Use recognizable restrained perimeter scenery instead of generic green/salmon blobs. Correct reused mascot instances, including terminal screens. | 0001, 0002, 0013 |
| R02 | Five distinct Codex-generated how-to illustrations visibly depict create, invite, write, ready, and reveal. Preserve authored instructional text and accessible five-step navigation. | 0003 |
| R03 | One recognizable sticky-note icon repeats subtly across the page canvas and scrolls continuously under normal motion. Retain the simple header note-face mark and multicolor ribbon, repair its fold, and integrate the ribbon with an opaque or softly tinted header. | 0004, 0005, 0006 |
| R04 | Warm, softly tinted supporting surfaces replace strong white enclosing panels. Writing uses a standalone yellow sticky note, not a white textarea nested inside an oversized white card. Keep the actual editor level, legible, pattern-free, and keyboard accessible. | 0007, 0009 |
| R05 | Provide 12 distinct, automatically assigned character/color avatar combinations. Assignments agree across clients and persist across reload, reconnect, restart, and replay; removing or adding someone does not recolor survivors. Render the same identity beside participant names and revealed author names. | 0008 |
| R06 | Animate a note flying down into a new writing round and flying out on server-confirmed reveal while the shared board appears. Effects are finite, interruptible, and decorative; never delay authoritative state, heading focus, or interaction availability. Reduced motion switches instantly without animation-event dependencies. | 0009 |
| R07 | Reveal uses an open board centered in the available page width with no reserved empty participant column. Preserve stable server note order, writer names, readable expanding cards, and responsive 1 to 12 note layouts. | 0010 |
| R08 | Replace the owner notice treatment with a legible Owner stamp and repair all shared folded-note corners without white protrusions or broken outlines. Ownership remains explicit text, not decorative inference. | 0011, 0012; shared folds also 0001, 0002, 0005, 0013 |
| R09 | Preserve server authority, pre-reveal privacy, one non-empty multiline plain-text note up to 500 characters, Ready/Edit semantics, late joins, disconnect grace, owner actions/transfer, replay, expiry, sessions, and existing persisted rooms. No data or volume reset. | All affected lifecycle views |
| R10 | Preserve 320px usability, 200% zoom, readable contrast, non-color state cues, real semantic controls, labels, keyboard/focus behavior, dialog reachability, persistent mute, and reduced motion. Decorative assets must not obscure copy or controls. | All 13 |
| R11 | Use `twin-astra` as the implementation agent. All UI/SVG implementation and corrective delegation must also use `twin-astra`; never substitute `twin` or assign UI/SVG fixes to `worker`. | Explicit user routing instructions |

## Out of scope

- New accounts, avatar picker, user-selected identity customization, game rules, rich text, saved history, room capacity changes, new services, horizontal scaling, production deployment, or TLS provisioning.
- Redesigning unrelated behavior or replacing the existing frontend/backend stacks.
- New dependency, database migration, destructive conversion, or image-generation call without its required approval.
- Copying third-party game assets, logos, characters, or exact layouts. Game-menu motion is an emotional reference, not an asset source.
- Rewriting original concept PNGs, discovery, prior archive evidence, or historical Dream records.
- Automatic commits, pushes, publication, or destructive Docker volume cleanup.

## Design

### Artwork and shared surfaces

- Use production assets and reusable components rather than separate CSS face approximations. Keep the simple small header mark while using expressive concept-derived characters for larger illustrations and avatars.
- Source inspiration from `design/concepts/`; production art may be extracted, derived, or redrawn appropriately. Avoid poor crops, baked-in sheet backgrounds, stray white corners, clipped limbs, and generic blobs presented as finished illustrations.
- Generate a separate action-specific how-to image for each of five steps. Before generation, present exact prompts, output destinations, and any local reference inputs for approval. Do not upload annotation screenshots. Keep generated text and controls out of product UI; author all interface text deterministically.
- Prefer bundled assets under `src/client/` so the existing Vite/Docker source pipeline includes them. Record asset provenance and intended use in current design guidance; preserve original PNG bytes. Keep image dimensions/reserved space stable to avoid layout shifts and ensure assets remain clear at phone and desktop sizes.
- Use one low-contrast note motif only on the canvas. Motion is static under reduced motion and pauses when the document is hidden. Keep decorative framing clear of controls, including at 320px and 200% zoom.
- Give shared note surfaces a coherent fold geometry with an intentional crease/underside, not a white triangle painted beyond a rectangular outline. Warm supporting surfaces remain opaque, calm, and pattern-free.
- Update affected sections of `design/README.md` and asset documentation to reflect the implemented follow-up. Older SVG mockups may be retained as prior composition references, but mark their changed panel/avatar/layout treatments non-binding rather than silently presenting contradictory guidance.

### Stable participant identity

- Allocate a room-local avatar slot from 12 available variants on the authoritative side and expose only presentation metadata alongside existing participant summaries. Client list index, first-character hashing, or random browser-local assignment cannot satisfy uniqueness and stability.
- Preserve a slot for every retained participant, including disconnected participants whose identity or ready note remains. Reuse a free slot only after actual membership removal; do not change lifecycle membership semantics to free slots.
- Existing stored room aggregates lacking avatar metadata need deterministic, backward-compatible normalization before assignment/projection or membership mutation. Save through existing transactional room persistence; do not reset notes, sessions, owner, phase, or expiry to add presentation metadata.
- An additive field inside the serialized room aggregate should not need a SQL table/schema migration. If implementation finds a migration necessary, stop and obtain approval. Validate legacy fixtures and restart persistence rather than assuming a TypeScript cast supplies missing fields.
- Reveal attribution uses the assigned identity of its author, including disconnected ready authors. Names remain the primary accessible identity cue; variants differ by character shape and color, not color alone.

### Phase-aware presentation

- Keep authoritative projection consumption in `App.tsx` and room commands unchanged except minimal additive presentation metadata. Replay normally changes reveal to writing. If distinguishing rounds after a reconnect that missed the intervening reveal requires it, expose an opaque round identifier, never private content, and key presentation to that identity rather than room version or draft updates.
- A new-round flight happens once per real round transition, not on each snapshot, Ready/Edit, or reconnect. Initial restoration into an existing round must not replay stale exit effects.
- Render and focus the server-confirmed reveal immediately. An outgoing decorative note may overlap the incoming board without intercepting input, duplicating an accessible editor, or carrying retained private draft state into later rounds. Never wait for animation completion to update room state.
- Remove interrupted overlays on a newer round, room change, terminal event, or unmount. Late joiners have no fictitious personal note to fly out. Reduced-motion behavior must work even if animation events never fire.
- Preserve editor value, debounce/Ready submission ordering, busy and permission checks, focus, and cancellation behavior. A rejected command cannot trigger an optimistic reveal.
- On reveal, remove the empty grid track and center the complete board region, not just the content inside the former left column. Owner controls remain outside the note grid. Keep normal document scrolling and readable long notes.

## Decision Log

| ID | Scope | Decision | Rationale and evidence | Revisit when |
| --- | --- | --- | --- | --- |
| P01 | Scope | Address all 13 annotations in one new follow-up item; keep prior archive unchanged. | Discovery D01 and approved synthesis. | Explicit user scope change. |
| P02 | Visual contract | Use concept-inspired production art, a note-first layout, warm supporting panels, open reveal, and five generated instructional images. | Discovery D02/D04/D06 and the annotation mapping. Supersedes only conflicting current visual guidance. | User visual acceptance identifies a concrete mismatch. |
| P03 | Identity | Use 12 automatically assigned stable variants, including revealed authors; preserve existing rooms with additive compatible presentation data. | Discovery D03/D06; current client modulo-four mapping collides. | A concrete compatibility blocker requires an approved approach change. |
| P04 | Motion | Server state and focus update immediately; flight effects are interruptible decoration with instant reduced motion. | Discovery D06; current room transitions and privacy projections remain authoritative. | An observed accessibility or state regression requires correction. |
| P05 | Agent routing | Implementation uses `twin-astra`; all delegated UI/SVG fixes use `twin-astra`, never `worker` or `twin`. | Explicit user instructions, discovery D05. Read-only review does not authorize a reviewer to implement UI fixes. | Only explicit user override. |
| P06 | Execution | Three serial slices across two segments, with medium assurance reviews. | User approved the combined contract and decomposition. | Concrete session or implementation evidence requires approved replanning. |

## Work breakdown

- [x] T01: Deliver recognizable production artwork and shared presentation.
  - Depends on: none.
  - Slice: 01.01, artwork generation/approval, shared characters/folds, five-step imagery, backdrop/scenery, header, warm surface foundation, and current design guidance.
  - Expected areas: `src/client/`, `design/`, `tests/client/`, `tests/integration/static-client.test.ts` as needed.
  - Acceptance: assets load in a production build; landing, how-to, and shared primitives visibly resolve their annotation findings; user approves the artwork/shared presentation before dependent room integration.
  - Verification: focused component/asset/browser checks, common project checks, and one focused T01 review.
- [ ] T02: Deliver and prove the note-first room experience.
  - Depends on: T01's usable, approved shared assets and components.
  - Slice: 02.01, compatible avatar allocation/projections, participant/author presentation, note-first room layout, flights, reveal centering, Owner stamp, and focused regression tests.
  - Slice: 02.02, integrated browser geometry/visual/transition coverage, complete desktop/phone acceptance, packaged asset and restart evidence, and final visual approval.
  - Expected areas: `src/client/`, `src/domain/`, `src/db/`, `tests/domain/`, `tests/integration/`, `tests/client/`, `tests/e2e/`, `tests/compose/`, current design/operator guidance only where affected.
  - Acceptance: R01-R11 pass with all 13 annotation IDs mapped to evidence; existing room data and lifecycle remain valid.
  - Verification: common checks, full browser/Compose acceptance, one focused T02 review, and an independent final whole-contract review.

## Acceptance criteria

1. All 13 annotation IDs map to visible corrections with desktop/phone screenshot evidence and explicit final user visual approval. CSS-string checks alone are not visual acceptance.
2. Hero and terminal mascots are recognizable; five how-to scenes show their respective actions; folded corners are clean at small and large sizes; backdrop and header form a coherent original composition.
3. Writing is a standalone yellow note with a level multiline editor, ready/frozen preview, and reachable controls; supporting panels are warm rather than large stark white containers.
4. Exactly 12 distinct avatar assignments coexist in a full room and agree across clients. Remove/rejoin/replay/reconnect/restart cases preserve survivor identity and correctly attribute revealed notes. Legacy stored room fixtures remain usable without loss of data.
5. New-round entry and authoritative reveal have the intended note flights under normal motion. Repeated snapshots, Ready/Edit, restoration, late join, rejected commands, and interruption cannot cause stale animation, early reveal, lost drafts, duplicate commands, or delayed focus. Reduced motion is instant and static.
6. Reveal is centered with no empty sidebar track at desktop widths; 1, 2, and 12 notes and 500-character/unbroken content remain readable with no horizontal page overflow at 320px. Check representative phone/desktop sizes and 200% zoom.
7. Owner stamp remains legible text, names remain accessible, dialog focus/return and keyboard operation pass, controls remain reachable, and mute behavior is unchanged.
8. Existing domain/protocol privacy, Ready/Edit, late-join, deadline, ownership, replay, deletion, expiry, and session tests remain green. Generated art never contains user text or credentials.
9. Production build serves every new asset. Compose health, room/draft/avatar restart persistence, reveal, and disposable-room cleanup pass without deleting the named volume or disrupting unrelated services.
10. Agent routing and generation/approval provenance are recorded; no prohibited UI/SVG delegation, unapproved dependency/migration, archive rewrite, or destructive operation occurs.

## Testing decisions and evidence classification

- Reuse existing public domain, HTTP/WebSocket, SQLite, React, browser, and Compose seams. Add focused tests for avatar allocation/legacy normalization, round-aware presentation, and actual rendered geometry/assets.
- Existing committed lifecycle tests and archived evidence establish unchanged behavior and reusable fixtures, not proof of this new visual implementation. Rerun affected regressions. Earlier visual approval does not substitute for approval of the corrected UI.
- The annotated screenshots establish the failure baseline. Use disposable test participants and notes in new evidence, not captured room links or user content.
- Add geometry assertions for reveal centering and responsive overflow, image-loading checks for all five how-to steps, and deliberate transition interruption coverage. Keep human inspection for recognizable art, clean folds, and overall composition.
- Validate avatar normalization against legacy serialized rooms and ordinary restart. A new field must not accidentally extend meaningful-activity expiry or change retained note eligibility.

## Verification plan

Common implementation checks:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`

Focused and final checks:

- Focused existing/new client tests and deterministic domain/SQLite/protocol tests, as named in the slice packets.
- `npm run test:e2e`, extended to cover the acceptance matrix above; record visual screenshots and manual 200% zoom evidence where browser automation does not faithfully reproduce it.
- `CEDULJICA_PORT=33000 docker compose config`
- `CEDULJICA_PORT=33000 docker compose up --build --wait -d`
- `curl --fail http://127.0.0.1:33000/health`
- `CEDULJICA_PORT=33000 COMPOSE_BASE_URL=http://127.0.0.1:33000 npm run test:compose`
- Confirm new asset HTTP responses and SQLite-backed avatar/room persistence across app-only restart. Delete only disposable test rooms.
- Inspect whether this repository's app was running before verification; preserve its initial running/stopped state. It was launched on port 33000 before discovery. Do not stop unrelated containers. If stopping a session-owned verification stack, use `docker compose down` without `-v`; verify the named volume remains.
- Operational spec validation and Markdown/path checks when evidence is updated.

Review tier: medium. Scoped checks per slice; focused T01 review after 01.01; focused T02 review plus an independent whole-contract review after 02.02. Reviewers use the credible-harm blocker standard without expanding scope. At most two targeted corrective reruns of an affected gate; then stop for a user decision. UI/SVG corrections always return to `twin-astra`.

## Risks, assumptions, and approval gates

- Asset extraction or generation can produce poor silhouettes, unexpected dimensions, or inconsistent scenes. `twin-astra` owns concrete art choices and visual inspection; exact generation prompts/references/destinations require approval, as do unapproved retries or expanded batches.
- Avatar metadata and round identity are presentation only. Preserve all existing room rules and persisted state; stop for any required migration or materially different persistence approach rather than silently broadening scope.
- UI transitions can race with replay, reconnect, and deletion. Test the actual authoritative update boundary; never solve animation by holding back server state.
- No new dependency is expected. Stop and ask before dependencies, migrations, destructive operations, external writes, commits, pushes, production actions, or scope expansion.
- Running-room restarts can temporarily disconnect local users. Before packaged verification, identify the app's current state and coordinate disruptive restarts if active user work is present; do not delete existing rooms or volumes.
- Exact asset prompts, filenames, tones, and composition remain implementation details owned by `twin-astra`, bounded by the approved visual direction and user visual gates. No external research is required to begin.

## Progress

- [x] Planning complete and confirmed.
- [x] T01 complete.
- [ ] T02 complete.
- [ ] Final verification and visual approval complete.

## Execution handoff

Start from [implementation/index.md](./implementation/index.md). Current is 02.02, not started. T01 passed scoped/common checks, focused independent review and user visual approval; see its packet for evidence and preserved infrastructure interruptions. 02.01 passed scoped/common checks and focused disposable-browser verification; its packet records compatibility, motion, layout evidence and the preserved runtime-context discrepancy. T02 and final verification remain incomplete. Implementation/T01 starting checkpoint is `817997403e53bb230af8d86bce100cc687012aa4`; T02's starting checkpoint is `b06f913f219fb96ef96d883f6c7ad159240901f3`.

```text
Use twin-astra as the implementation agent.
Read item.yaml, implementation/index.md, the Current packet, and applicable repository instructions.
Treat plan.md as the sole contract; load its named sections whenever scope or a projection is unclear.
Implement only Current and run its checks before advancing the index.
All UI/SVG implementation or corrective delegation must use twin-astra, never worker or twin.
Obtain approval for exact image prompts, destinations, and reference uploads before generation.
Preserve prior discovery/archive evidence, existing rooms, privacy, and the Docker volume.
Stop and ask at the plan's dependency, migration, destructive, external-write, Git, and scope gates.
Do not commit, push, run Dream, or archive automatically.
```

## Proposed durable knowledge updates

After implementation and verification establish the facts, update `wiki/architecture/room-core.md` only for durable avatar identity/compatibility and phase-presentation boundaries; update `wiki/log.md` according to scoped wiki rules. Keep annotation progress and transient art decisions in this item, not the wiki.
