import { ApiResponseProperty } from "@nestjs/swagger"
import { UserModel } from "@src/modules/user/model/user.model"
import { Type } from "class-transformer"
import { IsArray, IsNumber, ValidateNested } from "class-validator"

/**
 * * Data transfers object to Read User Output
 */
export class ReadUserOutput {
  /**
   * users count
   */
  @ApiResponseProperty({ type: Number })
  @IsNumber()
  count: number

  /**
   * users list
   */
  @ApiResponseProperty({ type: [UserModel] })
  @IsArray()
  @Type(() => UserModel)
  @ValidateNested()
  data: UserModel[]
}
