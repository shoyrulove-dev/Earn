import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { secureHash } from "@/lib/security";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  await connectDB();
  const user = token ? await User.findOne({ emailVerificationTokenHash: secureHash(token), emailVerificationExpiresAt: { $gt: new Date() } }).select("+emailVerificationTokenHash +emailVerificationExpiresAt") : null;
  if (!user) return NextResponse.redirect(new URL("/?verified=invalid", request.url));
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();
  return NextResponse.redirect(new URL("/dashboard?verified=1", request.url));
}
