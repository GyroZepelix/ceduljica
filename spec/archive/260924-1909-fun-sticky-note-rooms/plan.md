# Plan: Fun Sticky Note Rooms

Work item: `260924-1909-fun-sticky-note-rooms`
Status: Planned
Created: 2026-09-24
Updated: 2026-09-24

## Goal

Deliver Ceduljica as a responsive, playful, self-hosted web application where 2 to 12 invited people join an unlisted room, privately write one note each, synchronize readiness, and reveal all eligible named notes together.

The observable outcome is a Docker Compose deployment that preserves live rooms across an ordinary application restart, enforces the confirmed room lifecycle on the server, and provides the approved Playful Plaza experience on current phone and desktop browsers.

## Context

- This is a greenfield repository with no application framework or legacy compatibility constraint.
- Assurance: medium - synchronized multi-client state, pre-reveal note privacy, disconnect recovery, and persistent room lifecycle have meaningful regression cost, while the bounded single-instance deployment remains practical to recover.
- Execution mode: sliced, with 4 expected implementation sessions. The design approval gate and dependent server, client, and packaged-system evidence make one coherent implementation session unsafe.
- Review tier: scoped checks per slice, focused review at each coherent segment boundary, and one final contract-quality review over the whole implementation.
- The confirmed discovery remains available at [discovery.md](./discovery.md).

## Requirements

- R01 Visual contract: before application source implementation, produce a style tile and responsive key-screen mockups for landing/create/join, the 4 or 5 step how-to modal, lobby, writing/ready/waiting, and reveal. Obtain explicit user approval. Original Codex-generated imagery may support the concept, but protected Nintendo assets must not be copied.
- R02 Room access: a guest creates or joins an unlisted, high-entropy room link without an account, chooses a trimmed display nickname, and receives an opaque participant session identity that supports reconnection without treating the nickname as authorization.
- R03 Membership: a room contains at most 12 retained participants including the owner. The owner is a writing participant, and Begin is enabled only when at least 2 participants are eligible for the next round.
- R04 Server authority and privacy: the server owns all room, membership, round, ready, reveal, removal, transfer, replay, and deletion transitions. Before reveal, a participant must never receive another participant's note body through snapshots, events, or endpoints.
- R05 Writing and reveal: each active-round participant receives one non-empty multiline plain-text note of at most 500 characters. Ready freezes that note. Edit may return it to writing until the final Ready action atomically starts reveal. Reveal shows every eligible note with its writer's nickname to all connected room members.
- R06 Late joins and disconnects: a participant joining during writing waits outside the active round, may watch its reveal, and becomes eligible for the next round. A disconnected participant has a 60-second reconnection grace period. After grace, an unfinished participant leaves the active round, while a ready submission remains eligible. Any resulting all-ready state reveals automatically.
- R07 Owner controls and recovery: only the owner may begin or replay a round, remove a guest before reveal, or manually delete the room. Guest removal discards that guest's current submission and may trigger reveal if all remaining active participants are ready. After a 60-second owner disconnect grace period, ownership transfers to the longest-present connected guest. A former owner who later returns is a regular participant.
- R08 Replay and retention: after reveal, the owner may start a clean round in the same room. Connected and waiting participants become the next active set, and prior-round notes are not browsable. Server-accepted room actions update activity; passive heartbeats alone do not. The room and all note data expire after 24 hours without meaningful activity or immediately after confirmed owner deletion.
- R09 Persistence and deployment: use one authoritative TypeScript application process with SQLite stored on a persistent Docker volume. An ordinary application restart must not erase an unexpired room. Provide an easy Docker Compose startup, health check, persistent volume, environment documentation, and cleanup behavior. Horizontal multi-instance coordination is not required.
- R10 Interface: ship English copy structured for future localization. Implement the approved Playful Plaza direction with warm white, sky blue, coral, yellow, and mint; chunky rounded controls; an original sticky-note mascot; and soft, springy motion.
- R11 Accessibility and sound: support keyboard operation, visible focus, semantic controls, readable responsive layouts, and state feedback that does not rely only on color, motion, or sound. Honor reduced-motion preferences. Provide subtle optional interaction and reveal sounds with a persistent local mute control and browser-safe user-gesture activation.
- R12 Input and transport safety: validate room, participant, nickname, note, and owner actions on the server; render note and nickname content as text; reject oversized or phase-invalid actions; use unguessable room and session tokens; and document that production internet exposure requires HTTPS termination.

