import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { AuthModule } from "@src/modules/auth/auth.module"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { CreateUserInput } from "@src/modules/auth/dto/create-user.input"
import { EnvConfigModule } from "@src/modules/config/env-config.module"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import type { ErrorInfo } from "@src/modules/error/constants/type"
import { ErrorModule } from "@src/modules/error/error.module"
import { InitModule } from "@src/modules/init/init.module"
import { InitService } from "@src/modules/init/init.service"
import { PrismaModule } from "@src/modules/prisma/prisma.module"
import { PrometheusModule } from "@willsoto/nestjs-prometheus"
import { LokiLoggerModule } from "nestjs-loki-logger"

@Module({
    imports: [
        LokiLoggerModule.forRootAsync({
            imports: [EnvConfigModule],
            inject: [EnvConfigService],
            useFactory: (apiConfigService: EnvConfigService) => ({
                lokiUrl: apiConfigService.lokiServerAddress,
                labels: {
                    label: "testing",
                },
                logToConsole: true,
                gzip: false,
            }),
        }),
        PrometheusModule.register({
            path: "/metrics",
        }),
        ConfigModule.forRoot({
            validate: (config) =>
                EnvConfigService.environmentValidation(config),
        }),
        ScheduleModule.forRoot(),
        PrismaModule,
        AuthModule,
        ErrorModule,
        EnvConfigModule,
        InitModule,
    ],
})
export class AppModule {
    constructor(
        private init: InitService,
        private apiConfigService: EnvConfigService,
    ) {
        this.generateProjectErrors(), this.projectSuperUser()
    }

    generateProjectErrors() {
        const projectErrors: ErrorInfo[] = [...Object.values(AuthErrors)]
        this.init.generateProjectErrors(projectErrors)
    }

    /**
     * * Generate Super User With Admin Role
     */
    async projectSuperUser() {
        const superUserData: CreateUserInput = {
            username: this.apiConfigService.defaultUser.username,
            name: this.apiConfigService.defaultUser.name,
            password: this.apiConfigService.defaultUser.password,
            role: this.apiConfigService.defaultUser.role,
        }
        await this.init.generateSuperUserWithAdminRole(superUserData)
    }
}
