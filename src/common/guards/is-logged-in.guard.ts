import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { AppException } from "@src/app.exception"
import { AuthenticatedRequest } from "@src/common/types/auth-request.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"

@Injectable()
export class IsLoggedInGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (!request.user) {
      throw new AppException(AuthErrors.UserIsNotAuthorized)
    }

    return true
  }
}
