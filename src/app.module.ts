import { Module } from "@nestjs/common"
import { AuthModule } from "@src/modules/auth/auth.module"
import { EnvConfigModule } from "@src/modules/config/env-config.module"
import { InitModule } from "@src/modules/init/init.module"
import { PrismaModule } from "@src/modules/prisma/prisma.module"

@Module({
  imports: [PrismaModule, AuthModule, EnvConfigModule, InitModule],
})
export class AppModule {}
