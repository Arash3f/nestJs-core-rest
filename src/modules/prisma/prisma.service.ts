import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Injectable, Logger } from "@nestjs/common"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "@prisma/client"
import { AppErrorDescriptor, AppException } from "@src/app.exception"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { EnvType } from "@src/modules/config/types/config.type"
import { PRISMA_DUPLICATED_FIELD, PRISMA_NOT_FOUND } from "@src/modules/prisma/constants/const"
import { PrismaErrors } from "@src/modules/prisma/constants/errors"
import {
  DriverAdapterCause,
  PrismaDuplicatedError,
  PrismaKnownError,
} from "@src/modules/prisma/constants/type"
import { Pool } from "pg"

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, "query">
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)
  private readonly pool: Pool
  private readonly isDev: boolean

  constructor(env: EnvConfigService) {
    const isDev = env.nodeEnv === EnvType.Development

    const log: Prisma.LogDefinition[] = isDev
      ? [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "info" },
          { emit: "stdout", level: "warn" },
          { emit: "stdout", level: "error" },
        ]
      : [{ emit: "stdout", level: "error" }]

    const pool = new Pool({
      connectionString: env.databaseConfig.connectionUrl,
    })

    const adapter = new PrismaPg(pool)

    super({
      adapter,
      log,
    })

    this.pool = pool
    this.isDev = isDev
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()

    if (this.isDev) {
      this.$on("query", (event: Prisma.QueryEvent) => {
        this.logger.verbose({
          query: event.query,
          params: event.params,
          durationMs: event.duration,
        })
      })
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
    await this.pool.end()
  }

  private isPrismaKnownError(error: unknown): error is PrismaKnownError {
    return error instanceof Prisma.PrismaClientKnownRequestError
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string")
  }

  private getDuplicatedFields(error: PrismaKnownError): string[] {
    // new Prisma
    const cause = (error.meta as { driverAdapterError?: { cause?: DriverAdapterCause } })
      ?.driverAdapterError?.cause
    if (
      cause?.kind === "UniqueConstraintViolation" &&
      this.isStringArray(cause.constraint?.fields)
    ) {
      return cause.constraint.fields
    }
    // older Prisma
    const target: unknown = error.meta?.target
    if (typeof target === "string") return [target]
    if (this.isStringArray(target)) return target
    return []
  }

  handlePrismaErrors(info: {
    error: unknown
    notFoundError?: AppErrorDescriptor
    duplicatedErrors?: PrismaDuplicatedError[]
  }): never {
    const { error, notFoundError, duplicatedErrors } = info
    if (!this.isPrismaKnownError(error)) {
      throw error
    }
    if (error.code === PRISMA_NOT_FOUND) {
      throw new AppException(notFoundError ?? PrismaErrors.RowNotFound)
    }
    if (error.code === PRISMA_DUPLICATED_FIELD) {
      const duplicatedFields = this.getDuplicatedFields(error)
      const matched = duplicatedErrors?.find((item) => duplicatedFields.includes(item.field))
      throw new AppException(matched?.error ?? PrismaErrors.FieldIsDuplicated)
    }
    throw error
  }
}
