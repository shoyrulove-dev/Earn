import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ensureUserIdentity } from "@/lib/user-identity";

const locales = ["en", "vi", "zh", "es"];
function localeFor(country: string) { return country === "VN" ? "vi" : country === "CN" ? "zh" : country === "ES" ? "es" : "en"; }

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const detected = String(request.headers.get("x-vercel-ip-country") || "OTHER").toUpperCase();
  let user = await User.findOne({ email: session.user.email.toLowerCase() });
  if (user && !user.country) { user.country = detected; user.locale = localeFor(detected); await user.save(); }
  if (user) { await ensureUserIdentity(user); user = await User.findById(user._id); }
  return NextResponse.json({ user: user?.toObject() });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json(); const changes: Record<string, unknown> = {};
  if (body.country) changes.country = String(body.country).toUpperCase().slice(0, 2);
  if (locales.includes(body.locale)) changes.locale = body.locale;
  if (body.paymentAccounts && typeof body.paymentAccounts === "object") changes.paymentAccounts = body.paymentAccounts;
  await connectDB();
  const user = await User.findByIdAndUpdate(session.user.id, { $set: changes }, { new: true });
  return NextResponse.json({ user });
}
