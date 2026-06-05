/**
 * This enum keeps all module names
 */
export enum ModuleNames {
  AppModule = "AppModule",
  AuthModule = "AuthModule",
  ConfigModule = "ConfigModule",
  InitModule = "InitModule",
  PrismaModule = "PrismaModule",
  UserModule = "UserModule",
}

/**
 * This address is used for testing
 */
export const serverAddress = `http://${process.env.SERVER_ADDRESS}:${process.env.SERVER_PORT}`
