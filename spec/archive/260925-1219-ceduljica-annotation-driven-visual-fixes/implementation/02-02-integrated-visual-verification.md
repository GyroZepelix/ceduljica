# Slice 02.02: Prove the integrated visual contract

Plan: `../plan.md`
Implementation index: `./index.md`
Segment: `T02 - Deliver and prove the note-first room experience`
Assurance: medium - multi-client presentation, responsive accessibility, phase interruptions, and persistent identity require integrated regression evidence.
Review required now: one focused T02 review, one independent final whole-contract review, and explicit final user visual approval.

## Outcome

All 13 annotations have corrected desktop/phone visual evidence; browser, accessibility, phase-interruption, asset-serving, and Compose restart checks prove the integrated experience preserves room behavior and data. The user approves the final visuals.

## Why this slice exists now

The full multi-context viewport/zoom matrix and packaged restart/asset checks require T01 assets and the integrated 02.01 room experience. Keeping this work together isolates expensive browser/Compose diagnosis from persistence and animation implementation.

## Relevant context

- All R01-R11 and every plan acceptance criterion are in scope for final verification. Existing tests and archived evidence are reusable baselines, not proof of the new visuals.
- `.pi-annotations/20260925-101448Z/` is ignored local evidence. Use the plan's sanitized annotation mapping and new disposable test fixtures; do not retain original room URLs or user content.
- `tests/e2e/browser-contract.js` already covers multiple clients, privacy, reload, Ready/Edit, late join, replay, deletion, 1/12 notes, focus, mute, and reduced motion. Extend this seam rather than add a browser dependency unnecessarily.
- `tests/compose/smoke.ts` already verifies privacy, app-only restart, resynchronization, reveal, and disposable-room deletion without volume removal.
- Parent-plan sections to load on conflict or uncertainty: Requirements, Acceptance criteria, Testing decisions and evidence classification, Verification plan, Risks and approval gates.

## Constraints and non-goals

- All implementation and any corrective UI/SVG work must use `twin-astra`. Never substitute `twin` or delegate UI/SVG fixes to `worker`, even after review.
- Preserve lifecycle rules, privacy, existing rooms, source PNGs, and the named volume. Do not reset data to make verification pass.
- Confirm the repository app's pre-verification running/stopped state and preserve it; it was launched on port 33000 before discovery. Coordinate restarts if active user work is present. Do not disturb unrelated services or captured rooms.
- No new dependencies, migrations, image batches/uploads, destructive operations, external writes, production deployment, commits, pushes, or scope expansion without their explicit gates.
- Passing selectors, CSS strings, or screenshots that were not visually inspected cannot substitute for actual visual acceptance.

## Expected source and test areas

- `tests/e2e/browser-contract.js`, `tests/e2e/run-browser-contract.sh`, and `tests/compose/smoke.ts`.
- Focused tests and narrow source corrections revealed by this slice's credible regressions.
- Current `design/` guidance and operator guidance only where needed to explain affected assets/compatibility.
- This item's verification evidence and annotation-to-screenshot matrix.

These paths are navigation hints. Do not use final verification as permission for unrelated cleanup.

## Acceptance and checks

- Acceptance: every annotation 0001-0013 maps to a correction and visual evidence. Inspect landing, all five how-to steps, lobby, writing, Ready, late-join/waiting, reveal, and shared terminal mascot on phone and desktop.
- Acceptance: check 320px, representative phone/desktop sizes, 200% zoom, 1/2/12-note reveals, 500-character/unbroken text, and no horizontal overflow. Assert actual reveal centering and asset loading.
- Acceptance: test normal/reduced motion and transition interruption by authoritative replay/deletion/reconnect updates; verify no delayed focus, early disclosure, stale editor, duplicated command, or lost draft. Late join has no invented personal flight.
- Acceptance: twelve avatar variants agree across clients and attribution; remove/rejoin, disconnected ready authors, reload/replay, legacy records, and restart retain intended identity without recoloring survivors or changing expiry rules.
- Acceptance: keyboard order, phase focus, modal focus/return, dialog scrolling, readable Owner stamp, image semantics, contrast, and persistent mute pass.
- Acceptance: production assets serve successfully through Compose. App-only restart preserves room, draft, credentials, and avatar metadata; reveal and disposable-room deletion still work. Named volume and unrelated rooms remain intact.
- Acceptance: obtain explicit final user visual approval and both review verdicts, separate from automated results.
- Check: all common checks from the index.
- Check: `npm run test:e2e` with the extended matrix, plus recorded manual visual/zoom evidence where appropriate.
- Check: `CEDULJICA_PORT=33000 docker compose config`.
- Check: `CEDULJICA_PORT=33000 docker compose up --build --wait -d`.
- Check: `curl --fail http://127.0.0.1:33000/health`.
- Check: `CEDULJICA_PORT=33000 COMPOSE_BASE_URL=http://127.0.0.1:33000 npm run test:compose`.
- Check: new asset HTTP responses and preserved volume. Restore initial runtime state; only stop a session-owned stack with volume-preserving `docker compose down`, never `down -v`.
- Check: `uv run spec/scripts/manage-spec-item.py --root . validate --operational` and changed Markdown/path checks.

## Review gate

