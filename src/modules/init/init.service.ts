import { Injectable, Logger } from "@nestjs/common"
import { AuthService } from "src/modules/auth/auth.service"
import type { ErrorInfo } from "src/modules/error/constants/type"
import { ErrorService } from "src/modules/error/error.service"

@Injectable()
export class InitService {
	constructor(
		private error: ErrorService) { }

	private readonly logger = new Logger(AuthService.name)

	/**
	 * Generate all project errors
	 * @param projectErrors Collection of errors
	 * @returns The result of the operation
	 */
	generateProjectErrors(projectErrors: ErrorInfo[]): boolean {
		for (const errInfo of projectErrors) {
			this.error.createNewErrorTranslation(errInfo)
		}
		this.logger.log("All project errors were created Successfully")

		return true
	}
}
