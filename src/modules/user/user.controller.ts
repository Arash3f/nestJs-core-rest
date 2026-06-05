import { Body, Controller, Delete, Get, Post, UseGuards } from "@nestjs/common"
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { apiErrorResponses } from "@src/common/decorators/api-error-response.decorator"
import { GetUserId } from "@src/common/decorators/get-user-id.decorator"
import { IdInput } from "@src/common/dto/id.input"
import { SuccessOutput } from "@src/common/dto/success.output"
import { IsAdminGuard } from "@src/common/guards/is-admin.guard"
import { IsLoggedInGuard } from "@src/common/guards/is-logged-in.guard"
import { UserErrors } from "@src/modules/user/constants/errors"
import { CreateUserInput } from "@src/modules/user/dto/create-user.input"
import { ReadUserInput } from "@src/modules/user/dto/read-user.input"
import { ReadUserOutput } from "@src/modules/user/dto/read-user.output"
import { UpdateUserInput } from "@src/modules/user/dto/update-user.input"
import { UserModel } from "@src/modules/user/model/user.model"
import { UserService } from "@src/modules/user/user.service"

/**
 * User Controller
 */
@ApiTags("User")
@Controller("user")
export class UserController {
  /**
   * Import service
   * @param userService Import User service
   */
  constructor(private userService: UserService) {}

  /**
   * * return the requester informations by requester Token
   * @param requesterId Get the userId from the Token
   * @returns User informations
   */
  @Get("me")
  @ApiOperation({
    operationId: "me",
    summary: "Get my information",
    description: "return the requester informations by requester Token",
  })
  @ApiResponse({
    type: UserModel,
    status: 200,
  })
  @UseGuards(IsLoggedInGuard)
  @apiErrorResponses([UserErrors.UserNotFound])
  async me(@GetUserId() requesterId: string): Promise<UserModel> {
    return await this.userService.me(requesterId)
  }

  /**
   * * Takes the user's information and after validate the information create new User
   * @param data Necessary data for create user
   * @returns New User informations or throw error
   * @throws {UsernameIsDuplicated}
   */
  @Post("createUser")
  @ApiOperation({
    operationId: "createUser",
    summary: "Create new user",
    description: "Takes the user's information and after validate the information create new User",
  })
  @ApiBody({ type: CreateUserInput })
  @ApiResponse({
    type: UserModel,
    status: 201,
  })
  @UseGuards(IsAdminGuard)
  @apiErrorResponses([UserErrors.UsernameIsDuplicated])
  async createUser(@Body() data: CreateUserInput): Promise<UserModel> {
    return await this.userService.createUser(data)
  }

  /**
   * * Takes the information for search and sends the found items
   * @param data Information for search, pagination, sort
   * @returns Users found
   */
  @Post("readUsers")
  @ApiOperation({
    operationId: "readUsers",
    summary: "Found users",
    description: "Takes the information for search and sends the found items",
  })
  @ApiBody({ type: ReadUserInput })
  @ApiResponse({
    type: ReadUserOutput,
    status: 200,
  })
  @UseGuards(IsLoggedInGuard)
  async readUsers(@Body() data: ReadUserInput): Promise<ReadUserOutput> {
    return await this.userService.readUsers(data)
  }

  /**
   * * Takes the necessary information for update user and sends the updated user
   * @param data Necessary data for update user
   * @returns Updated user Information or throw error
   * @throws {UserNotFound, UsernameIsDuplicated}
   */
  @Post("updateUser")
  @ApiOperation({
    operationId: "updateUser",
    summary: "Updated user",
    description: "Takes the necessary information for update user and sends the updated use",
  })
  @ApiBody({ type: UpdateUserInput })
  @ApiResponse({
    type: UserModel,
    status: 200,
  })
  @UseGuards(IsAdminGuard)
  @apiErrorResponses([UserErrors.UserNotFound])
  @apiErrorResponses([UserErrors.UsernameIsDuplicated])
  async updateUser(@Body() data: UpdateUserInput): Promise<UserModel> {
    return await this.userService.updateUser(data)
  }

  /**
   * * Take the information for find user and delete it
   * @param where Information for find the user
   * @returns True value or throw Error
   * @throws {UserNotFound}
   */
  @Delete("deleteUser")
  @ApiOperation({
    operationId: "deleteUser",
    summary: "Delete user",
    description: "Take the information for find user and delete it",
  })
  @ApiBody({ type: IdInput })
  @ApiResponse({
    type: SuccessOutput,
    status: 200,
  })
  @UseGuards(IsAdminGuard)
  @apiErrorResponses([UserErrors.UserNotFound])
  async deleteUser(@Body() where: IdInput): Promise<SuccessOutput> {
    return await this.userService.deleteUser(where)
  }
}
