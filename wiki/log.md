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
