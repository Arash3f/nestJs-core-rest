import { ApiProperty } from "@nestjs/swagger"
import { PASSWORD_MIN_LENGTH } from "@src/common/constants/password"
import { IdInput } from "@src/common/dto/id.input"
import { Type } from "class-transformer"
import { IsString, MinLength, ValidateNested } from "class-validator"

export class ChangePasswordDataInput {
  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
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
