import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "@src/constants"

export const AuthErrors = {
  UserIsNotAuthorized: {
    code: 1,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.AuthModule,
    message: "User is not authorized",
    persianTranslation: "ابتدا وارد شوید",
  },
  AccessDenied: {
    code: 2,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.AuthModule,
    message: "Access denied",
    persianTranslation: "دسترسی داده نشد",
  },
  UsernameIsDuplicated: {
    code: 1,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.AuthModule,
    message: "Username is duplicate",
    persianTranslation: "نام کاربری تکراری است",
  },
  UserNotFound: {
    code: 2,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.AuthModule,
    message: "User not found",
    persianTranslation: "کاربر پیدا نشد",
  },
  InactiveUser: {
    code: 3,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.AuthModule,
    message: "User is inactive",
    persianTranslation: "کاربر غیر فعال است",
  },
  IncorrectUsernameOrPassword: {
    code: 4,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.AuthModule,
    message: "The username or password is incorrect",
    persianTranslation: "نام کاربری یا پسورد اشتباه است",
  },
}
