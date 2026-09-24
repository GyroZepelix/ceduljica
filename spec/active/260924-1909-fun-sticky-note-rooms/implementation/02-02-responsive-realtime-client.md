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

### Attempt 1 - completed

- Starting boundary: clean `HEAD aa0fa6b27dd72780fa149f3f602fd807c6126376`; no unrelated staged, modified, or untracked paths were present.
- Dependency gate: the parent approved exact runtime `react@19.3.0` and `react-dom@19.3.0` plus dev `vite@8.3.1`, `@vitejs/plugin-react@6.1.1`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `jsdom@30.1.1`, `@testing-library/react@16.3.3`, and `@testing-library/user-event@14.6.7`. Motion uses CSS and sound uses the browser Web Audio API; no animation, audio, or additional accessibility dependency was added.
- Delivered paths: `src/client/`, Vite/Vitest and TypeScript configuration, package manifest and lockfile, built-client static delivery in `src/server/http-server.ts`, authoritative disconnect deadlines in participant projections, and client/static/full-flow coverage under `tests/client/` and `tests/integration/`.
- Authority and privacy: the React client renders participant-specific projections, keeps only its own editable draft locally, sends commands without optimistic phase/owner/readiness changes, and refreshes the authoritative snapshot after rejection. Hidden note bodies remain absent from other participants' pre-reveal snapshots, state, DOM, and protocol evidence.
- Experience: implemented landing/create/join, five-step focus-trapped how-to, lobby, writing, ready/edit, late waiting, reconnect countdown, reveal, owner transfer/removal/replay/delete, terminal removed/deleted/expired states, responsive 1-to-12 note density, keyboard/focus/live-region behavior, reduced motion, non-color cues, and persistent optional mute with user-gesture-safe synthesized sounds.
- Clean-install and automated checks: `npm ci` passed with 199 packages and zero audit vulnerabilities; the package manager reported its install-script approval notice, while native SQLite tests and Vite production build passed. `npm run lint`, `npm run typecheck`, `npm test` (7 files, 28 tests), `npm run build`, `git diff --check`, and `uv run spec/scripts/manage-spec-item.py --root . validate --operational` passed.
- Real-server browser evidence: Playwright drove independent desktop and mobile sessions through create, join, begin, write, ready, and reveal against the built server. Width checks passed at 320, 390/393, and 1440 pixels without horizontal overflow; modal focus/Escape return, safe delete focus/return, reload restoration, visible mobile How-to, reduced-motion computed styles, and the corrected mobile People disclosure with a 44 px owner `Remove Guest` control passed. Evidence snapshots are under `.playwright-cli/`, including `page-2026-09-24T21-17-17-338Z.yml` and `page-2026-09-24T21-26-18-106Z.yml`.
- Focused T02 review: the initial review blocked on the mobile People disclosure being reveal-only and lacking owner removal. The smallest correction rendered it in every phase, passed the authoritative action handler, included disconnect guidance, and added a labelled region. Targeted re-review 1 passed with no blockers. Review retries: one.
- Residual uncertainty: the displayed disconnect seconds derive from an authoritative server deadline but can be slightly offset by client/server clock skew. Docker Compose networking, container restart evidence, and final cross-browser/system verification remain assigned to `03.01`; no live screen-reader speech synthesis run was performed.
- Progress: slice `02.02` and segment T02 are complete; `Current` advanced exactly once to `03.01`.
- Exact next action: begin a fresh Implement assignment for `03.01`; do not archive, commit, push, deploy, or invoke Dream from this slice.

## Completion and handoff

On success, record changed paths, check results, focused review verdict, residual uncertainty, and `03.01` as the exact next slice. Mark T02 Progress complete, update the index checkbox, and advance Current only after the segment gate passes. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
