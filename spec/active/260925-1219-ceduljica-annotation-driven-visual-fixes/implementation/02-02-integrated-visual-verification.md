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

No attempts recorded.

## Completion and handoff

Record all checks, screenshot mappings, approvals, review verdicts, runtime/volume preservation, and residual uncertainty in verification evidence. Mark 02.02 and T02 complete and set the index Current to complete only after all final gates pass. Do not create an outcome or archive without the separate explicit completion approval. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either; no automatic commit, push, deployment, or lifecycle mutation.
