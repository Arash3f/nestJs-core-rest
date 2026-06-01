import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common"
import { Role } from "@prisma/client"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import * as argon2 from "argon2"

@Injectable()
export class InitService implements OnApplicationBootstrap {
  /**
   * generate logger library
   */
  private readonly logger = new Logger(InitService.name)

  /**
   * Import app services
   * @param error error service for generate errors
   * @param prisma prisma service for connect to database
   */
  constructor(
    // private error: ErrorService,
    private prisma: PrismaService,
    private readonly envConf: EnvConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.envConf.seedOnBoot !== true) return

    this.logger.verbose("Seed Admin user started ...")
    await this.seedAdmin()

    this.logger.verbose("Seed Member user started ...")
    await this.seedNormalUser()

    this.logger.verbose("Seed service finished :)")
  }

  // /**
  //  * * Generate all project errors
  //  * @param projectErrors Collection of errors
  //  * @returns The result of the operation
  //  */
  // generateProjectErrors(projectErrors: ErrorInfo[]): boolean {
  //   for (const errInfo of projectErrors) {
  //     this.error.createNewErrorTranslation(errInfo)
  //   }
  //   this.logger.log("All project errors were created Successfully")

  //   return true
  // }

  private async seedAdmin() {
    const name = this.envConf.defaultSuperUser.name
    const username = this.envConf.defaultSuperUser.username
    const password = this.envConf.defaultSuperUser.password

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.envConf.memoryCost,
      timeCost: this.envConf.timeCost,
      parallelism: this.envConf.parallelism,
    })

    await this.prisma.users.upsert({
      where: { username },
      update: {
        name,
        username,
        passwordHash,
        role: Role.Admin,
        active: true,
      },
      create: {
        name,
        username,
        passwordHash,
        role: Role.Admin,
        active: true,
      },
    })
  }

  private async seedNormalUser() {
    const memberUser = this.envConf.defaultMemberUser
    if (memberUser === null) return

    const { name, username, password } = memberUser

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.envConf.memoryCost,
      timeCost: this.envConf.timeCost,
      parallelism: this.envConf.parallelism,
    })

    await this.prisma.users.upsert({
      where: { username },
      update: {
        name,
        passwordHash,
        role: Role.Member,
        active: true,
      },
      create: {
        name,
        username,
        passwordHash,
        role: Role.Member,
        active: true,
      },
    })
  }
}
