import { z } from "zod"
import { createZodDto } from "zod-nest"

export const loginInputSchema = z
  .object({
    username: z.string(),
    password: z.string(),
  })
  .strict()
  .meta({ id: "LoginInput", title: "LoginInput" })

export class LoginInput extends createZodDto(loginInputSchema) {}