## Out of scope

- User accounts, sign-in, or durable verified identity.
- Public room discovery, search, or a room directory.
- Saved room history, browsable prior rounds, exports, or analytics.
- Rich text, rendered links, images, uploads, or attachments inside notes.
- More than 12 retained participants in a room.
- Interface languages other than English in the initial version.
- Horizontal multi-instance scaling, distributed locks, or shared database operation.
- Managed-cloud-only services or a required external data provider.
- Built-in certificate issuance or TLS termination.
- Production deployment, commits, pushes, or publication as part of implementation.

## Assumptions

- The initial deployment runs one application process against one local SQLite database. Revisit the architecture before adding replicas or shared storage.
- Docker Compose may expose HTTP for local or trusted-network use. A production operator supplies HTTPS termination and secure forwarding headers; deployment documentation must make this boundary explicit.
- Exact maintained HTTP, real-time transport, SQLite, test, animation, and audio packages are selected at the dependency approval gate. They must preserve the single-process architecture and the verification seams in this plan.
- Participant authorization uses an opaque browser-held session token. A nickname is a display label and cannot authorize owner or participant actions.
- Generated concept imagery is a design reference. Production UI text, layout, and accessibility must be implemented deterministically rather than copied from imperfect generated text.

## Design

### Visual approval phase

Create a compact design package under `design/` containing:

- a documented style tile with palette, typography, spacing, shape, icon, mascot, motion, sound, and reduced-motion guidance;
- desktop and mobile mockups covering landing/create/join and how-to, lobby, writing and ready, waiting, and reveal states;
- original mascot or illustrative concept imagery, optionally produced with Codex image generation after the required external-call approval;
- an approval record in this plan's Progress section or Decision Log before T02 begins.

### Application shape

- Use one Node-compatible TypeScript service to serve the built client, expose health and room endpoints, and own the real-time connection layer.
- Keep domain transitions in a transport-independent room service so unit and integration tests can exercise deterministic state without a browser.
- Store room, participant, round, note, ownership, connection deadline, and activity data in SQLite. Serialize state-changing commands and use transactions where one command changes multiple records or may trigger reveal.
- Treat the server's phase and participant-specific projection as authoritative. Client snapshots must be filtered so another writer's note body is absent, not merely hidden by the interface.
- Use a React and Vite client that renders server projections, keeps only its own draft locally while editing, reconnects with the participant token, and reconciles to the latest authoritative snapshot.
- Use a cleanup job and startup cleanup to delete expired rooms. Time-dependent domain behavior must accept an injectable clock for focused tests.

### State model

- Lobby: eligible connected participants are visible; only the owner may begin once at least 2 are eligible.
- Writing: the active set is fixed for that round. Late arrivals are waiting. Active participants edit, become ready, or reconnect.
- Reveal: eligible note bodies and nicknames are visible to all room members. The owner may start a clean round or delete the room.
- Deleted or expired: connected clients receive a terminal event and return to an explanatory landing state.

Disconnect deadlines, removal, ownership transfer, and all-ready evaluation are server commands. They must be safe when retried and deterministic when deadlines or concurrent actions coincide.

## Decision Log

| ID | Scope | Decision | Rationale | Evidence | Revisit when |
| --- | --- | --- | --- | --- | --- |
| P001 | Assurance | Use medium assurance and boundary plus final reviews. | Multi-client privacy and lifecycle failures matter, but the single-instance app is recoverable. | [Discovery assurance](./discovery.md) and user-confirmed plan preview. | Operating scale or risk changes materially. |
| P002 | Execution | Use 3 segments and 4 serial implementation slices. | Visual approval blocks coding; server projections must precede client integration; packaged-system checks require the complete app. | User-approved To Spec preview. | A dependency makes a boundary invalid before implementation starts. |
| P003 | Design gate | Approve style tile and responsive mockups before application coding. | Visual direction is a first-class requirement and early approval prevents avoidable rework. | Discovery D021 and D023. | The user explicitly removes or changes the gate. |
| P004 | Architecture | Use one TypeScript application with SQLite on a persistent Docker volume. | This is the simplest self-hosted topology that supports the confirmed retention and restart behavior. | Discovery D020 and D022. | Horizontal scaling or shared storage becomes required. |
| P005 | Privacy | Make server-filtered participant projections the privacy boundary. | Hiding note text only in the client would still disclose it before reveal. | Discovery constraints and medium-assurance risk analysis. | End-to-end encryption or a different trust model is requested. |
| P006 | Visual direction | Implement Playful Plaza with original assets, accessible motion, and optional sounds. | It is the confirmed expression of the requested Wii-era spirit without copying protected assets. | Discovery D024 to D026. | The T01 concept review rejects a specific treatment. |
| P007 | Visual approval | Approve the final Astra-authored sunny paper plaza package as the binding T02 visual contract. | The package carries the selected original Ceduljica concepts into deterministic desktop/mobile states with accessible authored UI. | User explicit approval on 2026-09-24; [Current evidence](./implementation/01-01-visual-contract.md); [`design/README.md`](../../../design/README.md). | A later explicit visual change is requested. |

