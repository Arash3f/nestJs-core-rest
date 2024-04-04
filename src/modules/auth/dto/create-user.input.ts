import { ApiProperty } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { IsEnum, IsString } from "class-validator"

/**
 * * Data transfers object to Create User Input
 */
export class CreateUserInput {
  @ApiProperty({ type: String })
  @IsString()
  name: string

  @ApiProperty({ type: String })
  @IsString()
  username: string

  /**
   * * No length limit
   */
  @ApiProperty({ type: String })
  @IsString()
  password: string

  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role
}
