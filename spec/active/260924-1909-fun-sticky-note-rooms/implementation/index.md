# Implementation: Fun Sticky Note Rooms

Plan: `../plan.md`
Mode: sliced
Assurance: medium - synchronized multi-client state, pre-reveal note privacy, disconnect recovery, and persistent lifecycle have meaningful regression cost within a recoverable single-instance deployment.
Review tier: scoped checks per slice, focused review at each segment boundary, and one final contract-quality review over the complete implementation.
Current: `03.01`
Expected implementation sessions: 4
Implementation starting checkpoint: `1cec850d5876cdcb4f3cfc7b8678c8c36673533e`

## Shared objective

Deliver Ceduljica as a responsive, playful, self-hosted TypeScript and SQLite application where 2 to 12 invited participants privately write one note each and reveal all eligible named notes together.

## Shared constraints and non-goals

- The design contract requires explicit approval before application source implementation.
- One authoritative application process owns room transitions; horizontal scaling is out of scope.
- Unrevealed note bodies must be absent from every other participant's server projection.
- Accounts, public discovery, saved history, rich note content, more than 12 participants, and initial localization are out of scope.
- Preserve the confirmed 60-second disconnect behavior, 24-hour inactivity expiry, replay reset, and owner controls.

## Shared decisions and invariants

- P003: complete and approve the Playful Plaza style tile and responsive mockups before application coding.
- P004: use one TypeScript application with SQLite on a persistent Docker volume.
- P005: enforce privacy with participant-specific server projections, not client-side hiding.
- R04: the server is authoritative for every room and round transition.
- R11: motion, color, and audio are enhancements, never the only source of state meaning.

## Common approval gates

- Stop and ask before dependencies, schema migrations, destructive operations, external writes, commits, pushes, production actions, or scope expansion.
- Confirm the image prompt and output paths before any Codex image-generation call.
- Do not start `02.01` until the user explicitly approves the `01.01` design artifacts.

## Common checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`

Run only checks that exist for the current repository state. From `02.01` onward, all listed project scripts must exist and pass unless the packet explicitly introduces a later-owned check.

## Segment and slice order

### T01: Establish and approve the Ceduljica visual contract

Depends on: none
Segment starting checkpoint: `1cec850d5876cdcb4f3cfc7b8678c8c36673533e`
Segment acceptance: the style tile, original visual references, responsive key-screen mockups, motion, sound, and accessibility guidance cover every required state and receive explicit user approval.
Segment gate: artifact inspection, focused design-contract review, and explicit user approval before any application coding.

- [x] 01.01: Produce and approve the visual contract (packet: `./01-01-visual-contract.md`)

Boundary 01.01 -> 02.01: application coding before mockup approval would violate the confirmed design-first requirement and create avoidable visual rework.

### T02: Implement the authoritative room service and approved client experience

Depends on: T01 approved
Segment starting checkpoint: `fddc3c7e70b186e81e736302f9796cda3bb40c73`
Segment acceptance: the tested server-owned lifecycle, SQLite persistence, participant-specific real-time protocol, and approved responsive client work together in development without disclosing another participant's note before reveal.
Segment gate: all T02 checks pass and one focused implementation review covers state authority, privacy, recovery, and the approved interface.

- [x] 02.01: Build the authoritative room core and persistence (packet: `./02-01-authoritative-room-core.md`)

Boundary 02.01 -> 02.02: the client must consume a verified server-owned protocol that withholds other note bodies before reveal; combining both obscures whether privacy or synchronization failures originate in transitions or presentation.

- [x] 02.02: Build the responsive real-time client experience (packet: `./02-02-responsive-realtime-client.md`)

Boundary 02.02 -> 03.01: Compose restart, persistence, and browser-to-browser checks require a complete integrated application and are costly enough to form a natural final verification session.

### T03: Package and verify the complete self-hosted system

Depends on: T02
Segment starting checkpoint: unrecorded
Segment acceptance: a clean Compose deployment passes health, multi-client flow, persistence restart, lifecycle, responsive, accessibility, and whole-plan acceptance checks.
Segment gate: focused final-segment review plus one final contract-quality review over the entire plan and evidence.

- [ ] 03.01: Package and prove the Compose system (packet: `./03-01-compose-system-verification.md`)

## Discoveries and blockers

None recorded.
