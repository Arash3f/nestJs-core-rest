import { ApiProperty } from "@nestjs/swagger"
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@src/common/constants/password"
import { IdInput } from "@src/common/dto/id.input"
import { Type } from "class-transformer"
import { IsString, MaxLength, MinLength, ValidateNested } from "class-validator"

export class ChangePasswordDataInput {
  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
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
