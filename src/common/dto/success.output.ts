import { z } from "zod"
import { createZodDto } from "zod-nest"

export const successOutputSchema = z
  .object({
    success: z.boolean(),
  })
  .strict()
  .meta({ id: "SuccessOutput", title: "SuccessOutput" })

export class SuccessOutput extends createZodDto(successOutputSchema) {}
