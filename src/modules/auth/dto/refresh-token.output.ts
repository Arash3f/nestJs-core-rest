import { z } from "zod"
import { createZodDto } from "zod-nest"

export const refreshTokenOutputSchema = z
  .object({
    accessToken: z.jwt(),
    refreshToken: z.jwt(),
  })
  .strict()
  .meta({ id: "RefreshTokenOutput", title: "RefreshTokenOutput" })

export class RefreshTokenOutput extends createZodDto(refreshTokenOutputSchema) {}
