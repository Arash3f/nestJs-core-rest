import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common"
import { applyDecorators, UseInterceptors } from "@nestjs/common"
import { SetMetadata } from "@nestjs/common"
import { Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { FileFastifyInterceptor } from "fastify-file-interceptor"
import { DateTime } from "luxon"
import { diskStorage } from "multer"
import path from "path"
import { EnvConfigService } from "src/modules/config/env-config.service"

/**
 * @param options Necessary data for config upload multer
 * @returns
 * @example
 * ```ts
 *		/@Post("uploadFile")
 *		/@ApiOperation({ operationId: "uploadFile" })
 *		/@ApiResponse({ type: LinkOtput })
 *		/@FileUploader({"fieldName", "my-file"})
 *		uploadFile(@UploadedFile() file: Express.Multer.File) {
 *			return this.multerService.uploadFile(file);
 *		}
 * }
 * ```
 */

@Injectable()
export class FileUploaderInterceptor implements NestInterceptor {
	fileInterceptor: NestInterceptor
	constructor(
		private config: EnvConfigService,
		private reflector: Reflector) { }

	intercept(context: ExecutionContext, next: CallHandler) {
		const filesDestination = this.reflector.get<string>("directory", context.getHandler()) || this.config.uploadDirectory
		const fieldName = this.reflector.get<string>("fieldName", context.getHandler())

		const multerOptions = {
			storage: diskStorage({
				destination: filesDestination,
				filename: fileNameExtractor,
			}),
		}

		const InterceptorFactory = FileFastifyInterceptor(fieldName, multerOptions)
		const interceptor = new InterceptorFactory()

		return interceptor.intercept(context, next)
	}
}

export function FileUploader(options: FileUploadOptions) {
	return applyDecorators(
		SetMetadata("fieldName", options.fieldName),
		UseInterceptors(FileUploaderInterceptor),
	)
}

function fileNameExtractor(
	_req: Express.Request,
	file: Express.Multer.File,
	callback: (error: Error | null, filename: string) => void) {
	const currentDate = DateTime.now().toSeconds()

	const filename = `${currentDate}_${path
		.parse(file.originalname)
		.name.replace(/\s/g, "")}`

	const extention: string = path.extname(file.originalname)

	callback(null, `${filename}${extention}`)
}

type FileUploadOptions = {
	// TODO add valid example in comments
	fieldName: string
	directory?: string
}
