import type { ExecutionContext } from "@nestjs/common"
import { createParamDecorator } from "@nestjs/common"
import type { FastifyRequest } from "fastify"
/**
 * * Decorator to get the requester's IP
 */
export const GetIp = createParamDecorator((_data: unknown, context: ExecutionContext) => {
	const request = context.switchToHttp().getRequest<FastifyRequest>()
	const requesterIp = request.ip
	return requesterIp.split(":")[3]
})
