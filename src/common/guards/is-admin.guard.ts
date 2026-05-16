import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { Inject } from "@nestjs/common"
import { Role } from "@prisma/client"
import { TokenGuardData } from "@src/common/types/token.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { ErrorService } from "@src/modules/error/error.service"
import { Request } from "express"

/**
 * * This guard performs user's role to be Admin
 */
export class IsAdmin implements CanActivate {
  /**
   * Inject services
   * @param error import error Service
   */
  constructor(@Inject(ErrorService) private error: ErrorService) {}

  /**
   * ? performs user's role to be Admin
   * @param context request context
   * @returns throw error or pass user request
   * @throws {AuthErrors.AccessDenied, AuthErrors.UserIsNotAuthorized}
   */
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>()
    const tokenData = request.headers._tokenGuard as TokenGuardData

    if (tokenData?.user) {
      if (tokenData.user.role === Role.Admin) return true
      else {
        throw this.error.throwErrorToClient({
          errorData: AuthErrors.AccessDenied,
        })
      }
    }
    throw this.error.throwErrorToClient({
      errorData: AuthErrors.UserIsNotAuthorized,
    })
  }
}
