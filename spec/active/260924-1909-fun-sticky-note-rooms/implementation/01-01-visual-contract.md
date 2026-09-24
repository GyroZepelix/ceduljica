# Slice 01.01: Produce and approve the visual contract

Plan: `../plan.md`
Implementation index: `./index.md`
Segment: `T01 - Establish and approve the Ceduljica visual contract`
Assurance: medium - design approval is a binding dependency for the responsive application and accessibility treatment.
Review required now: one focused design-contract review and explicit user approval.

## Outcome

A compact design package defines Ceduljica's approved Playful Plaza look across desktop and mobile before any application source implementation begins.

## Why this slice exists now

The user explicitly requires the basic design and look to be reviewed before coding. This slice converts the confirmed direction into observable artifacts and prevents application implementation from guessing visual behavior.

## Relevant context

- R01: cover landing/create/join, the 4 or 5 step how-to modal, lobby, writing/ready/waiting, and reveal.
- R10: use warm white, sky blue, coral, yellow, and mint; rounded flat UI; an original sticky-note mascot; and soft springy motion.
- R11: define keyboard, focus, reduced-motion, non-color state cues, and optional sound with persistent mute.
- Generated imagery may support the concept but must not copy Nintendo assets or be treated as exact production UI text.
- Parent-plan sections to load on conflict or uncertainty: Requirements, Design, Acceptance criteria, Risks and blockers.

## Constraints and non-goals

- Do not create application source, add dependencies, or scaffold the runtime in this slice.
- Confirm the prompt and destination before invoking Codex image generation.
- Keep concepts original and use Wii-era character only as broad mood inspiration.
- Do not add unconfirmed screens, accounts, history, rich content, or localization.

## Expected source and test areas

- `design/README.md`
- `design/` style tile and original reference imagery
- `design/` desktop and mobile key-screen mockups
- `spec/active/260924-1909-fun-sticky-note-rooms/plan.md` approval record after confirmation

These paths are navigation hints. Inspect other files only when this slice or a credible repository rule requires it.

## Acceptance and checks

- Acceptance: the design package documents palette, typography, spacing, shapes, buttons, inputs, note cards, mascot treatment, motion, reduced motion, sound, and mute behavior.
- Acceptance: desktop and mobile mockups cover landing/create/join plus how-to, lobby, writing and ready, waiting, and reveal with representative 1-note and dense 12-note layouts.
- Acceptance: room ownership, readiness, waiting, disconnect, mute, and destructive-delete states have understandable visual treatment that does not rely on color alone.
- Acceptance: the user explicitly approves the package before `02.01` becomes Current.
- Check: `git diff --check -- design/ spec/active/260924-1909-fun-sticky-note-rooms`
- Check: inspect every documented required state against R01, R10, R11, and the Acceptance criteria.

## Review gate

Run one focused review over completeness, responsive consistency, originality, accessibility guidance, and alignment with Playful Plaza. Present the artifacts to the user and obtain explicit approval. Do not check off this slice or advance Current without that approval.

## Attempt log

### Attempt 1 - visual package ready; approval pending

- Starting boundary: `HEAD 1cec850d5876cdcb4f3cfc7b8678c8c36673533e`; the pre-existing `spec/index.md` modification and untracked item directory are workflow-owned planning artifacts.
- Authored: `design/README.md`, `design/style-tile.svg`, `design/original-reference-sheet.svg`, `design/desktop-key-screens.svg`, and `design/mobile-key-screens.svg`.
- Coverage: the package maps R01, R10, R11, and T01 acceptance across desktop and mobile entry, five-step how-to, lobby, writing, ready, waiting/disconnect, 1-note reveal, dense 12-note reveal, ownership, mute, destructive deletion, motion, sound, reduced motion, keyboard, focus, and non-color cues.
- Checks: SVG XML/title/description, local links, and required contract markers passed; all four SVGs rendered with `rsvg-convert`; design-only/no-runtime-scaffold inspection passed; `git diff --check -- design/ spec/active/260924-1909-fun-sticky-note-rooms` passed; `uv run spec/scripts/manage-spec-item.py --root . validate --operational` passed with no warnings. An initial invalid validation invocation combined mutually exclusive modes; the corrected documented command passed.
- Focused design-contract review: PASS with no blockers and zero retries. Non-blocking T02 reminders are to preserve an accessible name and pressed state for the compact mobile mute toggle and verify accent/text contrast with final font rendering.
- Blocker: explicit user visual approval is still required. This slice, T01 Progress, the index checkbox, and `Current: 01.01` remain unchanged.
- Exact next action: inspect the package from `design/README.md` and explicitly approve it or identify the visual corrections required.