Run one focused T02 review over integrated identity, compatibility, room presentation, privacy, animation, and system evidence. Then run one independent final contract-quality review covering R01-R11, every acceptance criterion, exclusions, decisions, all annotation IDs, T01 evidence, and user visual approvals. Reviewers use the credible-harm blocker standard without scope expansion. Rerun an affected gate at most twice after targeted corrections; then stop for user direction. All UI/SVG corrections return to `twin-astra`.

## Attempt log

### 2026-09-25: final integrated attempt in progress

- Clean start `7434679c7af4a55863996e3ffa2bce2fa49d4724`; directly assigned twin-astra, no implementation delegation or source/UI corrections.
- Extended existing browser contract and Compose smoke; 48 tests, lint/typecheck/build, isolated browser matrix and packaged restart/asset checks pass. Complete commands, corrected test failures, 39 screenshot paths/annotation mapping and runtime evidence are consolidated in [verification.md](../verification.md).
- Native 200% actual browser-menu check, final user visual approval, focused T02 review and independent final contract-quality review remain pending. Progress unchanged; zero review reruns.
- Runtime was initially healthy on actual port3000, not historical33000. User approved preserving port3000 and rebuilding/restarting. User independently removed/stopped the stack while isolated tests ran, then confirmed retaining its volume. Pre-rebuild fingerprint failed; a non-fail-fast shell continued approved up and this was immediately disclosed. Parent/user reconfirmed continuation after retained volume verification. Fresh baseline/synthetic smoke are proven, original pre-user-stop data contents are not. No volume reset, .env edit, unknown-room deletion or unrelated service change occurred.
- App now healthy/running on3000 with retained named volume. User is performing manual zoom; do not disturb their runtime/fixture. See parent verification for exact container/timestamps and approved boundaries.

### 2026-09-25: focused T02 review received

- Independent read-only regular twin `gm-260925-1219-T02-review-e4b8` returned Focused PASS, no blocking findings; zero corrective reruns. Parent relayed the actual host-delivered review, not a separate file. Coverage and inspected/reused checks recorded in [verification.md](../verification.md).
- Reviewer accepted the explicitly limited pre-user-stop data-continuity evidence; did not infer native zoom, final human approval or whole-item completion.
- Current 02.02 remains unchecked. Await actual user native 200% results and final visual approval before dispatching the separate independent final whole-contract review. No runtime changes while the user inspects; no terminal/lifecycle/Git actions.

### 2026-09-25: user manual outcome and final visuals approved

- Parent relayed the user's direct response to the native browser-menu 200% checklist and final screenshot/live visual request, verbatim: "works great, i aproove the final visuals".
- Record successful user-reported manual checklist outcome and explicit final visual approval, separate from automated geometry. Browser/version, window dimensions and a native-zoom screenshot were not supplied; no agent-observed native zoom or individual instrumented step results are claimed. Full checklist scope and limits are in [verification.md](../verification.md).
- Focused T02 PASS remains valid, zero corrective reruns. Current 02.02 remains unchecked pending the separate independent final whole-contract review. Ready for parent to dispatch that read-only gate; no runtime, lifecycle or Git actions taken.

### 2026-09-25: final whole-contract review and implementation completion

- Fresh independent read-only regular twin `gm-260925-1219-final-review-f6a1` returned Final contract-quality PASS, no blocking or non-blocking findings, zero corrective reruns. Parent relayed the actual host result, no separate file. Complete boundary, all R01-R11/13 annotations, source/tests/provenance, representative captures, human approvals and proportionate checks were covered; exact executed/reused checks and uncertainty are consolidated in [verification.md](../verification.md).
- Final reviewer accepted the explicitly user-reported native 200% outcome without inventing browser/dimension/capture details, and the retained-volume plus synthetic-restart evidence without claiming unavailable original-room fingerprints. Runtime health was reused; no additional live-runtime action occurred.
- All scoped/common/browser/Compose checks, focused T02 review, independent final review and mandatory human visual approval pass. Complete only 02.02 and T02/final plan gates; advance Current once to complete. Earlier completed packets and original attempt history remain intact.
- Owned 02.02 paths: `tests/e2e/browser-contract.js`, `tests/compose/smoke.ts`, this packet, `implementation/index.md`, `plan.md`, and new `verification.md`. No product source changes were required in this slice. Exact screenshot prefix `.playwright-cli/02-02-1790346352202-` maps all 13 annotations; 39 ignored synthetic captures retained.
- Lifecycle remains planned. Capability-check helper/archive and run non-mutating preflight, then request explicit terminal approval before creating outcome or invoking archive. No Dream, staging, commit, push or runtime changes are authorized here.

### 2026-09-25: terminal approval

- Dedicated helper archive capability and non-mutating preflight passed. Parent directly reconciled all final gates, complete progress, planned manifest and absent outcome/archive destination, then explicitly authorized outcome creation and helper archival for this item only.
- Approved terminal disposition is completed; use only the helper for the same-ID archive move and managed manifest/index updates. No runtime, wiki, Dream, staging, commit or push permission is included. Terminal control proof follows from actual helper output and direct manifest/index/filesystem inspection, not from this authorization alone.

## Completion and handoff

Record all checks, screenshot mappings, approvals, review verdicts, runtime/volume preservation, and residual uncertainty in verification evidence. Mark 02.02 and T02 complete and set the index Current to complete only after all final gates pass. Do not create an outcome or archive without the separate explicit completion approval. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either; no automatic commit, push, deployment, or lifecycle mutation.
