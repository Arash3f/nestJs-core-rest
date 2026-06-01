import type { INestApplication } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { Test } from "@nestjs/testing"
import { Role } from "@prisma/client"
import { AppModule } from "@src/app.module"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { TestApiCaller } from "@src/utils/test-utils"
import * as argon2 from "argon2"
import type { AxiosError } from "node_modules/axios/index.cjs"

describe("Auth", () => {
  const api = new TestApiCaller()
  let app: INestApplication
  let prisma: PrismaService
  let apiConfig: EnvConfigService

  /**
   * * FakeId used for some test that need dummy uuid
   */
  const FAKEID = "98a753df-bf91-45f0-914f-35acd9966ad5"

  /**
   * * Create App & fill service objects
   */
  async function createApp() {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = await NestFactory.create<NestExpressApplication>(AppModule)

    /**
     * * For access to project modules, we need to config servicess interface
     */
    apiConfig = module.get(EnvConfigService)
    prisma = module.get(PrismaService)

    await app.listen(apiConfig.serverPort)
  }

  beforeAll(async () => {
    await createApp()
    api.setApiConfig(apiConfig)
    api.setPrismaClient(prisma)
  })

  beforeEach(async () => {
    api.setAnonymousMode()
    await api.resetDatabase()
    await api.createSuperUser()
    await api.createMemberUser()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })

  /**
   * ! ------------- !
   * ! | Login API | !
   * ! ------------- !
   */

  it("+ Login", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"

    /**
     * * Create new user by prisma
     */
    const hashedPassword = await argon2.hash(password)
    await prisma.users.create({
      data: {
        name,
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    })

    /**
     * * Test login Api
     */
    await api.main.auth.logIn({
      username: "username",
      password,
    })
  })

  it("- Login (IncorrectUsernameOrPassword)", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"

    /**
     * * Create new user by prisma
     */
    const hashedPassword = await argon2.hash(password)
    await prisma.users.create({
      data: {
        name,
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    })

    /**
     * * Test login Api
     */
    try {
      await api.main.auth.logIn({
        username,
        password: "fjshadlfjsoidfsajfiosjfdio",
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.IncorrectUsernameOrPassword)
    }
  })

  /**
   * ! ---------- !
   * ! | Me API | !
   * ! ---------- !
   */

  it("+ Me API Successfuly", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"

    /**
     * * Create new user by prisma
     */
    const hashedPassword = await argon2.hash(password)
    const createdUser = await prisma.users.create({
      data: {
        name,
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    })

    /**
     * * login as new user
     */
    await api.loginAs(username, password)

    /**
     * * Test Me Api
     */
    const { data: userData } = await api.main.auth.me()
    expect(userData.id).toBe(createdUser.id)
    expect(userData.name).toBe(name)
    expect(userData.username).toBe(username.toLowerCase())
    expect(userData.role).toBe(Role.Member)
  })

  it("- Me API UnSuccessfuly (UserIsNotAuthorized)", async () => {
    /**
     * * Test Me Api
     */
    try {
      await api.main.auth.me()
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserIsNotAuthorized)
    }
  })

  /**
   * ! ------------------ !
   * ! | CreateUser API | !
   * ! ------------------ !
   */

  it("+ CreateUser API Successfuly", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"
    const role = Role.Member

    /**
     * * login as Super user
     */
    await api.setAdminMode()

    /**
     * * Test createUser Api
     */
    const { data: createResponse } = await api.main.auth.createUser({
      name,
      username,
      password,
      role,
    })
    expect(createResponse.active).toBe(true)
    expect(createResponse.name).toBe(name)
    expect(createResponse.username).toBe(username.toLowerCase())
    expect(createResponse.role).toBe(role)

    const prismaData = await prisma.users.findFirstOrThrow({
      where: {
        username: username.toLowerCase(),
      },
    })

    expect(prismaData.id).toBe(createResponse.id)
    expect(await argon2.verify(prismaData.password, password)).toBe(true)
    expect(prismaData.active).toBe(true)
    expect(prismaData.name).toBe(name)
    expect(prismaData.username).toBe(username.toLowerCase())
    expect(prismaData.role).toBe(role)
  })

  it("- CreateUser API UnSuccessfuly (UserIsNotAuthorized)", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"
    const role = Role.Member

    /**
     * * Test createUser Api
     */
    try {
      await api.main.auth.createUser({
        name,
        username,
        password,
        role,
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserIsNotAuthorized)
    }
  })

  it("- CreateUser API UnSuccessfuly (AccessDenied)", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"
    const role = Role.Member

    /**
     * * login as member user
     */
    await api.setMemberMode()

    /**
     * * Test createUser Api
     */
    try {
      await api.main.auth.createUser({
        name,
        username,
        password,
        role,
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.AccessDenied)
    }
  })

  it("- CreateUser API UnSuccessfuly (UsernameIsDuplicated)", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"
    const role = Role.Member
    const hashedPassword = await argon2.hash(password)

    await prisma.users.create({
      data: {
        name,
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    })

    /**
     * * login as admin user
     */
    await api.setAdminMode()

    /**
     * * Test createUser Api
     */
    try {
      await api.main.auth.createUser({
        name,
        username,
        password,
        role,
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UsernameIsDuplicated)
    }
  })

  /**
   * ! ----------------- !
   * ! | ReadUsers API | !
   * ! ----------------- !
   */

  it("+ ReadUsers API Successfuly (Where)", async () => {
    /**
     * * Create some user
     */
    const userPass01 = "user01"
    const userPassword01 = await argon2.hash(userPass01)
    const user01 = await prisma.users.create({
      data: {
        name: "uUsS00001798465489484",
        password: userPassword01,
        role: Role.Member,
        username: "user01",
        active: true,
      },
    })

    const userPass02 = "user02"
    const userPassword02 = await argon2.hash(userPass02)
    const user02 = await prisma.users.create({
      data: {
        name: "user02",
        password: userPassword02,
        role: Role.Admin,
        username: "AAsspvoijvdiodfV--78941684",
        active: true,
      },
    })

    const userPass03 = "user03"
    const userPassword03 = await argon2.hash(userPass03)
    const user03 = await prisma.users.create({
      data: {
        name: "user03",
        password: userPassword03,
        role: Role.Admin,
        username: "user03",
        active: false,
      },
    })

    /**
     * * Login as Member user
     */
    await api.setMemberMode()

    const { data: userCount } = await api.main.auth.readUsers({})
    expect(userCount.count).toBe(5)
    expect(userCount.data.length).toBe(5)

    /**
     * * Filter name
     */
    const { data: findUser01 } = await api.main.auth.readUsers({
      where: {
        name: "UsS00",
      },
    })
    expect(findUser01.data[0].id).toBe(user01.id)
    expect(findUser01.count).toBe(1)

    /**
     * * Filter username
     */
    const { data: findUser02 } = await api.main.auth.readUsers({
      where: {
        username: "diodfV--78",
      },
    })
    expect(findUser02.count).toBe(1)
    expect(findUser02.data[0].id).toBe(user02.id)

    /**
     * * Filter active
     */
    const { data: findUser03 } = await api.main.auth.readUsers({
      where: {
        active: false,
      },
    })
    expect(findUser03.count).toBe(1)
    expect(findUser03.data[0].id).toBe(user03.id)

    /**
     * * Filter role
     */
    const { data: findUser04 } = await api.main.auth.readUsers({
      where: {
        role: Role.Member,
      },
    })
    expect(findUser04.count).toBe(2)
    expect(findUser04.data[1].id).toBe(user01.id)
  })

  it("- ReadUsers API UnSuccessfuly (UserIsNotAuthorized)", async () => {
    /**
     * * Request to server
     */
    try {
      await api.main.auth.readUsers({})
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserIsNotAuthorized)
    }
  })

  /**
   * ! ------------------ !
   * ! | UpdateUser API | !
   * ! ------------------ !
   */

  it("+ UpdateUser API Successfuly", async () => {
    /**
     * * Create some user
     */
    const userPass01 = "user01"
    const userPassword01 = await argon2.hash(userPass01)
    const user01 = await prisma.users.create({
      data: {
        name: "uUsS00001798465489484",
        password: userPassword01,
        role: Role.Member,
        username: "user01",
      },
    })

    /**
     * * login as Super user
     */
    await api.setAdminMode()

    /**
     * * Request to server
     */
    const active = false
    const name = "updatedUser"
    const username = "UpdatedUserName"
    const role = Role.Admin
    const { data: updateUser01 } = await api.main.auth.updateUser({
      where: {
        id: user01.id,
      },
      data: {
        active,
        name,
        username,
        role,
      },
    })

    expect(updateUser01.id).toBe(user01.id)
    expect(updateUser01.active).toBe(active)
    expect(updateUser01.name).toBe(name)
    expect(updateUser01.username).toBe(username.toLowerCase())
    expect(updateUser01.role).toBe(role)

    const findUser = await prisma.users.findUnique({
      where: {
        id: updateUser01.id,
      },
    })

    expect(findUser?.id).toBe(updateUser01.id)
    expect(findUser?.active).toBe(updateUser01.active)
    expect(findUser?.name).toBe(updateUser01.name)
    expect(findUser?.username).toBe(updateUser01.username)
    expect(findUser?.role).toBe(updateUser01.role)
  })

  it("- UpdateUser API UnSuccessfuly (AccessDenied)", async () => {
    /**
     * * Login as Member user
     */
    await api.setMemberMode()

    /**
     * * Request to server
     */
    try {
      await api.main.auth.updateUser({
        where: {
          id: FAKEID,
        },
        data: {
          active: false,
          name: "updatedUser",
          username: "UpdatedUserName",
          role: Role.Admin,
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.AccessDenied)
    }
  })

  it("- UpdateUser API UnSuccessfuly (UserNotFound)", async () => {
    /**
     * * login as Super user
     */
    await api.setAdminMode()

    /**
     * * Request to server
     */
    try {
      await api.main.auth.updateUser({
        where: {
          id: FAKEID,
        },
        data: {
          active: false,
          name: "updatedUser",
          username: "UpdatedUserName",
          role: Role.Admin,
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserNotFound)
    }
  })

  it("- UpdateUser API UnSuccessfuly (UsernameIsDuplicated)", async () => {
    /**
     * * Create some user
     */
    const username01 = "user01"
    const userPassword01 = await argon2.hash("user01")
    const user01 = await prisma.users.create({
      data: {
        username: username01,
        name: "user01",
        password: userPassword01,
        role: Role.Member,
      },
    })

    const username02 = "user02"
    const userPassword02 = await argon2.hash("user02")
    await prisma.users.create({
      data: {
        username: username02,
        name: "user02",
        password: userPassword02,
        role: Role.Member,
      },
    })

    /**
     * * Login as Super user
     */
    await api.setAdminMode()

    try {
      /**
       * * Request to server
       */
      await api.main.auth.updateUser({
        where: {
          id: user01.id,
        },
        data: {
          active: false,
          name: "updatedUser",
          username: username02,
          role: Role.Admin,
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UsernameIsDuplicated)
    }
  })

  it("- UpdateUser API UnSuccessfuly (UserIsNotAuthorized)", async () => {
    try {
      /**
       * * Request to server
       */
      await api.main.auth.updateUser({
        where: {
          id: FAKEID,
        },
        data: {
          active: false,
          name: "updatedUser",
          username: "username02",
          role: Role.Admin,
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserIsNotAuthorized)
    }
  })

  /**
   * ! ------------------ !
   * ! | DeleteUser API | !
   * ! ------------------ !
   */

  it("+ DeleteUser API Successfuly", async () => {
    /**
     * * Create some user
     */
    const userPass01 = "user01"
    const userPassword01 = await argon2.hash(userPass01)
    const user01 = await prisma.users.create({
      data: {
        username: "user01",
        name: "uUsS00001798465489484",
        password: userPassword01,
        role: Role.Member,
      },
    })

    /**
     * * Login as Super user
     */
    await api.setAdminMode()

    /**
     * * Request to server
     */
    await api.main.auth.deleteUser({
      id: user01.id,
    })

    const findUser = await prisma.users.count({
      where: {
        id: user01.id,
        active: true,
      },
    })

    expect(findUser).toBe(0)
  })

  it("- DeleteUser API UnSuccessfuly (AccessDenied)", async () => {
    /**
     * * Login as Member user
     */
    await api.setMemberMode()

    /**
     * * Request to server
     */
    try {
      await api.main.auth.deleteUser({
        id: FAKEID,
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.AccessDenied)
    }
  })

  it("- DeleteUser API UnSuccessfuly (UserNotFound)", async () => {
    /**
     * * Login as Super user
     */
    await api.setAdminMode()

    /**
     * * Request to server
     */
    try {
      await api.main.auth.deleteUser({
        id: FAKEID,
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserNotFound)
    }
  })

  it("- DeleteUser API UnSuccessfuly (UserIsNotAuthorized)", async () => {
    /**
     * * Request to server
     */
    try {
      await api.main.auth.deleteUser({
        id: FAKEID,
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserIsNotAuthorized)
    }
  })

  /**
   * ! ---------------------- !
   * ! | ChangePassword API | !
   * ! ---------------------- !
   */

  it("+ ChangePassword API Successfuly", async () => {
    /**
     * * New user data
     */
    const name = "newUser"
    const username = "newUsername"
    const password = "newPassword"
    const role = Role.Member
    const hashedPassword = await argon2.hash(password)

    /**
     * * Create new user
     */
    const newUser = await prisma.users.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role,
      },
    })

    /**
     * * Login as Super user
     */
    await api.setAdminMode()

    /**
     * * Request to server
     */
    const newPassword = "123456789"
    await api.main.auth.changePassword({
      where: {
        id: newUser.id,
      },
      data: {
        newPassword,
      },
    })

    const findUser = await prisma.users.findFirstOrThrow({
      where: {
        id: newUser.id,
      },
    })
    expect(findUser.id).toBe(newUser.id)
    const isValid = await argon2.verify(findUser.password, newPassword)
    expect(isValid).toBe(true)
  })

  it("- ChangePassword API UnSuccessfuly (AccessDenied)", async () => {
    /**
     * * Login as member user
     */
    await api.setMemberMode()

    /**
     * * Request to server
     */
    try {
      await api.main.auth.changePassword({
        where: {
          id: FAKEID,
        },
        data: {
          newPassword: "123456789",
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.AccessDenied)
    }
  })

  it("- ChangePassword API UnSuccessfuly (UserNotFound)", async () => {
    /**
     * * Login as Super user
     */
    await api.setAdminMode()

    /**
     * * Request to server
     */
    try {
      await api.main.auth.changePassword({
        where: {
          id: FAKEID,
        },
        data: {
          newPassword: "123456789",
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserNotFound)
    }
  })

  it("- ChangePassword API UnSuccessfuly (UserIsNotAuthorized)", async () => {
    /**
     * * Request to server
     */
    try {
      await api.main.auth.changePassword({
        where: {
          id: FAKEID,
        },
        data: {
          newPassword: "123456789",
        },
      })
      fail("Test failed!")
    } catch (err) {
      const error = err as AxiosError
      expect(error.response?.data).toEqual(AuthErrors.UserIsNotAuthorized)
    }
  })
})
