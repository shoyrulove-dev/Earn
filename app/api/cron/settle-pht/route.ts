import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { vipLevelFor } from "@/lib/pht";
import { approveReferralForEarning } from "@/lib/referrals";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { syncAccessTradeTransactions } from "@/lib/accesstrade-sync";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let accessTrade: unknown = null;
  try {
    accessTrade = await syncAccessTradeTransactions();
  } catch (error) {
    accessTrade = {
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
  await connectDB();
  const due = await Transaction.find({
    type: "earning",
    currency: "PHT",
    status: "pending",
    availableAt: { $lte: new Date() },
    $or: [{ source: { $ne: "accesstrade" } }, { "metadata.networkStatus": 1 }],
  })
    .select("_id")
    .limit(200)
    .lean();
  let settled = 0;
  for (const item of due) {
    const tx = await Transaction.findOneAndUpdate(
      { _id: item._id, status: "pending" },
      { $set: { status: "approved" } },
      { new: true },
    );
    if (!tx) continue;
    const amount = Math.abs(Number(tx.amount));
    const earner = (await User.findByIdAndUpdate(
      tx.userId,
      {
        $inc: {
          pendingPht: -amount,
          phtBalance: amount,
          totalEarnedPht: amount,
        },
      },
      { new: true },
    )
      .select("referredBy totalEarnedPht")
      .lean()) as { referredBy?: unknown; totalEarnedPht?: number } | null;
    if (earner)
      await User.findByIdAndUpdate(tx.userId, {
        $set: {
          vipLevel: vipLevelFor(Number(earner.totalEarnedPht || 0)),
          vipInitialized: true,
        },
      });
    await approveReferralForEarning(tx);
    settled++;
  }
  return NextResponse.json({ ok: true, accessTrade, settled });
}
