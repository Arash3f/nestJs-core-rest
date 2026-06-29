import { idInputSchema } from "@src/common/dto/id.input"
import { roleSchema } from "@src/common/zod/prisma-role.schema"
import { z } from "zod"
import { createZodDto } from "zod-nest"

const updateUserDataSchema = z
  .object({
    username: z.string().optional(),
    active: z.boolean().optional(),
    role: roleSchema.optional(),
    name: z.string().optional(),
  })
  .strict()

export const updateUserInputSchema = z
  .object({
    where: idInputSchema,
    data: updateUserDataSchema,
  })
  .strict()
  .meta({ id: "UpdateUserInput", title: "UpdateUserInput" })

export class UpdateUserInput extends createZodDto(updateUserInputSchema) {}
