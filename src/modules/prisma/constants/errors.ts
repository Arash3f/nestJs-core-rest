import { HttpStatus } from "@nestjs/common"
import { ModuleNames } from "@src/constants"

export const PrismaErrors = {
  FieldIsDuplicated: {
    code: 1,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.PrismaModule,
    message: "Field is duplicate",
    persianTranslation: "مقدار وارد شده تکراری است",
  },
  RowNotFound: {
    code: 2,
    statusCode: HttpStatus.BAD_REQUEST,
    module: ModuleNames.PrismaModule,
    message: "Filed not found",
    persianTranslation: "خروجی مورد نظر پیدا نشد",
  },
}
