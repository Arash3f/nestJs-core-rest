import { z } from "zod"
import { createZodDto } from "zod-nest"

export const linkOutputSchema = z
  .object({
    url: z.string(),
  })
  .strict()
  .meta({ id: "LinkOutput", title: "LinkOutput" })

export class LinkOutput extends createZodDto(linkOutputSchema) {}
