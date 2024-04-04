import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsString, ValidateNested } from "class-validator"
import { IdInput } from "src/common/dto/id.input"

/**
 * * Data transfers object to Change Password Input
 */
export class ChangePasswordDataInput {
  @ApiProperty({ type: String })
  @IsString()
  newPassword: string
}

export class ChangePasswordInput {
  @Type(() => IdInput)
  @ApiProperty({ type: IdInput })
  @ValidateNested()
  where: IdInput

  @Type(() => ChangePasswordDataInput)
  @ApiProperty({ type: ChangePasswordDataInput })
  @ValidateNested()
  data: ChangePasswordDataInput
}
