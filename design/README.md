# Ceduljica visual contract

Status: original direction approved on 2026-09-24; shared artwork foundation updated and visually approved on 2026-09-25. The canonical follow-up plan governs its changed artwork, panels, avatars and layouts. Older SVG mockups remain prior composition references, not binding targets for those changed treatments. See [production artwork and provenance](./production-artwork.md) for the implemented 01.01 foundation and exact approved generation prompts.

Ceduljica's revised **Playful Plaza** direction is an original, high-energy microgame party: saturated blocks, ink-heavy outlines, comic bursts, skewed cards, punchy type, and a small cast of sticker-like plaza characters. It borrows no characters, icons, layouts, sounds, screenshots, or trade dress from Nintendo or any other game. The folded-corner sticky mascot, sticker cast, burst language, wordmark, and scenes in this package are original references created for Ceduljica.

## Artifact map

| Artifact | Purpose |
| --- | --- |
| [`style-tile.svg`](./style-tile.svg) | Color, type, spacing, controls, note cards, focus, status, and elevation. |
| [`original-reference-sheet.svg`](./original-reference-sheet.svg) | Original Peel mascot poses, Dot/Zip/Loop sticker cast, comic motifs, illustration rules, and mood references. |
| [`desktop-key-screens.svg`](./desktop-key-screens.svg) | Eight 1440 x 900 desktop frames: entry, how-to, lobby, writing, ready, waiting/disconnect, 1-note reveal, and dense 12-note reveal/delete. |
| [`mobile-key-screens.svg`](./mobile-key-screens.svg) | The same key states in eight 390 x 844 phone frames. |
| [`concepts/ceduljica-motif-world-concept.png`](./concepts/ceduljica-motif-world-concept.png) | Codex-generated original mood reference for a motif-filled plaza, perimeter character energy, and calm central writing surface. |
| [`concepts/ceduljica-responsive-room-concept.png`](./concepts/ceduljica-responsive-room-concept.png) | Early responsive mood exploration; useful framing cues only, not the target screen layout. |
| [`concepts/ceduljica-character-source-sheet.png`](./concepts/ceduljica-character-source-sheet.png) | Peel/Dot/Zip/Loop pose and expression source derived from the selected target. |
| [`concepts/ceduljica-pattern-framing-source-sheet.png`](./concepts/ceduljica-pattern-framing-source-sheet.png) | Original plaza scene, repeat, bunting, action-mark, paper-frame, and ribbon source material. |
| [`concepts/ceduljica-desktop-flow-concept.png`](./concepts/ceduljica-desktop-flow-concept.png) | Four-screen desktop composition source derived from the selected target. |
| [`concepts/ceduljica-mobile-flow-concept.png`](./concepts/ceduljica-mobile-flow-concept.png) | Four-screen mobile composition source derived from the selected target. |
| [`concepts/README.md`](./concepts/README.md) | Exact generation prompts, settings, approved reference input, and reuse boundary. |

SVGs are implementation references, not production markup and not pixel-perfect copy targets. UI copy shown here is approved-direction copy but may receive minor grammar edits without changing behavior.

### Selected target and generated-source boundary

[`ceduljica-motif-world-concept.png`](./concepts/ceduljica-motif-world-concept.png) is the selected style-and-feeling target. Its original Ceduljica energy, shape language, framing, color behavior, motif treatment, plaza atmosphere, and geometric character feel are binding direction. The authored rules below operationalize those qualities so the later app does not merely cite the image or copy generated pixels.

The four source sheets derived from that target help resolve poses, pattern density, paper framing, and responsive composition. No clipboard screenshot or Nintendo material was uploaded; the selected Ceduljica PNG was the only referenced image. The SVG sheets retain unchanged color, typography, accessibility and state references; changed presentation is specified by the canonical follow-up plan and the current production guidance.

Binding translation from the selected target:

- Build a sunny open-air plaza around the interface: warm paving, coral architecture shapes, sky openings, organic green edge forms, loose bunting, and floating paper accents. These stay abstract and original rather than becoming a literal scenic illustration on every screen.
- Keep Peel/Dot/Zip/Loop at the perimeter, never behind user copy or over controls. Use one or two pals per key view, with deep-purple outlines, rosy cheek accents, tiny limbs, elastic poses, and one readable expression.
- Supporting panels use warm opaque tints. Writing and the frozen ready preview use a standalone yellow sticky note on the canvas, not an enclosing white card. The level, multiline textarea shares the yellow surface; its quiet inset outline and visible focus ring identify the editable region.
- Use one subtle repeated sticky-note outline as warm paved atmosphere, restrained recognizable arch/plant scenery at wide-screen edges, and the integrated multicolor header ribbon as the energetic accent. Preserve generous sky/canvas gaps so the scene breathes.
- Decorative backdrops may use very soft tonal depth; controls, cards, notes, forms, and dialogs use deterministic flat fills and sharp contrast.

