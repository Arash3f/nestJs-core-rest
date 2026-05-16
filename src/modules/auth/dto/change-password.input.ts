import { ApiProperty } from "@nestjs/swagger"
import { IdInput } from "@src/common/dto/id.input"
import { Type } from "class-transformer"
import { IsString, ValidateNested } from "class-validator"

/**
 * * Data transfers object to Change Password Input
 */
export class ChangePasswordDataInput {
  /**
   * user new password
   */
  @ApiProperty({ type: String })
  @IsString()
  newPassword: string
}

/**
 * change password input
 */
export class ChangePasswordInput {
  /**
   * find target user
   */
  @Type(() => IdInput)
  @ApiProperty({ type: IdInput })
  @ValidateNested()
  where: IdInput

  /**
   * update data
   */
  @Type(() => ChangePasswordDataInput)
  @ApiProperty({ type: ChangePasswordDataInput })
  @ValidateNested()
  data: ChangePasswordDataInput
}
