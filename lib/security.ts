import crypto from "node:crypto";
import { connectDB } from "@/lib/mongodb";
import RateLimit from "@/models/RateLimit";

export function requestIp(request: Request) {
  return String(request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
}

export function secureHash(value: string) {
  return crypto.createHmac("sha256", process.env.SECURITY_HASH_SECRET || process.env.AUTH_SECRET || "pureearn").update(value).digest("hex");
}

export async function rateLimit(action: string, identity: string, limit: number, windowMs: number) {
  await connectDB();
  const key = secureHash(`${action}:${identity}`);
  const now = new Date();
  let row = await RateLimit.findOne({ key });
  if (!row || row.resetAt <= now) {
    row = await RateLimit.findOneAndUpdate({ key }, { $set: { count: 1, resetAt: new Date(Date.now() + windowMs) } }, { upsert: true, new: true });
    return { allowed: true, retryAfter: 0 };
  }
  row.count += 1;
  await row.save();
  return { allowed: row.count <= limit, retryAfter: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)) };
}

export async function verifyTurnstile(token: unknown, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: String(token) });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

function decodeBase32(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of input.toUpperCase().replace(/[^A-Z2-7]/g, "")) bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function verifyTotp(code: unknown, secret = process.env.ADMIN_TOTP_SECRET) {
  if (!secret || !/^\d{6}$/.test(String(code || ""))) return false;
  const key = decodeBase32(secret);
  const counter = Math.floor(Date.now() / 30000);
  for (let drift = -1; drift <= 1; drift++) {
    const buffer = Buffer.alloc(8); buffer.writeBigUInt64BE(BigInt(counter + drift));
    const digest = crypto.createHmac("sha1", key).update(buffer).digest();
    const offset = digest[digest.length - 1] & 15;
    const value = ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
    if (crypto.timingSafeEqual(Buffer.from(value), Buffer.from(String(code)))) return true;
  }
  return false;
}
