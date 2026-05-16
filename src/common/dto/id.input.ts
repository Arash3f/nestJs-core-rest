import { ApiProperty } from "@nestjs/swagger"
import { IsUUID } from "class-validator"

/**
 * * Data transfers object to Id Input
 */
export class IdInput {
  /**
   * response id
   */
  @ApiProperty({ type: String })
  @IsUUID()
  id: string
}
