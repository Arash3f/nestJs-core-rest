import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Injectable, Logger } from "@nestjs/common"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "@prisma/client"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { NodeEnvType } from "@src/modules/config/types/config.type"
import { Pool } from "pg"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(private readonly envConfigService: EnvConfigService) {
    // Set up the PG connection pool
    const pool = new Pool({
      connectionString: envConfigService.DATABASE_CONNECTION_URL,
    })

    // Create the Prisma adapter using the pool
    const adapter = new PrismaPg(pool)

    // Configure logging
    const logConfig: Prisma.LogDefinition[] = []

    if (envConfigService.nodeEnv === NodeEnvType.Development) {
      logConfig.push(
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "stdout",
          level: "error",
        },
        {
          emit: "stdout",
          level: "info",
        },
        {
          emit: "stdout",
          level: "warn",
        },
      )
    }

    // Pass the adapter to PrismaClient
    super({
      adapter,
      log: logConfig,
    })
  }

  async onModuleInit() {
    await this.$connect()

    if (this.envConfigService.nodeEnv === NodeEnvType.Development) {
      // Use proper typing with Prisma.QueryEvent
      this.$on("query" as never, (event: Prisma.QueryEvent) => {
        this.logger.verbose({
          Query: event.query,
          Params: event.params,
          Duration: `${event.duration}ms`,
        })
      })
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
