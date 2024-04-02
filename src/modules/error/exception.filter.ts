import { HttpStatus, ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException, Logger } from "@nestjs/common"
import { NodeEnvType } from "src/modules/config/types/config.type"
import type { ErrorType } from "src/modules/error/constants/type"
import { GlobalError } from "src/modules/error/global-error"
import { Request, Response } from "express"
import { ErrorService } from "./error.service"

@Catch()
export class CoreExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const logger = new Logger(ErrorService.name)
		// TODO should be resolved from config service
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		const productMode = process.env.NODE_ENV == NodeEnvType.Production

		const ctx = host.switchToHttp()
		const context = host.switchToHttp()
		const response = context.getResponse<Response>()
		const request = ctx.getRequest<Request>()

		const errorData: ErrorType = {
			path: request.url,
			message: null,
			timestamp: new Date().toISOString(),
		}

		/**
		 * Parsing error
		 */
		if (exception instanceof GlobalError) {
			errorData.message = exception.errorContext.message
			errorData.translation = exception.errorContext.translation
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

		logger.error(errorData)

		if (productMode) {
			delete errorData.debugError
			delete errorData.code
			delete errorData.module
		}
		response.status(errorData.statusCode).send(errorData)
	}
}