import type { TestingModule } from "@nestjs/testing"
import { Test } from "@nestjs/testing"
import { Prisma, Role } from "@prisma/client"
import { AppException } from "@src/app.exception"
import { AuthService } from "@src/modules/auth/auth.service"
import { PrismaService } from "@src/modules/prisma/prisma.service"
import { UserErrors } from "@src/modules/user/constants/errors"
import { UserService } from "@src/modules/user/user.service"

const mockAuthService = {
  generatedHashedPassword: jest.fn(),
}

describe("UserService", () => {
  let service: UserService

  const mockPrisma = {
    users: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    handlePrismaErrors: jest.fn(),
  }

  const mockUser = {
    id: "1",
    username: "testuser",
    name: "Test User",
    active: true,
    role: Role.Member,
    createdDate: new Date(),
    updatedDate: new Date(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    service = module.get(UserService)
  })

  /**
   * ----------------
   * Me
   * ----------------
   */

  it("should return current user", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(mockUser)

    const result = await service.me("1")

    expect(result).toEqual(mockUser)
    expect(mockPrisma.users.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })
  })

  it("should throw UserNotFound in me", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)

    await expect(service.me("fake")).rejects.toThrow(UserErrors.UserNotFound.message)
  })

  /**
   * ----------------
   * Create User
   * ----------------
   */

  it("should create user", async () => {
    const dto = {
      username: "NewUser",
      name: "New User",
      password: "123",
      role: Role.Member,
    }

    mockAuthService.generatedHashedPassword.mockResolvedValue("hashed")
    mockPrisma.users.create.mockResolvedValue({
      ...mockUser,
      username: dto.username.toLowerCase(),
      name: dto.name,
    })

    const result = await service.createUser(dto)

    expect(result.username).toBe(dto.username.toLowerCase())
    expect(mockAuthService.generatedHashedPassword).toHaveBeenCalledWith(dto.password)
    expect(mockPrisma.users.create).toHaveBeenCalledWith({
      data: {
        name: dto.name,
        passwordHash: "hashed",
        username: dto.username.toLowerCase(),
        role: dto.role,
      },
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })
  })

  it("should throw UsernameIsDuplicated when creating user", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.9.0",
    })

    mockAuthService.generatedHashedPassword.mockResolvedValue("hashed")
    mockPrisma.users.create.mockRejectedValue(prismaError)
    mockPrisma.handlePrismaErrors.mockImplementation(({ duplicatedErrors }) => {
      throw new AppException(duplicatedErrors[0].error)
    })

    await expect(
      service.createUser({
        username: "duplicate",
        name: "user",
        password: "123",
        role: Role.Member,
      }),
    ).rejects.toThrow(UserErrors.UsernameIsDuplicated.message)

    expect(mockPrisma.handlePrismaErrors).toHaveBeenCalledWith({
      error: prismaError,
      duplicatedErrors: [
        {
          error: UserErrors.UsernameIsDuplicated,
          field: Prisma.UsersScalarFieldEnum.username,
        },
      ],
    })
  })

  /**
   * ----------------
   * Update User
   * ----------------
   */

  it("should update user", async () => {
    const userId = "1"

    mockPrisma.users.update.mockResolvedValue({
      ...mockUser,
      name: "updated",
      username: "updated",
    })

    const result = await service.updateUser({
      where: { id: userId },
      data: { name: "updated", active: true, username: "Updated" },
    })

    expect(result.name).toBe("updated")
    expect(mockPrisma.users.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        name: "updated",
        username: "updated",
        active: true,
      },
      select: {
        id: true,
        username: true,
        active: true,
        name: true,
        role: true,
        createdDate: true,
        updatedDate: true,
        passwordHash: false,
      },
    })
  })

  it("should throw UserNotFound when updating user", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "7.9.0",
    })

    mockPrisma.users.update.mockRejectedValue(prismaError)
    mockPrisma.handlePrismaErrors.mockImplementation(({ notFoundError }) => {
      throw new AppException(notFoundError)
    })

    await expect(
      service.updateUser({
        where: { id: "fake" },
        data: { name: "test", active: false, username: "adsa" },
      }),
    ).rejects.toThrow(UserErrors.UserNotFound.message)

    expect(mockPrisma.handlePrismaErrors).toHaveBeenCalledWith({
      error: prismaError,
      duplicatedErrors: [
        {
          error: UserErrors.UsernameIsDuplicated,
          field: Prisma.UsersScalarFieldEnum.username,
        },
      ],
      notFoundError: UserErrors.UserNotFound,
    })
  })

  it("should throw UsernameIsDuplicated when updating user", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.9.0",
    })

    mockPrisma.users.update.mockRejectedValue(prismaError)
    mockPrisma.handlePrismaErrors.mockImplementation(({ duplicatedErrors }) => {
      throw new AppException(duplicatedErrors[0].error)
    })

    await expect(
      service.updateUser({
        where: { id: "1" },
        data: { name: "test", active: true, username: "duplicate" },
      }),
    ).rejects.toThrow(UserErrors.UsernameIsDuplicated.message)
  })

  /**
   * ----------------
   * Delete User
   * ----------------
   */

  it("should delete user", async () => {
    const userId = "1"

    mockPrisma.users.update.mockResolvedValue({
      id: userId,
      active: false,
    })

    const result = await service.deleteUser({ id: userId })

    expect(result).toEqual({ success: true })
    expect(mockPrisma.users.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { active: false },
    })
  })

  it("should throw UserNotFound when deleting user", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "7.9.0",
    })

    mockPrisma.users.update.mockRejectedValue(prismaError)
    mockPrisma.handlePrismaErrors.mockImplementation(({ notFoundError }) => {
      throw new AppException(notFoundError)
    })

    await expect(service.deleteUser({ id: "fake" })).rejects.toThrow(
      UserErrors.UserNotFound.message,
    )
  })

  /**
   * ----------------
   * verifyDuplicateUsernameWithException
   * ----------------
   */

  it("should return true when username is not duplicated", async () => {
    mockPrisma.users.findFirst.mockResolvedValue(null)

    const result = await service.verifyDuplicateUsernameWithException("newuser")

    expect(result).toBe(true)
    expect(mockPrisma.users.findFirst).toHaveBeenCalledWith({
      where: {
        username: "newuser",
        NOT: {
          username: undefined,
        },
      },
    })
  })

  it("should throw UsernameIsDuplicated when username exists", async () => {
    mockPrisma.users.findFirst.mockResolvedValue(mockUser)

    await expect(service.verifyDuplicateUsernameWithException("testuser")).rejects.toThrow(
      UserErrors.UsernameIsDuplicated.message,
    )
  })

  /**
   * ----------------
   * verifyUserExistanceByUserId
   * ----------------
   */

  it("should return user when id exists", async () => {
    mockPrisma.users.findUnique.mockResolvedValue({
      ...mockUser,
      passwordHash: "hash",
    })

    const result = await service.verifyUserExistanceByUserId("1")

    expect(result.id).toBe("1")
  })

  it("should throw UserNotFound when id does not exist", async () => {
    mockPrisma.users.findUnique.mockResolvedValue(null)

    await expect(service.verifyUserExistanceByUserId("fake")).rejects.toThrow(
      UserErrors.UserNotFound.message,
    )
  })
})
