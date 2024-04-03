import { Injectable, Logger } from "@nestjs/common"
import { SchedulerRegistry } from "@nestjs/schedule"
import { exec } from "child_process"
import { CronJob } from "cron"
import type { LinkOutput } from "src/common/dto/link.output"
import { BackUpErrors } from "src/modules/backup/constants/errors"
import { EnvConfigService } from "src/modules/config/env-config.service"
import { ErrorService } from "src/modules/error/error.service"
import util from "util"

import type { GlobalError } from "../error/global-error"

@Injectable()
export class BackupService {
	private execCommand = util.promisify(exec)
	private logger = new Logger(BackupService.name)

	/**
	 * Prepare password format from server platform
	 * @param databasePassword origin password
	 * @returns database's password format
	 */
	private prepareDatabasePasswordFormat(databasePassword: string): string {
		let command = `PGPASSWORD=${databasePassword}`
		if (process.platform == "win32") {
			command = `$env:PGPASSWORD='${databasePassword}';`
		}
		return command
	}

	/**
	 * Get best configuration for exec
	 * @returns
	 */
	private getExecConfigurationForServer(): object {
		let config = {}
		if (process.platform == "win32") {
			config = { shell: "powershell.exe" }
		}
		return config
	}

	constructor(
		private apiConfigService: EnvConfigService,
		private errorService: ErrorService,
		private schedulerRegistry: SchedulerRegistry) {

	}

	startCronJob() {
		const job = new CronJob(this.apiConfigService.backupCronPattern, async () => {
			this.logger.verbose("Database Backup Started.")
			await this.backupDatabase()
			this.logger.verbose("Database Backup Finished.")
		})

		this.schedulerRegistry.addCronJob("autoBackup", job)
		job.start()
	}

	/**
	 * BackUp Database
	 * @param requesterId Get the userId from the Token
	 * @returns True value or throw Error
	 * @throws
	 * {@link "modules/backup/constants/errors".BackUpErrors | ThereWasProblemInTakingBackup},
	 */
	async backupDatabase(): Promise<LinkOutput> {
		const backupDir = this.apiConfigService.backupDirectory
		const currentDate = this.generateCurrentDate()
		const backupName = `database-backup-${currentDate}.tar`
		const backupUrl = `${backupDir}/${backupName}`

		const dbConfig = this.buildDbConfig()

		const command = `${dbConfig.dbCommandPassword} pg_dump -U ${dbConfig.dbUsername} -p ${dbConfig.dbPort} -d ${dbConfig.activeDBName} -f ${backupUrl} -a -F t`
		try {
			const execConfig = this.getExecConfigurationForServer()
			const { stderr } = await this.execCommand(command, execConfig)
			if (stderr != "") {
				this.logger.error(stderr)
				throw this.errorService.throwErrorToClient({ errorData: BackUpErrors.ThereWasProblemInTakingBackup })
			}
		}
		catch (e) {
			const error: GlobalError = e
			this.logger.error(error, error.stack)
			throw this.errorService.throwErrorToClient({ errorData: BackUpErrors.ThereWasProblemInTakingBackup })
		}

		return { url: backupUrl }
	}

	private buildDbConfig() {
		return {
			dbCommandPassword: this.prepareDatabasePasswordFormat(this.apiConfigService.databaseConfig.password),
			dbUsername: this.apiConfigService.databaseConfig.username,
			activeDBName: this.apiConfigService.databaseConfig.name,
			dbPort: this.apiConfigService.databaseConfig.port,
		}
	}

	private generateCurrentDate(): string {
		const date = new Date()
		const currentDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}`
		return currentDate
	}
}
