import { Module } from "@nestjs/common"
import { PrismaService } from "src/modules/prisma/prisma.service"

import { EnvConfigModule } from "../config/env-config.module"

@Module({
    exports: [PrismaService],
    imports: [EnvConfigModule],
    providers: [PrismaService],
})
export class PrismaModule {}
