import type { ExecutionContext } from "@nestjs/common"
import { createParamDecorator } from "@nestjs/common"
import type { FastifyRequest } from "fastify"

/**
 * * Decorator to get the requester's Token
 */
export const GetJwtToken = createParamDecorator(
    (_data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<FastifyRequest>()
        const authorization = request.headers.authorization || ""
        const token = authorization.replace("bearer ", "").replace("jwt ", "")
        return token
    },
)
