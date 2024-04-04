import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common"
import { Request, Response } from "express"
import { EnvConfigService } from "src/modules/config/env-config.service"
import { NodeEnvType } from "src/modules/config/types/config.type"
import type { ErrorType } from "src/modules/error/constants/type"
import { ErrorService } from "src/modules/error/error.service"
import { GlobalError } from "src/modules/error/global-error"

@Catch()
export class CoreExceptionFilter implements ExceptionFilter {

	constructor(private config : EnvConfigService) { }

	catch(exception: unknown, host: ArgumentsHost) {
		const logger = new Logger(ErrorService.name)
		const ctx = host.switchToHttp()
		const context = host.switchToHttp()
		const response = context.getResponse<Response>()
		const request = ctx.getRequest<Request>()

		const errorData: ErrorType = {
			path: request.url,
			message: null,
			persianTranslation: null,
			developerMessage: null,
			code: null,
			statusCode: null,
			debugError: null,
			timestamp: new Date().toISOString(),
		}

		/**
		 * ? Parsing error
		 */
		if (exception instanceof GlobalError) {
			errorData.message = exception.errorContext.message
			errorData.persianTranslation = exception.errorContext.persianTranslation
			errorData.developerMessage = exception.errorContext.developerMessage
			errorData.statusCode = exception.errorContext.statusCode
			errorData.debugError = exception.error
			errorData.code = exception.errorContext.code
			errorData.module = exception.errorContext.module
		}
		else if (exception instanceof Error) {
			errorData.message = exception.message
			errorData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
			errorData.debugError = exception
		}
		else if (typeof exception == "string") {
			errorData.message = exception
			errorData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
			errorData.debugError = new Error(exception)
		}
		else {
			errorData.message = exception as string
			errorData.statusCode = HttpStatus.INTERNAL_SERVER_ERROR
			errorData.debugError = new Error(errorData.message)
		}

		if (this.config.nodeEnv == NodeEnvType.Production) {
			delete errorData.debugError
			delete errorData.developerMessage
		} else if (this.config.nodeEnv == NodeEnvType.Development) {
			logger.error(errorData)
		}
		response.status(errorData.statusCode).send(errorData)
	}
}