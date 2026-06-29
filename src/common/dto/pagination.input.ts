import { z } from "zod"
import { createZodDto } from "zod-nest"

export const paginationDataSchema = z
  .object({
    take: z.number().int().min(0).max(200).default(10).optional(),
    skip: z.number().int().min(0).default(0).optional(),
  })
  .strict()
  .meta({ id: "PaginationData", title: "PaginationData" })

export class PaginationData extends createZodDto(paginationDataSchema) {}
