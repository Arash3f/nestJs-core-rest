import { Module } from "@nestjs/common"
import { ErrorModule } from "src/modules/error/error.module"
import { InitService } from "src/modules/init/init.service"

@Module({
	providers: [InitService],
	imports: [ErrorModule],
	exports: [InitService],
})
export class InitModule { }
