import { ApiPropertyOptional } from "@nestjs/swagger"
import { Role } from "@prisma/client"
import { PaginationData } from "@src/common/dto/pagination.input"
import { SortByData } from "@src/common/dto/sort-by.input"
import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator"

/**
 * Data transfers object to Read User Input
 */
export class ReadUserWhereData {
  /**
   * user id
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID()
  id?: string

  /**
   * user username
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  username?: string

  /**
   * user name
   */
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  name?: string

  /**
   * user role
   */
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role

  /**
   * user activity
   */
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  active?: boolean
}

/**
 * read user input
 */
export class ReadUserInput {
  /**
   * find target user
   */
  @Type(() => ReadUserWhereData)
  @ApiPropertyOptional({ type: ReadUserWhereData })
  @IsOptional()
  @ValidateNested()
  where?: ReadUserWhereData

  /**
   * response pagination
   */
  @Type(() => PaginationData)
  @ApiPropertyOptional({ type: PaginationData })
  @IsOptional()
  @ValidateNested()
  pagination?: PaginationData

  /**
   * response sorting
   */
  @Type(() => SortByData)
  @ApiPropertyOptional({ type: SortByData })
  @IsOptional()
  @ValidateNested()
  sortBy?: SortByData
}
