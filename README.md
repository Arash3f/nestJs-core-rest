<div align="center">

# NestJS Core Rest

**A production-grade NestJS REST API boilerplate** — device-bound JWT auth, a centralized
error system, Prisma/PostgreSQL, and a fully containerized dev environment.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Why this boilerplate

Most NestJS starters stop at "hello world with a database." This one ships with the parts
that actually take time to get right on a real project:

- **Auth tokens bound to the device that requested them** — a stolen/leaked access token can't
  be replayed from a different device, because the JWT carries a fingerprint derived from the
  request's `User-Agent` and the global guard silently rejects mismatches.
- **One error type for every business-logic failure** (`AppException`), declared once per module
  with an English message, a Persian translation, and a stable `(module, code)` pair — instead of
  scattered `throw new Error(...)` calls and inconsistent HTTP responses.
- **A global exception filter** that normalizes `AppException`, NestJS `HttpException`, raw
  `Error`s, and even thrown strings into one predictable JSON shape, stripping debug info in
  production automatically.
- **Prisma query helpers** for pagination and sorting that validate the requested sort field
  against the real schema — an unknown field returns a clean `400` instead of leaking a Prisma
  `500`.
- **A typed API client generated straight from the live Swagger doc**, so the frontend never
  hand-writes request/response types.

## ✨ Features

| | |
|---|---|
| 🔐 **Device-bound JWT auth** | Access + refresh tokens, refresh-token rotation, device fingerprint binding |
| 🛡️ **Centralized error system** | `AppException` + `CoreExceptionFilter`, per-module error catalogs with EN/FA messages |
| 🗄️ **Prisma ORM** | Type-safe PostgreSQL client, migrations, schema-validated sort/pagination filters |
| 📘 **Swagger / OpenAPI** | Auto-generated docs, grouped error responses per endpoint via `@apiErrorResponses` |
| 🤖 **Typed API client generation** | `pnpm run api` turns the live Swagger doc into a typed client |
| 🐳 **Dockerized dev stack** | One command brings up Postgres + the app with migrations and seeding |
| 🌱 **Boot-time seeding** | Idempotent super-user/member-user seed, gated by `SEED_ON_BOOT` |
| 🧪 **Jest test suite** | Unit tests under `tests/unit`, e2e scaffolding under `tests/e2e` |
| 🧹 **Strict tooling** | ESLint + Prettier + Husky + lint-staged, gitmoji commit convention |

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) |
| Language | TypeScript 5.9 |
| ORM | [Prisma 7](https://www.prisma.io/) (`@prisma/adapter-pg`) |
| Database | PostgreSQL 15 |
| Auth | `@nestjs/jwt`, Argon2id password hashing |
| Validation | `class-validator` / `class-transformer` |
| Docs | `@nestjs/swagger` + `swagger-typescript-api` |
| Containerization | Docker / Docker Compose |
| Testing | Jest |
| Package manager | pnpm |

## 📦 Modules

```
src/
├── common/          guards, filters, decorators, pipes, pagination & sort DTOs
├── app.exception.ts AppException — the only error type for business-logic failures
└── modules/
    ├── auth/        login, logout, refresh-token rotation, change password
    ├── user/        user CRUD, "me" endpoint, soft delete
    ├── config/       typed & validated env config (EnvConfigService)
    ├── init/        boot-time super-user/member-user seeding
    └── prisma/      PrismaService, error-code mapping, pagination/sort-by utils
```

## 🔐 How auth works

1. `POST /auth/logIn` returns an `accessToken` + `refreshToken`, both signed with a `deviceId`
   claim — a SHA-256 fingerprint of the caller's `User-Agent`.
2. `TokenGuard` runs globally on every request. It's **non-blocking**: a missing, malformed, or
   device-mismatched token simply leaves the request unauthenticated rather than rejecting it
   outright.
3. Route-level guards enforce the actual rule:
   - `IsLoggedInGuard` — any authenticated user.
   - `IsAdminGuard` — authenticated **and** `role === Admin`.
4. `POST /auth/refreshToken` rotates both tokens and re-validates the device fingerprint, so a
   refresh token replayed from a different device is rejected even before hitting the database.

## 🚀 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/Arash3f/nestJs-core-rest.git
cd nestJs-core-rest
pnpm install
```

### 2. Configure environment

```bash
cp .env.sample .env.dev
```

Fill in `JWT_SECRET`, the `DATABASE_*` vars, and the seed-user credentials. See
[`.env.sample`](.env.sample) for every required key.

### 3. Run with Docker (recommended)

The fastest path — Postgres, migrations, and the app boot together:

```bash
cp docker/develop/.env.docker.dev.sample docker/develop/.env.docker.dev
cp docker/develop/.docker.dev.sample.env docker/develop/.docker.dev.env
# fill in both files, then:
docker compose -f docker/develop/docker-compose-develop.yml up -d --build
```

The API is now live at `http://localhost:3005`, with Swagger UI at `/api_docs`.

### 4. Or run locally against your own Postgres

```bash
pnpm run prisma:generate:dev
pnpm run prisma:migrate:dev
pnpm run start:dev
```

## 📜 Scripts

| Command | What it does |
|---|---|
| `pnpm run start:dev` | Dev server with HMR (`.env.dev`) |
| `pnpm run start:build` / `start:prod` | Production build & run (`.env.prod`) |
| `pnpm run prisma:generate:dev` | Generate the Prisma client |
| `pnpm run prisma:migrate:dev` | Create & apply a migration |
| `pnpm run prisma:studio:dev` | Open Prisma Studio |
| `pnpm run prisma:push:dev` | Push schema without a migration |
| `pnpm run test` / `test:cov` | Run the Jest suite, with coverage |
| `pnpm run lint` / `format` | ESLint --fix / Prettier --write |
| `pnpm run api` | Generate a typed API client from the live Swagger doc |

## 🧪 Testing

```bash
pnpm run test          # full suite
pnpm run test:cov      # with coverage (src/utils excluded)

# a single file
env-cmd -f ./.env.test npx jest --config jest.config.js path/to/file.spec.ts
```

Tests live under `tests/unit/` and `tests/e2e/`, matched by `*.spec.ts`.

## 🐳 Docker reference

```bash
# build & start
docker compose -f docker/develop/docker-compose-develop.yml up -d --build

# follow logs
docker compose -f docker/develop/docker-compose-develop.yml logs -f

# stop
docker compose -f docker/develop/docker-compose-develop.yml down

# stop & wipe the database volume
docker compose -f docker/develop/docker-compose-develop.yml down -v
```

## 🤝 Contributing

Commits follow the [gitmoji](https://gitmoji.dev/) convention via `cz-customizable` +
`commitlint-config-gitmoji` — run `pnpm exec cz` instead of `git commit` to be guided through it.

## 📝 License

[MIT](LICENSE)

## 👤 Author

**Arash Alfooneh** — [@Arash3f](https://github.com/Arash3f)

---

<div align="center">Built with NestJS, Prisma, and a healthy amount of paranoia about error handling.</div>
