import { Module } from "@nestjs/common"
import { AuthModule } from "@src/modules/auth/auth.module"
import { EnvConfigModule } from "@src/modules/config/env-config.module"
import { InitModule } from "@src/modules/init/init.module"
import { PrismaModule } from "@src/modules/prisma/prisma.module"
import { UserModule } from "@src/modules/user/user.module"

@Module({
  imports: [PrismaModule, AuthModule, EnvConfigModule, InitModule, UserModule],
})
export class AppModule {}
