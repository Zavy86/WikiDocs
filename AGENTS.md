# Wiki|Docs Agent Guidelines

Wiki|Docs is a lightweight, databaseless wiki designed for maximum portability and simplicity.

## Repository Overview

The dataset is stored as flat files in a directory driven by the `DATASETS` environment variable.

For the complete architecture, detailed API contracts, and sequence diagrams, refer to [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Monorepo Layout

```
/
├── shared/         # Cross-layer elements
│   └── contracts/  # Contracts definitions only
├── backend/        # NestJS — see backend/AGENTS.md
├── frontend/       # Angular — see frontend/AGENTS.md
├── desktop/        # Electron — see desktop/AGENTS.md
├── datasets/       # Sample datasets ignored by Git
└── environments/   # Environment configuration templates
```

Each subdirectory that contains a dedicated `AGENTS.md` supersedes these guidelines **within its own scope**.
These root guidelines apply to everything not covered by a subdirectory-level file.

## Language

All code, comments, commit messages, branch names, PR titles, and documentation must be written in **English**.

## Shared Contracts (`shared/contracts`)

`shared/contracts` is the **single source of truth** for cross-layer data shapes. Every layer (backend, frontend, desktop) must import from here instead of redefining shared contracts.

### Rules

1. **Never duplicate** a shared type in a layer-specific module. Import, do not redefine.
2. **`type` is the default** for all shared contracts, don't use `interface`.
3. **No runtime logic** in `shared/contracts` — pure contract definitions only.
4. Any change to a shared contract is a **breaking contract change**: update every consuming layer in the same PR.
5. Export everything through `shared/contracts/index.ts`; do not import from individual contract files directly.
6. If you no longer see any changes in the working tree, I likely made a safety commit while you were working.

## TypeScript Best Practices

1. Strict mode is assumed everywhere — respect `strictNullChecks`, `noImplicitAny`, etc.
2. Prefer explicit types on public API boundaries; avoid `any`.
3. Use `readonly` and immutable patterns where practical.
4. Prefer `type` over `interface` for data shapes (consistent with shared contract policy above).
5. Do not suppress type errors with casts or `@ts-ignore` without an explanatory comment.

## General Best Practices

1. **Scope discipline**: only modify files within the scope of the task. Do not touch unrelated layers.
2. **Small, safe changes**: prefer incremental refactoring to broad rewrites.
3. **No silent fallbacks**: surface explicit, meaningful errors rather than swallowing exceptions.
4. **Preserve public behavior** unless a change is explicitly requested.
5. **Consistency**: follow the patterns already established in the layer you are working in.

## Architecture Reference

Refer to `ARCHITECTURE.md` for:

- Dataset directory structure and file formats
- Full contract definitions and property lists for all domain objects
- Authentication, authorization and JSON Web Token implementation
- Document lifecycle (creation, update, soft-delete to trash)

## Agent skills

### Issue tracker
Issues live as local Markdown files under `.scratch/`. See `.agents/issue-tracker.md`.

### Triage labels
Using the defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. 
See `.agents/triage-labels.md`.

### Domain docs
Single-context layout (CONTEXT.md at repo root). See `.agents/domain.md`.
