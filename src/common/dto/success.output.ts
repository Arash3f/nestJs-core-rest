import { ApiResponseProperty } from "@nestjs/swagger"
import { IsBoolean } from "class-validator"

/**
 * * Data transfer object to Success Output
 */
export class SuccessOutput {
	@ApiResponseProperty({ type: Boolean })
	@IsBoolean()
	success: boolean
}
