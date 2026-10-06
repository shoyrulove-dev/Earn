import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit, secureHash } from "@/lib/security";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await rateLimit("verify-email", session.user.id, 3, 60 * 60 * 1000);
  if (!limited.allowed) return NextResponse.json({ error: "Please wait before requesting another email." }, { status: 429 });
  await connectDB();
  const token = crypto.randomBytes(32).toString("hex");
  await User.findByIdAndUpdate(session.user.id, { $set: { emailVerificationTokenHash: secureHash(token), emailVerificationExpiresAt: new Date(Date.now() + 86400000) } });
  const sent = await sendVerificationEmail(session.user.email, token);
  return sent ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
}