Generated details that are explicitly **not approved product UI** include every generated word or logo-like mark, navigation rail, rich-text/image control, heart-as-feature, multiple-note composer, envelope-like mascot variant, decorative slogan, moustache-like expression, paperclip, and any implied feature outside the canonical plan. Never adopt generated copy or controls. Production may use original concept-inspired redraws and separately approved action-specific generated illustrations; do not use poor sheet crops or baked-in source-sheet backgrounds. Room identity is not inferred from illustration characters. See the production registry for actual asset usage.

## Foundation

### Brand character

- **Fast energy, calm decisions:** burst shapes and saturated accents frame the page, while writing, warnings, and confirmations remain quiet and legible.
- **Tactile, not skeuomorphic:** flat paper shapes, 3 px ink outlines, hard offset shadows, sticker rims, tiny skews, and folded corners; no realistic paper textures.
- **Playful, not copied:** lively microgame pacing is an emotional reference only. Every character, silhouette, motif, layout, icon, wordmark, and sound must remain Ceduljica-original.
- **One visual punch per view:** a burst title, skewed hero card, or sticker character may lead a screen; never stack all three over the writing surface.
- **Shared state is obvious:** every phase has a heading, an icon plus label, and a short next-action sentence.

### Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#FFF6DD` | Warm page background. |
| `surface` | `#FFF9E9` | Warm opaque cards, modals, inputs; entry cards also use pale yellow `#FFF1CA` and green `#EEF3DA`. |
| `ink` | `#24154A` | Primary text and bold outlines. |
| `ink-muted` | `#5C5178` | Secondary text; never critical state alone. |
| `sky` | `#27B2F6` | Primary action fill with ink text. |
| `sky-soft` | `#D9F3FF` | Informational panels and owner marker background. |
| `coral` | `#FF5263` | Comic burst and reveal emphasis with ink text. |
| `coral-soft` | `#FFE0E3` | Disconnect and warning panels. |
| `yellow` | `#FFD53D` | Sticky notes and ready highlight with ink text. |
| `mint` | `#43D7A1` | Success accent with ink text. |
| `lavender` | `#A98BFF` | Optional note and sticker variation. |
| `plaza-peach` | `#FFB09E` | Decorative architecture and warm depth only. |
| `leaf` | `#2F8B68` | Decorative organic perimeter shapes only. |
| `focus` | `#6B35E8` | 3 px focus ring plus 2 px warm-canvas offset. |
| `danger` | `#C42F45` | Destructive text and outline; never the only warning cue. |

All body text uses `ink` on `canvas`, `surface`, or the light accent fills. White text is not placed on the accent colors. Production must verify WCAG contrast with the actual font rendering.

### Typography

Use the dependency-free stack `ui-rounded, "Arial Rounded MT Bold", "Avenir Next Rounded", system-ui, sans-serif` for headings and controls, and `system-ui, sans-serif` for body and note text. If a web font is later proposed, it needs dependency approval and must not delay first paint.

- Display: 52/52 desktop, 36/38 mobile, 900 weight, up to `-0.03em` tracking; a slight -1° to +1° title skew is allowed.
- Screen title: 36/40 desktop, 29/34 mobile, 900 weight. Short celebratory headings may use uppercase burst lettering; instructions stay sentence case.
- Card title: 22/28, 800 weight.
- Body: 16/24; never below 15 px in interactive views.
- Small/supporting: 14/20; labels stay sentence case.
- Note body: 18/27 desktop and 17/25 mobile, regular weight.

### Spacing and geometry

Use a 4 px base with preferred steps `4, 8, 12, 16, 24, 32, 48, 64`. Interactive targets are at least 44 x 44 px; primary controls are 52 px high. Content width is 1180 px desktop and the viewport minus 32 px on mobile.

- Small chip radius: 12 px.
- Input/button radius: 16 px.
- Card/modal radius: 24 px.
- Shared revealed-note silhouette: clipped top-right 26 px corner with an ink crease and warm underside, never a white triangle protruding past a rectangle.
- Outline: 3 px `ink`; selected or emphasized: 4 px. Small interior dividers remain 1–2 px.
- Shadow: hard `5px 6px 0 rgba(36,21,74,.20)` for controls/cards and `0 12px 30px rgba(36,21,74,.18)` for modal layers. Shadows never encode state.
- Skew: hero cards and note stickers may rotate from -1.5° to +1.5°; forms, multiline editors, tables, dialogs, and destructive controls remain level.
- Bursts: one 10–16 ray comic burst may sit behind a phase heading or reveal count. It is decorative, never animated continuously, never behind body copy, and hidden from assistive technology.

