import type { z } from "zod"
import { paginationDataSchema } from "@src/common/dto/pagination.input"

type PaginationData = z.infer<typeof paginationDataSchema>

/**
 * The internal function that prepares the final object for pagination filter, used when working with Prisma
 * @returns pagination object
 * @example
 * In User module --> service.ts
 * ```ts
 * const entity = this.prisma.users.findMany({
 * 		where: whereClause,
 * 		...convertSortByToPrismaFilter(input?.sortBy),
 * 		...convertPaginationToPrismaFilter(input?.pagination)
 * })
 * ```
 */
export function convertPaginationToPrismaFilter(input: PaginationData | undefined) {
  return {
    take: input?.take ?? 10,
    skip: input?.skip ?? 0,
  }
}
