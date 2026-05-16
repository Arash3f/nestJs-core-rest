import { NodeEnvType } from "@src/modules/config/types/config.type"
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator"

/**
 * * Environment Class Model
 */
export class EnvConfigModel {
  /**
   * app swagger doc path
   */
  @IsString()
  swaggerDocsPath: string

  /**
   * app swagger main path
   */
  @IsString()
  swaggerPath: string

  /**
   * app server port
   */
  @IsNumber()
  serverPort: number

  /**
   * jwt secret key
   */
  @IsString()
  jwtSecret: string

  /**
   * jwt expire time
   */
  @IsNumber()
  jwtExpire: number

  /**
   * database connection url
   */
  @IsString()
  DATABASE_CONNECTION_URL: string

  /**
   * app server address
   */
  @IsString()
  serverAddress: string

  /**
   * loki server path
   */
  @IsString()
  lokiServerAddress: string

  /**
   * database name
   */
  @IsString()
  databaseName: string

  /**
   * database username
   */
  @IsString()
  databaseUsername: string

  /**
   * database password
   */
  @IsString()
  databasePassword: string

  /**
   * database port
   */
  @IsString()
  databasePort: string

  /**
   * database host
   */
  @IsString()
  databaseHost: string

  /**
   * app node env mode
   */
  @IsEnum(NodeEnvType)
  NODE_ENV: NodeEnvType

  /**
   * super user username
   */
  @IsString()
  SUPER_USER_USERNAME: string

  /**
   * super user name
   */
  @IsString()
  SUPER_USER_NAME: string

  /**
   * sure user password
   */
  @IsString()
  SUPER_USER_PASSWORD: string

  /**
   * member use username
   */
  @IsOptional()
  @IsString()
  MEMBER_USER_USERNAME?: string

  /**
   * member user name
   */
  @IsOptional()
  @IsString()
  MEMBER_USER_NAME?: string

  /**
   * member user password
   */
  @IsOptional()
  @IsString()
  MEMBER_USER_PASSWORD?: string

  /**
   * upload directory
   */
  @IsString()
  UPLOAD_DIR: string
}
