import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { Injectable } from "@nestjs/common"
import { Role } from "@prisma/client"
import { AppException } from "@src/app.exception"
import { AuthenticatedRequest } from "@src/common/types/auth-request.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"

@Injectable()
export class IsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>()

    if (!req.user) {
      throw new AppException(AuthErrors.UserIsNotAuthorized)
    }

    if (req.user.role !== Role.Admin) {
      throw new AppException(AuthErrors.AccessDenied)
    }

    return true
  }
}
