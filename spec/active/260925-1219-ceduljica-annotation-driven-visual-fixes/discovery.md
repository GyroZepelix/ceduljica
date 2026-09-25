# Discovery: Ceduljica annotation-driven visual fixes

Work item: `260925-1219-ceduljica-annotation-driven-visual-fixes`
Status: Ready for Spec
Created: 2026-09-25
Updated: 2026-09-25
Assurance: medium - visual changes cross live phase transitions and responsive accessibility; stable distinct avatars touch participant presentation identity; local changes remain recoverable without changing room rules.

## Objective and desired outcome

Address all 13 annotations from capture `20260925-101448Z` with a coherent, note-first Ceduljica experience inspired by `design/concepts/`. Replace broken CSS character approximations, unreadable decoration, oversized white panels, and off-center reveal with recognizable original artwork, warmer supporting surfaces, a flying-note composer, and a centered shared board.

## Repository and operating context

- The previous item `260924-1909-fun-sticky-note-rooms` is completed under `spec/archive/`; this is a new initial discovery item, not a reopening or revision of its immutable archive.
- React/Vite client, one authoritative TypeScript server, SQLite persistence, and local Docker Compose deployment. Existing scope remains 2 to 12 participants, phone and desktop, one private note per active participant.
- Latest annotation source: `.pi-annotations/20260925-101448Z/annotations.json`, with 13 associated screenshots. This directory is Git-ignored. Keep annotation IDs and sanitized findings here so the handoff does not depend solely on ignored captures. Do not copy captured room URLs or participant content into durable artifacts or upload screenshots.
- Source baseline: `5a4d82156093ab97fd870b4bae1788cc9843ec30`. Application source was clean when discovery began.
- Protocol 2.2.1 and required helper capabilities passed preflight; operational validation passed without warnings.
- Required future implementation agent: `twin-astra`, explicitly requested by the user and verified available. Do not substitute `twin`. All UI and SVG fixes, including delegated work, must use `twin-astra`, never `worker`.

## Scope and annotation coverage

| Annotation IDs | Desired correction |
| --- | --- |
| 0001, 0013 | Replace the malformed hero mascot with a recognizable Ceduljica character informed by the generated concepts. |
| 0001 | Replace generic green/salmon blobs with recognizable concept-derived perimeter scenery, kept clear of content. |
| 0002, 0003 | Replace the broken repeated how-to character with five distinct Codex-generated illustrations showing create, invite, write, ready, and reveal. |
| 0004 | Replace dots/diagonal stripes with one recognizable sticky-note icon repeated in a subtle continuously scrolling backdrop. Keep original Ceduljica art, not copied game assets. |
| 0005 | Retain the simple header note-face mark, but repair its folded corner. |
| 0006 | Retain the multicolor ribbon, visually integrated with an opaque or softly tinted header instead of a disconnected line beneath transparency. |
| 0007, 0009 | Replace strong white enclosing room panels with warm supporting surfaces and a standalone writable yellow sticky note. |
| 0008 | Assign 12 distinct character/color avatar variants automatically, consistently across clients, reconnects, and rounds. |
| 0009 | The private note flies down into writing and flies out on server-confirmed reveal as the shared board appears. |
| 0010 | Center the reveal within the available page width, removing the unused sidebar column. |
| 0011 | Replace the owner notice treatment with a legible Owner stamp, retaining explicit text and authorization semantics. |
| 0012 | Repair folded corners on revealed notes without white protrusions or broken outlines. |

Shared mascot and folded-note primitives should be corrected wherever reused, including terminal screens, rather than leave the same artifact in another state.

## Confirmed facts and evidence

- `src/client/styles.css`: `.brand-mark::after`, `.peel::before`, and `.sticky-note::after` paint white triangles beyond the outer bounds. The screenshots corroborate detached white corners. Small Peel dimensions change without proportionally adjusting all face geometry.
- `src/client/HowTo.tsx`: all five steps reuse the same `.peel-small`; only background classes vary. There is no action-specific imagery.
- `src/client/RoomScreen.tsx`: the participant rail is omitted on reveal, while `.room-main` retains `minmax(0, 1fr) 300px` in CSS, explaining the empty right column and off-center board.
- `src/client/RoomScreen.tsx`: avatars derive from the first ID character modulo four. They can collide and are plain shapes, not characters.
- `src/domain/types.ts`: participant summaries expose identity but no assigned avatar. Persistent participants have `joinedOrder`; membership can shrink on removal, so deriving avatar slots from the current list index would recolor survivors.
- `src/client/App.tsx` and `RoomScreen.tsx`: server snapshots replace phase state; phase headings receive focus. Transition art must not become a second source of state or retain actionable stale controls.
- `design/concepts/` contains original character, motif-world, pattern/framing, desktop-flow, and mobile-flow PNGs. User explicitly confirmed inspiration from this directory.
- `design/README.md` and `design/concepts/README.md` currently restrict PNGs to reference use, prescribe large white surfaces, and describe the prior geometric avatars. This follow-up intentionally revises the affected visual contract; unaffected behavior, original-art constraints, and accessibility remain in force.
- `tests/client/room-screen.test.tsx` covers phase focus, private drafts, Ready/Edit, dialogs, and reveal density. `tests/client/responsive-contract.test.ts` uses CSS-string assertions that cannot prove visual quality or centering. `tests/e2e/browser-contract.js` covers real multi-context lifecycle, privacy, reload, capacity, 1/12-note layouts, focus, mute, and reduced motion.

## Confirmed decisions

