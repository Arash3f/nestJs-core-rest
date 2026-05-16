import type { ExecutionContext } from "@nestjs/common"
import { createParamDecorator } from "@nestjs/common"
import type { Request } from "express"

/**
 * * Decorator to get the requester's IP
 */
export const GetIp = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>()
  const requesterIp = request.ip ?? ""
  return requesterIp.split(":")[3]
})
