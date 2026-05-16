import { ApiResponseProperty } from "@nestjs/swagger"

/**
 * * Data transfers object to Link Output
 */
export class LinkOutput {
  /**
   * response url link field
   */
  @ApiResponseProperty({ type: String })
  url: string
}
