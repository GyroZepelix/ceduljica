# Dream learnings: 260925-1219-ceduljica-annotation-driven-visual-fixes

Work item: `260925-1219-ceduljica-annotation-driven-visual-fixes`

> Historical snapshot: this ledger records what Dream retained at each Gamemaster checkpoint. Current source, plans, verification, outcomes, and current dynamic destinations remain authoritative.

<!-- dream-checkpoints:start -->

## Gamemaster checkpoint: 260925-1219-ceduljica-annotation-driven-visual-fixes/01.01

Date: 2026-09-25
Dream log: [2026-09-25-1522-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-01-01.md](../2026-09-25-1522-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-01-01.md)
Outcome: episodic recall only

## Gamemaster checkpoint: 260925-1219-ceduljica-annotation-driven-visual-fixes/02.01

Date: 2026-09-25
Dream log: [2026-09-25-1554-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-02-01.md](../2026-09-25-1554-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-02-01.md)
Outcome: retained learning

### Stable avatar identity and compatible persistence

- **Exact written text:**
  > - `RoomService` allocates one room-local `avatarSlot` from 0-11 for each retained participant and projects it in participant summaries and revealed author records. Disconnected participants still reserve their slots, including eligible ready authors; only actual membership removal frees a slot. Never derive identity from client list order or participant-ID hashing.
  > - `normalizeAvatarSlots` runs before service projection or membership mutation, including startup/deadline processing. It orders legacy participants by joined order and ID, reserves valid existing assignments first, and deterministically fills missing, duplicate, or invalid slots. Normalize before removal or join so legacy survivors cannot be recolored.
  > - Avatar metadata is additive inside the schema-v1 serialized room aggregate and uses the existing transactional room/session save. Normalization alone does not change notes, credentials, membership, owner, phase, room version, meaningful activity, or expiry. Test legacy aggregates and ordinary close/reopen persistence when changing this boundary; a TypeScript cast does not populate missing stored fields.
  >
  > Sources: `src/domain/avatar-slots.ts`, `src/domain/room-service.ts`, `src/domain/types.ts`, `tests/domain/avatar-slots.test.ts`, `tests/integration/avatar-compatibility.test.ts`. These presentation additions describe the tested 02.01 working tree after `b06f913f219fb96ef96d883f6c7ad159240901f3`, not final packaged or visual acceptance.
- **Destination and classification:** `wiki/architecture/room-core.md` - `Topic-specific dynamic knowledge`
- **Session evidence or selection reason:** RoomService and avatar-slots source plus domain and SQLite compatibility tests establish 12 distinct slots, survivor stability, disconnected ready attribution, deterministic legacy normalization, and unchanged activity/expiry during metadata-only saves.
- **Expected future benefit:** Prevent recoloring retained participants or altering stored room lifecycle data when changing avatar allocation, projections, or compatibility handling.
- **Why this tier:** Repository-specific, stable persistence and identity invariants affect repeated room-service work; the existing room-core page is the narrowest route. This is supported source guidance, not a tentative observation.

### Round-aware editor and decorative flight boundary

- **Exact written text:**
  > - The projection exposes the existing persisted opaque `roundId`. Key writing editors and new-round presentation to room/round identity, not room version: reconnect can miss reveal, while replay during writing remains the same round. Round-keyed unmount cancels pending debounce and prevents a pending save-then-Ready chain from continuing into a later round; delayed draft echoes must not overwrite newer local typing.
  > - Phase or round changes move focus to the current heading immediately; Edit returns focus to the textarea. Modal content is portaled while the application root is inert, traps focus, restores the opener, and gives destructive confirmation a safe initial action.
  > - `NoteFlight` retains only presentation metadata and renders blank, aria-hidden, pointer-transparent paper behind content, never an old editor or private draft. CSS performs the 480 ms flight; React removes it independently after 520 ms and interrupts on newer phase/round/room, disconnect, reduced-motion preference, or unmount. Initial restoration, late join, same-round snapshot churn, and rejected commands must not manufacture stale exits or delay authoritative state, focus, or controls.
  > - Reduced motion omits flight overlays and freezes the canvas motif without depending on animation events. Optional synthesized sounds require an earlier user gesture, expose all state through simultaneous text and visuals, persist mute locally, and close the audio context when muted. The round-aware editor and flight boundary is covered by `tests/client/room-transitions.test.tsx`; complete visual and packaged acceptance is separate from these scoped tests.
- **Destination and classification:** `wiki/architecture/room-core.md` - `Topic-specific dynamic knowledge`
- **Session evidence or selection reason:** RoomScreen, NoteFlight and room-transitions tests prove existing round identity reuse, delayed-echo protection, stale Ready/debounce cancellation, immediate focus, content-free interruptible overlays and reduced motion. Focused built-browser checks exercised the integrated boundary.
- **Expected future benefit:** Prevent stale private editors, duplicate cross-round commands, replayed restoration effects, and animation-dependent authoritative state when changing room UI transitions.
- **Why this tier:** This replaces the obsolete CSS-only motion summary with supported client lifecycle responsibilities in the existing room-core topic, rather than promoting transient visual approval or runtime observations.

## Gamemaster checkpoint: 260925-1219-ceduljica-annotation-driven-visual-fixes/02.02

Date: 2026-09-25
Dream log: [2026-09-25-1654-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-02-02.md](../2026-09-25-1654-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-02-02.md)
Outcome: episodic recall only
