import type { Role } from "@prisma/client"

/**
 * * This type is used to generate jwt token without any field
 */
export type JwtPayload = {
  id: string
  role: Role
  username?: string
  iat?: number
  exp?: number
}
