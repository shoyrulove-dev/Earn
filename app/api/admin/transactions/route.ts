import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import {
  approveReferralForEarning,
  rejectReferralForEarning,
} from "@/lib/referrals";
import { verifyTotp, requestIp } from "@/lib/security";
import { writeAudit } from "@/lib/audit";
import { creditApprovedPht } from "@/lib/balance";

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
  const { id, status, totp } = await request.json();
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
    const threshold = Number(process.env.ADMIN_LARGE_WITHDRAWAL_PHT || 50000);
    if (status === "approved" && amount >= threshold && !verifyTotp(totp)) {
      tx.status = "pending";
      await tx.save();
      return NextResponse.json({ error: "A valid administrator TOTP code is required for this withdrawal." }, { status: 401 });
    }
    if (status === "rejected")
      await User.findByIdAndUpdate(tx.userId, { $inc: { phtBalance: amount } });
    await writeAudit({ actorId: session.user.id, action: `admin.withdrawal.${status}`, target: String(tx._id), ip: requestIp(request), userAgent: request.headers.get("user-agent") || undefined, metadata: { amount, userId: String(tx.userId), source: tx.source } });
    return NextResponse.json({ ok: true });
  }
  if (tx.type === "earning") {
    await User.findByIdAndUpdate(tx.userId, { $inc: { pendingPht: -amount } });
    const credited = status === "approved" ? await creditApprovedPht(tx.userId, amount) : null;
    if (credited?.debtPaid) tx.set("metadata.debtPaidPht", credited.debtPaid);
    if (credited?.debtPaid) await tx.save();
    if (status === "approved") await approveReferralForEarning(tx);
    else await rejectReferralForEarning(tx._id);
  }
  await writeAudit({ actorId: session.user.id, action: `admin.transaction.${status}`, target: String(tx._id), ip: requestIp(request), userAgent: request.headers.get("user-agent") || undefined, metadata: { amount, type: tx.type, userId: String(tx.userId) } });
  return NextResponse.json({ ok: true });
}
