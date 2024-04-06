import { Module } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtModule } from "@nestjs/jwt"
import { TokenGuard } from "src/common/guards/token.guard"
import { AuthController } from "src/modules/auth/auth.controller"
import { AuthService } from "src/modules/auth/auth.service"
import { EnvConfigModule } from "src/modules/config/env-config.module"
import { EnvConfigService } from "src/modules/config/env-config.service"
import { ErrorModule } from "src/modules/error/error.module"
import { PrismaModule } from "src/modules/prisma/prisma.module"

@Module({
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: TokenGuard,
        },
    ],
    imports: [
        ErrorModule,
        PrismaModule,
        EnvConfigModule,
        JwtModule.registerAsync({
            imports: [EnvConfigModule],
            useFactory: (apiConfigService: EnvConfigService) => ({
                privateKey: apiConfigService.jwtSecret,
                signOptions: { expiresIn: apiConfigService.jwtExpire },
            }),
            inject: [EnvConfigService],
        }),
    ],
    controllers: [AuthController],
})
export class AuthModule {}
