import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { CreateUserInput } from "@src/modules/auth/dto/create-user.input"
import { EnvConfigModel } from "@src/modules/config/model/env-config.model"
import type { ConfigDatabaseType, EnvType } from "@src/modules/config/types/config.type"

import { Role } from "../auth/model/user.model"

/**
 * Config Service
 */
@Injectable()
export class EnvConfigService {
  /**
   * import config sevice
   * @param configService app config service
   */
  constructor(private configService: ConfigService<EnvConfigModel>) {}

  get DATABASE_CONNECTION_URL(): string {
    return this.configService.getOrThrow("DATABASE_CONNECTION_URL")
  }

  get swaggerDocsPath(): string {
    return this.configService.getOrThrow("SWAGGER_DOCS_PATH")
  }

  get swaggerPath(): string {
    return this.configService.getOrThrow("SWAGGER_PATH")
  }

  get serverPort(): number {
    return this.configService.getOrThrow("SERVER_PORT")
  }

  get jwtSecret(): string {
    return this.configService.getOrThrow("JWT_SECRET")
  }

  get jwtExpire(): number {
    return this.configService.getOrThrow("JWT_ACCESS_EXPIRE")
  }

  get jwtRefreshExpire(): number {
    return this.configService.getOrThrow("JWT_REFRESH_EXPIRE")
  }

  get serverAddress(): string {
    return this.configService.getOrThrow("SERVER_ADDRESS")
  }

  get seedOnBoot(): boolean {
    return this.configService.getOrThrow("SEED_ON_BOOT")
  }

  get nodeEnv(): EnvType {
    const nodeEnv: EnvType = this.configService.getOrThrow("NODE_ENV")
    return nodeEnv
  }

  get databaseConfig(): ConfigDatabaseType {
    const dbConfig: ConfigDatabaseType = {
      connectionUrl: this.configService.getOrThrow("DATABASE_CONNECTION_URL"),
      name: this.configService.getOrThrow("DATABASE_NAME"),
      username: this.configService.getOrThrow("DATABASE_USERNAME"),
      password: this.configService.getOrThrow("DATABASE_PASSWORD"),
      port: this.configService.getOrThrow("DATABASE_PORT"),
      host: this.configService.getOrThrow("DATABASE_HOST"),
    }
    return dbConfig
  }

  get defaultSuperUser(): CreateUserInput {
    const defaultUserData: CreateUserInput = {
      name: this.configService.getOrThrow("SUPER_USER_NAME"),
      username: this.configService.getOrThrow("SUPER_USER_USERNAME"),
      password: this.configService.getOrThrow("SUPER_USER_PASSWORD"),
      role: Role.Admin,
    }
    return defaultUserData
  }

  get defaultMemberUser(): CreateUserInput {
    const defaultUserData: CreateUserInput = {
      name: this.configService.getOrThrow("MEMBER_USER_NAME"),
      username: this.configService.getOrThrow("MEMBER_USER_USERNAME"),
      password: this.configService.getOrThrow("MEMBER_USER_PASSWORD"),
      role: Role.Member,
    }
    return defaultUserData
  }
}
