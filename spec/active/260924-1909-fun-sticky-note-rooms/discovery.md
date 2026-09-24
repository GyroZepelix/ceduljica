# Discovery: Fun Sticky Note Rooms

Work item: `260924-1909-fun-sticky-note-rooms`
Status: Ready for Spec
Created: 2026-09-24
Updated: 2026-09-24

Assurance: medium - confirmed by the user because the app is greenfield and reversible, but synchronized multi-user room state, owner controls, and disconnects create meaningful cross-client failure modes.

## Objective

Define a KISS, playful room-based web experience where a group privately writes one sticky note each and reveals all notes together.

## Desired outcome

Ceduljica lets a host create a room, share its link, wait for participants, begin the activity, and reach a synchronized group reveal after every active participant is ready. The experience should feel cheerful and tactile through flat colors and lively animation inspired by the character of Nintendo Wii-era games without copying protected assets.

## Repository and domain context

- Fact: the repository currently contains only `/spec` and `/wiki` scaffolding. No application source, framework, deployment target, or test stack exists yet.
- User-stated context: people enter a shared room through a link and the room owner controls when the activity begins.
- User-confirmed operating envelope: a responsive modern-browser experience for casual invited groups of up to 12 people, rather than a regulated, failure-intolerant, or large public event platform.
- User-confirmed room model: participants use guest nicknames and an unlisted shared link without accounts.

## Scope

User-requested capabilities:

- Create a room and expose a shareable join link.
- Let participants join before the owner begins.
- Give each participant one sticky note writing surface after begin.
- Let each participant mark their note ready for reveal.
- Automatically move everyone to a shared board when all applicable participants are ready.
- Display all submitted notes together on the reveal board.
- Use playful flat-color visual design and lively Wii-era-inspired motion.
- Provide a small `How to use` control on the initial screen that opens a fun illustrated walkthrough of four or five steps.
- Let the owner start another clean round in the same room after reveal.
- Expire a room and its note data after 24 hours of inactivity, and let its owner delete it manually.
- Produce and confirm the basic Ceduljica visual design before application implementation; original concept imagery may be generated with Codex image generation.
- Provide an easy self-hosted Docker Compose deployment.
- Add subtle optional interaction and reveal sounds with a persistent mute control.

## Out of scope

- User accounts and sign-in.
- Durable room or round history after expiry or owner deletion.
- Browsing prior reveal boards.
- Public room discovery.
- Groups larger than 12 participants in the initial version.
- Rich text, images, file attachments, or clickable link formatting inside notes.
- Managed-cloud-only deployment.
- Horizontal multi-instance scaling in the initial version.
- Additional interface languages in the initial version.

## Confirmed facts and evidence

- Fact: no legacy application behavior or compatibility constraint exists in the repository.
- Fact: the spec protocol is version `2.2.1`; operational validation passed with no warnings before this item was created.
- User decision: the self-hosted application uses TypeScript and SQLite rather than Redis or a managed data service.
- Architecture implication: the confirmed small-group scope permits one authoritative application instance with SQLite on a persistent Docker volume; horizontal multi-instance operation is not required.
- User requirement: reveal is gated until everyone has indicated readiness.
- User requirement: the final state is a single view containing everyone’s notes next to each other.

## Constraints and invariants

- All connected clients in a room need a consistent room phase: lobby, writing, or reveal.
- Only the room owner can begin the writing phase.
- The reveal must not expose note text early to other participants.
- The interface should stay intentionally simple despite the multi-user state model.
- Room and note data must be deleted after 24 hours without room activity or immediately after confirmed owner deletion.
- Replaying the activity starts a clean round and does not retain a browsable prior reveal.
- The responsive reveal board must remain usable with 1 through 12 notes.
- A round can begin only with at least two participants, including the owner, and the owner writes a note like every other participant.
- A note is non-empty multiline plain text with a maximum of 500 characters.
- Selecting Ready freezes the note; Edit returns it to writing only before the final participant triggers reveal.
- A participant joining during writing waits outside the active round, may watch its reveal, and becomes eligible for the next round.
- Disconnected participants receive a 60-second reconnection grace period. After grace, an unready participant leaves the active round, while a ready submission remains eligible for reveal.
- A disconnected owner receives the same 60-second grace period before ownership transfers to the longest-present connected guest. A returning former owner is a regular participant.
- Before reveal, the current owner can remove a guest and discard that guest's current submission.
- The deployment must be operable through a straightforward self-hosted Docker Compose setup.
- One TypeScript application service owns authoritative room transitions and real-time delivery; SQLite persists live room state on a mounted volume so an ordinary service restart does not erase unexpired rooms.
- SQLite cleanup must enforce the 24-hour inactivity rule, and manual deletion must remove the room and notify connected clients.
- Sound effects are subtle and optional, with a persistent mute control and no reliance on audio for meaning.
- Motion must honor the browser's reduced-motion preference without removing state feedback.