## Work breakdown

- [x] T01: Establish and approve the Ceduljica visual contract.
  - Depends on: none
  - Scope: Create the style tile, original visual references, responsive key-screen mockups, and motion, sound, and accessibility guidance. Obtain explicit user approval before source implementation.
  - Expected areas: `design/`, `spec/active/260924-1909-fun-sticky-note-rooms/plan.md`
  - Acceptance: every required screen and responsive state is represented, the concept uses the confirmed Playful Plaza direction, and user approval is recorded.
  - Verification: artifact inspection, responsive-state checklist, `git diff --check`, focused design-contract review, and explicit user approval.

- [x] T02: Implement the authoritative room service and approved client experience.
  - Depends on: T01 approved
  - Scope: After dependency approval, establish the TypeScript application, SQLite persistence, room domain and participant-specific real-time protocol, then build the responsive React interface, reconnect behavior, how-to modal, animation, reduced-motion, and optional sound controls.
  - Expected areas: `package.json`, lockfile, TypeScript configuration, `src/`, database schema or migrations, `tests/`, approved design assets
  - Acceptance: all room and recovery rules work through server-owned transitions, other note bodies are absent before reveal, the approved interface works on phone and desktop, and focused automated checks pass.
  - Verification: lint, type-check, unit and integration tests, client tests, production build, focused privacy inspection, and focused segment review.

- [x] T03: Package and verify the complete self-hosted system.
  - Depends on: T02
  - Scope: Add Docker Compose delivery, persistent SQLite volume, health and startup behavior, operator documentation, multi-client browser coverage, restart and cleanup checks, and final contract verification.
  - Expected areas: `Dockerfile`, `compose.yaml`, `.dockerignore`, environment example, `README.md`, browser and Compose test areas
  - Acceptance: a clean Compose startup supports the complete browser-to-browser flow, survives an ordinary app restart, enforces deletion and expiry, and passes whole-plan acceptance.
  - Verification: all project checks, browser tests, Compose config and smoke tests, focused final-segment review, and final contract-quality review.

## Acceptance criteria

- The user approves the style tile and responsive mockups before T02 application source work begins.
- A guest can create an unlisted room, share its link, and join from a second current phone or desktop browser without an account.
- The room rejects a thirteenth retained participant and prevents Begin with fewer than 2 eligible participants.
- Only the owner can begin, replay, remove another participant, or delete the room.
- Each active participant can edit one non-empty plain-text note up to 500 characters, select Ready, and return to Edit only before reveal begins.
- Before reveal, no endpoint, snapshot, event, page source, or client state supplied to another participant contains that note body.
- The final Ready action atomically moves all connected room members to a reveal board containing every eligible note and its writer's nickname.
- A mid-round arrival sees a waiting state, may see the reveal, and participates after the owner starts the next clean round.
- A disconnect within 60 seconds restores the participant state. After grace, unfinished work is dropped, ready work remains eligible, and the room reveals if the remaining readiness condition becomes true.
- Owner loss transfers ownership after grace to the longest-present connected guest. The former owner returns without reclaiming ownership automatically.
- Owner removal discards the removed guest's current note, prevents further actions under that removed membership, and re-evaluates reveal readiness.
- Starting another round removes the prior round's note data from the active experience and includes currently eligible waiting participants.
- An ordinary application restart preserves unexpired rooms in the mounted SQLite database. Expiry and confirmed owner deletion remove room and note data and notify connected clients when applicable.
- Landing, how-to, lobby, writing, waiting, and reveal states are usable on phone and desktop, including a reveal layout from 1 through 12 notes.
- Keyboard, focus, reduced-motion, non-color state cues, and persistent mute behavior meet the requirements, and audio is never required to understand state.
- `docker compose up --build` starts a healthy documented deployment with no managed service dependency.

