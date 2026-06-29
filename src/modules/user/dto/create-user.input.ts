import { roleSchema } from "@src/common/zod/prisma-role.schema"
import { z } from "zod"
import { createZodDto } from "zod-nest"

export const createUserInputSchema = z
  .object({
    name: z.string(),
    username: z.string(),
    password: z.string(),
    role: roleSchema,
  })
  .strict()
  .meta({ id: "CreateUserInput", title: "CreateUserInput" })

export class CreateUserInput extends createZodDto(createUserInputSchema) {}
