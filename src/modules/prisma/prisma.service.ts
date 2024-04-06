import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Injectable, Logger } from "@nestjs/common"
import { Prisma, PrismaClient } from "@prisma/client"
import { EnvConfigService } from "src/modules/config/env-config.service"
import { NodeEnvType } from "src/modules/config/types/config.type"

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private readonly logger = new Logger(PrismaService.name)

    constructor(private readonly envConfigService: EnvConfigService) {
        super({
            log: [
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
            ],
        })
    }

    async onModuleInit() {
        await this.$connect()
        if (this.envConfigService.nodeEnv === NodeEnvType.Development) {
            this.$on("query" as never, (e) => {
                const res: Prisma.QueryEvent = e
                this.logger.verbose({
                    Query: res.query,
                    Params: res.params,
                    Duration: String(res.duration) + "ms",
                })
            })
        }
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }
}
