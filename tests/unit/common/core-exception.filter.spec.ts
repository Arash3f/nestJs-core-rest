import type { ArgumentsHost } from "@nestjs/common"
import { BadRequestException, HttpStatus, Logger, NotFoundException } from "@nestjs/common"
import { AppException } from "@src/app.exception"
import { CoreExceptionFilter } from "@src/common/filters/core-exception.filter"
import { UserErrors } from "@src/modules/user/constants/errors"
import { EnvType } from "@src/modules/config/types/config.type"
import { ModuleNames } from "@src/constants"

const buildHost = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  const req = { url: "/test", originalUrl: "/test" }
  const host = {
    switchToHttp: () => ({ getResponse: () => res, getRequest: () => req }),
  } as unknown as ArgumentsHost
  return { host, res }
}

const sentBody = (res: { send: jest.Mock }) => res.send.mock.calls[0][0]

describe("CoreExceptionFilter", () => {
  // Silence the development-mode error logging so test output stays clean.
  beforeAll(() => jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined))
  afterAll(() => jest.restoreAllMocks())

  const filterFor = (nodeEnv: EnvType) =>
    new CoreExceptionFilter({ nodeEnv } as never)

  it("maps an AppException onto its descriptor fields", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Development).catch(new AppException(UserErrors.UserNotFound), host)

    expect(res.status).toHaveBeenCalledWith(UserErrors.UserNotFound.statusCode)
    const body = sentBody(res)
    expect(body).toMatchObject({
      path: "/test",
      message: UserErrors.UserNotFound.message,
      persianTranslation: UserErrors.UserNotFound.persianTranslation,
      code: UserErrors.UserNotFound.code,
      module: UserErrors.UserNotFound.module,
      statusCode: UserErrors.UserNotFound.statusCode,
    })
  })

  it("joins array messages from a validation HttpException", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Development).catch(
      new BadRequestException(["a is invalid", "b is required"]),
      host,
    )

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(sentBody(res).message).toBe("a is invalid, b is required")
  })

  it("uses the status of a standard HttpException", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Development).catch(new NotFoundException("missing"), host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(sentBody(res).message).toBe("missing")
  })

  it("treats a generic Error as a 500 and captures debug info", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Development).catch(new Error("boom"), host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    const body = sentBody(res)
    expect(body.message).toBe("boom")
    expect(body.debugError).toMatchObject({ name: "Error", message: "boom" })
  })

  it("handles a thrown string", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Development).catch("raw failure", host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(sentBody(res).message).toBe("raw failure")
  })

  it("falls back to a generic 500 for unknown exception types", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Development).catch(42, host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    const body = sentBody(res)
    expect(body.message).toBe("Internal server error")
    expect(body.module).toBe(ModuleNames.AppModule)
  })

  it("strips developerMessage and debugError in production", () => {
    const { host, res } = buildHost()
    filterFor(EnvType.Production).catch(
      new AppException({ ...UserErrors.UserNotFound, developerMessage: "secret detail" }),
      host,
    )

    const body = sentBody(res)
    expect(body.developerMessage).toBeUndefined()
    expect(body.debugError).toBeUndefined()
  })
})