## Testing decisions and seams

- Test the room state machine independently from transport and SQLite using an injectable clock and deterministic participant ordering.
- Test SQLite repositories and transactional commands against a temporary database, including restart reconstruction, expiry cleanup, removal, and atomic reveal.
- Test participant-specific projections directly to prove unrevealed note bodies are absent for non-authors.
- Test real-time integration with multiple logical clients for create, join, begin, ready/edit, reveal, replay, late join, disconnect deadlines, owner transfer, and deletion.
- Use component and accessibility checks for modal behavior, forms, focus, ready/edit states, waiting, reveal cards, mute persistence, and reduced motion.
- Use browser tests for at least two simultaneous contexts and focused capacity/layout fixtures up to 12 notes. Do not require 12 full browsers for every scenario.
- Use fake or injected time for 60-second and 24-hour behavior rather than wall-clock waits.
- Treat visual approval and final responsive inspection as manual evidence where automation cannot prove design quality.

## Verification plan

After approved dependencies and implementation scripts exist, run:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. `npm run test:e2e`
7. `docker compose config`
8. `docker compose up --build -d`
9. `curl --fail http://localhost:3000/health`
10. `npm run test:compose`
11. `docker compose down`
12. `git diff --check`

`npm run test:compose` must exercise a two-client room flow against Compose, restart the `app` service without deleting its volume, verify room recovery, and leave expiry and manual-deletion timing to deterministic automated checks rather than a 24-hour wait.

At the end of T01, T02, and T03, run the medium-assurance focused boundary review. At the end of T03, also run one independent contract-quality review over all requirements, exclusions, acceptance criteria, and verification evidence.

## Risks and blockers

- Pre-reveal disclosure through broad snapshots or event payloads would violate the central privacy contract. Mitigation: participant-specific server projections and direct negative tests.
- Concurrent Ready, disconnect, removal, and transfer events could create duplicate reveals or inconsistent ownership. Mitigation: serialized commands, transactional multi-record changes, idempotent transition rules, and race-focused integration tests.
- SQLite does not provide horizontal coordination. Mitigation: enforce and document the single-process boundary; reassess before replicas.
- Generated concept art may contain inaccurate text or inaccessible layout. Mitigation: use it as reference only and implement deterministic UI from approved documented tokens and mockups.
- Browser audio restrictions may prevent playback before interaction. Mitigation: initialize audio only after a user gesture and keep visual feedback complete.
- T02 is blocked until T01 receives explicit visual approval and dependencies receive their separate approval.

## Progress

- [x] Planning complete and confirmed.
- [x] T01 visual contract approved and verified.
- [x] T02 authoritative room service and responsive real-time client complete and focused-review verified.
- [x] T03 packaged-system verification complete.
- [x] Final verification passed.

## Execution handoff

Use PI Agent in a fresh session with this prompt:

```text
Read spec/active/260924-1909-fun-sticky-note-rooms/plan.md, item.yaml, implementation/index.md, and the packet named by Current completely.
Implement only the Current packet while preserving the plan Requirements, Out of scope, Decision Log, acceptance criteria, and approval gates.
Update packet evidence, plan Progress when a segment passes, and implementation/index.md Current and checkboxes only after required checks and reviews succeed.
Run the packet checks before reporting completion.
Stop and ask before dependencies, schema migrations, Codex image generation or other external writes, destructive operations, commits, pushes, production actions, or scope expansion.
At the visual gate, do not begin application source implementation until the user explicitly approves the design artifacts.
```

## Proposed durable knowledge updates

After verified implementation, document the authoritative room-state architecture, participant-specific projection privacy boundary, SQLite lifecycle, and Docker Compose operating workflow in `/wiki`. Do not update the wiki from this future-state plan alone.

## Notes

- `plan.md` is the sole implementation contract. Files under `implementation/` are bounded projections for fresh sessions and cannot redefine this plan.
- No implementation was performed during planning.
