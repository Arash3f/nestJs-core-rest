import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import type { NestFastifyApplication } from "@nestjs/platform-fastify"
import { FastifyAdapter } from "@nestjs/platform-fastify"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "@src/app.module"
import { TokenGuard } from "@src/common/guards/token.guard"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { NodeEnvType } from "@src/modules/config/types/config.type"
import { CoreExceptionFilter } from "@src/modules/error/exception.filter"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import type { ServerResponse } from "http"

declare const module: any

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(),
    )
    const configService = app.get(EnvConfigService)

    setupGlobalValidation(app, configService)
    setupGlobalGuard(app)
    setupSwagger(app, configService)
    setupCors(app)
    setupLogger(app, configService)

    await app.listen(configService.serverPort)

    if (module.hot) {
        module.hot.accept()
        module.hot.dispose(() => app.close())
    }

    return app
}

function setupLogger(
    app: NestFastifyApplication,
    configService: EnvConfigService,
) {
    app.useLogger(
        configService.nodeEnv === NodeEnvType.Development
            ? ["log", "debug", "error", "verbose", "warn"]
            : [],
    )
}

/**
 * Generate Swagger Api
 * @param app Nest Application object
 * @returns Swagger documentation
 */
function setupSwagger(
    app: NestFastifyApplication,
    configService: EnvConfigService,
) {
    const config = new DocumentBuilder()
        .setTitle("My Project APIs")
        .setDescription("The Project APIs description")
        .setVersion("1.0")
        .addBearerAuth()
        .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup(configService.swaggerPath, app, document)
    app.use(`/${configService.swaggerDocsPath}`, (_, res: ServerResponse) =>
        res.end(JSON.stringify(document)),
    )
    return document
}

/**
 * Enable Cors
 * @param app Nest Application object
 */
function setupCors(app: NestFastifyApplication) {
    app.enableCors()
}

/**
 * Set Global Validation
 * @param app
 */
function setupGlobalValidation(
    app: NestFastifyApplication,
    configService: EnvConfigService,
) {
    app.useGlobalFilters(new CoreExceptionFilter(configService))
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
        }),
    )
}

/**
 * Use global guard for all client requests
 * @param app Nest Application object
 */
function setupGlobalGuard(app: NestFastifyApplication) {
    const prismaService = app.get(PrismaService)
    const jwtService = app.get(JwtService)
    const apiConfigService = app.get(EnvConfigService)
    app.useGlobalGuards(
        new TokenGuard(jwtService, prismaService, apiConfigService),
    )
}

bootstrap()
