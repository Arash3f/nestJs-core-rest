import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { GuardsModule } from "@src/common/guards/guards.module"
import { AuthController } from "@src/modules/auth/auth.controller"
import { AuthService } from "@src/modules/auth/auth.service"
import { EnvConfigModule } from "@src/modules/config/env-config.module"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { PrismaModule } from "@src/modules/prisma/prisma.module"

@Module({
  providers: [AuthService],
  imports: [
    PrismaModule,
    EnvConfigModule,
    GuardsModule,
    JwtModule.registerAsync({
      imports: [EnvConfigModule],
      useFactory: (apiConfigService: EnvConfigService) => ({
        secret: apiConfigService.jwtSecret,
        signOptions: { expiresIn: apiConfigService.jwtAccessExpire },
      }),
      inject: [EnvConfigService],
    }),
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
