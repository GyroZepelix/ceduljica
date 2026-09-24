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

No attempts recorded.

## Completion and handoff

On success, record changed paths, all command results, manual evidence, focused and final review verdicts, and residual uncertainty. Mark T03 and Final verification complete in the plan, check off this packet, and set `Current: complete` only after every gate passes. Stop for explicit completion approval before any terminal lifecycle action. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
