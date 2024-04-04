import { Body, Controller, Delete, Get, Post, UnauthorizedException, UseGuards } from "@nestjs/common"
import { ApiBasicAuth, ApiBearerAuth, ApiBody, ApiExtension, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { GetUserId } from "src/common/decorators/get-user-id.decorator"
import { IdInput } from "src/common/dto/id.input"
import { SuccessOutput } from "src/common/dto/success.output"
import { IsAdmin } from "src/common/guards/is-admin.guard"
import { IsLoggedIn } from "src/common/guards/is-logged-in.guard"
import { AuthService } from "src/modules/auth/auth.service"
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
	@ApiOperation({ operationId: "logIn" })
	@ApiBody({ type: LoginInput })
	@ApiResponse({ type: LoginOutput, status: 200 })
	async logIn(@Body() data: LoginInput): Promise<LoginOutput> {
		return await this.authService.logIn(data)
	}

	@Get("me")
	@ApiOperation({ operationId: "me" })
	@ApiResponse({ type: UserModel, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsLoggedIn)
	async me(@GetUserId() requesterId: string): Promise<UserModel> {
		return await this.authService.me(requesterId)
	}

	@Post("createUser")
	@ApiOperation({ operationId: "createUser" })
	@ApiBody({ type: CreateUserInput })
	@ApiResponse({ type: UserModel, status: 201 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	async createUser(@Body() data: CreateUserInput): Promise<UserModel> {
		return await this.authService.createUser(data)
	}

	@Post("readUsers")
	@ApiOperation({ operationId: "readUsers" })
	@ApiBody({ type: ReadUserInput })
	@ApiResponse({ type: ReadUserOutput, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsLoggedIn)
	async readUsers(@Body() data: ReadUserInput): Promise<ReadUserOutput> {
		return await this.authService.readUsers(data)
	}

	@Post("updateUser")
	@ApiOperation({ operationId: "updateUser" })
	@ApiBody({ type: UpdateUserInput })
	@ApiResponse({ type: UserModel, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	async updateUser(@Body() data: UpdateUserInput): Promise<UserModel> {
		return await this.authService.updateUser(data)
	}

	@Delete("deleteUser")
	@ApiOperation({ operationId: "deleteUser" })
	@ApiBody({ type: IdInput })
	@ApiResponse({ type: SuccessOutput, status: 200 })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	async deleteUser(@Body() where: IdInput): Promise<SuccessOutput> {
		return await this.authService.deleteUser(where)
	}

	@Post("changePassword")
	@ApiOperation({ operationId: "changePassword", summary: "Changes the users password", description: "asdasd" })
	@ApiBody({ type: ChangePasswordInput })
	@ApiResponse({ type: SuccessOutput, status: 200, description: "asdasd" })
	@ApiBearerAuth()
	@UseGuards(IsAdmin)
	// @ApiException(() => UnauthorizedException, { description: "asdasd" })
	async changePassword(@Body() data: ChangePasswordInput) {
		return await this.authService.changePassword(data)
	}
}
