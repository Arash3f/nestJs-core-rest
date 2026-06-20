import { createParamDecorator, type ExecutionContext } from "@nestjs/common"
import { AppException } from "@src/app.exception"
import type { AuthenticatedRequest } from "@src/common/types/request.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"

/**
 * Param decorator that returns the authenticated user's ID from `req.user`.
 *
 * @remarks
 * Relies on {@link TokenGuard} (registered globally) having populated `req.user`.
 * Throws `AppException(AuthErrors.UserIsNotAuthorized)` when `req.user?.id` is absent,
 * so it doubles as a "must be logged in" assertion at the param level.
 *
 * @returns The authenticated user's ID.
 * @throws {AppException} `AuthErrors.UserIsNotAuthorized` when no authenticated user is present.
 *
 * @example
 * ```ts
 * @Post("createPost")
 * createPost(@GetUserId() userId: string, @Body() input: CreatePostInput) {}
 * ```
 */
export const GetUserId = createParamDecorator<unknown, string>(
  (_data: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>()

    const userId = req.user?.id

    if (!userId) {
      throw new AppException(AuthErrors.UserIsNotAuthorized)
    }

    return userId
  },
)
