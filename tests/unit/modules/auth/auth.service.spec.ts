import type { Mock, Mocked } from "vitest"
import { vi } from "vitest"
import { Role } from "@prisma/client"
import { AppException } from "@src/app.exception"
import { AuthService } from "@src/modules/auth/auth.service"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { UserErrors } from "@src/modules/user/constants/errors"
import * as argon2 from "argon2"

vi.mock("argon2", () => ({
  argon2id: 2,
  hash: vi.fn(),
  verify: vi.fn(),
}))

const mockedArgon = argon2 as Mocked<typeof argon2>

const buildUser = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  username: "john",
  name: "John",
  active: true,
  role: Role.Member,
  passwordHash: "stored-hash",
  reFreshTokenHash: "stored-refresh-hash",
  ...overrides,
})

describe("AuthService", () => {
  let service: AuthService
  let prisma: {
    users: { findUnique: Mock; create: Mock; update: Mock }
    handlePrismaErrors: Mock
  }
  let jwt: { signAsync: Mock; verify: Mock; decode: Mock }
  const envConfig = { memoryCost: 1, timeCost: 1, parallelism: 1, jwtRefreshExpire: "7d" }

  beforeEach(() => {
    vi.clearAllMocks()

    prisma = {
      users: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockResolvedValue(undefined),
      },
      handlePrismaErrors: vi.fn(() => {
        throw new AppException(UserErrors.UsernameIsDuplicated)
      }),
    }
    jwt = {
      signAsync: vi.fn().mockResolvedValueOnce("access-token").mockResolvedValueOnce("refresh-token"),
      verify: vi.fn(),
      decode: vi.fn(),
    }

    service = new AuthService(prisma as never, envConfig as never, jwt as never)

    mockedArgon.hash.mockResolvedValue("hashed" as never)
    mockedArgon.verify.mockResolvedValue(true as never)
  })

  describe("logIn", () => {
    it("returns tokens and persists the refresh-token hash on valid credentials", async () => {
      prisma.users.findUnique.mockResolvedValue(buildUser())

      const tokens = await service.logIn({ username: "John", password: "pw" }, "device-1")

      expect(tokens).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" })
      // username is looked up case-insensitively (lowercased)
      expect(prisma.users.findUnique).toHaveBeenCalledWith({ where: { username: "john" } })
      // refresh token hash is stored
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { reFreshTokenHash: "hashed" },
      })
      // the device fingerprint is baked into the signed payload
      expect(jwt.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: "user-1", deviceId: "device-1" }),
      )
    })

    it("throws IncorrectUsernameOrPassword when the user does not exist", async () => {
      prisma.users.findUnique.mockResolvedValue(null)

      await expect(service.logIn({ username: "ghost", password: "pw" }, "d")).rejects.toThrow(
        AuthErrors.IncorrectUsernameOrPassword.message,
      )
    })

    it("throws InactiveUser when the account has been deactivated", async () => {
      prisma.users.findUnique.mockResolvedValue(buildUser({ active: false }))

      await expect(service.logIn({ username: "john", password: "pw" }, "d")).rejects.toThrow(
        AuthErrors.InactiveUser.message,
      )
      expect(mockedArgon.verify).not.toHaveBeenCalled()
    })

    it("throws IncorrectUsernameOrPassword when the password does not match", async () => {
      prisma.users.findUnique.mockResolvedValue(buildUser())
      mockedArgon.verify.mockResolvedValue(false as never)

      await expect(service.logIn({ username: "john", password: "bad" }, "d")).rejects.toThrow(
        AuthErrors.IncorrectUsernameOrPassword.message,
      )
    })
  })

  describe("logout", () => {
    it("clears the stored refresh-token hash and returns success", async () => {
      const result = await service.logout("user-1")

      expect(result).toEqual({ success: true })
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { reFreshTokenHash: null },
      })
    })
  })

  describe("register", () => {
    it("creates a Member with a lowercased username and auto-logs in", async () => {
      prisma.users.create.mockResolvedValue(buildUser())
      prisma.users.findUnique.mockResolvedValue(buildUser())

      const tokens = await service.register(
        { name: "John", username: "John", password: "pw" },
        "device-1",
      )

      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ username: "john", role: Role.Member }),
      })
      expect(tokens).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" })
    })

    it("maps a duplicate username to UsernameIsDuplicated", async () => {
      prisma.users.create.mockRejectedValue(new Error("unique constraint"))

      await expect(
        service.register({ name: "John", username: "john", password: "pw" }, "d"),
      ).rejects.toThrow(UserErrors.UsernameIsDuplicated.message)
      expect(prisma.handlePrismaErrors).toHaveBeenCalled()
    })
  })

  describe("changePassword", () => {
    it("updates the target user's password hash and returns success", async () => {
      prisma.users.update.mockResolvedValue(buildUser())

      const result = await service.changePassword({
        where: { id: "user-9" },
        data: { newPassword: "new-pw" },
      })

      expect(result).toEqual({ success: true })
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: "user-9" },
        data: { passwordHash: "hashed" },
      })
    })

    it("maps a missing target user to UserNotFound", async () => {
      prisma.users.update.mockRejectedValue(new Error("not found"))
      prisma.handlePrismaErrors.mockImplementation(() => {
        throw new AppException(UserErrors.UserNotFound)
      })

      await expect(
        service.changePassword({ where: { id: "ghost" }, data: { newPassword: "x" } }),
      ).rejects.toThrow(UserErrors.UserNotFound.message)
    })
  })

  describe("refreshToken", () => {
    const input = { refreshToken: "rt" }

    it("verifies the token, rotates it, and returns new tokens", async () => {
      jwt.verify.mockReturnValue({ id: "user-1", deviceId: "device-1" })
      prisma.users.findUnique.mockResolvedValue(buildUser())

      const tokens = await service.refreshToken(input, "device-1")

      expect(jwt.verify).toHaveBeenCalledWith("rt")
      expect(tokens).toEqual({ accessToken: "access-token", refreshToken: "refresh-token" })
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { reFreshTokenHash: "hashed" },
      })
    })

    it("throws InValidRefreshToken when verification fails (tampered or expired)", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("jwt expired")
      })

      await expect(service.refreshToken(input, "device-1")).rejects.toThrow(
        AuthErrors.InValidRefreshToken.message,
      )
      expect(prisma.users.findUnique).not.toHaveBeenCalled()
    })

    it("throws DeviceMismatch when the token was issued to another device", async () => {
      jwt.verify.mockReturnValue({ id: "user-1", deviceId: "other-device" })

      await expect(service.refreshToken(input, "device-1")).rejects.toThrow(
        AuthErrors.DeviceMismatch.message,
      )
    })

    it("throws UserIsNotAuthorized when the user has no stored refresh-token hash", async () => {
      jwt.verify.mockReturnValue({ id: "user-1", deviceId: "device-1" })
      prisma.users.findUnique.mockResolvedValue(buildUser({ reFreshTokenHash: null }))

      await expect(service.refreshToken(input, "device-1")).rejects.toThrow(
        AuthErrors.UserIsNotAuthorized.message,
      )
    })

    it("throws InValidRefreshToken when the token does not match the stored hash", async () => {
      jwt.verify.mockReturnValue({ id: "user-1", deviceId: "device-1" })
      prisma.users.findUnique.mockResolvedValue(buildUser())
      mockedArgon.verify.mockResolvedValue(false as never)

      await expect(service.refreshToken(input, "device-1")).rejects.toThrow(
        AuthErrors.InValidRefreshToken.message,
      )
    })
  })

  describe("generatedHashedPassword", () => {
    it("hashes with the configured argon2id cost parameters", async () => {
      await service.generatedHashedPassword("secret")

      expect(mockedArgon.hash).toHaveBeenCalledWith("secret", {
        type: argon2.argon2id,
        memoryCost: 1,
        timeCost: 1,
        parallelism: 1,
      })
    })
  })
})
