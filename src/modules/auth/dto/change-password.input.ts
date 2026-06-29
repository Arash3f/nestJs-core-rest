import { idInputSchema } from "@src/common/dto/id.input"
import { z } from "zod"
import { createZodDto } from "zod-nest"

const changePasswordDataSchema = z
  .object({
    newPassword: z.string(),
  })
  .strict()

export const changePasswordInputSchema = z
  .object({
    where: idInputSchema,
    data: changePasswordDataSchema,
  })
  .strict()
  .meta({ id: "ChangePasswordInput", title: "ChangePasswordInput" })

export class ChangePasswordInput extends createZodDto(changePasswordInputSchema) {}
