import { EnvConfigService } from "@src/modules/config/env-config.service"
import { TestApiCaller } from "@src/utils/test-utils"
import type { INestApplication } from "@nestjs/common"
import axios from "axios"

import { createE2eApp } from "./helpers/e2e-app"

describe("Health", () => {
  const api = new TestApiCaller()
  let app: INestApplication
  let apiConfig: EnvConfigService

  beforeAll(async () => {
    const ctx = await createE2eApp()
    app = ctx.app
    apiConfig = ctx.apiConfig
    api.setApiConfig(apiConfig)
  })

  afterAll(async () => {
    await app.close()
  })

  it("+ returns ok status without authentication", async () => {
    const { data, status } = await axios.get(
      `http://${apiConfig.serverAddress}:${apiConfig.serverPort}/health`,
    )

    expect(status).toBe(200)
    expect(data).toMatchObject({ status: "ok", database: "ok" })
    expect(typeof data.timestamp).toBe("string")
  })
})