| ID | Decision | Rationale and evidence |
| --- | --- | --- |
| D01 | New item titled Ceduljica annotation-driven visual fixes covers all 13 annotations. | User confirmed the complete scope in round 1; original completed archive stays untouched. |
| D02 | Use a note-first layout: warm supporting panels, standalone yellow writing note, open centered reveal board. | User chose this over tinting the existing enclosing cards. |
| D03 | Use 12 distinct automatically assigned character/color variants; no avatar picker. | User chose distinct variants over repeating only four avatars. The selected option includes consistency across clients, reconnects, and rounds. |
| D04 | Use `design/concepts/` as visual inspiration. Generate an action-specific image for each of five how-to steps during implementation. | Explicit user note and annotation 0003. Existing generated artwork may inform production assets rather than remain decorative citations. |
| D05 | Future implementation must use `twin-astra`, not `twin`; all UI/SVG fixes, including delegated fixes, must use `twin-astra`, never `worker`. | Explicit user instructions, including the clarification after final scope confirmation. |
| D06 | Final shared understanding is confirmed, including the completion details below. | User selected Confirm after the scope, assurance, acceptance, presentation-metadata implications, and preserved behavior were summarized. |

## Constraints, invariants, and non-goals

- Preserve server-owned membership, note eligibility, readiness, reveal order, owner permissions, late joins, disconnect grace, replay, and expiry. No other participant's note body may reach a client before reveal.
- Preserve existing rooms and sessions, including the local SQLite volume. Do not delete data, require room recreation, or silently reset participant identity to implement avatars.
- No accounts, avatar picker, new game rules, rich text, room history, new service, horizontal scaling, production deployment, or unrelated redesign.
- Preserve semantic controls, visible labels, focus, keyboard operation, mobile 320px layout, 200% zoom usability, persistent mute, and reduced-motion support. Art, color, and motion never carry essential meaning alone.
- Illustrations must not include generated UI text or participant content. Keep original PNG sources unchanged. Production art may be appropriately derived, extracted, or redrawn from Ceduljica concepts; generic CSS blobs are not an acceptable replacement for recognizable art.
- Image generation is implementation work, not part of discovery. Before calls, obtain approval for exact prompts, output paths, and any local reference images to upload. Inspiration permission alone does not authorize uploading all files in `design/concepts/`.
- No application edits, image generation, migrations, dependencies, commits, or runtime rebuilds during discovery.

## Resolved frontier and confirmed completion details

The user confirmed the final shared understanding. No consequential product-choice branch remains open. Confirmed interpretations:

- Keep a participant's assigned avatar stable when another person leaves or joins; reuse an available variant for a new identity without recoloring survivors. Minimal server/persistence presentation metadata may be necessary; choose the smallest backward-compatible mechanism during planning. Preserve existing room data and privacy projections.
- Apply the same avatar identity to the participant list and author attribution on revealed notes. Names remain the primary identity cue.
- Flying-note effects are short, finite, interruptible presentation only. Render and focus authoritative reveal immediately; an inert decorative outgoing note can overlap the incoming board. Reduced motion switches instantly. Reconnect, late join, replay, deletion, and rejected commands must not replay stale transitions or leave interactive old editors behind.
- Keep the simple header mark, correct its fold, retain and integrate the ribbon, and use restrained scenery around content rather than behind text. Exact tones, composition, and artwork are delegated to twin-astra within the confirmed direction, subject to visual acceptance.
- The current generated-reference-only and large-white-panel restrictions are superseded only for this follow-up's visual scope. Update affected current design guidance during implementation, not archived evidence.

## Proposed test seams and acceptance evidence

- Trace all 13 annotation IDs to corrected UI and screenshot evidence. Human visual approval is required; passing CSS-string tests alone is insufficient.
- Capture landing, all five how-to steps, lobby, writing, Ready, late-join/waiting, reveal, and shared terminal-mascot usage on desktop and phone. Check header integration, recognizable scenery/characters, clean folds, warm surfaces, and readable Owner stamp.
- Verify 1, 2, and 12 revealed notes, centered board geometry, long 500-character content, normal page scroll, 320px width, representative desktop widths, and 200% zoom.
- Verify 12 unique avatar assignments, cross-client agreement, reload/reconnect/replay stability, departures/replacements without survivor recoloring, and compatibility with existing persisted rooms. Validate author identity when ready notes survive a disconnect.
- Exercise writing entry, Ready/Edit, final Ready, replay, reconnect, late joining, and deletion during animation. Confirm no duplicated commands, draft loss, early disclosure, stale interaction, delayed phase focus, or blocked controls.
- Reduced motion disables drift and flight without waiting on animation events. Validate keyboard focus/return, dialog scrolling, image semantics, contrast, and mute behavior.
- Retain existing unit/integration/browser lifecycle and privacy checks; add focused behavior and browser visual/geometry checks for new presentation. Run lint, typecheck, tests, build, and browser E2E. Verify packaged asset serving and health through local Compose while preserving the volume.

## Resume state

- Initial discovery mode; round 1 and final shared-understanding confirmation are recorded, along with the subsequent prohibition on `worker` for UI/SVG fixes.
- No external research required. Repository source and local generated-art references resolve the current factual branches. Exact art prompts and asset mechanics remain non-blocking implementation details with approval required before generation or uploads.
- Exact next action: run `/skill:to-spec 260925-1219-ceduljica-annotation-driven-visual-fixes`. Carry forward mandatory `twin-astra` implementation routing and prohibit delegation of UI/SVG fixes to `worker`. No canonical plan or application changes have been made during discovery.

## Readiness for To Spec

- [x] Every consequential branch is resolved or explicitly out of scope.
- [x] Facts are distinguished from user decisions and hypotheses.
- [x] Requirements, constraints, and non-goals are clear.
- [x] Acceptance evidence and proposed test seams are defined.
- [x] The user confirmed shared understanding.
