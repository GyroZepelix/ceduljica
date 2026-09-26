# Plan: Add round prompts

Work item: `260926-1439-add-round-prompts`
Status: Planned
Created: 2026-09-26
Updated: 2026-09-26
Assurance: medium - the feature crosses the authoritative round aggregate, WebSocket commands, persisted compatibility, participant projections, and responsive phase UI; it is additive, has no SQL migration, and remains straightforward to roll back.

## Goal

Let a room owner attach an optional question or prompt to each round before starting it, so every participant sees what their note should answer while writing and the same prompt remains visible with the completed board.

The observable outcome is a thematic, accessible prompt field in the owner controls and a shared round-prompt treatment in writing and reveal views, backed by authoritative validation, persistence, and participant snapshots.

## Context

- GitHub issue [GyroZepelix/ceduljica#1](https://github.com/GyroZepelix/ceduljica/issues/1) requires owner entry before a round, visibility during writing, and visibility beside revealed notes.
- `RoomService` owns lifecycle changes and participant-specific projections. SQLite schema v1 stores the complete room aggregate as JSON, so an additive round field does not require a table migration.
- `begin` and `replay` currently create a round immediately. The smallest coherent change is to carry the locally composed prompt on those commands and store it atomically with the new round, without adding a setup phase.
- The approved [Ceduljica visual contract](../../../design/README.md) defines the Playful Plaza palette, outlined paper geometry, typography, responsive behavior, focus treatment, and accessibility constraints that the prompt UI must reuse.

## Requirements

- R01: In the lobby and after reveal, the owner can enter an optional single-line prompt before selecting `Begin writing` or `Start a new round`.
- R02: Normalize the submitted prompt by trimming surrounding whitespace. Accept an empty prompt, reject line breaks and values longer than 200 characters, and enforce these rules in the authoritative domain layer rather than only in the browser.
- R03: Carry the prompt on owner-only `begin` and `replay` commands and store it on the newly created round. The completed round retains its own prompt; the next-round input starts blank and never copies the prior value.
- R04: Project the current round prompt to every authenticated participant during writing and reveal. Show a non-empty prompt in all writing variants (active editor, ready, and late-join waiting) and above the completed note board. Render no empty prompt container.
- R05: Preserve existing room and client compatibility: omitted prompt command fields mean an empty prompt, and persisted legacy rounds without prompt data project an empty prompt. Keep SQLite schema version 1 and do not reset or rewrite rooms merely to add the field.
- R06: Integrate entry and display with the approved Playful Plaza design using warm opaque paper surfaces, ink-heavy outlines, folded-note geometry, existing color/type/spacing tokens, semantic labels, visible focus, and a hierarchy that does not compete with the writing note or reveal board.
- R07: Keep the prompt treatment usable at 320 px width and 200% zoom, keyboard and screen-reader accessible, and rendered strictly as plain text. Preserve existing note privacy, lifecycle authority, focus transitions, motion, sound, owner permissions, and replay behavior.

## Out of scope

- Editing a prompt after its round starts or broadcasting an in-progress owner draft to other participants.
- Requiring a prompt, pre-filling the next round, multiline or rich-text prompts, links, attachments, prompt history, prior-round browsing, board export, or localization work.
- A new room phase, database schema migration, dependency, generated artwork, broad visual redesign, deployment, commit, push, or production action.

## Assumptions

- A 200-character limit is sufficient for the confirmed concise single-line question format. Revisit only if product requirements call for longer or multiline instructions.
- Guests do not need to see the prompt before the round starts. It becomes shared when the authoritative round is created and remains shared through reveal.
- Current browser clients may reconnect to a newer server, so accepting an omitted prompt on `begin` and `replay` is a practical compatibility requirement.

## Design

- Add a shared prompt limit and parser beside existing nickname and note validation. The parser accepts unknown command input, defaults omitted input to an empty string, trims it, and rejects embedded CR/LF or more than 200 characters.
- Add prompt data to `Round` and expose a stable `roundPrompt` string in `RoomProjection` (empty when no prompt is available). Round creation receives the parsed prompt for both initial begin and replay. Projection uses an empty fallback for stored legacy rounds whose serialized aggregate lacks the field.
- Extend the strict WebSocket command schemas, client command union, HTTP server dispatch, and `RoomService.begin`/`replay` boundaries with an optional prompt payload. New client actions send the field explicitly; missing fields remain accepted for compatibility.
- Keep owner prompt composition as local component state in the existing lobby and reveal controls. Do not persist or broadcast text until the owner starts the round. Phase replacement naturally discards that local value, and a later reveal mounts a fresh blank next-round input.
- Render one reusable, semantic round-prompt treatment before phase-specific writing content and before the reveal board. Style the entry and display as restrained Ceduljica paper elements using current tokens and responsive rules, without adding artwork or motion.

## Decision Log

| ID | Scope | Decision | Rationale | Evidence | Revisit when |
| --- | --- | --- | --- | --- | --- |
| P01 | Product behavior | Prompts are optional, single-line, trimmed, limited to 200 characters, and blank for each next round. | Preserves quick starts while providing a concise question and preventing accidental reuse. | User confirmation on 2026-09-26. | Product requirements change the format or make prompts mandatory. |
| P02 | Lifecycle | Send the prompt with `begin`/`replay` and persist it on the created round, without a setup phase. | Matches the existing authoritative transition and avoids speculative pending-round state. | `src/domain/room-service.ts`, `src/server/protocol.ts`, and confirmed contract. | Owners must collaborate on or save prompts before starting. |
| P03 | Compatibility | Treat missing command and stored-round prompt fields as empty; retain SQLite schema v1. | Supports existing browser tabs and serialized rooms without migration or data rewrite. | `src/db/sqlite-room-store.ts` stores aggregate JSON; user confirmed no migration design. | Implementation evidence proves aggregate compatibility is insufficient. |
| P04 | Presentation | Reuse the approved Playful Plaza design language and require responsive visual evidence. | The user explicitly requires a nice, thematic result, and the repository already has a binding visual system. | User confirmation and `design/README.md`. | A broader visual redesign is explicitly requested. |

## Work breakdown

- [x] T01: Add the authoritative round-prompt contract.
  - Depends on: none.
  - Scope: Add constants and validation, round/projection types, compatible begin/replay service inputs, protocol and dispatch payloads, JSON aggregate persistence behavior, and focused domain/protocol/restart tests.
  - Expected areas: `src/shared/constants.ts`, `src/domain/types.ts`, `src/domain/validation.ts`, `src/domain/room-service.ts`, `src/server/protocol.ts`, `src/server/http-server.ts`, `src/client/types.ts`, `tests/domain/`, `tests/integration/`.
  - Acceptance: valid, blank, trimmed, invalid-line-break, oversized, unauthorized, first-round, replay, reveal, reconnect, restart, and legacy-missing-field cases produce the confirmed authoritative behavior without exposing or changing note privacy.
  - Verification: focused Vitest files for room service, real-time protocol, and SQLite persistence, then `npm run typecheck`.

- [x] T02: Deliver the thematic prompt experience and complete regression evidence.
  - Depends on: T01.
  - Scope: Add owner prompt fields to lobby/reveal actions, shared writing/reveal prompt presentation, Playful Plaza styling, focused component tests, and browser coverage for two participants and a fresh blank replay input.
  - Expected areas: `src/client/RoomScreen.tsx`, `src/client/styles.css`, `tests/client/`, `tests/e2e/browser-contract.js`, and current design guidance only if implementation introduces a reusable visual rule not already covered.
  - Acceptance: the owner can start initial and later rounds with or without a prompt; every participant sees a non-empty prompt during writing and reveal; the next input is blank; and the result is coherent, accessible, and uncluttered on phone and desktop.
  - Verification: focused client tests, `npm run test:e2e`, responsive manual inspection at desktop, 320 px, and 200% zoom, then all project checks.

## Acceptance criteria

- The owner can enter up to 200 single-line characters in both pre-round locations, and starting sends the trimmed prompt with the correct command.
- Empty or whitespace-only input starts a round normally and produces no visible prompt display.
- Newline-containing or over-limit payloads are rejected by the server with `invalid_input`; non-owners remain unable to begin or replay.
- All participants, including ready participants and mid-round arrivals, receive and see the same prompt while writing. The same text appears with the revealed notes.
- Starting the next round creates a distinct prompt value, and its owner input begins blank rather than inheriting the completed prompt.
- A restart preserves a current round prompt. Existing stored rounds without the field and older clients omitting the command field continue with an empty prompt under SQLite schema v1.
- Prompt text is rendered as plain text and does not weaken participant-specific note privacy or alter existing lifecycle, reconnect, focus, motion, or sound behavior.
- Prompt entry and display visibly belong to Ceduljica's Playful Plaza system, remain subordinate to the note/board, and work with keyboard, screen reader labels, 320 px layout, and 200% zoom.
- No dependency, SQL migration, generated artwork, unrelated cleanup, deployment, commit, or push is introduced.

## Testing decisions and seams

- Extend deterministic `RoomService` tests for normalization, validation, authorization, projection visibility, round retention, replay replacement, and legacy empty fallback.
- Extend strict protocol tests to prove prompt transport and participant broadcast while retaining omitted-field compatibility and invalid-payload sanitization.
- Extend SQLite persistence coverage to close/reopen a prompted round and load a legacy aggregate without prompt data. Do not infer compatibility from TypeScript types alone.
- Extend React component tests for labelled owner inputs, max length, begin/replay payloads, blank suppression, and prompt display in active, ready, waiting, and reveal states.
- Extend the existing two-context browser contract for owner entry, guest visibility, completed-board visibility, and fresh next-round input. Use manual inspection only for thematic quality and the explicit 320 px/200% visual checks.

## Verification plan

1. Run focused changed test files with Vitest while implementing.
2. `npm run lint`
3. `npm run typecheck`
4. `npm test`
5. `npm run build`
6. `npm run test:e2e`
7. Inspect owner entry and participant display at a representative desktop width, 320 px width, and 200% zoom for hierarchy, overflow, labels, focus, and thematic fit.
8. `git diff --check`
9. `uv run spec/scripts/manage-spec-item.py --root . validate --item "260926-1439-add-round-prompts"`

## Risks and blockers

- Legacy serialized rounds have no prompt property. Mitigation: explicit projection fallback plus a stored legacy fixture; do not require a SQL migration or room rewrite.
- Strict command schemas could reject older command shapes if the new field becomes required. Mitigation: keep the transport field optional and default it authoritatively to empty.
- A large decorative prompt panel could crowd the standalone note or dense reveal board, especially on phones and at zoom. Mitigation: use a restrained shared component, existing visual tokens, responsive browser evidence, and no new illustration.
- Client-only validation could be bypassed. Mitigation: validate in the domain boundary and test raw protocol payloads.
- Stop for approval if implementation discovers a need for a dependency, migration, destructive data handling, external write, production action, or material scope expansion.

## Progress

- [x] Planning complete and confirmed.
- [x] Implementation complete.
- [x] Verification complete.

## Execution handoff

Use PI Agent in a fresh session with this prompt:

```text
Read spec/active/260926-1439-add-round-prompts/plan.md, item.yaml, and all applicable repository instructions completely.
Implement the smallest coherent change that satisfies the confirmed contract, preserving Requirements, Out of scope, Decision Log, and medium assurance.
Complete T01 before T02, and record only verified progress, evidence, failures, skipped checks, and residual uncertainty.
Run the plan's focused and full verification before reporting completion.
Stop and ask before dependencies, migrations, destructive operations, external writes, commits, pushes, production actions, or material scope expansion.
Do not silently rewrite requirements, acceptance criteria, exclusions, or assurance when implementation evidence changes the approach.
```

## Proposed durable knowledge updates

After verified implementation, update `wiki/architecture/room-core.md` with the round-owned prompt persistence/projection boundary and compatibility fallback. Update the wiki log only if that durable page changes. Do not update the wiki from this future-state plan alone.

## Notes

- Planning source baseline: `e4af084`.
- No implementation was performed during planning.
