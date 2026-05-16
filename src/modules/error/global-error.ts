import { BadRequestException } from "@nestjs/common"
import type { ErrorInfo } from "@src/modules/error/constants/type"

/**
 * * Create new error exception for Override Project Errors
 */
export class GlobalError extends BadRequestException {
  /**
   * ? nothing
   * @param errorContext error contex
   * @param error default error obj
   */
  constructor(
    public errorContext: ErrorInfo,
    public error?: Error,
  ) {
    super(errorContext)
  }
}
