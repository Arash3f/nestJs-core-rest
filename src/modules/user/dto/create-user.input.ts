import { ApiProperty } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { IsEnum, IsString } from "class-validator"

/**
 * * Data transfers object to Create User Input
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
   *
   * ! No length limit
   */
  @ApiProperty({ type: String })
  @IsString()
  password: string

  /**
   * user role
   */
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role
}
