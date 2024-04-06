import type { ExecutionContext } from "@nestjs/common"
import { createParamDecorator } from "@nestjs/common"
import { TokenGuardData } from "@src/common/types/token.type"
import type { FastifyRequest } from "fastify"

/**
 * * Decorator to get the requester's UserId
 *
 * ! Note: this decorator does not authenticate requester
 */
export const GetUserId = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<FastifyRequest>()
        const tokenGuardData = request.headers._tokenGuard as TokenGuardData
        const userId = tokenGuardData.user.id
        return userId
    },
)
