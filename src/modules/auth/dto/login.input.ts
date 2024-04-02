import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

/**
 * Data transfers object for Login Input
 */
export class LoginInput {
  @ApiProperty({ type: String })
  @IsString()
  username: string

  @ApiProperty({ type: String })
  @IsString()
  password: string
}
