import { ApiResponseProperty } from "@nestjs/swagger"

/**
 * Data transfer object to Success Output
 */
export class SuccessOutput {
  @ApiResponseProperty({ type: Boolean })
  success: boolean
}
