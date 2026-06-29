import { z } from "zod"
import { createZodDto } from "zod-nest"

export const updateMeInputSchema = z
  .object({
    name: z.string().optional(),
    username: z.string().optional(),
  })
  .strict()
  .meta({ id: "UpdateMeInput", title: "UpdateMeInput" })

export class UpdateMeInput extends createZodDto(updateMeInputSchema) {}
