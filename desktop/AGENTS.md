# Desktop Agent Guidelines

## Scope

These guidelines apply **only** to `desktop/`.
Do not change files outside `desktop/` unless explicitly requested.

## Project Structure (follow this layout)

- `src/index.ts`: Electron main process entrypoint.
- `src/preload.ts`: preload bridge between main and renderer.
- `src/renderer.ts`: renderer process bootstrap code.
- `src/index.html` and `src/index.css`: renderer UI shell assets.
- `forge.config.ts`: Electron Forge packaging and publishing setup.
- `webpack.*.ts`: Electron Webpack build pipeline configuration.

Keep new/refactored code in the same layer where responsibility already exists.

## Refactoring Principles

1. Prefer small, isolated changes over broad rewrites.
2. Preserve public behavior unless a change is explicitly requested.
3. Keep backward compatibility for desktop startup, preload behavior, and packaging flow.
4. Reuse existing desktop modules/configuration before introducing new abstractions.
5. Avoid silent fallbacks: surface explicit, meaningful errors.

## TypeScript Best Practices

1. Use explicit types for public APIs, IPC payloads, and config-facing helpers.
2. Do not introduce new `any`; prefer precise unions, generics, and narrowing.
3. Keep null/undefined handling explicit and consistent with `strictNullChecks`.
4. Prefer immutable patterns (`readonly`, copy/update) where practical.
5. Keep naming and file organization consistent with existing desktop patterns.

## Electron Best Practices

1. Keep privileged logic in main/preload, not in renderer code.
2. Minimize the preload surface and expose only required capabilities.
3. Keep packaging/build concerns in Forge/Webpack config files, not in runtime modules.
4. Preserve process boundaries and avoid leaking Node-only APIs to renderer unless explicitly required.
5. Keep startup and shutdown behavior deterministic and observable.

## Shared Contracts (`/shared/contracts`)

`/shared/contracts` is the cross-layer contract source of truth.
Any desktop refactor touching cross-layer payloads must remain aligned with those contracts.

### Contract typing policy

- Use **`type` as the default** for shared contracts (current project direction).
- Use `interface` only when a contract is genuinely extension-oriented and the reason is explicit in the change.

When desktop code uses shared domain payloads, import from `/shared/contracts/index.ts` rather than redefining types.

## Validation, Security, and Errors

1. Validate external inputs at process boundaries (IPC, environment, filesystem interactions).
2. Do not expose secrets, tokens, or sensitive local paths in renderer output or logs.
3. Keep authentication/authorization expectations coherent with backend/frontend integration contracts.
4. Show clear, actionable error states instead of silent failures.

## Quality Gates

On each task ask me if you want to run the following commands to verify that your changes are safe and complete.

Run from `desktop/`:

1. `npm run lint`
2. `npm run package`

Refactoring is considered complete only when these commands pass.
