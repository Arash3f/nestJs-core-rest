import { Logger } from "@nestjs/common"
import { plainToInstance } from "class-transformer"
import { validateSync } from "class-validator"

import { EnvConfigService } from "./env-config.service"
import { EnvConfigModel } from "./model/env-config.model"

/**
 * Validates environment variables against the expected configuration model.
 *
 * @description
 * This function performs runtime validation of environment variables using
 * class-validator decorators defined in `EnvConfigModel`. If validation fails,
 * it logs all errors and terminates the application with exit code 1.
 *
 * @param config - Raw configuration object (typically from `process.env`)
 * @returns Validated configuration object typed as `EnvConfigModel`
 *
 * @see {@link EnvConfigModel} - The configuration model with validation rules
 * @see {@link EnvConfigService} - Service that uses this validation function
 */
export function validateEnv(config: Record<string, unknown>): EnvConfigModel {
  const logger = new Logger(EnvConfigService.name)

  const validatedConfig = plainToInstance(EnvConfigModel, config, {
    enableImplicitConversion: true,
  })
  const validationErrors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (validationErrors.length > 0) {
    validationErrors.forEach((err) => {
      if (err.constraints) {
        const errorMessage = Object.values(err.constraints)
        errorMessage.forEach((error) => logger.error(error))
      } else {
        logger.error(`Validation error in property: ${err.property}`)
      }
    })

    process.exit(1)
  }
  return validatedConfig
}
