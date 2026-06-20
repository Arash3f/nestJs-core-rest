import { ApiProperty } from "@nestjs/swagger"
import { IsJWT } from "class-validator"

export class RefreshTokenInput {
  @ApiProperty({ type: String })
  @IsJWT()
  refreshToken: string
}
