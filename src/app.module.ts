import { Module } from "@nestjs/common"
import { ThrottlerModule } from "@nestjs/throttler"
import { AuthModule } from "@src/modules/auth/auth.module"
import { EnvConfigModule } from "@src/modules/config/env-config.module"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { EnvType } from "@src/modules/config/types/config.type"
import { HealthModule } from "@src/modules/health/health.module"
import { InitModule } from "@src/modules/init/init.module"
import { PrismaModule } from "@src/modules/prisma/prisma.module"
import { UserModule } from "@src/modules/user/user.module"

@Module({
  imports: [
    PrismaModule,
    EnvConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [EnvConfigModule],
      inject: [EnvConfigService],
      useFactory: (env: EnvConfigService) => ({
        skipIf: () => env.nodeEnv === EnvType.Test,
        throttlers: [{ ttl: env.throttleTtlMs, limit: env.throttleLimit }],
      }),
    }),
    AuthModule,
    InitModule,
    UserModule,
    HealthModule,
  ],
})
export class AppModule {}
