import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit } from "@/lib/security";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ name: session.user.name || "Administrator", email: session.user.email || "", username: process.env.ADMIN_USERNAME || "admin" });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin" || !session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await rateLimit("admin-password", session.user.id, 5, 3600000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const { currentPassword, newPassword } = await request.json();
  if (typeof newPassword !== "string" || newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) return NextResponse.json({ error: "Use at least 12 characters with upper/lowercase letters, a number and a symbol." }, { status: 400 });
  await connectDB();
  const user = await User.findById(session.user.id).select("+passwordHash");
  if (!user) return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  const fallback = process.env.ADMIN_PASSWORD_HASH_B64 ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8") : String(process.env.ADMIN_PASSWORD_HASH || "");
  const currentHash = user.passwordHash || fallback;
  if (!currentHash || !(await bcrypt.compare(String(currentPassword || ""), currentHash))) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  await writeAudit({ actorId: session.user.id, action: "admin.password.changed", target: session.user.id, metadata: { method: "profile" } });
  return NextResponse.json({ ok: true });
}
