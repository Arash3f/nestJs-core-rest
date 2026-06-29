import { paginationDataSchema } from "@src/common/dto/pagination.input"
import { sortByDataSchema } from "@src/common/dto/sort-by.input"
import { roleSchema } from "@src/common/zod/prisma-role.schema"
import { z } from "zod"
import { createZodDto } from "zod-nest"

const readUserWhereSchema = z
  .object({
    id: z.uuid().optional(),
    username: z.string().optional(),
    name: z.string().optional(),
    role: roleSchema.optional(),
    active: z.boolean().optional(),
  })
  .strict()

export const readUserInputSchema = z
  .object({
    where: readUserWhereSchema.optional(),
    pagination: paginationDataSchema.optional(),
    sortBy: sortByDataSchema.optional(),
  })
  .strict()
  .meta({ id: "ReadUserInput", title: "ReadUserInput" })

export class ReadUserInput extends createZodDto(readUserInputSchema) {}