## Domain language

- **Owner/host:** the person who creates the room and can begin the activity.
- **Participant:** anyone present in the room; the owner is also a writing participant.
- **Ready:** a participant signal that their current note may take part in the reveal.
- **Reveal board:** the shared post-writing view containing all eligible notes.
- **Active-round participant:** a participant assigned a note and included in the current readiness set.
- **Waiting participant:** a mid-round arrival who may observe the current reveal but joins the readiness set only next round.

## Decision tree

- Deliver the synchronized room experience.
  - Confirm browser/device target and expected group size.
  - Confirm room access, identity, and lifetime.
  - Confirm one-round versus replay behavior.
  - Confirm readiness, disconnect, and owner-loss rules so reveal cannot deadlock.
  - Confirm whether revealed notes identify their writers.
- Preserve the playful KISS experience.
  - Keep required screens and controls minimal.
  - Establish motion and accessibility expectations after the delivery environment is settled.

## Confirmed decisions

| ID | Decision | Rationale | Evidence | Revisit when |
| --- | --- | --- | --- | --- |
| D001 | Use a room owner who explicitly starts the activity. | Gives the group a shared start after invited people arrive. | User request. | Never, unless the product flow changes. |
| D002 | Give each participant one sticky note in the writing phase. | This is the central interaction. | User request. | If multiple notes or rounds are selected later. |
| D003 | Gate a synchronized reveal on participant readiness. | Prevents notes appearing piecemeal. | User request. | When disconnect and readiness semantics are resolved. |
| D004 | Include an illustrated four- or five-step how-to modal from the initial screen. | Makes the KISS flow self-explanatory. | User request. | If onboarding moves inline. |
| D005 | Use original flat-color art and playful motion inspired by Wii-era games. | Captures the requested tone without requiring copied assets. | User request, interpreted conservatively. | If a specific original visual direction is supplied. |
| D006 | Name the app `Ceduljica`. | Establishes product identity for interface copy and visual design. | User decision, round 1. | If the user renames the product. |
| D007 | Support current phone and desktop browsers with responsive layouts. | Shared links may be opened on either device class. | User decision, round 1. | If a deployment environment imposes narrower compatibility. |
| D008 | Use guest nicknames and an unlisted room link without accounts. | Keeps entry instant and within KISS scope. | User decision, round 1. | If stronger identity or access control becomes necessary. |
| D009 | Expire rooms after 24 hours of inactivity and allow confirmed owner deletion. | Permits practical reconnects without durable history. | User decision, round 1. | If retention or recovery requirements change. |
| D010 | Cap the initial room at 12 participants. | Bounds synchronization and preserves a readable reveal layout. | User decision, round 1. | If larger-group support becomes a goal. |
| D011 | Allow the owner to start another clean round in the same room without retaining old rounds. | Supports replay without making Ceduljica a history tool. | User decision, round 1. | If one-shot rooms or saved rounds are later desired. |
| D012 | Show each writer's nickname on their revealed note. | Supports clear group conversation after reveal. | User decision, round 1. | If room-level anonymity becomes a feature. |
| D013 | Let a ready participant choose Edit until the final ready action starts reveal. | Supports correction without adding an owner-only recovery flow. | User decision, round 2. | If readiness must become irreversible. |
| D014 | Put mid-round arrivals in a waiting view, allow them to watch reveal, and include them next round. | Keeps the current readiness set stable without rejecting invited guests. | User decision, round 2. | If late entry should be blocked or alter the current round. |
| D015 | Give disconnected guests 60 seconds to reconnect, then drop unfinished notes while retaining ready submissions. | Prevents deadlock while protecting completed work. | User decision, round 2. | If the grace interval or retention rule proves unsuitable. |
| D016 | Transfer ownership after 60 seconds to the longest-present connected guest. | Lets the room recover without accounts or indefinite freezing. | User decision, round 2. | If ownership needs stronger identity guarantees. |
| D017 | Let the owner remove a guest before reveal and discard that guest's current note. | Lets the owner unblock or moderate the room. | User decision, round 2. | If stronger moderation or no host control is desired. |
| D018 | Include the owner as a writing participant and require at least two total participants to begin. | Preserves the shared activity rather than a facilitator mode. | User decision, round 2. | If facilitation or solo mode is added. |
| D019 | Limit notes to non-empty multiline plain text of at most 500 characters. | Allows moderately detailed responses while bounding the reveal layout. | User decision, round 2, overriding the 280-character recommendation. | If reveal readability requires a different limit. |
| D020 | Target an easy self-hosted Docker Compose deployment. | Gives the user operational ownership and a simple startup path. | User decision, round 2, overriding managed-cloud recommendation. | If a hosted service becomes acceptable. |
| D021 | Complete and confirm a basic visual design before coding the app, with Codex-generated original concept imagery available. | Reduces visual rework and treats the requested style as a first-class deliverable. | User direction after round 2. | If the user elects to skip the visual approval gate. |
| D022 | Use a TypeScript application with SQLite persistence instead of Redis. | A single service and mounted database volume best fit the requested easy Compose deployment and bounded scale. | User decision, round 3. | If horizontal scaling or a different persistence requirement appears. |
| D023 | Require explicit approval of a style tile and responsive key-screen mockups before application coding. | Makes the visual direction testable before implementation effort. | User decision, round 3. | If the user removes the approval gate. |
| D024 | Use the `Playful Plaza` direction: warm white space, sky blue, coral, yellow, and mint; chunky rounded UI; a sticky-note mascot; and soft springy motion. | Most directly combines flat-color KISS design with the requested Wii-era spirit. | User decision, round 3. | If concept review rejects the direction. |
| D025 | Ship the initial interface in English while keeping copy structured for future localization. | Minimizes first-release scope without blocking later translation. | User decision, round 3. | When another language is explicitly added. |
| D026 | Include subtle optional sound effects with a persistent mute control. | Adds playful feedback without making audio mandatory. | User decision, round 3, overriding the no-sound recommendation. | If concept review removes or expands sound. |

