# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NestJS REST API boilerplate using Prisma ORM (PostgreSQL), JWT auth with device-fingerprint binding, a centralized error/exception system, and Swagger docs. Package manager is `pnpm`.

## Commands

```bash
# Install
pnpm install

# Develop (uses .env.dev, Rspack watch)
pnpm run start:dev

# Build & run production (uses .env.prod)
pnpm run start:build
pnpm run start:prod

# Prisma
pnpm run prisma:generate:dev   # generate client
pnpm run prisma:migrate:dev    # create/apply a migration
pnpm run prisma:studio:dev     # open Prisma Studio
pnpm run prisma:push:dev       # push schema without a migration

# Lint / format (oxlint + prettier)
pnpm run lint
pnpm run format

# Tests (uses .env.test, Vitest)
pnpm run test
pnpm run test:cov

# Run a single test file
env-cmd -f ./.env.test pnpm exec vitest run <path/to/file.spec.ts>

# Generate the typed API client from the running Swagger doc
pnpm run api
```

Tests live under `tests/unit/` and `tests/e2e/` (not co-located with `src/`), matched by `*.spec.ts`. `src/utils` is excluded from coverage.

Environment is selected per-script via `env-cmd` against `.env.dev` / `.env.prod` / `.env.test` (see `.env.sample` for required keys: server, JWT, database, seed/super-user, and Argon2 password-hash cost params).

## Architecture

**Module layout**: each feature lives under `src/modules/<name>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, and `constants/errors.ts`. `AppModule` (`src/app.module.ts`) wires together `PrismaModule`, `AuthModule`, `EnvConfigModule`, `InitModule`, `UserModule`.

**Errors — `AppException`** (`src/app.exception.ts`): the only error type that should be thrown for business-logic failures. Each module declares its errors once as plain `AppErrorDescriptor` objects in `constants/errors.ts` (see `src/modules/auth/constants/errors.ts`), keyed by a per-module `code` (restarts at 1 per module — uniqueness is `(module, code)`, not `code` alone) plus `statusCode`, `message`, and `persianTranslation`. Throw by reference: `throw new AppException(AuthErrors.UserIsNotAuthorized)`, or spread to attach dynamic context: `throw new AppException({ ...PrismaErrors.InvalidSortField, developerMessage: ... })`. Module names are the `ModuleNames` enum in `src/constants.ts` — add new modules there.

All exceptions (AppException, NestJS HttpException, generic Error, strings, unknown) are caught globally by `CoreExceptionFilter` (`src/common/filters/core-exception.filter.ts`, registered in `main.ts`) and normalized into one `ErrorResponseBody` shape. In production, `debugError`/`developerMessage` are stripped; non-production logs the full exception and includes them in the response.

**Auth flow**: `TokenGuard` (`src/common/guards/token.guard.ts`) is registered as a **global** guard in `main.ts` and is non-blocking — it decodes/verifies a bearer JWT and attaches `req.user`, but never rejects the request itself. A token is also rejected (silently, leaving `req.user` unset) if its `deviceId` claim doesn't match the current request's device fingerprint (`src/common/utils/device-fingerprint.util.ts`), so a token from one device can't be replayed from another. Actual authorization is enforced downstream by per-route guards:
- `IsLoggedInGuard` — throws `AuthErrors.UserIsNotAuthorized` if `req.user` is unset.
- `IsAdminGuard` — additionally loads the user from Prisma and throws `AuthErrors.AccessDenied` unless `role === Role.Admin`.

Refresh tokens are a separate flow (`auth.module`/`auth.service`, `dto/refresh-token.*`) backed by the `RefreshToken` Prisma model/migration.

**Prisma query helpers** (`src/modules/prisma/utils/`): list endpoints should compose these instead of building `orderBy`/`skip`/`take` by hand:
- `convertPaginationToPrismaFilter(input?.pagination)` — defaults `take: 10, skip: 0`.
- `convertSortByToPrismaFilter(input?.sortBy, Prisma.ModelName.X)` — pass the Prisma model name to validate the requested sort field against the real schema (via `Prisma.dmmf`) and throw `PrismaErrors.InvalidSortField` (400) instead of letting an invalid field reach Prisma and surface as a 500.

**Config**: `EnvConfigService`/`EnvConfigModule` (`src/modules/config/`) validate and expose typed env vars (`validate-env.ts`, `env.schema.ts`); `EnvType` (`types/config.type.ts`) distinguishes `Development`/`Production` (e.g. for logger verbosity and stripping debug info in `CoreExceptionFilter`).

**Validation — Zod + `zod-nest`**: DTOs are Zod schemas wrapped with `createZodDto` (`z.object(...).strict().meta({ id })`). `ZodNestModule.forRoot()` in `AppModule` registers `ZodValidationPipe` and `ZodSerializerInterceptor` globally. Controllers declare responses with `@ZodResponse({ type, status })`; `applyZodNest()` post-processes the Swagger document to OpenAPI 3.1. Env vars use the same Zod pattern in `env.schema.ts`.

**Init module** (`src/modules/init/`): bootstrap-time seeding logic (e.g. super-user / member user creation, gated by `SEED_ON_BOOT`).

## Conventions

- Path alias `@src/*` → `src/*` (configured in `tsconfig.json` and `vitest.config.ts`); prefer it over relative imports across module boundaries.
- **Toolchain (NestJS v12):** Rspack (`nest-cli.json` builder), oxlint (`oxlint.json`), Vitest (`vitest.config.ts`), ESM (`"type": "module"`).
- JSDoc is expected on exported classes/functions, especially guards, filters, and utils: one-line summary, `@param`, `@returns`, and one `@throws` per `AppException` the function can raise; add `@example` when usage isn't obvious from the signature (see `token.guard.ts`, `core-exception.filter.ts`, `sort-by.convert.ts` for the expected density).
- Commits follow `cz-customizable` + `commitlint-config-gitmoji` (gitmoji type + `(global)` scope only — see `.claude/commands/commit.md` for the full convention and type table).
