import { ApiPropertyOptional } from "@nestjs/swagger"
import { convertPaginationToPrismaFilter } from "@src/modules/prisma/utils/pagination.convert"
import { IsNumber, IsOptional, Max, Min } from "class-validator"

/**
 * Data transfer object for Pagination Input
 */
export class PaginationData {
  @ApiPropertyOptional({
    type: Number,
    default: 10,
    minimum: 0,
    maximum: 200,
  })
  @IsOptional()
  @Min(0)
  @Max(200)
  @IsNumber()
  take?: number = 10

  @ApiPropertyOptional({
    type: Number,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Min(0)
  @IsNumber()
  skip?: number = 0

  /**
   * Prepares the final `{ take, skip }` object for a Prisma pagination filter.
   *
   * @returns a Prisma pagination fragment with the resolved `take` and `skip` values
   * @example
   * In Auth module --> service.ts
   * ```ts
   * const entity = this.prisma.users.findMany({
   * 		where: whereClause,
   * 		...input?.sortBy?.convertToPrismaFilter(Prisma.ModelName.Users),
   * 		...input?.pagination?.convertToPrismaFilter()
   * })
   * ```
   */
  convertToPrismaFilter() {
    return convertPaginationToPrismaFilter(this)
  }
}
