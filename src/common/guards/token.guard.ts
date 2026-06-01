import type { CanActivate, ExecutionContext } from "@nestjs/common"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { AuthenticatedRequest, RequestUser } from "@src/common/types/auth-request.type"
import { JwtPayload } from "@src/common/types/token.type"
import { getJwtFromRequest } from "@src/common/utils/jwt-extract.util"

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>()

    const token = getJwtFromRequest(req)
    if (!token) return true

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)

      const user: RequestUser = {
        id: payload.id,
        username: payload.username,
        role: payload.role,
      }

      req.user = user
    } catch {
      return true
    }

    return true
  }
}
