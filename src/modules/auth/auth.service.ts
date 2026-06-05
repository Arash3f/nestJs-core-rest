import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Role, Users } from "@prisma/client"
import { AppException } from "@src/app.exception"
import type { SuccessOutput } from "@src/common/dto/success.output"
import { JwtPayload } from "@src/common/types/token.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import type { ChangePasswordInput } from "@src/modules/auth/dto/change-password.input"
import type { LoginInput } from "@src/modules/auth/dto/login.input"
import type { LoginOutput } from "@src/modules/auth/dto/login.output"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { UserErrors } from "@src/modules/user/constants/errors"
import * as argon2 from "argon2"

/**
 * Auth service
 */
@Injectable()
export class AuthService {
  /**
   * import services
   * @param prisma prisma service for call database
   * @param jwt jwt service for generate toekn
   */
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /**
   * * Takes the user's information and after validate the information returns the user's jwt Token
   * @param input Necessary data for login user
   * @returns User's jwt Token
   * @throws {AppException} AuthErrors.IncorrectUsernameOrPassword - When username or password incorrect
   */
  async logIn(data: LoginInput): Promise<LoginOutput> {
    const { password, username } = data

    const user = await this.verifyUserExistanceByUsername(username)
    await this.verifyUserPassword(user.passwordHash, password)
    const token = await this.generateToken(user.username, user.id, user.role)

    return { jwt: token }
  }

  /**
   * * Take the information for find user and update password
   * @param input Necessary data for update user's password
   * @returns True value or throw Error
   * @throws {AppException} UserErrors.UserNotFound - When user not found
   */
  async changePassword(input: ChangePasswordInput): Promise<SuccessOutput> {
    const {
      data: { newPassword },
      where: { id },
    } = input
    const hashedPassword = await this.generatedHashedPassword(newPassword)

    try {
      await this.prisma.users.update({
        where: { id },
        data: { passwordHash: hashedPassword },
      })

      return { success: true }
    } catch (error: unknown) {
      this.prisma.handlePrismaErrors({
        error: error,
        notFoundError: UserErrors.UserNotFound,
      })
    }
  }

  /**
   * * Hash Password
   * @param password The user's password to be Hashed
   * @returns Hashed password
   */
  async generatedHashedPassword(password: string): Promise<string> {
    return await argon2.hash(password)
  }

  /**
   * * Verify User with UserPassword
   * @param userPassword Target user password
   * @param password Target User password
   * @returns User Object or throw Error
   * @throws {AppException} AuthErrors.IncorrectUsernameOrPassword - When username or password incorrect
   */
  private async verifyUserPassword(userPassword: string, password: string): Promise<boolean> {
    const valid = await argon2.verify(userPassword, password)

    if (!valid) throw new AppException(AuthErrors.IncorrectUsernameOrPassword)

    return valid
  }

  /**
   * * Generate Token
   * @param username user username
   * @param userId user id
   * @returns user token
   */
  async generateToken(username: string, userId: string, role: Role): Promise<string> {
    const payload: JwtPayload = {
      username: username.toLowerCase(),
      role: role,
      id: userId,
    }
    return await this.jwt.signAsync(payload)
  }

  /**
   * * Verify User Existance By Username
   * @param username Target username for Verify
   * @returns User Object or throw Error
   * @throws {AppException} AuthErrors.IncorrectUsernameOrPassword - When username or password incorrect
   */
  async verifyUserExistanceByUsername(username: string): Promise<Users> {
    const user = await this.prisma.users.findUnique({
      where: {
        username: username.toLowerCase(),
      },
    })

    if (!user) throw new AppException(AuthErrors.IncorrectUsernameOrPassword)

    return user
  }
}
