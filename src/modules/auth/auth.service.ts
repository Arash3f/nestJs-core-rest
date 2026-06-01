import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { Prisma, Role, Users } from "@prisma/client"
import { AppException } from "@src/app.exception"
import type { IdInput } from "@src/common/dto/id.input"
import type { SuccessOutput } from "@src/common/dto/success.output"
import { JwtPayload } from "@src/common/types/token.type"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import type { ChangePasswordInput } from "@src/modules/auth/dto/change-password.input"
import type { CreateUserInput } from "@src/modules/auth/dto/create-user.input"
import type { LoginInput } from "@src/modules/auth/dto/login.input"
import type { LoginOutput } from "@src/modules/auth/dto/login.output"
import type { ReadUserInput } from "@src/modules/auth/dto/read-user.input"
import type { ReadUserOutput } from "@src/modules/auth/dto/read-user.output"
import type { UpdateUserInput } from "@src/modules/auth/dto/update-user.input"
import type { UserModel } from "@src/modules/auth/model/user.model"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import * as argon2 from "argon2"
import cleanDeep from "clean-deep"

/**
 * Auth service
 */
@Injectable()
export class AuthService {
  /**
   * import services
   * @param prisma prisma service for call database
   * @param jwt jwt service for generate toekn
   * @param error error service for throw error
   */
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  /**
   * * Takes the user's information and after validate the information returns the user's jwt Token
   * @param input Necessary data for login user
   * @returns User's jwt Token
   * @throws {IncorrectUsernameOrPassword}
   */
  async logIn(data: LoginInput): Promise<LoginOutput> {
    const { password, username } = data

    const user = await this.verifyUserExistanceByUsername(username)
    await this.verifyUserPassword(user.passwordHash, password)
    const token = await this.generateToken(user.username, user.id, user.role)

    return { jwt: token }
  }

  /**
   * * return the requester informations by requester Token
   * @param requesterId Get the userId from the Token
   * @returns User informations
   */
  async me(requesterId: string): Promise<UserModel> {
    const user = await this.prisma.users.findUnique({
      where: {
        id: requesterId,
      },
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })

    if (!user) {
      throw new AppException(AuthErrors.UserNotFound)
    }

    return user
  }

  /**
   * * Takes the user's information and after validate the information create new User
   * @param input Necessary data for create user
   * @returns New User informations or throw error
   * @throws {UsernameIsDuplicated}
   */
  async createUser(data: CreateUserInput): Promise<UserModel> {
    const { password, username, name, role } = data
    await this.verifyDuplicateUsernameWithException(username)
    const hashedPassword = await this.generatedHashedPassword(password)

    const createUserInput: Prisma.UsersCreateInput = {
      name,
      passwordHash: hashedPassword,
      username: username.toLowerCase(),
      role,
    }

    const user = await this.prisma.users.create({
      data: createUserInput,
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })

    return user
  }

  /**
   * * Takes the information for search and sends the found items
   * @param input Information for search, pagination, sort
   * @returns Users found
   */
  async readUsers(entryData: ReadUserInput): Promise<ReadUserOutput> {
    const rawWhere = entryData.where || {}

    let whereClause: Prisma.UsersWhereInput = {
      id: rawWhere.id,
      active: rawWhere.active,
      username: {
        mode: "insensitive",
        contains: rawWhere.username,
      },
      name: { mode: "insensitive", contains: rawWhere.name },
      role: rawWhere.role,
    }

    whereClause = cleanDeep(whereClause)

    const count = await this.prisma.users.count({ where: whereClause })
    const data = await this.prisma.users.findMany({
      where: whereClause,
      ...entryData?.sortBy?.convertToPrismaFilter(),
      ...entryData?.pagination?.convertToPrismaFilter(),
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })

    return { count, data }
  }

