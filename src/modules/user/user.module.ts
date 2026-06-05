import { Module } from "@nestjs/common"
import { AuthModule } from "@src/modules/auth/auth.module"
import { PrismaModule } from "@src/modules/prisma/prisma.module"
import { UserController } from "@src/modules/user/user.controller"
import { UserService } from "@src/modules/user/user.service"

@Module({
  providers: [UserService],
  imports: [PrismaModule, AuthModule],
  controllers: [UserController],
})
export class UserModule {}
