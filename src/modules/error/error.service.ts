import { HttpStatus, Injectable } from "@nestjs/common"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import type {
    CreateErrorInput,
    ErrorInfo,
    FindErrorInput,
    TranslationMapRecordType,
} from "@src/modules/error/constants/type"
import { GlobalError } from "@src/modules/error/global-error"

@Injectable()
export class ErrorService {
    /**
     * ! All project errors are saved in this object
     */
    private translationMap: TranslationMapRecordType = {}

    /**
     * * Generate new Translation for Error
     * @param errInfo Target error for generate
     * @returns The result of the operation
     */
    createNewErrorTranslation(errInfo: ErrorInfo): boolean {
        errInfo.statusCode = errInfo.statusCode || HttpStatus.BAD_REQUEST
        this.translationMap[errInfo.module] =
            this.translationMap[errInfo.module] || {}
        this.translationMap[errInfo.module][errInfo.code] = errInfo
        return true
    }

    /**
     * * Find error in translationMap
     * @param error Target Error
     * @returns Error found or null
     */
    private findErrorTranslation(error: FindErrorInput): ErrorInfo {
        const { code, module } = error
        return this.translationMap[module]
            ? this.translationMap[module][code]
            : null
    }

    /**
     * * Throw error to Client
     * @param errorData Target error data
     * @returns Throw Error to Client
     * @example
     * ```ts
     * Location: In auth.service.ts
     * export class AuthService {
     *
     *      constructor(
     *          private error: ErrorService,
     *      ) {}
     *
     *      private async verifyUserExistanceByUserId(userId: string): Promise<Users> {
     *          const user = await this.prisma.users.findUnique({
     *              where: {
     *                  id: userId,
     *              },
     *          });
     *
     *          if (!user) throw this.error.throwErrorToClient({ errorData: AuthErrors.UserNotFound });
     *
     *          return user;
     *      }
     *
     * }
     * ```
     */
    throwErrorToClient({
        errorData,
    }: {
        errorData: CreateErrorInput
        developerMessage?: string
    }): GlobalError {
        const { code, error, module } = errorData
        const candidateError =
            this.findErrorTranslation({ module, code }) ||
            this.findErrorTranslation(AuthErrors.UserIsNotAuthorized)
        candidateError.developerMessage = candidateError.developerMessage || ""

        return new GlobalError(candidateError, error)
    }
}
