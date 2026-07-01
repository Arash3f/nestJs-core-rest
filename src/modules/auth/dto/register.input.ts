import { ApiProperty } from "@nestjs/swagger"
import { PASSWORD_MIN_LENGTH } from "@src/common/constants/password"
import { IsString, MinLength } from "class-validator"

/**
 * Data transfer object for public self-registration.
 *
 * Intentionally has no `role` field: registration always creates a `Member`
 * (the role is forced server-side), so a visitor can't sign themselves up as
 * an Admin. Creating users with an explicit role stays an admin-only operation
 * on `POST /user/createUser`.
 */
export class RegisterInput {
  /**
   * user name
   */
  @ApiProperty({ type: String })
  @IsString()
  name: string

  /**
   * user username
   */
  @ApiProperty({ type: String })
  @IsString()
  username: string

  /**
   * user password
   */
  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  password: string
}
