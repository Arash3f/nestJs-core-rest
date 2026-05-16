import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "@src/app.module"
import { TokenGuard } from "@src/common/guards/token.guard"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { NodeEnvType } from "@src/modules/config/types/config.type"
import { CoreExceptionFilter } from "@src/modules/error/exception.filter"
import { PrismaService } from "@src/modules/prisma/prisma.service"
// import promBundle from "express-prom-bundle"
import type { ServerResponse } from "http"

/**
 * Hot Module Replacement interface for Webpack
 */
interface HotModule {
  hot: {
    accept: () => void
    dispose: (callback: () => Promise<void> | void) => void
  }
}

/**
 * use for hot mode
 */
declare const module: HotModule

/**
 * * main function for run app
 * @returns App
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(EnvConfigService)

  setupGlobalValidation(app, configService)

  // setupPorm(app)
  setupGlobalGuard(app)
  setupSwagger(app, configService)
  setupCors(app)
  setupLogger(app, configService)

  await app.listen(configService.serverPort, configService.serverAddress)

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }

  return app
}

// /**
//  * * Config prom
//  * @param app Nest Application object
//  */
// function setupPorm(app: NestExpressApplication) {
//   const metricsMiddleware = promBundle({
//     includeMethod: true,
//     includePath: true,
//     includeStatusCode: true,

//     promClient: {
//       collectDefaultMetrics: {},
//     },

//     metricsPath: "/metrics",
//   })

//   app.use(metricsMiddleware)
// }

/**
 * * Config project logger
 * @param app Nest Application object
 * @param configService Application Env object
 */
function setupLogger(app: NestExpressApplication, configService: EnvConfigService) {
  app.useLogger(
    configService.nodeEnv === NodeEnvType.Development
      ? ["log", "debug", "error", "verbose", "warn"]
      : [],
  )
}

/**
 * * Generate Swagger Api
 * @param app Nest Application object
 * @param configService Application Env object
 * @returns Swagger documentation
 */
function setupSwagger(app: NestExpressApplication, configService: EnvConfigService) {
  const config = new DocumentBuilder()
    .setTitle("My Project APIs")
    .setDescription("The Project APIs description")
    .setVersion("1.0")
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup(configService.swaggerPath, app, document)
  app.use(`/${configService.swaggerDocsPath}`, (_req: Request, res: ServerResponse) =>
    res.end(JSON.stringify(document)),
  )
  return document
}

/**
 * * Enable Cors
 * @param app Nest Application object
 */
function setupCors(app: NestExpressApplication) {
  app.enableCors()
}

/**
 * * Set Global Validation
 * @param app Nest Application object
 * @param configService Application Env object
 */
function setupGlobalValidation(app: NestExpressApplication, configService: EnvConfigService) {
  app.useGlobalFilters(new CoreExceptionFilter(configService))
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )
}

/**
 * * Use global guard for all client requests
 * @param app Nest Application object
 */
function setupGlobalGuard(app: NestExpressApplication) {
  const prismaService = app.get(PrismaService)
  const jwtService = app.get(JwtService)
  const apiConfigService = app.get(EnvConfigService)
  app.useGlobalGuards(new TokenGuard(jwtService, prismaService, apiConfigService))
}

void bootstrap()
