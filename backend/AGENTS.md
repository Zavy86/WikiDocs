# Backend Agent Guidelines

## Scope

These guidelines apply **only** to `backend/`.
Do not change files outside `backend/` unless explicitly requested.

This backend is already functionally complete. Current work is expected to be small, safe, incremental refactoring and
maintenance.

## Project Structure (follow this layout)

- `src/main.ts`: app bootstrap, global pipes, CORS, Swagger setup.
- `src/app.module.ts`: module wiring and providers.
- `src/app.controller.ts`: HTTP endpoints, transport concerns only.
- `src/app.guard.ts`: authentication/authorization enforcement.
- `src/app.decorators.ts`: custom decorators for auth metadata and JWT payload access.
- `src/services/`: business logic and filesystem/domain operations.
- `src/schemas/`: request/response and payload schemas used by validation/transform.
- `test/`: e2e tests.

Keep new/refactored code in the same layer where responsibility already exists.

## Refactoring Principles

1. Prefer small, isolated changes over broad rewrites.
2. Preserve public behavior unless a change is explicitly requested.
3. Keep backward compatibility for API payloads and auth flows.
4. Reuse existing services/schemas/decorators before introducing new abstractions.
5. Avoid silent fallbacks: surface explicit, meaningful errors.

## TypeScript Best Practices

1. Use explicit types for public method signatures and service contracts.
2. Do not introduce new `any`; prefer precise unions, generics, and narrowing.
3. Keep null/undefined handling explicit and consistent with `strictNullChecks`.
4. Prefer immutable patterns (`readonly`, copy/update) where practical.
5. Keep naming consistent with existing code (`snake_case` endpoint handlers are already in use in `app.controller.ts`).

## NestJS Best Practices

1. Keep controllers thin: parse inputs/decorators and delegate to services.
2. Keep services focused on business logic; avoid HTTP transport details in services.
3. Use dependency injection through constructors; avoid manual singleton/state patterns.
4. Use Nest exceptions (`UnauthorizedException`, `BadRequestException`, etc.) instead of generic errors.
5. Keep guards/decorators authoritative for auth concerns; do not duplicate auth checks in each endpoint.

## Shared Contracts (`/shared/contracts`)

`/shared/contracts` is the cross-layer contract source of truth.
Any backend refactor touching API payloads must remain aligned with those contracts.

### Contract typing policy

- Use **`type` as the default** for shared contracts (current project direction).
- Use `interface` only when a contract is genuinely extension-oriented and the reason is explicit in the change.

When backend schemas (`src/schemas`) and `/shared/contracts` overlap, keep them semantically aligned.

## Validation, Security, and Errors

1. Keep validation rules coherent with global `ValidationPipe` settings in `main.ts`.
2. Preserve whitelist/transform behavior for incoming payloads.
3. Keep JWT and authorization behavior consistent with `app.guard.ts` and `app.decorators.ts`.
4. Log operationally relevant events through Nest `Logger`; do not leak sensitive data in logs.

## Quality Gates

On each task ask me if you want to run the following commands to verify that your changes are safe and complete.

Run from `backend/`:

1. `npm run lint`
2. `npm run test`
3. `npm run build`

Refactoring is considered complete only when these commands pass.
