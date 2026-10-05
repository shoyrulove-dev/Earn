import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ensureUserIdentity } from "@/lib/user-identity";
import Transaction from "@/models/Transaction";
import { vipLevelFor } from "@/lib/pht";
import { normalizeCountry } from "@/lib/countries";

const locales = ["en", "vi", "zh", "es"];
function localeFor(country: string) {
  return country === "VN"
    ? "vi"
    : country === "CN"
      ? "zh"
      : country === "ES"
        ? "es"
        : "en";
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const detected = String(
    request.headers.get("x-vercel-ip-country") || "OTHER",
  ).toUpperCase();
  let user = await User.findOne({ email: session.user.email.toLowerCase() });
  if (user && !user.country) {
    user.country = detected;
    user.locale = localeFor(detected);
    await user.save();
  }
  if (user) {
    await ensureUserIdentity(user);
    if (!user.vipInitialized) {
      const rows = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
            status: "approved",
            amount: { $gt: 0 },
            type: { $in: ["earning", "checkin"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      user.totalEarnedPht = Math.max(
        Number(user.totalEarnedPht || 0),
        Number(rows[0]?.total || 0),
      );
      user.vipLevel = vipLevelFor(user.totalEarnedPht);
      user.vipInitialized = true;
      await user.save();
    }
    user = await User.findById(user._id);
  }
  return NextResponse.json({ user: user?.toObject() });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const changes: Record<string, unknown> = {};
  if (body.country) {
    changes.country = normalizeCountry(body.country);
    changes.countryName =
      changes.country === "OTHER"
        ? String(body.countryName || "")
            .trim()
            .slice(0, 80)
        : "";
  }
  if (locales.includes(body.locale)) changes.locale = body.locale;
  if (body.paymentAccounts && typeof body.paymentAccounts === "object")
    changes.paymentAccounts = body.paymentAccounts;
  await connectDB();
  const user = await User.findByIdAndUpdate(
    session.user.id,
    { $set: changes },
    { new: true },
  );
  return NextResponse.json({ user });
}
