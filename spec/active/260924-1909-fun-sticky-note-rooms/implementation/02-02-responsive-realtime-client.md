# Slice 02.02: Build the responsive real-time client experience

Plan: `../plan.md`
Implementation index: `./index.md`
Segment: `T02 - Implement the authoritative room service and approved client experience`
Assurance: medium - the client must preserve server authority while presenting every confirmed room state accessibly across phone and desktop layouts.
Review required now: one focused T02 segment review.

## Outcome

The approved Playful Plaza interface implements Ceduljica's complete live room flow against the verified server protocol, including reconnection, how-to guidance, responsive reveal layouts, accessible motion, and optional sound.

## Why this slice exists now

This slice depends on the verified participant-specific protocol from `02.01`. Keeping presentation integration separate makes state divergence and privacy defects diagnosable at the server projection boundary.

## Relevant context

- Use only the T01-approved visual contract and original assets.
- R03, R05 through R07, R10, and R11 define participant flow, owner controls, responsive presentation, accessibility, and sound.
- The client renders authoritative projections and may hold only its own current draft while editing.
- Waiting participants may watch reveal and enter the active set only after the owner starts the next round.
- Parent-plan sections to load on conflict or uncertainty: Requirements, Design, Acceptance criteria, Testing decisions and seams.

## Constraints and non-goals

- Obtain approval before adding any client, animation, accessibility-test, or audio dependency not approved in `02.01`.
- Do not broaden the visual direction beyond the approved artifacts.
- Do not expose hidden note content in client state, debug payloads, HTML, or accessibility trees.
- Do not make sound, color, or animation necessary to understand state.

## Expected source and test areas

- `src/client/`
- `src/shared/`
- approved assets under `design/` or the production asset area
- client component and accessibility tests
- focused multi-client development integration tests

These paths are navigation hints. Inspect other source or tests only when this slice or a credible regression path requires it.

## Acceptance and checks

- Acceptance: landing/create/join, how-to, lobby, writing, ready/edit, waiting, reveal, deletion, expiry, and reconnect states match the approved responsive contract.
- Acceptance: owner-only actions have clear controls and server-rejected actions reconcile without stale optimistic state.
- Acceptance: the reveal board remains usable from 1 through 12 notes on current phone and desktop viewport fixtures.
- Acceptance: keyboard order, focus return, modal behavior, labels, visible focus, non-color cues, and reduced-motion behavior are verified.
- Acceptance: subtle sounds begin only after user interaction, remain optional, and honor a persistent mute preference.
- Acceptance: focused two-client flows cover join, begin, ready/edit, reveal, waiting, replay, reconnect, transfer, removal, and delete against the real server.
- Check: `npm run lint`
- Check: `npm run typecheck`
- Check: `npm test`
- Check: `npm run build`
- Check: `git diff --check`

## Review gate

Run one focused review over the complete T02 segment. Review server authority, participant-specific privacy, reconnect behavior, phase rendering, responsive layouts, approved visual fidelity, accessibility, and sound controls. Correct credible blockers and rerun affected checks before marking T02 complete.

## Attempt log

No attempts recorded.

## Completion and handoff

On success, record changed paths, check results, focused review verdict, residual uncertainty, and `03.01` as the exact next slice. Mark T02 Progress complete, update the index checkbox, and advance Current only after the segment gate passes. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
