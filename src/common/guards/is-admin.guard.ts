import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { Inject } from "@nestjs/common"
import { Role } from "@prisma/client"
import type { FastifyRequest } from "fastify"
import type { TokenGuardData } from "src/common/types/token.type"
import { AuthErrors } from "src/modules/auth/constants/errors"
import { ErrorService } from "src/modules/error/error.service"

/**
 * * This guard performs user's role to be Admin
 */
export class IsAdmin implements CanActivate {
	constructor(@Inject(ErrorService) private error: ErrorService) { }

	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<FastifyRequest>()
		const tokenData = request.headers._tokenGuard as TokenGuardData

		if (tokenData?.user) {
			if (tokenData.user.role == Role.Admin) return true
		}
		throw this.error.throwErrorToClient({ errorData: AuthErrors.AccessDenied })
	}
}