### Attempt 2 - high-energy visual revision ready; approval pending

- User feedback: revise the existing package toward an original high-energy microgame mood with bold outlines, comic bursts, skewed panels, playful typography, saturated colors, and sticker-like original characters while preserving the no-copy boundary.
- Revision: all five design artifacts now define and show the higher-energy treatment. The palette is more saturated; outlines, offset shadows, burst motifs, panel skews, punchier type, and the original Peel/Dot/Zip/Loop sticker cast were added while form, writing, and destructive-dialog surfaces remain level and legible.
- Originality boundary: no Nintendo character, logo, trade dress, screenshot, copied UI, sound, or asset was introduced. No image-generation or other external write was invoked.
- Checks: SVG XML/title/description, local links, required states, revised visual markers, and originality markers passed; all four SVGs rendered with `rsvg-convert`; documented text, danger, and focus color pairings passed the stated contrast thresholds; the design-only/no-runtime-scaffold check passed; `git diff --check -- design/ spec/active/260924-1909-fun-sticky-note-rooms` passed; operational spec validation passed with no warnings.
- Focused design-contract review: PASS with no blockers and zero corrective retries. One earlier review dispatch failed from a provider connection error and produced no verdict; the replacement reviewer passed. Non-blocking T02 reminders remain to provide the compact mobile sound toggle's accessible name/pressed state and verify final rendered-font contrast.
- Blocker: explicit user approval of the revised visual package is still required. The slice checkbox, T01 Progress, and `Current: 01.01` remain unchanged.
- Exact next action: inspect the revised package beginning at `design/README.md` and explicitly approve it or identify further visual corrections.

### Attempt 3 - motif framing and generated concepts ready for iterative review

- User feedback: add an original low-contrast repeating Ceduljica motif, gentle canvas scrolling, stronger playful framing, and a static reduced-motion fallback; use the supplied local third-party image only to understand the general effect and do not copy or upload it.
- Revision: all SVG artifacts now show an original <=10% opacity motif made from folded-note corners, Dot/Zip/Loop geometry, checks, and sparkles. Desktop and mobile use original rounded multicolor plaza ribbons. `design/README.md` specifies a 48-second canvas-only drift, opaque calm content surfaces, and a completely static reduced-motion fallback.
- No-copy boundary: the package explicitly rejects the reference image's logo, character, garlic motif, exact hazard border, layout, and trade dress. The clipboard reference was inspected locally but was not copied into the repository or uploaded.
- Approved external write: after separate confirmation of both exact text-only prompts and paths, Codex generated `design/concepts/ceduljica-motif-world-concept.png` and `design/concepts/ceduljica-responsive-room-concept.png` at 1536 x 1024. No reference image was uploaded.
- Integration: `design/README.md` accepts only original atmosphere, perimeter-character energy, calm central paper, broad color movement, bold framing, offsets, and responsive scale cues. It explicitly rejects every generated word or logo-like mark, navigation rail, rich-text/image control, heart, multiple-note composer, envelope-like mascot, slogan, and implied out-of-plan feature; deterministic SVGs remain authoritative.
- Checks: SVG structure, <=10% motif opacity, local links, motion/static fallback, contrast, and no-copy markers passed; all SVGs rendered at 1200 px; both PNG signatures and 1536 x 1024 dimensions passed; design-only/no-runtime-scaffold inspection, `git diff --check`, and operational spec validation passed.
- Review state: a focused review of the motif-only revision passed before the latest workflow direction. The user subsequently directed that no reviewer agent run for intermediate visual iterations; the one required focused review over the final complete package is therefore deferred until the user declares the design final and ready for the gate. A generated-concept review dispatch was told to stop and will not be treated as the final gate.
- Blocker: iterative user review, final focused review, and explicit final visual approval are still pending. The slice checkbox, T01 Progress, and `Current: 01.01` remain unchanged.
- Exact next action: the user reviews the current package and either requests another visual correction or declares it final and ready for the required focused design-contract review.

