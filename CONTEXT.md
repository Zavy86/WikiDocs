# Wiki|Docs Agents Context

Wiki|Docs is a lightweight, databaseless wiki designed for maximum portability and simplicity.

Data is stored as flat files and surfaced by several consumers (backend API, Angular frontend, Electron desktop client).

The codebase is organized into a small set of top-level contexts:

- backend/ — NestJS backend services and API surface
- frontend/ — Angular single-page application and client logic
- desktop/ — Electron wrapper and desktop-specific integrations
- shared/ — cross-layer utilities and `shared/contracts`
- datasets/ — sample datasets (ignored by Git)
- environments/ — environment configuration templates

## Key invariants and conventions

- Data storage: the dataset directory is driven by the `DATASETS` environment variable; code assumes file-backed datasets rather than a database.
- Shared contracts: `shared/contracts` is the single source of truth for cross-layer data shapes. Do not duplicate types between layers.
- ADRs: architecture decision records live under `docs/adr/` (system-wide) or `src/<context>/docs/adr/` for context-scoped decisions.
- Agent files: `docs/agents/` contains agent-facing configuration (issue tracker, domain rules, triage labels).

## Glossary

- dataset — the on-disk collection of wiki pages the engine serves (directory pointed at by `DATASETS`).
- document / page — a single wiki page within a dataset; stored as a file containing frontmatter + body.
- trash entry — a deleted document node retained in the dataset's trash.
- contract — a type definition in `shared/contracts` used across layers.
- artifact — build outputs (frontend bundles, desktop packages) — not part of the dataset.

## Where to look first

- `ARCHITECTURE.md` — full domain model and design rationale.
- `backend/` — server-side behaviour and domain logic.
- `frontend/` — client behaviour and UI contracts.
- `desktop/` — desktop integration and packaging.

## How agents should use this file

- Use `CONTEXT.md` as the primary glossary and structure map for the repo. When naming domain concepts in issues, tests, or ADRs, prefer terms from this file.
- If a concept you need is missing, create a note in `/domain-modeling` via `/grill-with-docs` rather than inventing new terminology in outputs.
