import { IsEnum, IsNumber, IsString } from "class-validator"
import { NodeEnvType } from "src/modules/config/types/config.type"

/**
 * * Environment Class Model
 */
export class EnvConfigModel {
    @IsString()
    swaggerDocsPath: string

    @IsString()
    swaggerPath: string

    @IsNumber()
    serverPort: number

    @IsString()
    jwtSecret: string

    @IsNumber()
    jwtExpire: number

    @IsString()
    DATABASE_CONNECTION_URL: string

    @IsString()
    databaseName: string

    @IsString()
    databaseUsername: string

    @IsString()
    databasePassword: string

    @IsString()
    databasePort: string

    @IsString()
    databaseHost: string

    @IsString()
    uploadDirectory: string

    @IsString()
    backupCronPattern: string

    @IsString()
    backupDirectory: string

    @IsEnum(NodeEnvType)
    NODE_ENV: NodeEnvType

    @IsString()
    SUPER_USER_USERNAME: string

    @IsString()
    SUPER_USER_NAME: string

    @IsString()
    SUPER_USER_PASSWORD: string
}
