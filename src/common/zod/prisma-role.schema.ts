import { Role } from "@prisma/client"
import { z } from "zod"

/** Prisma `Role` enum as a Zod schema. */
export const roleSchema = z.nativeEnum(Role)
