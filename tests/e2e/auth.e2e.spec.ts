import type { INestApplication } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { Test } from "@nestjs/testing"
import { Role } from "@prisma/client"
import { AppModule } from "@src/app.module"
import { CoreExceptionFilter } from "@src/common/filters/core-exception.filter"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { UserErrors } from "@src/modules/user/constants/errors"
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

    app.useGlobalFilters(new CoreExceptionFilter(apiConfig))

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
        passwordHash: hashedPassword,
      },
    })

    /**
     * * Test login Api
     */
    await api.main.auth.logIn({
      username,
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
        passwordHash: hashedPassword,
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
      console.log(err)
      const error = err as AxiosError
      expect(error.response?.data).toMatchObject(AuthErrors.IncorrectUsernameOrPassword)
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
        passwordHash: hashedPassword,
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
    const isValid = await argon2.verify(findUser.passwordHash, newPassword)
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
      expect(error.response?.data).toMatchObject(AuthErrors.AccessDenied)
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
      expect(error.response?.data).toMatchObject(UserErrors.UserNotFound)
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
      expect(error.response?.data).toMatchObject(AuthErrors.UserIsNotAuthorized)
    }
  })
})
