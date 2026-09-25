# Slice 03.01: Package and prove the Compose system

Plan: `../plan.md`
Implementation index: `./index.md`
Segment: `T03 - Package and verify the complete self-hosted system`
Assurance: medium - packaged restart, lifecycle, and multi-client behavior must prove the integrated application meets the confirmed contract.
Review required now: one focused final-segment review plus one final contract-quality review over whole-plan acceptance.

## Outcome

Ceduljica starts through documented Docker Compose commands, persists unexpired rooms across an ordinary app restart, and passes the complete automated and manual acceptance suite.

## Why this slice exists now

Compose packaging, restart recovery, browser-to-browser scenarios, dense responsive fixtures, and whole-plan review depend on the complete integrated application from T02. Their setup and remediation cost form a natural final verification session.

## Relevant context

- R08 and R09 define retention, restart, cleanup, and self-hosted deployment.
- Every requirement and acceptance criterion in the parent plan is in scope for final verification.
- Compose uses one `app` service and a persistent SQLite volume. Production HTTPS termination remains an operator responsibility documented in the README.
- Use injected or fake time for 60-second and 24-hour checks; do not introduce wall-clock waits.
- Parent-plan sections to load on conflict or uncertainty: Requirements, Out of scope, Acceptance criteria, Verification plan, Risks and blockers.

## Constraints and non-goals

- Obtain approval before adding deployment or browser-test dependencies, running schema migrations, or performing external or destructive actions.
- Do not deploy to production, configure public DNS, issue certificates, publish images, commit, or push.
- Do not add replicas, managed services, telemetry, history, accounts, or unsupported browsers.
- `docker compose down` must not delete the persistent volume during verification.

## Expected source and test areas

- `Dockerfile`
- `compose.yaml`
- `.dockerignore`
- `.env.example`
- `README.md`
- browser end-to-end tests
- Compose smoke and restart test scripts
- all implementation and test areas affected by final corrections

These paths are navigation hints. Inspect other source or tests only when this slice or a credible regression path requires it.

## Acceptance and checks

- Acceptance: a new operator can configure and start the app from the README and reach a healthy service at the documented local URL.
- Acceptance: two independent browser contexts complete create, join, begin, write, ready/edit, reveal, replay, and delete through Compose.
- Acceptance: late join, 60-second reconnect and expiry logic, owner transfer, removal, capacity, and privacy checks pass with deterministic time.
- Acceptance: restarting the `app` service without deleting the volume preserves an unexpired room and allows participant resynchronization.
- Acceptance: manual deletion and deterministic 24-hour inactivity cleanup remove room and note records.
- Acceptance: phone and desktop browser checks cover all screens and representative 1-note and dense 12-note reveal boards.
- Acceptance: every parent-plan acceptance criterion has passing automated or recorded manual evidence.
- Check: `npm ci`
- Check: `npm run lint`
- Check: `npm run typecheck`
- Check: `npm test`
- Check: `npm run build`
- Check: `npm run test:e2e`
- Check: `docker compose config`
- Check: `docker compose up --build -d`
- Check: `curl --fail http://localhost:3000/health`
- Check: `npm run test:compose`
- Check: `docker compose down`
- Check: `git diff --check`

## Review gate

Run one focused review over T03 packaging, restart, cleanup, browser evidence, responsive behavior, and operator documentation. Then run one independent final contract-quality review over all plan requirements, exclusions, decisions, acceptance criteria, and verification evidence. Reviewers use the credible-harm blocker standard and do not expand scope. Rerun an affected gate at most twice after targeted corrections; after two failed retries, stop for a user decision.

## Attempt log

### Attempt 1 - completed