### Attempt 4 - selected concept operationalized; iterative review pending

- User feedback: treat `design/concepts/ceduljica-motif-world-concept.png` as the target and carry its original style and feeling through the complete contract and later app rather than merely citing it.
- Authored revision: `design/README.md` now makes the selected target binding and operationalizes its sunny plaza depth, warm paving, coral architecture, sky openings, organic green edges, bunting, broad color movement, deep-purple outlines, hard offsets, calm central paper, perimeter characters, rosy accents, and small-scale cast rules. Generated extras and pixels remain non-authoritative. The style tile, original reference sheet, desktop mockups, and mobile mockups were updated with motif-world patterning, plaza scenery/framing, bunting, and perimeter Peel/Dot/Zip/Loop treatments while retaining opaque level forms.
- Approved source batch: exact prompts, settings, reference input, and paths were recorded before invocation in `design/concepts/README.md`. The only uploaded reference was the user-selected Ceduljica motif-world PNG. No clipboard or Nintendo material was uploaded.
- Generated source material: `ceduljica-character-source-sheet.png`, `ceduljica-pattern-framing-source-sheet.png`, `ceduljica-desktop-flow-concept.png`, and `ceduljica-mobile-flow-concept.png` are present. The initial parallel call returned no tool results; inspection showed only the pattern sheet had completed. After explicit retry authorization, each absent output was retried once with the same approved request.
- Generation limitation: the character and mobile retries produced the requested 1536 x 1024 PNGs. The desktop retry produced a valid 1774 x 887 PNG despite the approved 1536 x 1024 setting. It is retained and explicitly labelled non-authoritative mood source, not dimensional evidence; no repeated retry was attempted.
- Checks: four authored SVGs parse and render; all local links resolve; all six PNGs have valid signatures and recorded dimensions; selected-target translation and generated-source rejection markers passed; functional contrast, design-only/no-runtime-scaffold inspection, `git diff --check`, and operational spec validation passed.
- Review state: per current user workflow direction, no reviewer agent was used for this intermediate iteration. The required final focused design-contract review remains deferred until the user declares the design final.
- Blocker: iterative user review, the final focused review, and explicit visual approval remain pending. Progress and `Current: 01.01` remain unchanged.
- Exact next action: the user inspects the selected-target translation and source sheets, then requests a correction or declares the design final and ready for the required focused review.

### Attempt 5 - substantive SVG fidelity revision ready for user review

- User feedback after provider abort: the PNG concepts are approved as target, but the authored SVGs still did not visually resemble them enough. Preserve all prior evidence and substantially re-author the four SVG contract files around the selected original family.
- Fidelity revision: all four authored SVGs now use layered sunny-plaza scenes rather than a flat patterned canvas alone. The compositions add sky depth, abstract coral arches, organic leaf-green perimeter mounds, warm curved paving, low-density motif ground, loose bunting/ribbons, taped opaque paper title surfaces, deep-purple outlines, hard offsets, and larger perimeter Peel/Dot/Zip/Loop poses.
- Functional preservation: writing, participant, status, modal, and destructive-confirmation surfaces remain opaque, level, and readable. All eight required desktop/mobile states and 1-note/12-note density examples remain represented. Generated pixels, architecture, and screen layouts were not traced.
- Source preservation: all six valid PNG concepts, their prompt registry, and every prior attempt entry were retained unchanged. No successful image generation was repeated and no further external write was used.
- Checks: all four SVGs parse with title/description and original motif definitions; desktop/mobile files contain scenic-depth and perimeter-character primitives; every local artifact link resolves; all SVGs render cleanly at 1200 px; functional contrast thresholds, design-only/no-runtime-scaffold inspection, `git diff --check`, and operational spec validation pass.
- Review state: no reviewer agent ran, per the user-only iteration direction. The required final focused design-contract review remains deferred until the user declares this package final.
- Blocker: user visual review, final focused review, and explicit approval remain pending. Progress and `Current: 01.01` remain unchanged.
- Exact next action: the user reviews the re-authored SVGs against the selected concept target and either requests a specific correction or declares the package final for the required focused review.

