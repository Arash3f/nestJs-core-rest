import { EnvType } from "@src/modules/config/types/config.type"
import { z } from "zod"

const envBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value
  if (value === "true" || value === "1") return true
  if (value === "false" || value === "0") return false
  return value
}, z.boolean())

const envNumber = z.preprocess((value) => {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? value : parsed
  }
  return value
}, z.number())

const envConfigShape = {
  SWAGGER_DOCS_PATH: z.string(),
  SWAGGER_PATH: z.string(),
  SERVER_PORT: envNumber,
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRE: envNumber,
  JWT_REFRESH_EXPIRE: envNumber,
  DATABASE_CONNECTION_URL: z.string(),
  SERVER_ADDRESS: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_USERNAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_PORT: z.string(),
  DATABASE_HOST: z.string(),
  NODE_ENV: z.nativeEnum(EnvType),
  SEED_ON_BOOT: envBoolean,
  SUPER_USER_USERNAME: z.string(),
  SUPER_USER_NAME: z.string(),
  SUPER_USER_PASSWORD: z.string(),
  MEMBER_USER_USERNAME: z.string(),
  MEMBER_USER_NAME: z.string(),
  MEMBER_USER_PASSWORD: z.string(),
  PASSWORD_HASH_MEMORY_COST: envNumber,
  PASSWORD_HASH_TIME_COST: envNumber,
  PASSWORD_HASH_PARALLELISM: envNumber,
} as const

export const envConfigKeys = Object.keys(envConfigShape)

export const envConfigSchema = z.object(envConfigShape).strict()

export type EnvConfigModel = z.infer<typeof envConfigSchema>
