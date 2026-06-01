import { EnvType } from "@src/modules/config/types/config.type"
import { IsBoolean, IsEnum, IsNumber, IsString } from "class-validator"

/**
 * Environment Class Model
 */
export class EnvConfigModel {
  @IsString()
  SWAGGER_DOCS_PATH: string

  @IsString()
  SWAGGER_PATH: string

  @IsNumber()
  SERVER_PORT: number

  @IsString()
  JWT_SECRET: string

  @IsNumber()
  JWT_ACCESS_EXPIRE: number

  @IsNumber()
  JWT_REFRESH_EXPIRE: number

  @IsString()
  DATABASE_CONNECTION_URL: string

  @IsString()
  SERVER_ADDRESS: string

  @IsString()
  DATABASE_NAME: string

  @IsString()
  DATABASE_USERNAME: string

  @IsString()
  DATABASE_PASSWORD: string

  @IsString()
  DATABASE_PORT: string

  @IsString()
  DATABASE_HOST: string

  @IsEnum(EnvType)
  NODE_ENV: EnvType

  @IsBoolean()
  SEED_ON_BOOT: boolean

  @IsString()
  SUPER_USER_USERNAME: string

  @IsString()
  SUPER_USER_NAME: string

  @IsString()
  SUPER_USER_PASSWORD: string

  @IsString()
  MEMBER_USER_USERNAME: string

  @IsString()
  MEMBER_USER_NAME: string

  @IsString()
  MEMBER_USER_PASSWORD: string
}
