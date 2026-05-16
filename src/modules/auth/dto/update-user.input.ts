import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { IdInput } from "@src/common/dto/id.input"
import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator"

/**
 * * Data transfers object to Update User Input
 */
export class UpdateUserDataInput {
  /**
   * user username
   */
  @ApiProperty({ type: String })
  @IsString()
  username: string

  /**
   * user activity
   */
  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active: boolean

  /**
   * user role
   */
  @ApiPropertyOptional({ enum: Role })
  @IsEnum(Role)
  @IsOptional()
  role?: Role

  /**
   * user name
   */
  @ApiProperty({ type: String })
  @IsString()
  name: string
}

/**
 * update use input
 */
export class UpdateUserInput {
  /**
   * find target user
   */
  @Type(() => IdInput)
  @ApiPropertyOptional({ type: IdInput })
  @ValidateNested()
  where: IdInput

  /**
   * update data
   */
  @Type(() => UpdateUserDataInput)
  @ApiPropertyOptional({ type: UpdateUserDataInput })
  @ValidateNested()
  data: UpdateUserDataInput
}
