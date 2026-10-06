import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { vipLevelFor } from "@/lib/pht";
import {
  approveReferralForEarning,
  rejectReferralForEarning,
} from "@/lib/referrals";

export async function GET() {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  return NextResponse.json({
    transactions: await Transaction.find()
      .populate("userId", "email name country memberLevel")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
  });
}
export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status } = await request.json();
  if (!id || !["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  await connectDB();
  const tx = await Transaction.findOne({ _id: id, status: "pending" });
  if (!tx)
    return NextResponse.json(
      { error: "Pending transaction not found" },
      { status: 404 },
    );
  tx.status = status;
  await tx.save();
  const amount = Math.abs(Number(tx.amount));
  if (tx.type === "withdrawal") {
    if (status === "rejected")
      await User.findByIdAndUpdate(tx.userId, { $inc: { phtBalance: amount } });
    return NextResponse.json({ ok: true });
  }
  if (tx.type === "earning") {
    const updated = await User.findByIdAndUpdate(
      tx.userId,
      {
        $inc: {
          pendingPht: -amount,
          ...(status === "approved"
            ? { phtBalance: amount, totalEarnedPht: amount }
            : {}),
        },
      },
      { new: true },
    );
    if (status === "approved" && updated) {
      updated.vipLevel = vipLevelFor(updated.totalEarnedPht);
      updated.vipInitialized = true;
      await updated.save();
    }
    if (status === "approved") await approveReferralForEarning(tx);
    else await rejectReferralForEarning(tx._id);
  }
  return NextResponse.json({ ok: true });
}
