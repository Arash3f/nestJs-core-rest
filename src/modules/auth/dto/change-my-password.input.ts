import { ApiProperty } from "@nestjs/swagger"
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@src/common/constants/password"
import { IsString, MaxLength, MinLength } from "class-validator"

/**
 * Self-service password change input.
 *
 * Unlike the admin-only `changePassword` (which resets any user's password by
 * id), this requires the requester to prove ownership by supplying their current
 * password before the new one is accepted.
 */
export class ChangeMyPasswordInput {
  @ApiProperty({ type: String })
  @IsString()
  currentPassword: string

  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  newPassword: string
}
