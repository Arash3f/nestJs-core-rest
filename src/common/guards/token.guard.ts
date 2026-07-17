import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { AuthenticatedRequest, JwtPayload, RequestUser } from "@src/common/types/request.type"
import { getJwtFromRequest } from "@src/common/utils/jwt-extract.util"

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verifies the bearer JWT and attaches its user identity to the request.
   *
   * Non-blocking by design: it never rejects the request. A missing, malformed, or invalid
   * token simply leaves `req.user` unset; downstream guards enforce authorization.
   *
   * @param context - The execution context for the incoming request.
   * @returns `true` always.
   */
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = getJwtFromRequest(req)

    if (!token) return true

    try {
      const payload = this.jwtService.verify<JwtPayload>(token)
      const userPayload: RequestUser = {
        id: payload.id,
        username: payload.username,
      }

      req.user = userPayload
    } catch {
      return true
    }

    return true
  }
}
