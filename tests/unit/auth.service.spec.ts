import { JwtService } from "@nestjs/jwt"
import type { TestingModule } from "@nestjs/testing"
import { Test } from "@nestjs/testing"
import { Prisma, Role } from "@prisma/client"
import { AppException } from "@src/app.exception"
import { AuthService } from "@src/modules/auth/auth.service"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { UserErrors } from "@src/modules/user/constants/errors"
import * as argon2 from "argon2"

jest.mock("argon2")

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
}

describe("AuthService", () => {
  let service: AuthService

  const mockPrisma = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    handlePrismaErrors: jest.fn(),
  }

  const mockUser = {
    id: "1",
    username: "test",
    name: "Test User",
    active: true,
    role: Role.Member,
    passwordHash: "hashed_password",
    createdDate: new Date(),
    updatedDate: new Date(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  /**
   * ----------------
   * Login
   * ----------------
   */

  it("should login successfully", async () => {
    const username = "test"
    const password = "123"

    mockPrisma.users.findUnique.mockResolvedValue(mockUser)
    ;(argon2.verify as jest.Mock).mockResolvedValue(true)
    mockJwtService.signAsync.mockResolvedValue("mocked_token")

    const result = await service.logIn({
      username,
      password,
    })

    expect(result).toEqual({
      jwt: "mocked_token",
    })

    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: {
        username: username.toLowerCase(),
      },
    })

    expect(argon2.verify).toHaveBeenCalledWith(mockUser.passwordHash, password)

    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      username: username.toLowerCase(),
      role: mockUser.role,
      id: mockUser.id,
    })
  })

  it("should throw IncorrectUsernameOrPassword when user not found", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)

    await expect(
      service.logIn({
        username: "wrong",
        password: "123",
      }),
    ).rejects.toThrow(AuthErrors.IncorrectUsernameOrPassword.message)

    expect(argon2.verify).not.toHaveBeenCalled()
    expect(mockJwtService.signAsync).not.toHaveBeenCalled()
  })

  it("should throw IncorrectUsernameOrPassword when password is wrong", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(mockUser)
    ;(argon2.verify as jest.Mock).mockResolvedValue(false)

    await expect(
      service.logIn({
        username: "test",
        password: "wrong-password",
      }),
    ).rejects.toThrow(AuthErrors.IncorrectUsernameOrPassword.message)

    expect(mockJwtService.signAsync).not.toHaveBeenCalled()
  })

  /**
   * ----------------
   * Change Password
   * ----------------
   */

  it("should change password", async () => {
    const userId = "1"

    ;(argon2.hash as jest.Mock).mockResolvedValue("newHash")
    mockPrisma.users.update.mockResolvedValue({
      id: userId,
    })

    const result = await service.changePassword({
      where: { id: userId },
      data: { newPassword: "123456" },
    })

    expect(result).toEqual({ success: true })

    expect(argon2.hash).toHaveBeenCalledWith("123456")

    expect(mockPrisma.users.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { passwordHash: "newHash" },
    })
  })

  it("should throw UserNotFound when changing password", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "7.9.0",
    })

    ;(argon2.hash as jest.Mock).mockResolvedValue("newHash")
    mockPrisma.users.update.mockRejectedValue(prismaError)
    mockPrisma.handlePrismaErrors.mockImplementation(({ notFoundError }) => {
      throw new AppException(notFoundError)
    })

    await expect(
      service.changePassword({
        where: { id: "fake" },
        data: { newPassword: "123" },
      }),
    ).rejects.toThrow(UserErrors.UserNotFound.message)

    expect(mockPrisma.handlePrismaErrors).toHaveBeenCalledWith({
      error: prismaError,
      notFoundError: UserErrors.UserNotFound,
    })
  })

  /**
   * ----------------
   * verifyUserExistanceByUsername
   * ----------------
   */

  it("should return user when username exists", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(mockUser)

    const result = await service.verifyUserExistanceByUsername("Test")

    expect(result).toEqual(mockUser)
    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: { username: "test" },
    })
  })

  it("should throw IncorrectUsernameOrPassword when username does not exist", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)

    await expect(service.verifyUserExistanceByUsername("missing")).rejects.toThrow(
      AuthErrors.IncorrectUsernameOrPassword.message,
    )
  })

  /**
   * ----------------
   * generateToken
   * ----------------
   */

  it("should generate token", async () => {
    mockJwtService.signAsync.mockResolvedValue("mocked_token")

    const result = await service.generateToken("Test", "1", Role.Admin)

    expect(result).toBe("mocked_token")
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      username: "test",
      role: Role.Admin,
      id: "1",
    })
  })

  /**
   * ----------------
   * generatedHashedPassword
   * ----------------
   */

  it("should hash password", async () => {
    ;(argon2.hash as jest.Mock).mockResolvedValue("hashed-password")

    const result = await service.generatedHashedPassword("123456")

    expect(result).toBe("hashed-password")
    expect(argon2.hash).toHaveBeenCalledWith("123456")
  })
})
