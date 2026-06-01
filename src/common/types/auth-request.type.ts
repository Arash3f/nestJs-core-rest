import type { Role } from "@prisma/client"
import type { Request } from "express"

export type RequestUser = {
  id: string
  username?: string
  role: Role
}

export type AuthenticatedRequest = Request & {
  user?: RequestUser
}
