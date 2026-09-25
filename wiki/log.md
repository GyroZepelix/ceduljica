# Wiki Log

Curated append-only timeline of durable wiki maintenance events. This is not a codebase changelog, commit log, or session transcript.

Use this shape for new entries:

- Heading: `## [YYYY-MM-DD] <kind> | <short title>`.
- Trigger: why the wiki was updated.
- Inputs: source paths, commit ranges, specs, verification, outcomes, URLs, or raw files used as evidence.
- Wiki pages changed: wiki files changed.
- Verification: checks or source verification.
- Notes: gaps, conflicts, stale areas, or exceptions.

## [2026-09-24] install | repo wiki template

- Trigger: user requested installation from `https://git.dgjalic.com/dgjalic/repo-wiki-template`.
- Inputs: protocol version 2.2.1/schema-2 payload from `https://git.dgjalic.com/dgjalic/repo-wiki-template/install/template/`.
- Wiki pages changed: `wiki/AGENTS.md`, `wiki/index.md`, `wiki/log.md`, `wiki/state.md`, `wiki/raw/README.md`.
- Verification: required files and managed regions exist; existing files were preserved or merged; protocol validation result was recorded (`uv run spec/scripts/manage-spec-item.py --root . validate --operational` => valid=true count=0; `validate --all` => valid=true count=0).
- Notes: installed payload may also create or merge root and spec files; initial codebase ingest is still needed.

## [2026-09-24] dream | authoritative room core

- Trigger: `/dream` run after Gamemaster checkpoint `260924-1909-fun-sticky-note-rooms/02.01`.
- Inputs: `src/domain/room-service.ts`, `src/db/sqlite-room-store.ts`, `src/server/http-server.ts`, `tests/domain/`, `tests/integration/`, and the completed 02.01 implementation packet.
- Wiki pages changed: `wiki/architecture/room-core.md`, `wiki/index.md`, this maintenance log, one immutable Dream episode plus its catalog record, and the matching per-spec checkpoint ledger.
- Verification: source and implementation evidence were re-read; memory safety, catalog/ledger identity, links, append-only preservation, and whitespace checks passed.
- Notes: the final responsive client and Docker Compose deployment remain pending in later slices; no observation was added.

## [2026-09-24] dream | responsive real-time client boundary

- Trigger: `/dream` run after Gamemaster checkpoint `260924-1909-fun-sticky-note-rooms/02.02`.
- Inputs: `src/client/`, `src/server/http-server.ts`, `src/domain/types.ts`, `src/domain/room-service.ts`, `tests/client/`, `tests/integration/`, and the completed 02.02 implementation packet.
- Wiki pages changed: `wiki/architecture/room-core.md`, this maintenance log, `wiki/dreams/2026-09-24-2332-gamemaster-checkpoint-260924-1909-fun-sticky-note-rooms-02-02.md`, `wiki/dreams/episodes.jsonl`, and `wiki/dreams/by-spec/260924-1909-fun-sticky-note-rooms.md`.
- Verification: implementation evidence and current source were re-read; memory safety, catalog/ledger identity, relative links, prior-history preservation, and whitespace checks passed.
- Notes: Compose packaging and final system verification remain in 03.01; the reconnect countdown may display a small client/server clock-skew offset; no observation was added.

## [2026-09-25] implement | packaged self-hosted workflow

- Trigger: verified Current `03.01` added the Docker Compose operating boundary and complete browser/packaged-system checks.
- Inputs: `Dockerfile`, `compose.yaml`, `.env.example`, `README.md`, `tests/e2e/`, `tests/compose/`, and `spec/archive/260924-1909-fun-sticky-note-rooms/implementation/03-01-compose-system-verification.md`.
- Wiki pages changed: `wiki/architecture/room-core.md` and this maintenance log.
- Verification: clean Node checks and browser E2E passed; Compose built the Node 26 image, reached health, passed native SQLite restart/persistence/privacy/deletion smoke, stopped without `-v`, and retained the named data volume.
- Notes: the architecture remains intentionally single-process; production HTTPS and WebSocket forwarding are operator responsibilities.

## [2026-09-25] dream | stable avatars and round-aware presentation

- Trigger: authorized Dream after Gamemaster checkpoint `260925-1219-ceduljica-annotation-driven-visual-fixes/02.01`.
- Inputs: tested 02.01 working tree after `b06f913f219fb96ef96d883f6c7ad159240901f3`; `src/domain/avatar-slots.ts`, `src/domain/room-service.ts`, `src/domain/types.ts`, `src/client/RoomScreen.tsx`, `src/client/NoteFlight.tsx`, focused avatar/compatibility/transition tests, and the completed 02.01 packet.
- Wiki pages changed: `wiki/architecture/room-core.md`, this log, `wiki/dreams/2026-09-25-1554-gamemaster-checkpoint-260925-1219-ceduljica-annotation-driven-visual-fixes-02-01.md`, `wiki/dreams/episodes.jsonl`, and `wiki/dreams/by-spec/260925-1219-ceduljica-annotation-driven-visual-fixes.md`.
- Verification: source-supported guidance and its exact ledger review blocks checked; memory safety, catalog/frontmatter identity, relative links, append-only history and non-wiki/index preservation checks performed.
- Notes: final visual/Compose acceptance, native 200% zoom and scheduled reviews remain pending in 02.02. Runtime-port observations and harness failures stay episodic. No observations, new dynamic pages, pointer/index routes, or ingest/checkpoint state were added.