- Starting boundary: clean `HEAD a13002da2c1251d5a4425fbdccbae3c1db0b8ace`; all later modified and untracked paths belong to Current, with no staged or unrelated changes.
- Approval gates: the parent approved dev-only `@playwright/cli@0.1.19` with its Playwright `1.63.0-alpha-2026-08-31` toolchain for the bounded browser harness. After native `better-sqlite3@13.0.3` compilation failed in the slim builder, the parent approved the pinned full Node 26 Bookworm build image `sha256:2aaae6d91f99fee84cfc92da9b52c22a185752d247746052bbc3f961e44478c6`; the final runtime remains slim. No runtime package, service, schema migration, or production action was added.
- Delivered paths: `Dockerfile`, `compose.yaml`, `.dockerignore`, `.env.example`, `README.md`, `tests/e2e/`, `tests/compose/`, `package.json`, `package-lock.json`, `eslint.config.js`, the startup-expiry case in `tests/integration/sqlite-persistence.test.ts`, and durable deployment guidance in `wiki/architecture/room-core.md` plus `wiki/log.md`.
- Packaging and operations: one non-root Node process serves the built client and authoritative service, stores SQLite at `/data/ceduljica.sqlite` on the named `ceduljica-data` volume, and exposes startup-gated health checks. The README documents configuration, routine restart/rebuild/down without data loss, explicit destructive volume cleanup, single-process limits, bearer-link privacy, and operator-supplied HTTPS/WebSocket proxying.
- Browser acceptance: independent desktop and phone contexts completed create, join, begin, multiline write, Ready/Edit, final reveal, late join, reload/reconnect, replay, and deletion. Negative endpoint and DOM assertions covered pre-reveal privacy; fixtures covered 13th-member rejection, one-note desktop and dense 12-note phone reveal, focus transitions and modal return, persistent mute, reduced motion, and horizontal overflow.
- Deterministic lifecycle acceptance: existing fake-clock domain/protocol checks cover reconnect grace, deadline outcomes, owner transfer and former-owner return, owner removal, ready-note retention, automatic reveal, meaningful activity, and 24-hour expiry. A new restart-startup case proves rooms and session rows that expire while offline are removed.
- Packaged evidence: `docker compose config` passed. `docker compose up --build -d` built the native SQLite module and started the image; an unrelated healthy project already owned host port 3000, so the documented `CEDULJICA_PORT=33000` override was used. `curl --fail http://127.0.0.1:33000/health` passed. `COMPOSE_BASE_URL=http://127.0.0.1:33000 npm run test:compose` passed two-client privacy, app-only restart, volume-backed room/draft recovery, resynchronization, reveal, deletion notification, and session cleanup. `docker compose down` ran without `-v`, and `fun-postit_ceduljica-data` remained present.
- Full checks: `npm ci` passed with 202 packages and zero audit vulnerabilities; `npm run lint`, `npm run typecheck`, `npm test` (7 files, 29 tests), `npm run build`, `npm run test:e2e`, `git diff --check`, explicit changed-text newline/trailing-whitespace and Markdown-fence checks, and operational spec validation passed.
- Recoveries: two initial Docker registry metadata attempts timed out before source execution; a later build reached the registry. The first slim build then failed because native compilation lacked Python/toolchain and was corrected through the approved full build stage. The first Compose start could not bind the unrelated occupied port 3000 and passed after using the documented host-port override. The first contract-review dispatch produced no verdict because its configured model was unavailable; a fresh independent reviewer completed the gate.
- Focused T03 review: PASS with no blocking or non-blocking findings. Review correction retries: zero.
- Independent final contract-quality review: PASS over R01-R12, all exclusions, P001-P007, every acceptance criterion, committed T01/T02 evidence, and Current T03 artifacts. Review correction retries: zero; one infrastructure-only redispatch occurred before any verdict.
- Residual uncertainty: the displayed reconnect countdown can drift slightly with client/server clock skew while server enforcement remains authoritative. Native screen-reader speech and live TLS termination were not exercised; DOM semantics/focus and the documented operator HTTPS boundary satisfy the planned evidence and exclusions. Default host port 3000 was not available on this machine, but the supported override path passed end to end.
- Progress: T03 and final whole-plan verification are complete; Current is `complete`. Lifecycle remains `planned` pending explicit outcome/archive approval.
- Exact next action: run completion preflight, present the proposed `outcome.md`, and obtain explicit terminal archive approval; do not stage, commit, push, deploy, publish, delete the preserved volume, or invoke Dream.

## Completion and handoff

On success, record changed paths, all command results, manual evidence, focused and final review verdicts, and residual uncertainty. Mark T03 and Final verification complete in the plan, check off this packet, and set `Current: complete` only after every gate passes. Stop for explicit completion approval before any terminal lifecycle action. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
