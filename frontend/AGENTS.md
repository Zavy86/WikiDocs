# Frontend Agent Guidelines

## Scope

These guidelines apply **only** to `frontend/`.
Do not change files outside `frontend/` unless explicitly requested.

## Project Structure (follow this layout)

- `src/main.ts`: app bootstrap.
- `src/app/app.ts`: root standalone component.
- `src/app/app.config.ts`: root providers and app-level configuration.
- `src/app/app.routes.ts`: routing configuration.
- `src/app/components/`: reusable UI components (e.g. sidebar).
- `src/app/pages/`: route-level page components.
- `src/styles.scss`: global styles.

Keep new/refactored code in the same layer where responsibility already exists.

## Refactoring Principles

1. Prefer small, isolated changes over broad rewrites.
2. Preserve public behavior unless a change is explicitly requested.
3. Keep backward compatibility for routes, component inputs/outputs, and expected UI flows.
4. Reuse existing components/config/routes before introducing new abstractions.
5. Avoid silent fallbacks: surface explicit, meaningful errors in UI and service flows.
6. Check if you need to update also the .md files with new documentation. 

## TypeScript Best Practices

1. Use explicit types for public component APIs and local frontend types.
2. Do not introduce new `any`; prefer precise unions, generics, and narrowing.
3. Keep null/undefined handling explicit and consistent with `strictNullChecks`.
4. Prefer immutable patterns (`readonly`, copy/update) where practical.
5. Keep naming and file organization consistent with existing frontend patterns.

## Angular Best Practices

1. Prefer standalone components and Angular 22 idioms already in use.
2. Keep page components focused on orchestration and presentation; move reusable UI behavior to components.
3. Keep routing concerns in `app.routes.ts`; avoid scattering route rules across unrelated files.
4. Use Angular dependency injection through constructors or `inject()` consistently with local patterns.
5. Avoid direct DOM manipulation when Angular template/data-binding patterns can solve the same requirement.

## Localization

1. All frontend-owned user-facing text must be defined in `src/app/localizations/*.yml`; do not add hardcoded UI text to
   templates or TypeScript.
2. Use the `localized` pipe in templates and `LocalizationService.getText()` for text produced in TypeScript.
3. Use semantic, lowercase, kebab-case key segments organized into feature namespaces.
4. Every localization key addition, change, rename, or removal must be applied to **every language catalog in the same
   change set**.
5. Every language must contain the exact same keys and named placeholders; placeholder defaults may be translated.
6. Run `make check` from the repository root after changing any localization catalog. Frontend-specific check remains
   available as `npm run check:localizations` from `frontend/`.

## Shared Contracts (`/shared/contracts`)

`/shared/contracts` is the cross-layer contract source of truth.
Any frontend refactor touching API payloads must remain aligned with those contracts.

### Contract typing policy

- Use **`type` as the default** for shared contracts (current project direction).
- Use `interface` only when a contract is genuinely extension-oriented and the reason is explicit in the change.

Frontend application code must import from local types in `src/app/types`.
Local frontend types must stay structurally aligned with `/shared/contracts/index.ts`.

## Validation, Security, and Errors

1. Keep client-side validation coherent with backend validation rules and API expectations.
2. Do not expose secrets, tokens, or sensitive backend details in rendered UI or logs.
3. Keep authentication and authorization behavior consistent with backend contract expectations.
4. Show clear, actionable error states instead of silent failures.

## Quality Gates

On each task ask me if you want to run the following commands to verify that your changes are safe and complete.

Run from `frontend/`:

1. `npm run check:localizations`
2. `npm run build`
3. `npm run test`

Refactoring is considered complete only when these commands pass.
