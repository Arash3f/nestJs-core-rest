import { Logger } from "@nestjs/common"
import { exec } from "child_process"
import { promisify } from "util"
import { serverApiDocs } from "src/constants"

const execAsync = promisify(exec)

/**
 * To update Swagger Api file, we use (npm run type) and make this function to run
 * @see https://github.com/acacode/swagger-typescript-api
 */
async function generateSwagger() {
  const schemaPath = serverApiDocs
  const outputPath = "./swagger"
  const command = `npx swagger-typescript-api -p ${schemaPath} -o ${outputPath} --axios`
  const { stderr, stdout } = await execAsync(command)
  Logger.verbose(stdout)
  if (stderr) {
    Logger.error(stderr)
  }
}

generateSwagger()