## Rejected alternatives

- Managed-cloud-first architecture: rejected in favor of an easy self-hosted Docker Compose deployment.
- Rich note content: rejected to keep input, rendering, and safety simple.
- Indefinite disconnect waiting: rejected because it can deadlock a round.
- Redis as the ephemeral room store: rejected in favor of TypeScript plus SQLite and a simpler initial Compose topology.
- Design-during-coding: rejected in favor of explicit pre-coding mockup approval.
- Silent-only interaction: rejected in favor of optional, muteable sounds.

## Open questions and prerequisites

No blocking product or architecture questions remain. Non-blocking implementation selections include the exact TypeScript HTTP/WebSocket and SQLite libraries, final generated mascot treatment, and exact transition timings within the approved visual direction.

## Current frontier

Empty. The user confirmed the shared-understanding synthesis.

## Research index

No external research was required. Repository inspection established that this is a greenfield app, and the user directly selected the operating envelope, architecture family, and visual direction.

## Proposed test seams and acceptance evidence

- Visual gate: an approved style tile and responsive mockups cover landing/create/join plus the how-to modal, lobby, writing/ready/waiting, and reveal states before source implementation starts.
- Deterministic tests cover owner-only begin, minimum and maximum room size, legal phase transitions, ready/edit behavior, replay reset, and automatic reveal.
- Multi-client tests prove note text remains private before reveal and becomes visible to every connected room member only after the readiness condition is met.
- Multi-client tests cover late joins, guest removal, 60-second reconnection grace, retained ready notes, discarded unfinished notes, and deterministic owner transfer.
- Persistence tests cover service restart with a mounted SQLite database, 24-hour inactivity cleanup, and immediate confirmed owner deletion.
- Validation tests cover unique room identity, nickname and note input handling, and the 500-character server-enforced limit.
- Responsive browser checks cover phone and desktop layouts with 1 through 12 reveal notes.
- Interaction and accessibility checks cover the illustrated how-to modal, keyboard operation, visible focus, reduced motion, sound muting, and state feedback that does not rely on motion, color, or audio alone.
- A Docker Compose smoke test proves a clean self-hosted startup, persistent data volume, health check, and browser-to-browser room flow.

## Proposed wiki updates after implementation

If implementation establishes reusable architecture or real-time state conventions, document those after source and verification evidence exist.

## Resume state

Shared understanding confirmed by the user on 2026-09-24.

Exact next action: run `/skill:to-spec 260924-1909-fun-sticky-note-rooms` to create the canonical implementation plan, preserving the visual approval gate before application coding.

## Readiness for To Spec

- [x] Every consequential branch is resolved or explicitly out of scope.
- [x] Facts are distinguished from user decisions and hypotheses.
- [x] Requirements, constraints, and non-goals are clear.
- [x] Acceptance evidence and proposed test seams are defined.
- [x] The user confirmed shared understanding.
