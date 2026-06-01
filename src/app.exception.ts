import type { ModuleNames } from "src/constants"

export interface AppErrorDescriptor {
  message: string
  statusCode: number
  persianTranslation: string
  developerMessage?: string
  code: number
  module: ModuleNames
}

export class AppException extends Error {
  public readonly statusCode: number
  public readonly persianTranslation: string
  public readonly developerMessage?: string
  public readonly code: number
  public readonly module: ModuleNames

  constructor(public readonly error: AppErrorDescriptor) {
    super(error.message)
    this.statusCode = error.statusCode
    this.persianTranslation = error.persianTranslation
    this.developerMessage = error.developerMessage
    this.code = error.code
    this.module = error.module

    Object.setPrototypeOf(this, AppException.prototype)
  }
}
