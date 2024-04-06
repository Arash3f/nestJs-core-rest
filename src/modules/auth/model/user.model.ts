import { ApiResponseProperty } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { IsBoolean, IsDate, IsString, IsUUID } from "class-validator"

/**
 * * User Model Class
 */
export class UserModel {
    @ApiResponseProperty({ type: String })
    @IsUUID()
    id: string

    @ApiResponseProperty({ type: String })
    @IsString()
    name: string

    @ApiResponseProperty({ type: String })
    @IsString()
    username: string

    @ApiResponseProperty({ type: Boolean })
    @IsBoolean()
    active: boolean

    @ApiResponseProperty({ enum: Role })
    role: string

    @ApiResponseProperty({ type: Date })
    @IsDate()
    createdDate: Date

    @ApiResponseProperty({ type: Date })
    @IsDate()
    updatedDate: Date
}
