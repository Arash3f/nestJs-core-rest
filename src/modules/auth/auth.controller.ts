import { ApiException } from "@nanogiants/nestjs-swagger-api-exception-decorator"
import { BadRequestException, Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody,ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { GetUserId } from "src/common/decorators/get-user-id.decorator"
import { IdInput } from "src/common/dto/id.input"
import { SuccessOutput } from "src/common/dto/success.output"
import { IsAdmin } from "src/common/guards/is-admin.guard"
import { IsLoggedIn } from "src/common/guards/is-logged-in.guard"
import { AuthService } from "src/modules/auth/auth.service"
import { AuthErrors } from "src/modules/auth/constants/errors"
import { ChangePasswordInput } from "src/modules/auth/dto/change-password.input"
import { CreateUserInput } from "src/modules/auth/dto/create-user.input"
import { LoginInput } from "src/modules/auth/dto/login.input"
import { LoginOutput } from "src/modules/auth/dto/login.output"
import { ReadUserInput } from "src/modules/auth/dto/read-user.input"
import { ReadUserOutput } from "src/modules/auth/dto/read-user.output"
import { UpdateUserInput } from "src/modules/auth/dto/update-user.input"
import { UserModel } from "src/modules/auth/model/user.model"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) { }

	@Post("logIn")
	@ApiOperation({ operationId: "logIn", summary: "Login user", description: "Takes the user's information and after validate the information returns the user's jwt Token" })	
	@ApiBody({ type: LoginInput })
	@ApiResponse({ type: LoginOutput, status: 200 })
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.IncorrectUsernameOrPassword]})
	async logIn(@Body() data: LoginInput): Promise<LoginOutput> {
		return await this.authService.logIn(data)
	}

	@Get("me")
	@ApiOperation({ operationId: "me", summary: "Get my information", description: "return the requester informations by requester Token" })
	@ApiResponse({ type: UserModel, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsLoggedIn)
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.UserIsNotAuthorized]})
	async me(@GetUserId() requesterId: string): Promise<UserModel> {
		return await this.authService.me(requesterId)
	}

	@Post("createUser")
	@ApiOperation({ operationId: "createUser", summary: "Create new user", description: "Takes the user's information and after validate the information create new User" })
	@ApiBody({ type: CreateUserInput })
	@ApiResponse({ type: UserModel, status: 201 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.UsernameIsDuplicated, AuthErrors.AccessDenied, AuthErrors.UserIsNotAuthorized]})
	async createUser(@Body() data: CreateUserInput): Promise<UserModel> {
		return await this.authService.createUser(data)
	}

	@Post("readUsers")
	@ApiOperation({ operationId: "readUsers", summary: "Found users", description: "Takes the information for search and sends the found items" })
	@ApiBody({ type: ReadUserInput })
	@ApiResponse({ type: ReadUserOutput, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsLoggedIn)
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.UserIsNotAuthorized]})
	async readUsers(@Body() data: ReadUserInput): Promise<ReadUserOutput> {
		return await this.authService.readUsers(data)
	}

	@Post("updateUser")
	@ApiOperation({ operationId: "updateUser", summary: "Updated user", description: "Takes the necessary information for update user and sends the updated use" })
	@ApiBody({ type: UpdateUserInput })
	@ApiResponse({ type: UserModel, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.UserNotFound, AuthErrors.UsernameIsDuplicated, AuthErrors.AccessDenied, AuthErrors.UserIsNotAuthorized]})
	async updateUser(@Body() data: UpdateUserInput): Promise<UserModel> {
		return await this.authService.updateUser(data)
	}

	@Delete("deleteUser")
	@ApiOperation({ operationId: "deleteUser", summary: "Delete user", description: "Take the information for find user and delete it" })
	@ApiBody({ type: IdInput })
	@ApiResponse({ type: SuccessOutput, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.UserNotFound, AuthErrors.AccessDenied, AuthErrors.UserIsNotAuthorized]})
	async deleteUser(@Body() where: IdInput): Promise<SuccessOutput> {
		return await this.authService.deleteUser(where)
	}

	@Post("changePassword")
	@ApiOperation({ operationId: "changePassword", summary: "Update user password", description: "Take the information for find user and update password" })
	@ApiBody({ type: ChangePasswordInput })
	@ApiResponse({ type: SuccessOutput, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	@ApiException(() => [new BadRequestException], {template: [AuthErrors.UserNotFound, AuthErrors.AccessDenied, AuthErrors.UserIsNotAuthorized]})
	async changePassword(@Body() data: ChangePasswordInput) {
		return await this.authService.changePassword(data)
	}
}
