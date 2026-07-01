import type { PrismaClient } from "@prisma/client"
import type { EnvConfigService } from "@src/modules/config/env-config.service"
import type { CreateUserInput } from "@src/modules/user/dto/create-user.input"
import * as argon2 from "argon2"
import { Api as APPApi } from "swagger/Api"

/**
 * Helper used by e2e specs to drive the running app over HTTP (via the
 * generated Swagger client) and to seed/reset the database directly through
 * Prisma. A single instance is shared across a spec file: configure it once
 * with {@link TestApiCaller.setApiConfig} / {@link TestApiCaller.setPrismaClient},
 * then switch auth context per test with the `set*Mode` methods.
 *
 * Two roles can be impersonated, matching the app's single privileged guard:
 * - admin  (`Role.Admin`)  → passes `IsAdminGuard`
 * - member (`Role.Member`) → fails `IsAdminGuard`, passes `IsLoggedInGuard`
 *
 * Both fixtures come from the validated env config (`defaultSuperUser`, whose
 * role is `Role.Admin`, and `defaultMemberUser`), so credentials stay in sync
 * with what the app's `InitService` seeds.
 */
export class TestApiCaller {
  /**
   * Typed env-config service, source of the default admin/member credentials
   * and the Argon2 hash cost parameters.
   */
  private apiConfigService: EnvConfigService
  /**
   * Prisma client used for direct DB seeding/wiping (bypassing the HTTP API).
   */
  private prisma: PrismaClient

  /**
   * Generated Swagger client pointed at the locally running app.
   */
  main = new APPApi({
    baseURL: `http://${process.env.SERVER_ADDRESS}:${process.env.SERVER_PORT}`,
  })

  /**
   * Sets (or clears) the `Authorization` header on the shared axios instance so
   * every subsequent request carries it.
   *
   * Mutates the axios instance defaults rather than replacing its `request`
   * method, so the generated client's `HttpClient.request` pipeline stays intact.
   *
   * @param accessToken - The bearer token to attach, or `null` to go anonymous.
   */
  private setAuthToken(accessToken: string | null) {
    const headers = this.main.instance.defaults.headers.common
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
    } else {
      delete headers["Authorization"]
    }
  }

  /**
   * Injects the env-config service (source of the default user credentials and
   * Argon2 cost parameters).
   *
   * @param apiConfigService - The application's typed env-config service.
   */
  setApiConfig(apiConfigService: EnvConfigService) {
    this.apiConfigService = apiConfigService
  }

  /**
   * Injects the Prisma client used for direct database seeding and wiping.
   *
   * @param prisma - The application's Prisma client.
   */
  setPrismaClient(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Logs in as the default admin user (`Role.Admin`) and attaches the bearer
   * token to every subsequent request, granting admin-guarded routes
   * (`IsAdminGuard`).
   *
   * @returns A promise that resolves once the admin token is attached.
   */
  async setAdminMode() {
    await this.loginAs(
      this.apiConfigService.defaultSuperUser.username,
      this.apiConfigService.defaultSuperUser.password,
    )
  }

  /**
   * Logs in as the member (non-privileged) fixture user and attaches the bearer
   * token to every subsequent request — used to assert access denial on
   * admin-guarded routes.
   *
   * @returns A promise that resolves once the member token is attached.
   */
  async setMemberMode() {
    await this.loginAs(
      this.apiConfigService.defaultMemberUser.username,
      this.apiConfigService.defaultMemberUser.password,
    )
  }

  /**
   * Clears any attached bearer token, so subsequent requests are anonymous.
   */
  setAnonymousMode() {
    this.setAuthToken(null)
  }

  /**
   * Logs in as an arbitrary user and attaches the resulting bearer token.
   *
   * @param username - The user's username.
   * @param password - The user's password.
   *
   * @returns A promise that resolves once the user's token is attached.
   */
  async loginAs(username: string, password: string) {
    this.setAnonymousMode()

    const {
      data: { accessToken },
    } = await this.main.auth.logIn({ username, password })

    this.setAuthToken(String(accessToken))
  }

  /**
   * Wipes every application table so each test starts from a clean slate.
   *
   * Uses `TRUNCATE ... RESTART IDENTITY CASCADE` over all public tables
   * (excluding Prisma's migrations table), mirroring the seed script's wipe.
   * Because it discovers tables dynamically and relies on `CASCADE`, it needs
   * no manual table list or FK-ordering maintenance when the schema changes.
   *
   * @returns A promise that resolves once all tables are truncated.
   */
  async resetDatabase() {
    const rows = await this.prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    `
    const tables = rows.map((r) => `"public"."${r.tablename}"`).join(", ")
    if (tables) {
      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`)
    }
  }

  /**
   * Hashes a password exactly the way `AuthService.generatedHashedPassword`
   * does (Argon2id with the configured memory/time/parallelism cost), so a
   * directly-seeded user can authenticate through the real login flow.
   *
   * @param password - The plaintext password to hash.
   *
   * @returns A promise resolving to the encoded Argon2 hash.
   */
  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.apiConfigService.memoryCost,
      timeCost: this.apiConfigService.timeCost,
      parallelism: this.apiConfigService.parallelism,
    })
  }

  /**
   * Seeds a single user row directly via Prisma (bypassing the HTTP API).
   *
   * The username is lower-cased to match the login lookup
   * (`AuthService.verifyUserExistenceByUsername`), and the password is hashed
   * with {@link TestApiCaller.hashPassword} so the seeded user can log in.
   *
   * @param user - Name, username, password and role for the new user.
   *
   * @returns A promise that resolves once the user row is created.
   */
  private async seedUser(user: CreateUserInput) {
    await this.prisma.users.create({
      data: {
        name: user.name,
        username: user.username.toLowerCase(),
        passwordHash: await this.hashPassword(user.password),
        role: user.role,
      },
    })
  }

  /**
   * Seeds the default admin user (`Role.Admin`) directly via Prisma.
   *
   * The matching login helper is {@link TestApiCaller.setAdminMode}. Unlike the
   * app's `InitService`, this seeds only the user row, keeping the database
   * minimal for exact-count assertions.
   *
   * @returns A promise that resolves once the user row is created.
   */
  async createAdminUser() {
    await this.seedUser(this.apiConfigService.defaultSuperUser)
  }

  /**
   * Seeds the default member (non-privileged) user (`Role.Member`) directly via
   * Prisma.
   *
   * The matching login helper is {@link TestApiCaller.setMemberMode}. The user
   * is deliberately not privileged so denial tests can verify guard behaviour.
   *
   * @returns A promise that resolves once the user row is created.
   */
  async createMemberUser() {
    await this.seedUser(this.apiConfigService.defaultMemberUser)
  }
}