### Original motif field and plaza framing

The page canvas uses exactly one recognizable folded-note outline repeated on a 112 x 96 px cell, in muted warm ink at 15% opacity. No mixed dots, diagonal stripes, generic blobs or competing character repeat remains.

At wide sizes, restrained original coral arch/steps and potted foliage frame the far edges. Scenery is hidden below 720 px, giving controls and copy priority. The background is pointer-transparent and contains no user content.

- The motif sits only on page canvas. Warm forms, note editors, status panels, modals, sticky notes, and destructive confirmations remain opaque and pattern-free.
- A screen may use one original plaza ribbon: rounded color tabs, loose triangular bunting on a curved ink cord, or a broad wavy stack of sky/coral/mint shapes. Do not use black/yellow hazard stripes, garlic-like repeats, or a copied reference-site border, composition, logo, or layout.
- Standard motion drifts the motif horizontally by one repeat cell over 48 seconds with linear timing. It has no parallax, does not react to pointer movement, pauses when the page is hidden, and never moves foreground controls.
- `prefers-reduced-motion: reduce` makes the same motif completely static. A user never loses information or state feedback when drift is disabled.
- At 200% zoom and on mobile, the repeat may scale up or reduce in density; it must not produce moire, obscure the focus ring, or create horizontal page scrolling.

## Components and states

### Header

The punchy wordmark and simple original vector folded-note face sit left. A continuous sky/coral/yellow/mint ribbon is attached to the opaque warm-tinted full-width header, not floating over the page repeat. Room views show phase as text (`Lobby`, `Writing`, `Reveal`) in a compact slanted tab. Right-side controls are **How to use** where relevant and a 44 px sound toggle labelled `Sound on` or `Muted`; its icon is accompanied by visible text at desktop and an accessible name plus pressed state on compact mobile.

### Buttons

- Primary: saturated sky fill, 3 px ink outline, verb-first label, hard 5 px bottom-right offset, and optional tiny burst ticks outside the control.
- Secondary: warm cream fill, ink outline.
- Quiet: underlined ink text or borderless control, still 44 px tall.
- Danger: warm cream fill with danger outline, trash icon, and explicit label such as `Delete room`.
- Disabled: neutral fill, lower contrast, lock or explanatory adjacent text, and `disabled` semantics. Do not communicate disabled state through opacity alone.
- Focus: 3 px purple outside ring with a 2 px canvas gap, visible on every surface.

### Inputs

Labels stay above controls. Help and error text reserve space below. Invalid state uses a warning icon, danger outline, and specific text. The note editor displays `312 / 500` below the textarea; at the limit it reads `500 / 500 — limit reached`. Nicknames are described as display names, never credentials.

### Participant rows and ownership

Twelve server-assigned character/color variants use the four original Peel/Dot/Zip/Loop silhouettes in three palettes, with small expression variations. `src/client/Avatar.tsx` is an original vector redraw, not generated or uploaded artwork. Each retained participant reserves its room-local slot across reload, reconnect, restart and replay, including disconnected ready authors. Only actual membership removal frees a slot. Participant rows and revealed author footers render the same assigned variant; names remain the accessible identity. Every person row retains a name and textual status:

- Owner: a legible double-outline stamp with explicit `Owner` text, repeated by revealed owner controls.
- Writing: pencil icon and `Writing`.
- Ready: check icon and `Ready`.
- Waiting: hourglass icon and `Next round`.
- Disconnected in grace: broken-link icon, `Reconnecting · 42s`, and a visible countdown.
- Current user: appended text `(you)`.

Icons and color supplement, rather than replace, these labels. Owner-only controls sit in an `Owner controls` region.

### Character placement

- Peel is the leading guide: a yellow folded-corner square with deep-purple outline, rosy cheeks, simple face, tiny round-ended limbs, and no costume or prop.
- Dot is a sky circle, Zip a mint triangle, and Loop a lavender rounded square. Their silhouette determines identity; accessories, hair, clothing, moustaches, and envelope folds are not part of the production cast.
- Standard views use at most two pals; the current hero/terminal mascot is 160 x 144 px on desktop and 130 x 117 px on phones. Action-specific how-to scenes have a reserved 3:2 region, at most 420 px wide. They may lean in from a perimeter, jump beside a phase heading, or celebrate outside a board.
- Character pose never carries meaning alone. Status text, icons, and semantic state remain complete when characters are hidden.
- At 320 px width or 200% zoom, secondary pals disappear before content is compressed.

