import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { Inject } from "@nestjs/common"
import { TokenGuardData } from "@src/common/types/token.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { ErrorService } from "@src/modules/error/error.service"
import { Request } from "express"

/**
 * * This guard verifies requester's token to have valid token
 *
 * ! Note : In our's structure to generate token, we save user object in requester's header see {@link TokenGuard}
 *
 * ? So we check user object for verify token
 */
export class IsLoggedIn implements CanActivate {
  /**
   * Inject services
   * @param error import error Service
   */
  constructor(@Inject(ErrorService) private error: ErrorService) {}

  /**
   * ? verifies requester's token to have valid token
   * @param context request context
   * @returns throw error or pass user validation
   * @throws {AuthErrors.UserIsNotAuthorized}
   */
  canActivate(context: ExecutionContext) {
    let result = false

    const request = context.switchToHttp().getRequest<Request>()
    const tokenData = request.headers._tokenGuard as TokenGuardData

    /**
     * ? Verify requester user
     */
    if (tokenData?.user) result = true
    else {
      throw this.error.throwErrorToClient({
        errorData: AuthErrors.UserIsNotAuthorized,
      })
    }

    return result
  }
}
