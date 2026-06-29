import { Logger } from "@nestjs/common"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { envConfigKeys, envConfigSchema } from "@src/modules/config/env.schema"

/**
 * Validates environment variables against the expected configuration model.
 *
 * @param config - Raw configuration object (typically from `process.env`)
 * @returns Validated configuration object typed as `EnvConfigModel`
 *
 * @see {@link envConfigSchema} - The Zod schema with validation rules
 * @see {@link EnvConfigService} - Service that uses this validation function
 */
export function validateEnv(config: Record<string, unknown>) {
  const logger = new Logger(EnvConfigService.name)
  const envOnly = Object.fromEntries(envConfigKeys.map((key) => [key, config[key]]))
  const result = envConfigSchema.safeParse(envOnly)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""
      logger.error(`${path}${issue.message}`)
    }
    process.exit(1)
  }

  return result.data
}