### Sticky notes and reveal density

Reveal notes use yellow, mint, sky-soft, coral-soft, and lavender in a deterministic repeating sequence, always with ink text and the writer name in a footer. Color has no semantic meaning. The surrounding board may be exuberant, but user-written note surfaces never use burst patterns behind text.

- 1 note: centered, maximum 520 px wide; height expands without a maximum.
- 2–4 notes: 2-column desktop; single column mobile.
- 5–8 notes: 3-column desktop; single column mobile.
- 9–12 notes: 4-column desktop with compact 16 px gaps; single column mobile, with a sticky progress label (`12 notes · note 1 of 12`) and normal page scrolling.
- Cards expand vertically for content up to 500 characters. Never shrink note text to fit. Long unbroken strings wrap with `overflow-wrap: anywhere`.
- Board order is stable and deterministic. Rotations may vary from -1 to +1 degree only when motion is allowed; reduced motion uses zero rotation.

## Screen contract and packet-required states

The two mockup sheets use matching numbered frames and the following responsive behavior.

| # | Screen | Required state and behavior |
| --- | --- | --- |
| 1 | Landing / create / join | `Create a room` is the primary action. Join accepts the shared room link/code and nickname. `How to use` is available before entry. Mobile stacks cards and keeps the primary action first. |
| 2 | How-to modal | Five steps: create, invite, write, ready, reveal. It has a title, progress text, Back/Next controls, close button, and original illustration. Focus is trapped; Escape closes; closing returns focus to the opener. On mobile it is a bottom sheet below 600 px height only if all controls remain reachable, otherwise a full-screen dialog. |
| 3 | Lobby | Participant count and minimum (`2 of 12`) are text. Owner can copy the invite and Begin. Begin is disabled below 2 eligible people with a written reason. Guests see `Waiting for the owner to begin`. Remove is available only to the owner and has an accessible name naming the guest. |
| 4 | Writing | One 500-character multiline note, progress count (`2 of 4 ready`), Ready, and the participant list. Other note bodies never appear. On mobile, phase/status comes before editor and Ready remains in document flow (not over the keyboard). |
| 5 | Ready | Frozen own-note preview, `Ready` heading and check icon, `Edit note` while reveal has not started, and `Waiting for 2 more`. If final readiness wins, the server phase replaces this view with Reveal. |
| 6 | Waiting / disconnect | Late joiners see `You're in the next round` and may observe current status without an editor. A disconnected active person appears as `Reconnecting · Ns`; a notice explains unfinished work is removed after grace while ready notes stay eligible. No progress is inferred from color. |
| 7 | Reveal, 1 note | Centered note with visible writer. Confetti shapes are decorative and hidden from assistive technology. Owner gets `Start a new round`; guests get `Waiting for owner`. |
| 8 | Reveal, 12 notes / deletion | Dense desktop grid and mobile scroll pattern. Owner controls remain outside the note grid. `Delete room` opens a confirmation dialog naming the consequence: room and every note are permanently deleted. Confirmation buttons are `Keep room` and `Delete room permanently`; focus returns to the trigger if cancelled. |

### Terminal and recovery messages

The application phase can also replace a room screen with a plain, focused status card:

- Removed: `You've been removed from this room.` Action: `Return home`.
- Room deleted: `This room was deleted by its owner. Its notes are gone.` Action: `Return home`.
- Room expired: `This room expired after 24 hours without activity.` Action: `Create a new room`.
- Connection lost locally: banner `Connection lost — trying again` with a spinner plus text. After reconnection: polite announcement `Back online. Room status updated.`
- Ownership transfer: banner and live-region message `Maya is now the owner.` The new owner also receives `You are now the owner` near Owner controls.

## Motion contract

Motion is punchy, quick, and interruptible: one snap, stamp, or settle per action. The low-contrast canvas drift is the sole continuous decorative motion; every foreground effect is finite and no animation delays a server-confirmed state.

| Moment | Standard motion | Reduced motion |
| --- | --- | --- |
| Canvas motif | 48 s linear drift by one repeat cell; canvas only, no parallax. | Identical motif held at a fixed position. |
| Button press | 90 ms down/return, 2 px translation. | Instant fill change. |
| Card entry | 160 ms snap from 10 px rise and 1° tilt, 25 ms stagger, max 6 items staggered. | Instant appearance with zero tilt or stagger. |
| Ready | 220 ms scale `1 → 1.07 → .98 → 1`; check stamps in once. | Instant check and text update. |
| New writing round | A blank decorative yellow note flies down once in 480 ms. The actual editor and controls are immediately available. | Instant editor, no flight overlay. |
| Reveal | Authoritative board and heading focus switch immediately; a blank decorative note flies out in 480 ms while board cards enter in 360 ms. | Instant board switch; heading focus communicates phase. |
| Modal | 150 ms fade/scale from 96% with one overshoot. | Instant open/close. |
| Disconnect countdown | No pulsing. Numeral updates once per second. | Same static numeral update. |