  /**
   * * Takes the necessary information for update user and sends the updated user
   * @param input Necessary data for update user
   * @returns Updated user Information or throw error
   * @throws {UserNotFound, UsernameIsDuplicated}
   */
  async updateUser(input: UpdateUserInput): Promise<UserModel> {
    const {
      data,
      where: { id },
    } = input

    const user = await this.verifyUserExistanceByUserId(id)
    await this.verifyDuplicateUsernameWithException(data.username, user.username)

    const updatedUser = await this.prisma.users.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        username: data.username.toLowerCase(),
        active: data.active,
        role: data.role,
      },
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })

    return updatedUser
  }

  /**
   * * Take the information for find user and delete it
   * @param where Information for find the user
   * @returns True value or throw Error
   * @throws {UserNotFound}
   */
  async deleteUser(where: IdInput): Promise<SuccessOutput> {
    const { id } = where
    await this.verifyUserExistanceByUserId(id)

    await this.prisma.users.update({
      where: { id },
      data: { active: false },
    })

    return { success: true }
  }

  /**
   * * Take the information for find user and update password
   * @param input Necessary data for update user's password
   * @returns True value or throw Error
   * @throws {UserNotFound}
   */
  async changePassword(input: ChangePasswordInput): Promise<SuccessOutput> {
    const {
      data: { newPassword },
      where: { id },
    } = input

    await this.verifyUserExistanceByUserId(id)
    const hashedPassword = await this.generatedHashedPassword(newPassword)

    await this.prisma.users.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    })

    return { success: true }
  }

  /**
   * * Hash Password
   * @param password The user's password to be Hashed
   * @returns Hashed password
   */
  private async generatedHashedPassword(password: string): Promise<string> {
    return await argon2.hash(password)
  }

  /**
   * * Verify User with UserPassword
   * @param userPassword Target user password
   * @param password Target User password
   * @returns User Object or throw Error
   * @throws {IncorrectUsernameOrPassword}
   */
  private async verifyUserPassword(userPassword: string, password: string): Promise<boolean> {
    const valid = await argon2.verify(userPassword, password)

    if (!valid) throw new AppException(AuthErrors.IncorrectUsernameOrPassword)

    return valid
  }

  /**
   * * Verify duplicate username with exception name
   * @param username Target username for Verify
   * @param exceptionName The username that should not be considered in the verification operation (Optional)
   * @returns result of operation
   * @throws {UsernameIsDuplicated}
   */
  private async verifyDuplicateUsernameWithException(
    username: string,
    exceptionName?: string,
  ): Promise<boolean> {
    const user = await this.prisma.users.findFirst({
      where: {
        username: username.toLowerCase(),
        NOT: {
          username: exceptionName,
        },
      },
    })

    if (user) throw new AppException(AuthErrors.UsernameIsDuplicated)

    return true
  }

  /**
   * * Verify User Existance By UserID
   * @param userId Target User Id for Verify Existance
   * @returns User Object or throw Error
   * @throws {UserNotFound}
   */
  private async verifyUserExistanceByUserId(userId: string): Promise<Users> {
    const user = await this.prisma.users.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) throw new AppException(AuthErrors.UserNotFound)

    return user
  }

  /**
   * * Verify User Existance By Username
   * @param username Target username for Verify
   * @returns User Object or throw Error
   * @throws {IncorrectUsernameOrPassword}
   */
  private async verifyUserExistanceByUsername(username: string): Promise<Users> {
    const user = await this.prisma.users.findUnique({
      where: {
        username: username.toLowerCase(),
      },
    })

    if (!user) throw new AppException(AuthErrors.IncorrectUsernameOrPassword)

    return user
  }

  /**
   * * Generate Token
   * @param username user username
   * @param userId user id
   * @returns user token
   */
  private async generateToken(username: string, userId: string, role: Role): Promise<string> {
    const payload: JwtPayload = {
      username: username.toLowerCase(),
      role: role,
      id: userId,
    }
    return await this.jwt.signAsync(payload)
  }
}
