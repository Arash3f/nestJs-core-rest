import { ApiPropertyOptional } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator"
import { PaginationData } from "src/common/dto/pagination.input"
import { SortByData } from "src/common/dto/sort-by.input"

/**
 * Data transfers object to Read User Input
 */
export class ReadUserWhereData {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  id?: string

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  username?: string

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  active?: boolean
}

export class ReadUserInput {
  @Type(() => ReadUserWhereData)
  @ApiPropertyOptional({ type: ReadUserWhereData })
  @IsOptional()
  @ValidateNested()
  where?: ReadUserWhereData

  @Type(() => PaginationData)
  @ApiPropertyOptional({ type: PaginationData })
  @IsOptional()
  @ValidateNested()
  pagination?: PaginationData

  @Type(() => SortByData)
  @ApiPropertyOptional({ type: SortByData })
  @IsOptional()
  @ValidateNested()
  sortBy?: SortByData
}
