import { applyZodNest } from "zod-nest"
import { NestFactory } from "@nestjs/core"
import { JwtService } from "@nestjs/jwt"
import type { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "@src/app.module"
import { CoreExceptionFilter } from "@src/common/filters/core-exception.filter"
import { TokenGuard } from "@src/common/guards/token.guard"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { EnvType } from "@src/modules/config/types/config.type"
import type { IncomingMessage, ServerResponse } from "http"

/**
 * main function for run app
 * @returns App
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(EnvConfigService)

  setupGlobalPipesAndFilters(app, configService)
  setupGlobalGuard(app)
  setupSwagger(app, configService)
  setupCors(app)
  setupLogger(app, configService)

  /**
   * Trust the first proxy hop.
   *
   * @remarks
   * Useful when running behind a reverse proxy (e.g., Nginx) so that
   * `req.ip` and related fields can be resolved correctly.
   */
  app.set("trust proxy", 1)

  await app.listen(configService.serverPort, configService.serverAddress)

  return app
}

/**
 * Configures NestJS logger levels based on the runtime environment.
 *
 * @param app - NestJS application instance.
 * @param configService - Configuration provider.
 *
 * @remarks
 * - Development: enables detailed logs.
 * - Other environments: restricts output to warnings/errors.
 */
function setupLogger(app: NestExpressApplication, configService: EnvConfigService) {
  app.useLogger(
    configService.nodeEnv === EnvType.Development
      ? ["log", "debug", "error", "verbose", "warn"]
      : ["error", "warn"],
  )
}

/**
 * Configures Swagger (OpenAPI) for the application.
 *
 * @param app - NestJS application instance.
 * @param configService - Configuration provider.
 *
 * @remarks
 * Exposes:
 * - Swagger UI at `configService.swaggerPath`
 * - Raw OpenAPI JSON at `/{configService.swaggerDocsPath}`
 *
 * @returns The generated OpenAPI document.
 */
function setupSwagger(app: NestExpressApplication, configService: EnvConfigService) {
  const config = new DocumentBuilder()
    .setTitle("My Project APIs")
    .setDescription("The Project APIs description")
    .setVersion("1.0")
    .addBearerAuth()
    .build()

  const rawDocument = SwaggerModule.createDocument(app, config)
  const document = applyZodNest(rawDocument)

  SwaggerModule.setup(configService.swaggerPath, app, document)

  app.use(`/${configService.swaggerDocsPath}`, (_req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(document))
  })

  return document
}

/**
 * Enables Cross-Origin Resource Sharing (CORS).
 *
 * @param app - NestJS application instance.
 */
function setupCors(app: NestExpressApplication) {
  app.enableCors()
}

/**
 * Registers the global exception filter.
 *
 * @param app - NestJS application instance.
 * @param configService - Configuration provider.
 *
 * @remarks
 * `ZodValidationPipe` and `ZodSerializerInterceptor` are registered globally via
 * `ZodNestModule.forRoot()` in `AppModule`.
 */
function setupGlobalPipesAndFilters(app: NestExpressApplication, configService: EnvConfigService) {
  app.useGlobalFilters(new CoreExceptionFilter(configService))
}

/**
 * Configures and registers global guards for the NestJS application.
 *
 * @description
 * This function sets up global guards that will be applied to all routes
 * across the entire application. Currently, it registers the `TokenGuard`
 * to handle JWT token validation and authentication for every incoming request.
 *
 * @param app - The NestJS Express application instance
 *
 * @see {@link TokenGuard} - The guard being registered globally
 */
function setupGlobalGuard(app: NestExpressApplication) {
  const jwtService = app.get(JwtService)
  app.useGlobalGuards(new TokenGuard(jwtService))
}

void bootstrap()
