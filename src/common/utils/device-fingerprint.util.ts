import { createHash } from "crypto"
import type { Request } from "express"

/**
 * Derives a stable device fingerprint for the incoming request from its
 * `User-Agent` header.
 *
 * @remarks
 * The fingerprint is the hex-encoded SHA-256 of the `User-Agent` string, so the
 * same device/browser always yields the same value while a different device
 * (e.g. a laptop replaying a token issued to a phone) yields a different one.
 * A missing `User-Agent` hashes the empty string, producing a constant value.
 *
 * @param req - The incoming Express request.
 * @returns The hex-encoded SHA-256 fingerprint of the request's `User-Agent`.
 */
export function getDeviceFingerprint(req: Request): string {
  const userAgent = req.headers["user-agent"] ?? ""
  return createHash("sha256").update(userAgent).digest("hex")
}
