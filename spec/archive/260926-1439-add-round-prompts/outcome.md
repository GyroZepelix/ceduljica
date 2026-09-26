# Outcome: Add round prompts

Work item: `260926-1439-add-round-prompts`
Disposition: Completed
Date: 2026-09-26

## Delivered scope

- Added optional owner-composed round prompts to lobby begin and reveal replay controls.
- Added authoritative single-line parsing, surrounding-whitespace trimming, a 200-character limit, and owner-only begin/replay transport.
- Stored prompts on each new round and projected them to every participant during active, ready, waiting, and reveal states while suppressing blank display containers.
- Preserved omitted-command and stored legacy-round compatibility under SQLite schema v1, with no migration or eager rewrite.
- Added accessible plain-text Playful Plaza entry/display treatments that remain subordinate to the note and board and work at desktop, 320 px, and inspected 2x zoom.
- Extended domain, protocol, persistence, client, and browser regression coverage without changing note privacy or existing lifecycle, focus, motion, sound, permission, or replay behavior.

## Deviations from plan

None. No dependency, SQL migration, phase, generated artwork, deployment, commit, push, or unrelated cleanup was introduced.

## Verification summary

Focused authoritative and client suites passed. Lint, typecheck, all 54 Vitest tests, production build, full browser E2E, responsive visual inspection, diff hygiene, item validation, focused review, and final contract-quality review passed. See `verification.md` for commands, failure recovery, reviewer evidence, and requirement coverage.

## Retained, reverted, or transferred work

All implementation and test changes were retained. No work was reverted or transferred to another item.

## Residual risks

Native browser-menu 200% zoom could not be automated in the headless browser harness. CSS 2x zoom inspection and 320 px reflow evidence passed with no horizontal overflow; no functional uncertainty remains.

## Follow-up work items

None required.

## Source references

- `src/shared/constants.ts`
- `src/domain/types.ts`
- `src/domain/validation.ts`
- `src/domain/room-service.ts`
- `src/server/protocol.ts`
- `src/server/http-server.ts`
- `src/client/types.ts`
- `src/client/RoomScreen.tsx`
- `src/client/styles.css`
- `tests/domain/room-service.test.ts`
- `tests/integration/realtime-protocol.test.ts`
- `tests/integration/sqlite-persistence.test.ts`
- `tests/client/room-screen.test.tsx`
- `tests/client/room-transitions.test.tsx`
- `tests/e2e/browser-contract.js`

## Wiki updates

Updated `wiki/architecture/room-core.md` with the round-owned prompt validation, persistence, projection, privacy, and legacy-compatibility boundary. Appended the verified maintenance event to `wiki/log.md`; `wiki/index.md` and `wiki/state.md` required no change.
