import crypto from "node:crypto";
import AuditLog from "@/models/AuditLog";

export async function writeAudit(entry: { actorId?: unknown; action: string; target?: string; ip?: string; userAgent?: string; metadata?: unknown }) {
  const previous = await AuditLog.findOne().sort({ createdAt: -1 }).select("hash").lean() as { hash?: string } | null;
  const createdAt = new Date();
  const payload = JSON.stringify({ ...entry, actorId: entry.actorId ? String(entry.actorId) : undefined, createdAt: createdAt.toISOString(), previousHash: previous?.hash || "GENESIS" });
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  return AuditLog.create({ ...entry, createdAt, previousHash: previous?.hash || "GENESIS", hash });
}
