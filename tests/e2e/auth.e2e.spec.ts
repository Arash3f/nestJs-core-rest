import { AuthErrors } from "@src/modules/auth/constants/errors"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { UserErrors } from "@src/modules/user/constants/errors"
import { TestApiCaller } from "@src/tests/e2e/helpers/test-utils"
import type { INestApplication } from "@nestjs/common"
import type { AxiosError } from "node_modules/axios/index.cjs"
import type { ChangePasswordInput, LoginInput, RefreshTokenInput, RegisterInput } from "swagger/Api"

import { createE2eApp } from "@src/tests/e2e/helpers/e2e-app"

describe("Auth", () => {
  const api = new TestApiCaller()
  let app: INestApplication
  let prisma: PrismaService
  let apiConfig: EnvConfigService

  /**
   * * FakeId used for not-found tests (valid UUID shape, never seeded)
   */
  const FAKEID = "98a753df-bf91-45f0-914f-35acd9966ad5"

  /** The admin (`Role.Admin`) fixture credentials, from the validated env config. */
  let admin: { username: string; password: string }
  /** The member (`Role.Member`) fixture credentials, from the validated env config. */
  let member: { username: string; password: string }

  /**
   * Asserts a string is shaped like a JWT (three dot-separated segments).
   *
   * @param token - The token to inspect.
   */
  const expectJwt = (token: string) => {
    expect(typeof token).toBe("string")
    expect(token.split(".")).toHaveLength(3)
  }

  beforeAll(async () => {
    const ctx = await createE2eApp()
    app = ctx.app
    prisma = ctx.prisma
    apiConfig = ctx.apiConfig

    api.setApiConfig(apiConfig)
    api.setPrismaClient(prisma)

    admin = {
      username: apiConfig.defaultSuperUser.username,
      password: apiConfig.defaultSuperUser.password,
    }
    member = {
      username: apiConfig.defaultMemberUser.username,
      password: apiConfig.defaultMemberUser.password,
    }
  })

  beforeEach(async () => {
    api.setAnonymousMode()
    await api.resetDatabase()
    await api.createAdminUser()
    await api.createMemberUser()
    await api.setAdminMode()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })

  /**
   * ! ------------------- !
   * ! | LogIn             | !
   * ! ------------------- !
   */
  describe("LogIn", () => {
    it("+ returns an access/refresh token pair for valid credentials", async () => {
      api.setAnonymousMode()

      const { data } = await api.main.auth.logIn(admin)

      expectJwt(data.accessToken)
      expectJwt(data.refreshToken)
    })

    it("+ is case-insensitive on the username", async () => {
      api.setAnonymousMode()

      const { data } = await api.main.auth.logIn({
        username: admin.username.toUpperCase(),
        password: admin.password,
      })

      expectJwt(data.accessToken)
    })

    it("+ persists a refresh-token hash on the user", async () => {
      api.setAnonymousMode()

      await api.main.auth.logIn(member)

      const row = await prisma.users.findUniqueOrThrow({
        where: { username: member.username.toLowerCase() },
      })
      expect(row.refreshTokenHash).not.toBeNull()
    })

    it("- IncorrectUsernameOrPassword for a wrong password", async () => {
      api.setAnonymousMode()

      try {
        await api.main.auth.logIn({ username: admin.username, password: "definitely-wrong" })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.IncorrectUsernameOrPassword)
      }
    })

    it("- IncorrectUsernameOrPassword for an unknown username", async () => {
      api.setAnonymousMode()

      try {
        await api.main.auth.logIn({ username: "ghost", password: "whatever" })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.IncorrectUsernameOrPassword)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | Register          | !
   * ! ------------------- !
   */
  describe("Register", () => {
    const NEW_USER = { name: "New User", username: "New.User", password: "S3cret!pass" }

    it("+ creates a Member, auto-logs in, and returns tokens", async () => {
      api.setAnonymousMode()

      const { data, status } = await api.main.auth.register(NEW_USER)
      expect(status).toBe(201)
      expectJwt(data.accessToken)
      expectJwt(data.refreshToken)

      const row = await prisma.users.findUniqueOrThrow({
        where: { username: NEW_USER.username.toLowerCase() },
      })
      // role is forced server-side, never taken from the request
      expect(row.role).toBe("Member")
      expect(row.name).toBe(NEW_USER.name)
    })

    it("+ lower-cases the username before storing", async () => {
      api.setAnonymousMode()

      await api.main.auth.register(NEW_USER)

      const row = await prisma.users.findFirst({
        where: { username: NEW_USER.username.toLowerCase() },
      })
      expect(row).not.toBeNull()
    })

    it("- UsernameIsDuplicated for an existing username", async () => {
      api.setAnonymousMode()

      try {
        // the member fixture already exists
        await api.main.auth.register({ ...NEW_USER, username: member.username })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UsernameIsDuplicated)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | Logout            | !
   * ! ------------------- !
   */
  describe("Logout", () => {
    it("+ clears the stored refresh-token hash and returns success", async () => {
      await api.setMemberMode()

      const { data } = await api.main.auth.logout()
      expect(data.success).toBe(true)

      const row = await prisma.users.findUniqueOrThrow({
        where: { username: member.username.toLowerCase() },
      })
      expect(row.refreshTokenHash).toBeNull()
    })

    it("- UserIsNotAuthorized for an anonymous request", async () => {
      api.setAnonymousMode()

      try {
        await api.main.auth.logout()
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | ChangePassword    | !
   * ! ------------------- !
   */
  describe("ChangePassword", () => {
    const NEW_PASSWORD = "Br4ndN3wP@ss"

    it("+ updates the target user's password (old fails, new works)", async () => {
      const row = await prisma.users.findUniqueOrThrow({
        where: { username: member.username.toLowerCase() },
      })

      api.setAnonymousMode()
      const { data: sessionBeforeChange } = await api.main.auth.logIn(member)
      await api.setAdminMode()

      const { data } = await api.main.auth.changePassword({
        where: { id: row.id },
        data: { newPassword: NEW_PASSWORD },
      })
      expect(data.success).toBe(true)

      // refresh tokens issued before the password change are revoked
      api.setAnonymousMode()
      try {
        await api.main.auth.refreshToken({ refreshToken: sessionBeforeChange.refreshToken })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }

      // the old password no longer authenticates
      try {
        await api.main.auth.logIn(member)
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.IncorrectUsernameOrPassword)
      }

      // the new password does
      const { data: tokens } = await api.main.auth.logIn({
        username: member.username,
        password: NEW_PASSWORD,
      })
      expectJwt(tokens.accessToken)
    })

    it("- UserNotFound for an unknown target id", async () => {
      try {
        await api.main.auth.changePassword({
          where: { id: FAKEID },
          data: { newPassword: NEW_PASSWORD },
        })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UserNotFound)
      }
    })

    it("- UserIsNotAuthorized for an anonymous request", async () => {
      const row = await prisma.users.findUniqueOrThrow({
        where: { username: member.username.toLowerCase() },
      })
      api.setAnonymousMode()

      try {
        await api.main.auth.changePassword({
          where: { id: row.id },
          data: { newPassword: NEW_PASSWORD },
        })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })

    it("- AccessDenied for a non-admin member", async () => {
      const row = await prisma.users.findUniqueOrThrow({
        where: { username: member.username.toLowerCase() },
      })
      await api.setMemberMode()

      try {
        await api.main.auth.changePassword({
          where: { id: row.id },
          data: { newPassword: NEW_PASSWORD },
        })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.AccessDenied)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | RefreshToken      | !
   * ! ------------------- !
   */
  describe("RefreshToken", () => {
    /**
     * A `User-Agent` that differs from axios' default, used to simulate a
     * request coming from a device the session was not bound to (the fingerprint
     * is a SHA-256 of the `User-Agent`).
     */
    const OTHER_DEVICE = { headers: { "User-Agent": "OtherDevice/1.0" } }

    it("+ exchanges a valid refresh token for a fresh, usable token pair", async () => {
      api.setAnonymousMode()
      const { data: first } = await api.main.auth.logIn(member)

      const { data: rotated } = await api.main.auth.refreshToken({
        refreshToken: first.refreshToken,
      })
      expectJwt(rotated.accessToken)
      expectJwt(rotated.refreshToken)

      // the issued refresh token can itself be exchanged again
      const { data: again } = await api.main.auth.refreshToken({
        refreshToken: rotated.refreshToken,
      })
      expectJwt(again.accessToken)
    })

    it("- InValidRefreshToken for a tampered token", async () => {
      api.setAnonymousMode()
      const { data } = await api.main.auth.logIn(member)

      // keep the JWT shape (3 segments) but break the signature
      const lastChar = data.refreshToken.slice(-1)
      const tampered = data.refreshToken.slice(0, -1) + (lastChar === "a" ? "b" : "a")

      try {
        await api.main.auth.refreshToken({ refreshToken: tampered })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.InValidRefreshToken)
      }
    })

    it("- UserIsNotAuthorized after logout (no stored refresh token)", async () => {
      api.setAnonymousMode()
      const { data } = await api.main.auth.logIn(member)

      // log the member out — this clears the stored refresh-token hash, so the
      // refresh token captured above can no longer be exchanged
      await api.setMemberMode()
      await api.main.auth.logout()
      api.setAnonymousMode()

      try {
        await api.main.auth.refreshToken({ refreshToken: data.refreshToken })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })

    it("- DeviceMismatch when refreshing from a different device", async () => {
      api.setAnonymousMode()
      const { data } = await api.main.auth.logIn(member)

      try {
        await api.main.auth.refreshToken({ refreshToken: data.refreshToken }, OTHER_DEVICE)
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.DeviceMismatch)
      }
    })

    it("- UserIsNotAuthorized when the account has been deactivated", async () => {
      api.setAnonymousMode()
      const { data } = await api.main.auth.logIn(member)

      await prisma.users.update({
        where: { username: member.username.toLowerCase() },
        data: { active: false },
      })

      try {
        await api.main.auth.refreshToken({ refreshToken: data.refreshToken })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | Validation        | !
   * ! ------------------- !
   *
   * Each input DTO is rejected by the global `ValidationPipe` before the handler
   * runs (a `400` whose body keeps the filter defaults `code: 9999`,
   * `module: "AppModule"`). Guards run before pipes, so the guarded
   * `ChangePassword` case relies on the admin context seeded in `beforeEach`.
   */
  describe("Validation", () => {
    /**
     * Asserts a request is rejected by the global `ValidationPipe`.
     *
     * @param request - A thunk performing the (expected-to-fail) request.
     */
    const expectValidationError = async (request: () => Promise<unknown>) => {
      try {
        await request()
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.status).toBe(400)
        expect(error.response?.data).toMatchObject({
          statusCode: 400,
          code: 9999,
          module: "AppModule",
        })
      }
    }

    it("- 400 when LogIn is missing the password", async () => {
      api.setAnonymousMode()
      await expectValidationError(() =>
        api.main.auth.logIn({ username: admin.username } as unknown as LoginInput),
      )
    })

    it("- 400 when LogIn carries an unknown field (whitelist)", async () => {
      api.setAnonymousMode()
      await expectValidationError(() =>
        api.main.auth.logIn({ ...admin, role: "Admin" } as unknown as LoginInput),
      )
    })

    it("- 400 when Register is missing the username", async () => {
      api.setAnonymousMode()
      await expectValidationError(() =>
        api.main.auth.register({ name: "x", password: "y" } as unknown as RegisterInput),
      )
    })

    it("- 400 when ChangePassword targets a non-uuid id", async () => {
      await expectValidationError(() =>
        api.main.auth.changePassword({
          where: { id: "not-a-uuid" },
          data: { newPassword: "whatever" },
        } as unknown as ChangePasswordInput),
      )
    })

    it("- 400 when RefreshToken is not a JWT", async () => {
      api.setAnonymousMode()
      await expectValidationError(() =>
        api.main.auth.refreshToken({ refreshToken: "notajwt" } as unknown as RefreshTokenInput),
      )
    })
  })
})
