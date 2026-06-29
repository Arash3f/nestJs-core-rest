import { z } from "zod"
import { createZodDto } from "zod-nest"

export const refreshTokenInputSchema = z
  .object({
    refreshToken: z.jwt(),
  })
  .strict()
  .meta({ id: "RefreshTokenInput", title: "RefreshTokenInput" })

export class RefreshTokenInput extends createZodDto(refreshTokenInputSchema) {}
