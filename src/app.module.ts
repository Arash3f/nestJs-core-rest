import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { ServeStaticModule } from "@nestjs/serve-static"
import { join } from "path"
import { AuthModule } from "src/modules/auth/auth.module"
import { AuthErrors } from "src/modules/auth/constants/errors"
import { CreateUserInput } from "src/modules/auth/dto/create-user.input"
import { BackupModule } from "src/modules/backup/backup.module"
import { BackUpErrors } from "src/modules/backup/constants/errors"
import { EnvConfigModule } from "src/modules/config/env-config.module"
import { EnvConfigService } from "src/modules/config/env-config.service"
import type { ErrorInfo } from "src/modules/error/constants/type"
import { ErrorModule } from "src/modules/error/error.module"
import { InitModule } from "src/modules/init/init.module"
import { InitService } from "src/modules/init/init.service"
// import { MulterModule } from "src/modules/multer/multer.module"
import { PrismaModule } from "src/modules/prisma/prisma.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (config) => EnvConfigService.environmentValidation(config),
		}),
		ScheduleModule.forRoot(),
		PrismaModule,
		AuthModule,
		ErrorModule,
		// MulterModule,
		EnvConfigModule,
		InitModule,
		BackupModule,
		ServeStaticModule.forRootAsync({
			imports: [EnvConfigModule],
			inject: [EnvConfigService],
			useFactory: (apiConfigService: EnvConfigService) => [
				{
					serveRoot: "/upload/",
					rootPath: join(__dirname, "..", apiConfigService.uploadDirectory),
					/**
					 * @example
					 * From this request --> 127.0.0.1/{serveRoot}/NestJsIcon.png
					 * Looking for this location --> ./{uploadDirectory}/NestJsIcon.png
					 */
				},
			],
		}),
	],
})
export class AppModule {
	constructor(
		private init: InitService,
		private apiConfigService: EnvConfigService,
	) {
		this.generateProjectErrors(),
		this.projectSuperUser()
	}

	generateProjectErrors() {
		const projectErrors: ErrorInfo[] = [
			...Object.values(AuthErrors),
			...Object.values(BackUpErrors),
		]
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
		await this.init.generateSuperUserWithAdminRole( superUserData)
	  }
}
