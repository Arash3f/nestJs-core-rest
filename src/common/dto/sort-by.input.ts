import { z } from "zod"
import { createZodDto } from "zod-nest"

export const sortByDataSchema = z
  .object({
    field: z.string().optional(),
    descending: z.boolean().default(true).optional(),
  })
  .strict()
  .meta({ id: "SortByData", title: "SortByData" })

export class SortByData extends createZodDto(sortByDataSchema) {}

export type SortByDataInput = z.infer<typeof sortByDataSchema>
