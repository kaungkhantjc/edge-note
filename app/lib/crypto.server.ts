import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compares two strings in constant time using hashes to prevent length leaks.
 * This function is intended for server-side use only.
 */
export function safeCompare(a: string, b: string) {
    // Prevent potential DoS by setting a reasonable max length (512 chars)
    // before performing CPU-intensive hashing.
    if ((a || "").length > 512 || (b || "").length > 512) {
        return false;
    }

    // Using a hash ensures we always compare buffers of the same length,
    // which prevents leaking the length of the secret via timing.
    const aHash = createHash("sha256").update(a || "").digest();
    const bHash = createHash("sha256").update(b || "").digest();

    return timingSafeEqual(aHash, bHash);
}
