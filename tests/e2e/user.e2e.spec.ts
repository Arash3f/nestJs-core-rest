import { AuthErrors } from "@src/modules/auth/constants/errors"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { UserErrors } from "@src/modules/user/constants/errors"
import { TestApiCaller } from "@src/utils/test-utils"
import type { INestApplication } from "@nestjs/common"
import type { AxiosError } from "node_modules/axios/index.cjs"
import type { CreateUserInput, ReadUserInput, UpdateUserInput } from "swagger/Api"

import { createE2eApp } from "./helpers/e2e-app"

describe("User", () => {
  const api = new TestApiCaller()
  let app: INestApplication
  let prisma: PrismaService
  let apiConfig: EnvConfigService

  /**
   * * FakeId used for not-found / empty-filter tests (valid UUID shape)
   */
  const FAKEID = "98a753df-bf91-45f0-914f-35acd9966ad5"

  /** The admin (`Role.Admin`) fixture username, from the validated env config. */
  let adminUsername: string
  /** The member (`Role.Member`) fixture username, from the validated env config. */
  let memberUsername: string

  const mockUser = {
    name: "John Doe",
    username: "John.Doe",
    password: "Sup3rS3cret!",
    role: "Member",
  } as const

  /**
   * Asserts a request is rejected by the global `ZodValidationPipe`: a `400` whose
   * body keeps the filter defaults (`code: 9999`, `module: "AppModule"`).
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

  beforeAll(async () => {
    const ctx = await createE2eApp()
    app = ctx.app
    prisma = ctx.prisma
    apiConfig = ctx.apiConfig

    api.setApiConfig(apiConfig)
    api.setPrismaClient(prisma)

    adminUsername = apiConfig.defaultSuperUser.username.toLowerCase()
    memberUsername = apiConfig.defaultMemberUser.username.toLowerCase()
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
   * ! | Me                | !
   * ! ------------------- !
   */
  describe("Me", () => {
    it("+ returns the authenticated admin user", async () => {
      const { data } = await api.main.user.me()

      expect(data.id).toBeDefined()
      expect(data.username).toBe(adminUsername)
      expect(data.role).toBe("Admin")
      expect(data.active).toBe(true)
      expect(typeof data.createdDate).toBe("string")
      expect(typeof data.updatedDate).toBe("string")
    })

    it("+ returns the authenticated member user", async () => {
      await api.setMemberMode()

      const { data } = await api.main.user.me()

      expect(data.username).toBe(memberUsername)
      expect(data.role).toBe("Member")
    })

    it("- UserIsNotAuthorized for an anonymous request", async () => {
      api.setAnonymousMode()

      try {
        await api.main.user.me()
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | UpdateMe          | !
   * ! ------------------- !
   */
  describe("UpdateMe", () => {
    it("+ lets a member change their own name and username", async () => {
      await api.setMemberMode()

      const { data } = await api.main.user.updateMe({ name: "Renamed", username: "Renamed.Member" })

      expect(data.name).toBe("Renamed")
      // username is stored lower-cased
      expect(data.username).toBe("renamed.member")
      // role/active are untouched (not editable through updateMe)
      expect(data.role).toBe("Member")
      expect(data.active).toBe(true)
    })

    it("- UsernameIsDuplicated when taking another user's username", async () => {
      await api.setMemberMode()

      try {
        await api.main.user.updateMe({ username: adminUsername })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UsernameIsDuplicated)
      }
    })

    it("- UserIsNotAuthorized for an anonymous request", async () => {
      api.setAnonymousMode()

      try {
        await api.main.user.updateMe({ name: "x" })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | CreateUser        | !
   * ! ------------------- !
   */
  describe("CreateUser", () => {
    it("+ creates a user and persists it (username lower-cased)", async () => {
      const { data } = await api.main.user.createUser(mockUser)

      expect(data.id).toBeDefined()
      expect(data.name).toBe(mockUser.name)
      expect(data.username).toBe(mockUser.username.toLowerCase())
      expect(data.role).toBe("Member")
      expect(data.active).toBe(true)

      const persisted = await prisma.users.findUniqueOrThrow({ where: { id: data.id } })
      expect(persisted.username).toBe(mockUser.username.toLowerCase())
    })

    it("+ can create an Admin", async () => {
      const { data } = await api.main.user.createUser({
        ...mockUser,
        username: "second.admin",
        role: "Admin",
      })

      expect(data.role).toBe("Admin")
    })

    it("- UsernameIsDuplicated for an existing username", async () => {
      try {
        await api.main.user.createUser({ ...mockUser, username: memberUsername })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UsernameIsDuplicated)
      }
    })

    it("- UserIsNotAuthorized for an anonymous request", async () => {
      api.setAnonymousMode()

      try {
        await api.main.user.createUser(mockUser)
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })

    it("- AccessDenied for a non-admin member", async () => {
      await api.setMemberMode()

      try {
        await api.main.user.createUser(mockUser)
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.AccessDenied)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | ReadUsers         | !
   * ! ------------------- !
   */
  describe("ReadUsers", () => {
    it("+ returns the two seeded users with no filter", async () => {
      const { data } = await api.main.user.readUsers({})

      expect(data.count).toBe(2)
      expect(data.data.length).toBe(2)
    })

    it("+ is readable by a non-admin member", async () => {
      await api.setMemberMode()

      const { data } = await api.main.user.readUsers({})
      expect(data.count).toBe(2)
    })

    it("+ filters by username (case-insensitive contains)", async () => {
      const { data } = await api.main.user.readUsers({
        where: { username: adminUsername.toUpperCase() },
      })

      expect(data.count).toBe(1)
      expect(data.data[0].username).toBe(adminUsername)
    })

    it("+ filters by role", async () => {
      const { data } = await api.main.user.readUsers({ where: { role: "Admin" } })

      expect(data.count).toBe(1)
      expect(data.data[0].role).toBe("Admin")
    })

    it("+ filters by the active flag", async () => {
      await prisma.users.update({
        where: { username: memberUsername },
        data: { active: false },
      })

      const { data: actives } = await api.main.user.readUsers({ where: { active: true } })
      expect(actives.count).toBe(1)
      expect(actives.data[0].username).toBe(adminUsername)

      const { data: inactives } = await api.main.user.readUsers({ where: { active: false } })
      expect(inactives.count).toBe(1)
      expect(inactives.data[0].username).toBe(memberUsername)
    })

    it("+ paginates results", async () => {
      const { data: page1 } = await api.main.user.readUsers({
        pagination: { take: 1, skip: 0 },
      })
      expect(page1.count).toBe(2)
      expect(page1.data.length).toBe(1)

      const { data: page2 } = await api.main.user.readUsers({
        pagination: { take: 1, skip: 1 },
      })
      expect(page2.data.length).toBe(1)
      expect(page2.data[0].id).not.toBe(page1.data[0].id)
    })

    it("+ sorts by username ascending and descending", async () => {
      const { data: asc } = await api.main.user.readUsers({
        sortBy: { field: "username", descending: false },
      })
      const ascNames = asc.data.map((u) => u.username)
      expect(ascNames).toEqual([...ascNames].sort())

      const { data: desc } = await api.main.user.readUsers({
        sortBy: { field: "username", descending: true },
      })
      const descNames = desc.data.map((u) => u.username)
      expect(descNames).toEqual([...ascNames].reverse())
    })

    it("+ empty result for an unknown filter", async () => {
      const { data } = await api.main.user.readUsers({ where: { id: FAKEID } })
      expect(data.count).toBe(0)
      expect(data.data).toHaveLength(0)
    })

    it("- UserIsNotAuthorized for an anonymous request", async () => {
      api.setAnonymousMode()

      try {
        await api.main.user.readUsers({})
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | UpdateUser        | !
   * ! ------------------- !
   */
  describe("UpdateUser", () => {
    it("+ updates fields (name, active, role, username lower-cased)", async () => {
      const { data: created } = await api.main.user.createUser(mockUser)

      const { data: updated } = await api.main.user.updateUser({
        where: { id: created.id },
        data: { name: "Jane Roe", active: false, role: "Admin", username: "Jane.Roe" },
      })

      expect(updated.id).toBe(created.id)
      expect(updated.name).toBe("Jane Roe")
      expect(updated.active).toBe(false)
      expect(updated.role).toBe("Admin")
      expect(updated.username).toBe("jane.roe")
    })

    it("- UserNotFound for an unknown id", async () => {
      try {
        await api.main.user.updateUser({ where: { id: FAKEID }, data: { name: "x" } })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UserNotFound)
      }
    })

    it("- UsernameIsDuplicated when colliding with another user", async () => {
      const member = await prisma.users.findUniqueOrThrow({ where: { username: memberUsername } })

      try {
        await api.main.user.updateUser({
          where: { id: member.id },
          data: { username: adminUsername },
        })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UsernameIsDuplicated)
      }
    })

    it("- AccessDenied for a non-admin member", async () => {
      const { data: created } = await api.main.user.createUser(mockUser)
      await api.setMemberMode()

      try {
        await api.main.user.updateUser({ where: { id: created.id }, data: { name: "x" } })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.AccessDenied)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | DeleteUser        | !
   * ! ------------------- !
   */
  describe("DeleteUser", () => {
    it("+ soft-deletes a user (sets active to false)", async () => {
      const { data: created } = await api.main.user.createUser(mockUser)

      const { data: res } = await api.main.user.deleteUser({ id: created.id })
      expect(res.success).toBe(true)

      const persisted = await prisma.users.findUniqueOrThrow({ where: { id: created.id } })
      expect(persisted.active).toBe(false)
    })

    it("- UserNotFound for an unknown id", async () => {
      try {
        await api.main.user.deleteUser({ id: FAKEID })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(UserErrors.UserNotFound)
      }
    })

    it("- AccessDenied for a non-admin member", async () => {
      const { data: created } = await api.main.user.createUser(mockUser)
      await api.setMemberMode()

      try {
        await api.main.user.deleteUser({ id: created.id })
        fail("Test failed!")
      } catch (err) {
        const error = err as AxiosError
        expect(error.response?.data).toMatchObject(AuthErrors.AccessDenied)
      }
    })
  })

  /**
   * ! ------------------- !
   * ! | Validation        | !
   * ! ------------------- !
   */
  describe("Validation", () => {
    it("- 400 when CreateUser is missing the role", async () => {
      await expectValidationError(() =>
        api.main.user.createUser({
          name: "x",
          username: "x.user",
          password: "y",
        } as unknown as CreateUserInput),
      )
    })

    it("- 400 when CreateUser carries an unknown field (whitelist)", async () => {
      await expectValidationError(() =>
        api.main.user.createUser({ ...mockUser, extra: true } as unknown as CreateUserInput),
      )
    })

    it("- 400 for a non-uuid id filter on ReadUsers", async () => {
      await expectValidationError(() => api.main.user.readUsers({ where: { id: "not-a-uuid" } }))
    })

    it("- 400 for an unknown filter field on ReadUsers (whitelist)", async () => {
      await expectValidationError(() =>
        api.main.user.readUsers({ where: { foo: "bar" } } as unknown as ReadUserInput),
      )
    })

    it("- 400 when ReadUsers pagination take exceeds the maximum", async () => {
      await expectValidationError(() => api.main.user.readUsers({ pagination: { take: 999 } }))
    })

    it("- 400 when UpdateUser targets a non-uuid id", async () => {
      await expectValidationError(() =>
        api.main.user.updateUser({
          where: { id: "not-a-uuid" },
          data: { name: "x" },
        } as unknown as UpdateUserInput),
      )
    })
  })
})
