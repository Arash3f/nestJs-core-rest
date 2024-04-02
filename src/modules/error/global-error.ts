import type { ErrorInfo } from "src/modules/error/constants/type"

/**
 * Create new error exception for Override Project Errors
 */
export class GlobalError extends Error {
  constructor(public errorContext: ErrorInfo, public error?: Error) {
    super(errorContext.message)
  }
}
