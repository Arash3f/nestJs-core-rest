import { applyDecorators } from "@nestjs/common"
import { ApiResponse } from "@nestjs/swagger"
import type { AppErrorDescriptor } from "@src/app.exception"

import { AppExceptionResponseDto } from "../dto/error-response.dto"

/**
 * Groups errors by HTTP status code and creates Swagger documentation responses
 *
 * This utility function takes an array of application error descriptors, groups them
 * by their HTTP status codes, and generates a single `ApiResponse` decorator for
 * each unique status code. This prevents duplicate status code entries in Swagger
 * documentation while still documenting all possible errors.
 *
 * @param errors - Array of application error descriptors to document
 * @returns A combined decorator that applies all generated ApiResponse decorators
 *
 * @example
 * ```typescript
 * // Apply on a route — errors with the same status code are merged into one ApiResponse
 * @apiErrorResponses([
 *   MinioErrors.FileNotFound,         // statusCode: 404
 *   MinioErrors.FileIsNotPending,     // statusCode: 400
 *   MinioErrors.FileNotFoundInStorage // statusCode: 404 (merged with FileNotFound)
 * ])
 * @Post("downloadFile")
 * downloadFile(@Body() input: DownloadFileInput) {}
 * ```
 */
export function apiErrorResponses(errors: AppErrorDescriptor[]) {
  // Group errors by status code
  const groupedErrors = errors.reduce(
    (acc, error) => {
      if (!acc[error.statusCode]) {
        acc[error.statusCode] = []
      }
      acc[error.statusCode].push(error)
      return acc
    },
    {} as Record<number, AppErrorDescriptor[]>,
  )

  // Create one ApiResponse per status code, using the grouped errors as the example list
  const decorators = Object.entries(groupedErrors).map(([statusCode, errorGroup]) =>
    ApiResponse({
      status: Number(statusCode),
      type: AppExceptionResponseDto,
      example: errorGroup,
    }),
  )

  return applyDecorators(...decorators)
}
