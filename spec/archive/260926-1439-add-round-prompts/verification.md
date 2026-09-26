# Verification: Add round prompts

Work item: `260926-1439-add-round-prompts`
Date: 2026-09-26

## Environment

- macOS repository workspace at starting `HEAD e4af084eeb146fbd8eaddf02b2865ce85f767b09`
- Node.js `v26.8.2`, npm `11.19.1`, Python `3.14.6`, uv `0.11.24`
- Direct mode, medium assurance

## Commands and checks

| Check | Result | Evidence |
| --- | --- | --- |
| Focused authoritative tests | Passed | `npx vitest run --config vitest.config.ts tests/domain/room-service.test.ts tests/integration/realtime-protocol.test.ts tests/integration/sqlite-persistence.test.ts` - 3 files, 23 tests. |
| Focused client tests | Passed | `npx vitest run --config vitest.config.ts tests/client/room-screen.test.tsx tests/client/room-transitions.test.tsx` - 2 files, 15 tests. |
| Lint | Passed | `npm run lint`. |
| Type checking | Passed | `npm run typecheck`. |
| Full unit/integration suite | Passed | `npm test` - 11 files, 54 tests. |
| Production build | Passed | `npm run build` - server TypeScript and Vite client output built successfully. |
| Browser contract | Passed | `npm run test:e2e` - two-participant prompt entry, trimmed begin/replay transport, active/ready/waiting/reveal visibility, blank next input, privacy/lifecycle regression coverage, responsive screenshots, and no browser errors. |
| Responsive visual inspection | Passed with limitation | Inspected generated lobby, writing, ready, waiting, and reveal screenshots at desktop and 320 px. Separate CSS 2x zoom inspection of lobby/writing at a 1280 px viewport had no horizontal overflow; native browser-menu zoom was unavailable in the headless harness. |
| Diff hygiene | Passed | `git diff --check`. |
| Item validation | Passed | `uv run spec/scripts/manage-spec-item.py --root . validate --item "260926-1439-add-round-prompts"` returned `valid: true`. |

## Requirement coverage

| Requirement | Evidence | Status |
| --- | --- | --- |
| R01 | Labelled optional owner prompt controls in lobby and reveal; component and browser tests cover begin/replay. | Passed |
| R02 | Shared 200-character constant and authoritative parser trim input and reject CR/LF, non-strings, and oversized normalized values. | Passed |
| R03 | `begin`/`replay` carry prompt into a newly created round; client sends trimmed values and replay input mounts blank. | Passed |
| R04 | `roundPrompt` is projected to every participant and rendered in active, ready, waiting, and reveal states with blank suppression. | Passed |
| R05 | Optional protocol fields default to empty; stored legacy rounds use an empty projection fallback; restart tests pass with SQLite schema v1 unchanged. | Passed |
| R06 | Entry and display reuse opaque warm paper, ink outlines, folded corners, existing tokens, type, spacing, and focus behavior. | Passed |
| R07 | Semantic labels/region, plain React text rendering, 320 px and zoom inspection, privacy assertions, and lifecycle/focus/motion/sound regression suites pass. | Passed |

## Review findings

- T01 focused review: PASS, no blocking findings, zero correction retries.
- Final contract-quality review: PASS, no blocking findings. One initial provider connection failure required redispatch; the completed gate needed zero correction re-reviews.
- Non-blocking: `PromptComposer` uses static IDs safely because lobby and reveal are mutually exclusive; scope IDs if those controls ever coexist.
- Non-blocking: authoritative validation checks the 200-character maximum after trimming, matching the confirmed normalization contract.

## Failures and skipped checks

- The first browser-contract invocation ran against stale existing `dist` output and could not find the new field. `npm run build` refreshed the production output; the browser contract then passed twice, including in the final combined check.
- An existing client transition assertion initially expected no textbox in reveal. It was narrowed to the stale private note editor because reveal now intentionally contains the next-round prompt input; focused and full suites then passed.
- The first final-review provider failed with a connection error and produced no verdict. A fresh independent contract-quality reviewer completed with PASS.
- No checks were skipped. Native browser-menu zoom was unavailable; the disclosed CSS 2x zoom inspection and 320 px reflow evidence cover the responsive risk without claiming native automation.

## Unverified areas

- No known functional uncertainty. Native browser-menu-specific 200% rendering was not directly automated in the headless environment.
