import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "traveloop_salt").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number): string {
  const payload = `${userId}:${Date.now()}:${Math.random()}`;
  return Buffer.from(payload).toString("base64url");
}

export function parseToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [userId] = decoded.split(":");
    const id = parseInt(userId, 10);
    return isNaN(id) ? null : id;
  } catch {
    return null;
  }
}

export function generateShareCode(): string {
  return crypto.randomBytes(6).toString("hex");
}
