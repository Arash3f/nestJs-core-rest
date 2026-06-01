import { JwtService } from "@nestjs/jwt"
import type { TestingModule } from "@nestjs/testing"
import { Test } from "@nestjs/testing"
import { Role } from "@prisma/client"
import { AuthService } from "@src/modules/auth/auth.service"
import { AuthErrors } from "@src/modules/auth/constants/errors"
import { ErrorService } from "@src/modules/error/error.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import * as argon2 from "argon2"

jest.mock("argon2")

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
}

const mockErrorService = {
  throwErrorToClient: jest.fn(),
}

describe("AuthService", () => {
  let service: AuthService

  const mockPrisma = {
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  beforeEach(async () => {
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
        {
          provide: ErrorService,
          useValue: mockErrorService,
        },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  /**
   * ----------------
   * Login
   * ----------------
   */

  it("should login successfully", async () => {
    const username = "test"
    const password = "123"

    mockPrisma.users.findUnique.mockResolvedValue({
      id: "1",
      username,
      password: "hashed_password",
    })
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

    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      username: username.toLowerCase(),
      id: "1",
    })
  })

  it("should throw IncorrectUsernameOrPassword", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)

    mockErrorService.throwErrorToClient.mockReturnValue(
      new Error(AuthErrors.IncorrectUsernameOrPassword.message),
    )

    await expect(
      service.logIn({
        username: "wrong",
        password: "123",
      }),
    ).rejects.toThrow(AuthErrors.IncorrectUsernameOrPassword.message)
  })

  /**
   * ----------------
   * Create User
   * ----------------
   */

  it("should create user", async () => {
    const dto = {
      username: "newuser",
      name: "New User",
      password: "123",
      role: Role.Member,
    }

    mockPrisma.users.findFirst.mockResolvedValue(null)
    ;(argon2.hash as jest.Mock).mockResolvedValue("hashed")

    mockPrisma.users.create.mockResolvedValue({
      id: "1",
      ...dto,
      username: dto.username.toLowerCase(),
    })

    const result = await service.createUser(dto)

    expect(result.username).toBe(dto.username.toLowerCase())
    expect(mockPrisma.users.create).toHaveBeenCalledTimes(1)
  })

  it("should throw UsernameIsDuplicated", async () => {
    mockPrisma.users.findFirst.mockResolvedValue({
      id: "existingUser",
    })

    mockErrorService.throwErrorToClient.mockReturnValue(
      new Error(AuthErrors.UsernameIsDuplicated.message),
    )

    await expect(
      service.createUser({
        username: "duplicate",
        name: "user",
        password: "123",
        role: "Member",
      }),
    ).rejects.toThrow(AuthErrors.UsernameIsDuplicated.message)
  })

  /**
   * ----------------
   * Update User
   * ----------------
   */

  it("should update user", async () => {
    const userId = "1"

    mockPrisma.users.findUnique.mockResolvedValue({
      id: userId,
      name: "123",
    })

    mockPrisma.users.findFirst.mockResolvedValue(null)

    mockPrisma.users.update.mockResolvedValue({
      id: userId,
      name: "updated",
    })

    const result = await service.updateUser({
      where: { id: userId },
      data: { name: "updated", active: true, username: "updated" },
    })

    expect(result.name).toBe("updated")
  })

  it("should throw UserNotFound", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)
    mockErrorService.throwErrorToClient.mockReturnValue(new Error(AuthErrors.UserNotFound.message))
    await expect(
      service.updateUser({
        where: { id: "fake" },
        data: { name: "test", active: false, username: "adsa" },
      }),
    ).rejects.toThrow(AuthErrors.UserNotFound.message)
  })

  /**
   * ----------------
   * Delete User
   * ----------------
   */

  it("should delete user", async () => {
    const userId = "1"
    mockPrisma.users.findUnique.mockResolvedValue({
      id: userId,
      active: false,
    })

    mockPrisma.users.update.mockResolvedValue({
      id: userId,
      active: false,
    })

    await service.deleteUser({ id: userId })

    expect(mockPrisma.users.update).toHaveBeenCalled()
  })

  /**
   * ----------------
   * Change Password
   * ----------------
   */

  it("should change password", async () => {
    const userId = "1"

    mockPrisma.users.findUnique.mockResolvedValue({
      id: userId,
    })
    ;(argon2.hash as jest.Mock).mockResolvedValue("newHash")

    mockPrisma.users.update.mockResolvedValue({
      id: userId,
    })

    await service.changePassword({
      where: { id: userId },
      data: { newPassword: "123456" },
    })

    expect(mockPrisma.users.update).toHaveBeenCalled()
  })

  it("should throw UserNotFound when changing password", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)
    mockErrorService.throwErrorToClient.mockReturnValue(new Error(AuthErrors.UserNotFound.message))

    await expect(
      service.changePassword({
        where: { id: "fake" },
        data: { newPassword: "123" },
      }),
    ).rejects.toThrow(AuthErrors.UserNotFound.message)
  })
})
