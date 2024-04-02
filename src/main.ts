import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { NestFastifyApplication } from "@nestjs/platform-fastify"
import { FastifyAdapter } from "@nestjs/platform-fastify"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import type { ServerResponse } from "http"
import { AppModule } from "src/app.module"
import { NodeEnvType } from "src/modules/config/types/config.type"
import { EnvConfigService } from "src/modules/config/env-config.service"
import { CoreExceptionFilter } from "src/modules/error/exception.filter"
import { PrismaService } from "./modules/prisma/prisma.service"
import { JwtService } from "@nestjs/jwt"
import { TokenGuard } from "./common/guards/token.guard"

declare const module: any

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())
	const configService = app.get(EnvConfigService)

	setupGlobalValidation(app)
	// setupFastifyUpload(app)
	setupGlobalGuard(app)
	setupSwagger(app, configService)
	setupCors(app)
	
	await app.listen(configService.serverPort)

	if (module.hot) {
		module.hot.accept()
		module.hot.dispose(() => app.close())
	}

	return app
}


function setupLogger(app: NestFastifyApplication, configService: EnvConfigService) {
	app.useLogger(
		configService.nodeEnv === NodeEnvType.Development
			? ["log", "debug", "error", "verbose", "warn"]
			: [],
	)
}

// function setupFastifyUpload(app: NestFastifyApplication) {
// 	app.register(fastyfyMultipart)
// }

/**
 * Generate Swagger Api
 * @param app Nest Application object
 * @returns Swagger documentation
 */
function setupSwagger(app: NestFastifyApplication, configService: EnvConfigService) {
	const config = new DocumentBuilder()
		.setTitle("My Project APIs")
		.setDescription("The Project APIs description")
		.setVersion("1.0")
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
function setupGlobalValidation(app: NestFastifyApplication) {
	app.useGlobalFilters(new CoreExceptionFilter())
	app.useGlobalPipes(new ValidationPipe({
		transform: true,
		whitelist: true,
	}))
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
