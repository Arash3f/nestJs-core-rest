import type { OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { Injectable, Logger } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name)

	constructor() {
		super()
		// TODO: This should be configurable
		// super({
		// 	log: [
		// 		{
		// 			emit: "event",
		// 			level: "query"
		// 		},
		// 		{
		// 			emit: "stdout",
		// 			level: "error"
		// 		},
		// 		{
		// 			emit: "stdout",
		// 			level: "info"
		// 		},
		// 		{
		// 			emit: "stdout",
		// 			level: "warn"
		// 		}
		// 	]
		// })
	}

	async onModuleInit() {
		await this.$connect()
		// if (process.env.NODE_ENV === NodeEnvType.Development) {
		//   this.$on("query", (e) => {
		//     this.logger.verbose({
		//       Query: e.query,
		//       Params: e.params,
		//       Duration: String(e.duration) + "ms"
		//     })
		//   })
		// }
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