### Attempt 6 - Astra artifacts integrated; final approval pending

- Delegated visual pass: the parent-run Astra designer changed only `design/style-tile.svg`, `design/original-reference-sheet.svg`, `design/desktop-key-screens.svg`, and `design/mobile-key-screens.svg`. The repaired files use approved original scenery and silhouette-cropped pals, layered ribbons, warm hard shadows, calm authored paper surfaces, and deterministic state/accessibility text.
- Compatibility and provenance: SVG 1.1-compatible shadows/clipping render in Inkscape 1.4.4. Display streams omit only nonvisual caBX metadata; exact approved source PNG bytes and SHA-256 records remain embedded in SVG metadata. Project-local concept PNGs were unchanged.
- User gate signal: the user inspected the repaired SVGs in Inkscape, said they are much better and fine for now, and authorized the one required final focused review.
- Checks: XML/title/description, unique IDs, every href/xlink fragment/local/data reference, embedded display PNG decoding, and exact metadata-to-source PNG byte/hash matching passed. Both responsive sheets contain all eight required screens and state copy. Markdown path/fence and untracked-file text hygiene passed. Inkscape 1.4.4 and librsvg each rendered all four SVGs at 1200 px. `git diff --check`, design-only/no-runtime-scaffold inspection, and operational spec validation passed with no warnings.
- Final focused design-contract review: PASS with no blockers and zero corrective retries. Coverage included completeness, desktop/mobile consistency, originality/no-copy boundary, approved PNG-to-SVG fidelity, accessibility, reduced motion, sound/mute guidance, and required states.
- Non-blocking: the mood-only desktop generated PNG remains 1774 x 887 rather than the requested 1536 x 1024 and is excluded from dimensional evidence. T02 must implement an explicit accessible name/pressed state for compact mute and verify final-font contrast.
- Blocker: explicit final user visual approval is still required. The slice checkbox, T01 Progress, and `Current: 01.01` remain unchanged.
- Exact next action: obtain explicit final approval of the current visual artifacts; only then record T01/01.01 complete and advance Current once to `02.01`.

### Attempt 7 - explicitly approved and completed

- Approval: the user explicitly approved the final Ceduljica visual package on 2026-09-24 and authorized completing T01/01.01 and advancing Current exactly once.
- Delivered paths: `design/README.md`, `design/style-tile.svg`, `design/original-reference-sheet.svg`, `design/desktop-key-screens.svg`, `design/mobile-key-screens.svg`, and the generated concept/source registry under `design/concepts/`.
- Acceptance: style, original references, desktop/mobile required states, 1-note and 12-note reveal density, ownership/readiness/waiting/reconnect/mute/delete treatments, motion/reduced-motion, sound, keyboard, focus, and non-color guidance are present and approved.
- Verification: exact embedded-source provenance, XML/reference/state coverage, untracked-aware text/path hygiene, Inkscape and librsvg rendering, `git diff --check`, design-only scope, and operational spec validation passed.
- Review: the required final focused design-contract review passed with no blockers and zero corrective retries.
- Residual: the documented 1774 x 887 mood-only desktop generated PNG is not dimensional evidence. T02 retains the explicit compact-mute accessible-name/pressed-state and final-font contrast implementation reminders.
- Progress: T01 and slice 01.01 are complete; `Current` advanced exactly once to `02.01`. No T02 source work began.
- Exact next action: begin a fresh Implement assignment for `02.01` only after its separate dependency approval gate; do not infer dependency approval from this visual approval.

## Completion and handoff

On success, record generated and authored paths, review findings, explicit approval, residual uncertainty, and `02.01` as the exact next slice. Update T01 Progress, the index checkbox, and Current only after all gate evidence passes. Stop for a user-controlled Git checkpoint and suggest Dream without invoking either.
