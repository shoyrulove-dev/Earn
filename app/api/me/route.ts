import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ensureUserIdentity } from "@/lib/user-identity";
import Transaction from "@/models/Transaction";
import { vipLevelFor } from "@/lib/pht";
import { normalizeCountry } from "@/lib/countries";
import { peForApprovedPht } from "@/lib/pe";
import { rejectReferralForEarning } from "@/lib/referrals";

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
  const runMaintenance = new URL(request.url).searchParams.get("maintenance") === "1";
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
    if (runMaintenance) {
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
    // Legacy PE reconciliation is intentionally one-time. New approvals award
    // PE at settlement, so rescanning the full ledger on every dashboard load
    // only adds latency without changing the balance.
    if (!user.peBackfilledAt) {
      const peRows = await Transaction.aggregate([
        { $match: { userId: user._id, type: "earning", currency: "PHT", status: "approved", amount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const targetPe = peForApprovedPht(Number(peRows[0]?.total || 0));
      let currentTaskPe = Number(user.taskEarnedPe || 0);
      if (!currentTaskPe && Number(user.totalEarnedPe || 0) > 0)
        currentTaskPe = Math.min(targetPe, Number(user.totalEarnedPe || 0));
      const difference = Math.max(0, Math.floor((targetPe - currentTaskPe) * 100) / 100);
      await User.findOneAndUpdate(
        { _id: user._id, peBackfilledAt: { $exists: false } },
        {
          $inc: { peBalance: difference, totalEarnedPe: difference },
          $set: { taskEarnedPe: targetPe, peBackfilledAt: new Date() },
        },
      );
    }
    // Remove legacy dashboard-tester credits. Real CPX sessions always carry
    // subId=pureearn; empty attribution came from the CPX postback test tool.
    if (Number(user.pendingPht || 0) > 0 && !user.cpxAttributionCleanedAt) {
      const tests = await Transaction.find({
        userId: user._id,
        source: "cpx",
        status: "pending",
        $or: [{ "metadata.subId": { $exists: false } }, { "metadata.subId": "" }],
      }).select("_id amount");
      let removed = 0;
      for (const test of tests) {
        const reversed = await Transaction.findOneAndUpdate(
          { _id: test._id, status: "pending" },
          { $set: { status: "rejected", "metadata.reversalReason": "legacy-cpx-dashboard-test", "metadata.reversedAt": new Date() } },
          { new: true },
        );
        if (reversed) {
          removed += Math.abs(Number(reversed.amount || 0));
          await rejectReferralForEarning(reversed._id);
        }
      }
      const fresh = await User.findById(user._id);
      if (fresh) {
        fresh.pendingPht = Math.max(0, Number(fresh.pendingPht || 0) - removed);
        fresh.cpxAttributionCleanedAt = new Date();
        await fresh.save();
      }
    }
    user = await User.findById(user._id);
    }
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
