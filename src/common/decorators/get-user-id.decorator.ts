import type { ExecutionContext } from "@nestjs/common"
import { createParamDecorator, UnauthorizedException } from "@nestjs/common"
import type { TokenGuardData } from "@src/common/types/token.type"
import type { Request } from "express"

/**
 * * Decorator to get the requester's UserId
 *
 * ! Note: this decorator does not authenticate requester
 */
export const GetUserId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>()

  const tokenGuardData = request.headers._tokenGuard as TokenGuardData

  if (!tokenGuardData) {
    throw new UnauthorizedException("Authentication data not found. Ensure TokenGuard is applied.")
  }

  if (!tokenGuardData.user?.id) {
    throw new UnauthorizedException("User ID not found in authentication data.")
  }

  return tokenGuardData.user.id
})
