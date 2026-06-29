import { userModelSchema } from "@src/modules/user/model/user.model"
import { z } from "zod"
import { createZodDto } from "zod-nest"

export const readUserOutputSchema = z
  .object({
    count: z.number(),
    data: z.array(userModelSchema),
  })
  .strict()
  .meta({ id: "ReadUserOutput", title: "ReadUserOutput" })

export class ReadUserOutput extends createZodDto(readUserOutputSchema) {}
