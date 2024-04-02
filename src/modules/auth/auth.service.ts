import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { Prisma, Users } from "@prisma/client"
import cleanDeep from "clean-deep"
import type { JwtPayloadType } from "src/common/types/token.type"
import type { IdInput } from "src/common/dto/id.input"
import { AuthErrors } from "src/modules/auth/constants/errors"
import type { ChangePasswordInput } from "src/modules/auth/dto/change-password.input"
import type { CreateUserInput } from "src/modules/auth/dto/create-user.input"
import type { LoginInput } from "src/modules/auth/dto/login.input"
import type { LoginOutput } from "src/modules/auth/dto/login.output"
import type { ReadUserInput } from "src/modules/auth/dto/read-user.input"
import type { ReadUserOutput } from "src/modules/auth/dto/read-user.output"
import type { UpdateUserInput } from "src/modules/auth/dto/update-user.input"
import type { UserModel } from "src/modules/auth/model/user.model"
import { ErrorService } from "src/modules/error/error.service"
import { PrismaService } from "src/modules/prisma/prisma.service"
import type { SuccessOutput } from "src/common/dto/success.output"
import hasha from "hasha"

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private error: ErrorService,
	) { }

	async logIn(data: LoginInput): Promise<LoginOutput> {
		const { password, username } = data

		const user = await this.verifyUserExistanceByUsername(username)
		await this.verifyUserPassword(user.id, password)
		const token = await this.generateToken(user.username, user.id)

		return { jwt: token }
	}

	async me(requesterId: string): Promise<UserModel> {
		const user: UserModel = await this.prisma.users.findUnique({
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
				password: false,
			},
		})

		return user
	}

	async createUser(data: CreateUserInput): Promise<UserModel> {
		const { password, username, name, role } = data
		await this.verifyDuplicateUsernameWithException(username)
		const hashedPassword = await this.generatedHashedPassword(password)

		const createUserInput: Prisma.UsersCreateInput = {
			name,
			password: hashedPassword,
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
				password: false,
			},
		})

		return user
	}

	async readUsers(entryData: ReadUserInput): Promise<ReadUserOutput> {
		console.log("123")
		
		const rawWhere = entryData.where || {}

		let whereClause: Prisma.UsersWhereInput = {
			id: rawWhere.id,
			active: rawWhere.active,
			username: { mode: "insensitive", contains: rawWhere.username },
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
				password: false,
			},
		})

		return { count, data }
	}

	async updateUser(input: UpdateUserInput): Promise<UserModel> {
		const { data, where: { id } } = input

		const user = await this.verifyUserExistanceByUserId(id)
		await this.verifyDuplicateUsernameWithException(
			data.username,
			user.username,
		)

		const updatedUser = await this.prisma.users.update({
			where: {
				id,
			},
			data: {
				name: data.name,
				username: data.username.toLowerCase(),
				active: data.active,
			},
			select: {
				id: true,
				username: true,
				active: true,
				name: true,
				role: true,
				createdDate: true,
				updatedDate: true,
				password: false,
			},
		})

		return updatedUser
	}

	async deleteUser(where: IdInput): Promise<SuccessOutput> {
		const { id } = where
		await this.verifyUserExistanceByUserId(id)

		await this.prisma.users.update({
			where: { id },
			data: { active: false },
		})

		return { success: true }
	}

	async changePassword(input: ChangePasswordInput): Promise<SuccessOutput> {
		const {
			data: { newPassword },
			where: { id },
		} = input

		await this.verifyUserExistanceByUserId(id)
		const hashedPassword =  await this.generatedHashedPassword(newPassword)

		await this.prisma.users.update({
			where: { id },
			data: { password: hashedPassword },
		})

		return { success: true }
	}

	/**
	 * * Hash Password
	 * @param password The user's password to be Hashed
	 * @returns Hashed password
	 */
	private async generatedHashedPassword(password: string): Promise<string> {
		return await hasha.async(password, { algorithm: "sha1" })
	}

	private async verifyUserPassword(userId: string, password: string): Promise<Users> {
		const hashedPassword = await this.generatedHashedPassword(password)

		const user = await this.prisma.users.findFirst({
			where: {
				id: userId,
				password: hashedPassword,
			},
		})

		if (!user) throw this.error.throwErrorToClient({ errorData: AuthErrors.IncorrectUsernameOrPassword })

		return user
	}

	private async verifyDuplicateUsernameWithException(username: string, exceptionName?: string): Promise<boolean> {
		const user = await this.prisma.users.findFirst({
			where: {
				username: username.toLowerCase(),
				NOT: {
					username: exceptionName,
				},
			},
		})

		if (user) throw this.error.throwErrorToClient({ errorData: AuthErrors.UsernameIsDuplicated })

		return true
	}

	private async verifyUserExistanceByUserId(userId: string): Promise<Users> {
		const user = await this.prisma.users.findUnique({
			where: {
				id: userId,
			},
		})

		if (!user) throw this.error.throwErrorToClient({ errorData: AuthErrors.UserNotFound })

		return user
	}

	private async verifyUserExistanceByUsername(username: string): Promise<Users> {
		const user = await this.prisma.users.findUnique({
			where: {
				username: username.toLowerCase(),
			},
		})

		if (!user) throw this.error.throwErrorToClient({ errorData: AuthErrors.IncorrectUsernameOrPassword })

		return user
	}

	private async generateToken(username: string, userId: string): Promise<string> {
		const payload: JwtPayloadType = {
			username: username.toLowerCase(),
			id: userId,
		}
		return await this.jwt.signAsync(payload)
	}
}
