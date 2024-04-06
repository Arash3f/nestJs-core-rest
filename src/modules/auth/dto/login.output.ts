import { ApiResponseProperty } from "@nestjs/swagger"
import { IsJWT } from "class-validator"

/**
 * * Data transfers object for Login Output
 */
export class LoginOutput {
    @ApiResponseProperty({ type: String })
    @IsJWT()
    jwt: string
}
