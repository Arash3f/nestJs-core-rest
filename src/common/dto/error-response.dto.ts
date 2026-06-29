import { ModuleNames } from "@src/constants"
import { z } from "zod"
import { createZodDto } from "zod-nest"

export const appExceptionResponseSchema = z
  .object({
    statusCode: z.number(),
    message: z.string(),
    persianTranslation: z.string(),
    developerMessage: z.string().optional(),
    code: z.number(),
    module: z.nativeEnum(ModuleNames),
    timestamp: z.string(),
    path: z.string(),
  })
  .strict()
  .meta({ id: "AppExceptionResponse", title: "AppExceptionResponse" })

/** Standardized error body shape returned by the global exception filter. */
export class AppExceptionResponseDto extends createZodDto(appExceptionResponseSchema) {}
