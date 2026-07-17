import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from "@nestjs/common"
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger"
import { ThrottlerGuard } from "@nestjs/throttler"
import { apiErrorResponses } from "@src/common/decorators/api-error-response.decorator"
import { GetUserId } from "@src/common/decorators/get-user-id.decorator"
import { SuccessOutput } from "@src/common/dto/success.output"
import { IsAdminGuard } from "@src/common/guards/is-admin.guard"
import { IsLoggedInGuard } from "@src/common/guards/is-logged-in.guard"
import { AuthService } from "@src/modules/auth/auth.service"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { ChangePasswordInput } from "@src/modules/auth/dto/change-password.input"
import { LoginInput } from "@src/modules/auth/dto/login.input"
import { LoginOutput } from "@src/modules/auth/dto/login.output"
import { RefreshTokenInput } from "@src/modules/auth/dto/refresh-token.input"
import { RefreshTokenOutput } from "@src/modules/auth/dto/refresh-token.output"
import { RegisterInput } from "@src/modules/auth/dto/register.input"
import { UserErrors } from "@src/modules/user/constants/errors"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("logIn")
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    operationId: "logIn",
    summary: "Login user",
  })
  @ApiBody({ type: LoginInput })
  @apiErrorResponses([AuthErrors.IncorrectUsernameOrPassword])
  @ApiResponse({ type: LoginOutput })
  async logIn(@Body() data: LoginInput): Promise<LoginOutput> {
    return await this.authService.logIn(data)
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    operationId: "register",
    summary: "Register a new member account",
    description:
      "Public self-registration. Always creates a Member and returns tokens (auto-login).",
  })
  @ApiBody({ type: RegisterInput })
  @apiErrorResponses([UserErrors.UsernameIsDuplicated])
  @ApiResponse({ type: LoginOutput, status: 201 })
  async register(@Body() data: RegisterInput): Promise<LoginOutput> {
    return await this.authService.register(data)
  }

  @Post("logout")
  @ApiOperation({
    operationId: "logout",
    summary: "logout user",
  })
  @ApiResponse({ type: SuccessOutput })
  @UseGuards(IsLoggedInGuard)
  async logout(@GetUserId() currentUserId: string): Promise<SuccessOutput> {
    return await this.authService.logout(currentUserId)
  }

  @Patch("changePassword")
  @ApiOperation({
    operationId: "changePassword",
    summary: "Update user password",
  })
  @ApiBody({ type: ChangePasswordInput })
  @ApiResponse({ type: SuccessOutput, status: 200 })
  @apiErrorResponses([UserErrors.UserNotFound])
  @UseGuards(IsAdminGuard)
  async changePassword(@Body() data: ChangePasswordInput) {
    return await this.authService.changePassword(data)
  }

  @Post("refreshToken")
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    operationId: "refreshToken",
    summary: "refresh token",
  })
  @ApiBody({ type: RefreshTokenInput })
  @ApiResponse({ type: RefreshTokenOutput, status: 201 })
  @apiErrorResponses([AuthErrors.UserIsNotAuthorized, AuthErrors.InValidRefreshToken])
  async refresh(@Body() input: RefreshTokenInput) {
    return await this.authService.refreshToken(input)
  }
}
