import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator"
import { IdInput } from "src/common/dto/id.input"

/**
 * * Data transfers object to Update User Input
 */
export class UpdateUserDataInput {
  @ApiProperty({ type: String })
  @IsString()
  username: string

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  active: boolean

  @ApiPropertyOptional({ enum: Role })
  @IsEnum(Role)
  @IsOptional()
  role?: Role

  @ApiProperty({ type: String })
  @IsString()
  name: string
}

export class UpdateUserInput {
  @Type(() => IdInput)
  @ApiPropertyOptional({ type: IdInput })
  @ValidateNested()
  where: IdInput

  @Type(() => UpdateUserDataInput)
  @ApiPropertyOptional({ type: UpdateUserDataInput })
  @ValidateNested()
  data: UpdateUserDataInput
}
