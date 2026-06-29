import { roleSchema } from "@src/common/zod/prisma-role.schema"
import { z } from "zod"
import { createZodDto } from "zod-nest"

export const userModelSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    username: z.string(),
    active: z.boolean(),
    role: roleSchema,
    createdDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
  })
  .strict()
  .meta({ id: "UserModel", title: "UserModel" })

export class UserModel extends createZodDto(userModelSchema) {}
