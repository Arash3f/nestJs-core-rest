import { ApiResponseProperty } from "@nestjs/swagger"

/**
 * * Data transfers object to Link Output
 */
export class LinkOutput {
	@ApiResponseProperty({ type: String })
	url: string
}
