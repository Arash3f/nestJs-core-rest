import { ApiResponseProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsArray, IsNumber, ValidateNested } from "class-validator"
import { UserModel } from "src/modules/auth/model/user.model"

/**
 * * Data transfers object to Read User Output
 */
export class ReadUserOutput {
    @ApiResponseProperty({ type: Number })
    @IsNumber()
    count: number

    @ApiResponseProperty({ type: [UserModel] })
    @IsArray()
    @Type(() => UserModel)
    @ValidateNested()
    data: UserModel[]
}
