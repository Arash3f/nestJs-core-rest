import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { SuccessOutput } from "@src/common/dto/success.output"
import { IsAdminGuard } from "@src/common/guards/is-admin.guard"
import { AuthService } from "@src/modules/auth/auth.service"
import { ChangePasswordInput } from "@src/modules/auth/dto/change-password.input"
import { LoginInput } from "@src/modules/auth/dto/login.input"
import { LoginOutput } from "@src/modules/auth/dto/login.output"

/**
 * Auth Controller
 */
@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  /**
   * Import service
   * @param authService Import Auth service
   */
  constructor(private authService: AuthService) {}

  /**
   * * Takes the user's information and after validate the information returns the user's jwt Token
   * @param input Necessary data for login user
   * @returns User's jwt Token
   * @throws {IncorrectUsernameOrPassword}
   */
  @Post("logIn")
  @ApiOperation({
    operationId: "logIn",
    summary: "Login user",
    description:
      "Takes the user's information and after validate the information returns the user's jwt Token",
  })
  @ApiBody({ type: LoginInput })
  @ApiResponse({ type: LoginOutput, status: 200 })
  async logIn(@Body() data: LoginInput): Promise<LoginOutput> {
    return await this.authService.logIn(data)
  }

  /**
   * * Take the information for find user and update password
   * @param input Necessary data for update user's password
   * @returns True value or throw Error
   * @throws {UserNotFound}
   */
  @Post("changePassword")
  @ApiOperation({
    operationId: "changePassword",
    summary: "Update user password",
    description: "Take the information for find user and update password",
  })
  @ApiBody({ type: ChangePasswordInput })
  @ApiResponse({ type: SuccessOutput, status: 200 })
  @UseGuards(IsAdminGuard)
  async changePassword(@Body() data: ChangePasswordInput) {
    return await this.authService.changePassword(data)
  }
}
