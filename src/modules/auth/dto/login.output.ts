import { z } from "zod"
import { createZodDto } from "zod-nest"

export const loginOutputSchema = z
  .object({
    accessToken: z.jwt(),
    refreshToken: z.jwt(),
  })
  .strict()
  .meta({ id: "LoginOutput", title: "LoginOutput" })

export class LoginOutput extends createZodDto(loginOutputSchema) {}
