import { ApiProperty } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@src/common/constants/password"
import { IsEnum, IsString, MaxLength, MinLength } from "class-validator"

/**
 * Data transfers object to Create User Input
 */
export class CreateUserInput {
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
  @ApiProperty({ type: String, minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string

  /**
   * user role
   */
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role
}
