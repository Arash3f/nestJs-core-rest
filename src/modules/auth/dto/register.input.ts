import { z } from "zod"
import { createZodDto } from "zod-nest"

export const registerInputSchema = z
  .object({
    name: z.string(),
    username: z.string(),
    password: z.string(),
  })
  .strict()
  .meta({ id: "RegisterInput", title: "RegisterInput" })

export class RegisterInput extends createZodDto(registerInputSchema) {}
