# Ceduljica production artwork

Current 01.01 implementation, 2026-09-25. The user approved the actual built-browser artwork/shared presentation: "I like these fixes." This approval is scoped to the shared foundation; reveal centering and standalone writing-note integration remain subsequent work, not approved completed room layout.

## Authored primitives

`src/client/Artwork.tsx` contains original vector redraws authored directly by the assigned `twin-astra` implementation agent. `Mascot` has welcoming and calm terminal poses; `NoteMark` keeps the small header face simple. Their clean, closed silhouettes and folded undersides replace the CSS face approximations. Plaza scenery uses a coral arch/steps and potted greenery, inspired by local inspection of the original concept world, not extracted sheet backgrounds. `styles.css` contains one low-contrast folded-note repeat and a contained shared note fold. No UI/SVG implementation was delegated.

Source inspiration: `design/concepts/ceduljica-motif-world-concept.png` and `design/concepts/ceduljica-character-source-sheet.png`, inspected locally only. All original concept PNG bytes are preserved. Scenery is decorative, pointer-transparent, kept at wide-screen edges and hidden below 720px. The single-note repeat scrolls one 112px cell over 48 seconds, pauses via document visibility, and is static for reduced motion. Supporting surfaces use opaque cream, pale yellow and pale green; editors and copy remain pattern-free.

## Generated how-to scenes

Tool/model: `codex_generate_image` / `gpt-image-2`. Date: 2026-09-25.

The user approved **"Approve five calls"**, relayed by Gamemaster before execution, for the exact prompts and destinations below. Requested and observed dimensions: 1536 x 1024, quality high. Explicit `referencedImagePaths: []` for every call: **no local reference files uploaded**. No annotations, participant content, credentials or screenshots were uploaded. Exactly five calls succeeded; no retry or extra call was made. Original generated RGBA PNGs are bundled without cropping or alteration; cream backing is supplied by the UI. Generated scene marks are decorative, never controls or authored interface text.

All destinations are repository-relative. `HowTo.tsx` imports the five PNGs through Vite, reserves a 3:2 image region, uses contain sizing and supplies action-specific alt text. Existing five-step text, navigation and modal focus behavior remain authored code. These illustrations explain actions, not persistent avatar assignment; the generated supporting cast does not assign identity to room participants.

### `src/client/assets/howto-create.png`

> Create an original Ceduljica instructional illustration, landscape 3:2. Flat vector-like sticker art, warm solid cream #FFF6DD background, deep purple #24154A rounded outlines, sunny yellow, sky blue, mint, coral and lavender accents. A cheerful yellow square sticky-note character with a clean top-right folded corner, oval eyes, rosy cheeks, open smile and tiny rounded arms and feet assembles a small empty plaza meeting space: placing a large blank yellow note upright on a simple low coral stand, with a small sky-blue circular friend arriving. Make the act of starting a new shared space immediately clear. Centered complete silhouettes, generous quiet margins, no cropped limbs, no panel border, no texture, no photorealism. No words, letters, numbers, logos, UI controls, screenshots or third-party characters.

### `src/client/assets/howto-invite.png`

> Create an original Ceduljica instructional illustration, landscape 3:2. Flat vector-like sticker art, warm solid cream #FFF6DD background, deep purple #24154A rounded outlines, sunny yellow, sky blue, mint, coral and lavender accents. A cheerful yellow square sticky-note character with a clean top-right folded corner, oval eyes, rosy cheeks, open smile and tiny rounded arms and feet passes a small blank invitation card to a sky-blue circular friend; a mint triangular friend and lavender rounded-square friend approach along a short curved dotted path. Make inviting friends to one private gathering immediately clear. Centered complete silhouettes, generous quiet margins, no cropped limbs, no panel border, no texture, no photorealism. No words, letters, numbers, logos, UI controls, screenshots or third-party characters.

### `src/client/assets/howto-write.png`

> Create an original Ceduljica instructional illustration, landscape 3:2. Flat vector-like sticker art, warm solid cream #FFF6DD background, deep purple #24154A rounded outlines, sunny yellow, sky blue, mint, coral and lavender accents. A cheerful yellow square sticky-note character with a clean top-right folded corner, oval eyes, rosy cheeks, focused smile and tiny rounded arms and feet holds an oversized coral pencil against one large blank yellow sticky note on a simple low desk. A small folded privacy screen at the side suggests quiet individual writing. The pencil and single note dominate; no other written notes. Centered complete silhouettes, generous quiet margins, no cropped limbs, no panel border, no texture, no photorealism. No words, letters, numbers, handwriting, logos, UI controls, screenshots or third-party characters.

### `src/client/assets/howto-ready.png`

> Create an original Ceduljica instructional illustration, landscape 3:2. Flat vector-like sticker art, warm solid cream #FFF6DD background, deep purple #24154A rounded outlines, sunny yellow, sky blue, mint, coral and lavender accents. A cheerful yellow square sticky-note character with a clean top-right folded corner, oval eyes, rosy cheeks, open smile and tiny rounded arms and feet places a large mint circular checkmark seal beside one face-down folded-corner note. The character raises its free hand to signal readiness; two small friends wait calmly nearby. Make finishing one's note and waiting for the group immediately clear. Centered complete silhouettes, generous quiet margins, no cropped limbs, no panel border, no texture, no photorealism. No words, letters, numbers, logos, UI controls, screenshots or third-party characters.

### `src/client/assets/howto-reveal.png`

> Create an original Ceduljica instructional illustration, landscape 3:2. Flat vector-like sticker art, warm solid cream #FFF6DD background, deep purple #24154A rounded outlines, sunny yellow, sky blue, mint, coral and lavender accents. Four cheerful original geometric friends, a yellow folded-corner sticky-note square, sky-blue circle, mint triangle and lavender rounded square, with oval eyes, rosy cheeks and tiny rounded arms and feet, celebrate around an open shared board of four separate blank colored sticky notes now facing everyone. Their raised hands and a few restrained coral celebration rays communicate a simultaneous group reveal. Keep each note distinct and blank. Centered complete silhouettes, generous quiet margins, no cropped limbs, no panel border, no texture, no photorealism. No words, letters, numbers, logos, UI controls, screenshots or third-party characters.

## Generated asset checksums

SHA256 of the unchanged generated PNG bytes:

| Scene | SHA256 |
| --- | --- |
| create | `6a2528b3f649fb8307ae87fd97f06b3c12da56cc611913943888c853c07cc42f` |
| invite | `8a6b496ef793b312ef6e4cd179b1e87a00acf7ea10979ca1ed75e62e223c8720` |
| write | `5e81d24d3ac7e9ebcd8f93b1af1499939433521081d734ee69191f1dcddf8a5e` |
| ready | `0fa65545d01c4a0dad4bba8c515dd06bd4bd2c2064e8825abcf78787088dec02` |
| reveal | `12a45eead84d03b9ad092ac91b90d8a8cebcaf7f9b396514fd35481e038c55c1` |

## Boundaries

The canonical follow-up plan governs changed artwork, single-note canvas, header, fold and warm panel treatments. Older SVG mockups are prior composition references, not pixel targets for changed panels, avatars or room layouts. Full standalone writing-note restructuring, persistent 12-variant participant identity, Owner stamp and reveal transitions/layout belong to subsequent work; this artwork foundation does not claim they are implemented. No backend, lifecycle, persistence or room-transition implementation is part of 01.01.
