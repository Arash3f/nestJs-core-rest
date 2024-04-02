import { Module } from "@nestjs/common"
import { EnvConfigModule } from "src/modules/config/env-config.module"
import { FileUploaderInterceptor } from "./interceptors/file-uploader.interceptor"

@Module({
	imports: [
		EnvConfigModule,
	],
	providers: [FileUploaderInterceptor],
	exports: [FileUploaderInterceptor],
})
export class MulterModule { }
