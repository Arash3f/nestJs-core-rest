import type { PrismaClient } from "@prisma/client"
import { Role } from "@prisma/client"
import { serverAddress } from "@src/constants"
import type { EnvConfigService } from "@src/modules/config/env-config.service"
import * as argon2 from "argon2"
import axios from "axios"
import { Api as APPApi } from "swagger/Api"

/**
 * ? Helper function for app test
 */
export class TestApiCaller {
  /**
   * config service variable
   */
  private apiConfigService: EnvConfigService
  /**
   * prisma service variable
   */
  private prisma: PrismaClient

  /**
   * config server address
   */
  main = new APPApi({
    baseURL: serverAddress,
  })

  /**
   * ? fill config service object
   * @param apiConfigService app config service
   */
  setApiConfig(apiConfigService: EnvConfigService) {
    this.apiConfigService = apiConfigService
  }

  /**
   * ? fill prisma service object
   * @param apiConfigService app config service
   */
  setPrismaClient(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * ? config token as admin user
   */
  async setAdminMode() {
    const {
      data: { jwt },
    } = await this.main.auth.logIn({
      username: this.apiConfigService.defaultSuperUser.username,
      password: this.apiConfigService.defaultSuperUser.password,
    })

    this.main.instance.request = axios.create({
      headers: { authorization: "Bearer " + jwt },
    })
  }

  /**
   * ? config token as normall user
   */
  async setMemberMode() {
    const {
      data: { jwt },
    } = await this.main.auth.logIn({
      username: this.apiConfigService.defaultMemberUser.username,
      password: this.apiConfigService.defaultMemberUser.password,
    })

    this.main.instance.request = axios.create({
      headers: { authorization: "Bearer " + jwt },
    })
  }

  /**
   * ? remove token
   */
  setAnonymousMode() {
    this.main.instance.request = axios.create({
      headers: { authorization: null },
    })
  }

  /**
   * ? login user
   * @param username user's username
   * @param password user's password
   */
  async loginAs(username: string, password: string) {
    this.setAnonymousMode()

    const {
      data: { jwt },
    } = await this.main.auth.logIn({ username, password })

    this.main.instance.request = axios.create({
      headers: { authorization: "Bearer " + jwt },
    })
  }

  /**
   * ? reset database
   * ! complete this function if create new table
   */
  async resetDatabase() {
    await Promise.all([this.prisma.users.deleteMany()])
  }

  /**
   * ? create default super user
   */
  async createSuperUser() {
    const passwordHash = await argon2.hash(this.apiConfigService.defaultSuperUser.password)
    await this.prisma.users.create({
      data: {
        name: this.apiConfigService.defaultSuperUser.name,
        passwordHash,
        username: this.apiConfigService.defaultSuperUser.username,
        role: Role.Admin,
      },
    })
  }

  /**
   * ? create normall user
   */
  async createMemberUser() {
    const passwordHash = await argon2.hash(this.apiConfigService.defaultMemberUser.password)
    await this.prisma.users.create({
      data: {
        name: this.apiConfigService.defaultMemberUser.name,
        passwordHash,
        username: this.apiConfigService.defaultMemberUser.username,
      },
    })
  }
}
