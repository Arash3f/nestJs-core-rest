import { Module } from "@nestjs/common"
import { BackupService } from "src/modules/backup/backup.service"
import { EnvConfigModule } from "src/modules/config/env-config.module"
import { ErrorModule } from "src/modules/error/error.module"

@Module({
    imports: [EnvConfigModule, ErrorModule],
    providers: [BackupService],
})
export class BackupModule {}
