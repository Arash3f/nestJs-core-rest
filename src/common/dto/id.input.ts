import { z } from "zod"
import { createZodDto } from "zod-nest"

export const idInputSchema = z
  .object({
    id: z.uuid(),
  })
  .strict()
  .meta({ id: "IdInput", title: "IdInput" })

export class IdInput extends createZodDto(idInputSchema) {}