Flights are keyed to the existing opaque round ID, never room version. Initial restoration, same-round reconnect, Ready/Edit, snapshot churn and rejection do not replay effects. Late joiners have no personal note to fly out. Blank flights are aria-hidden, pointer-transparent and behind content; they never retain draft text or interactive editors. A 520 ms fallback removes them without animation events, and a new round, room change, disconnect, reduced-motion preference or unmount interrupts them. A reconnect that missed reveal resets the editor using the new round identity.

Use `prefers-reduced-motion: reduce` to freeze the canvas motif and remove transforms, parallax, confetti movement, auto-scrolling, and stagger. Preserve a visible focus move or polite status announcement so the state transition remains understandable.

## Sound contract

Sound is optional enhancement only. Proposed original sound language:

- `tap`: 45–70 ms soft wooden tick for explicit button activation.
- `ready`: 140–180 ms two-note paper/pluck ascent.
- `reveal`: 450–650 ms three-note warm chime, played once when entering reveal.

No sound plays before a user gesture. Default is on after gesture, subject to browser policy. The header toggle persists locally across rooms and reads `Sound on` / `Muted`; toggling to muted stops currently playing audio. There is no loop, countdown tick, disconnect alarm, or removal sound. Every sounded event has simultaneous visual/text feedback.

## Accessibility contract

- Semantic landmarks, headings in order, real buttons, labelled inputs, lists for participants, and a dialog element or equivalent modal semantics.
- Keyboard order follows the visual flow. No positive `tabindex`. Escape closes non-destructive dialogs. Enter must not accidentally submit a multiline note.
- Focus moves to each phase heading after a server-confirmed phase change. Joining errors focus the error summary. Modal and delete-confirm focus are contained and restored.
- Live regions: polite for participant/status/ownership updates; assertive only for room deletion or removal. Never announce the disconnect countdown every second; announce initial disconnect and grace expiry.
- State uses icon + plain-language text + shape, not color, motion, or sound alone.
- Minimum 44 x 44 px targets, 200% zoom support, and usable 320 px-wide layout without horizontal page scrolling. The dense reveal scrolls vertically on mobile.
- The repeating canvas motif, plaza ribbons, decorative mascot, and confetti are hidden from assistive technology. Meaningful illustrations receive concise alt text, for example `A smiling sticky note placing a note on a shared board.`
- Note and nickname content is rendered as text. User content is never inserted into illustration, icon, or status markup.
- Persistent mute is exposed as a pressed toggle and remains operable by keyboard and screen reader.

## Responsive handoff

- Breakpoints are content-driven: one-column entry and participant layouts below 720 px; two-column room layout from 720 px; reveal grid changes at approximately 720, 960, and 1180 px.
- Lobby/writing retain a main region and 300 px participant rail. Writing has no outer enclosing panel. Reveal uses one complete-width track and an open, centered board; it reserves no empty participant column. Mobile keeps phase progress above the editor and participants in a collapsible `People (4)` disclosure after the primary action.
- Dialogs fit within `min(680px, viewport - 32px)` and scroll internally only when viewport height requires it.
- Respect safe-area insets on mobile. Nothing essential is fixed to the viewport except optional status banners, which must not cover controls.
- Do not reorder controls with CSS in a way that diverges from DOM and keyboard order.

## Approval checklist

The follow-up approver must inspect built-browser evidence (not only old SVG sheets) and confirm:

- [ ] The revised high-energy Playful Plaza mood, bold outline system, skewed panels, comic bursts, punchy type, original Peel/Dot/Zip/Loop sticker cast, low-contrast repeating motif, and original plaza framing feel suitable.
- [ ] Entry and the five-step how-to are understandable.
- [ ] Lobby, writing, ready, waiting, disconnect, reveal, owner, mute, and delete states are clear without color alone.
- [ ] Desktop and mobile layouts, including 1 and 12 notes, are a sound implementation target.
- [ ] Motion, reduced-motion, sound, keyboard, focus, and live-region guidance are acceptable.

Explicit human approval of the actual follow-up artwork/shared presentation is required before dependent room integration. The 2026-09-24 approval does not substitute for this gate.
