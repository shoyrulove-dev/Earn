import { NextResponse } from "next/server";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { queueReferralReward } from "@/lib/referrals";

function validHash(transId: string, received: string) {
  const secret = process.env.CPX_SECURE_HASH;
  if (!secret || !received) return false;
  const expected = crypto.createHash("md5").update(`${transId}-${secret}`).digest("hex");
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function GET(request: Request) { return handle(request); }
export async function POST(request: Request) { return handle(request); }

async function handle(request: Request) {
  const params = new URL(request.url).searchParams;
  const status = String(params.get("status") || "1");
  const transId = String(params.get("trans_id") || "");
  const userId = String(params.get("user_id") || "");
  const receivedHash = String(params.get("secure_hash") || params.get("hash") || "");
  const amountLocal = Number(params.get("amount_local") || 0);
  const amountUsd = Number(params.get("amount_usd") || 0);
  const subId = String(params.get("subid") || "");
  const subId2 = String(params.get("sub_id_2") || "");
  if (!transId || !userId || !validHash(transId, receivedHash)) return NextResponse.json({ error: "Invalid CPX postback" }, { status: 401 });
  // CPX's dashboard tester may send a placeholder user id. After validating
  // the signature, acknowledge it without creating a fake credit.
  await connectDB();
  const user = mongoose.isValidObjectId(userId)
    ? await User.findById(userId).select("_id totalEarnedPht pendingPht phtBalance")
    : await User.findOne({ userId }).select("_id totalEarnedPht pendingPht phtBalance");
  if (!user) return NextResponse.json({ ok: true, ignored: true, reason: "test user not mapped" });
  const reference = `cpx:${transId}`;
  const existing = await Transaction.findOne({ reference });

  if (status === "2") {
    if (!existing) return NextResponse.json({ ok: true, ignored: true });
    if (existing.status === "rejected") return NextResponse.json({ ok: true, duplicate: true });
    if (existing.status === "pending") user.pendingPht = Math.max(0, Number(user.pendingPht || 0) - existing.amount);
    else user.phtBalance = Math.max(0, Number(user.phtBalance || 0) - existing.amount);
    await user.save();
    existing.status = "rejected";
    existing.metadata = { ...(existing.metadata || {}), cpxStatus: 2, reversedAt: new Date() };
    await existing.save();
    return NextResponse.json({ ok: true, reversed: true });
  }

  if (status !== "1" || !Number.isFinite(amountLocal) || amountLocal <= 0) return NextResponse.json({ error: "Invalid CPX amount" }, { status: 400 });
  // Only survey sessions created by Pure Earn carry this attribution pair.
  // CPX's dashboard postback tester sends empty sub IDs; acknowledge those
  // tests without creating member balance or pending invoice liabilities.
  if (subId !== "pureearn" || subId2 !== "web")
    return NextResponse.json({ ok: true, ignored: true, reason: "test or unattributed postback" });
  if (existing) return NextResponse.json({ ok: true, duplicate: true });
  // CPX publisher payments are invoice based and do not provide a
  // transaction-level "paid" postback. Keep rewards pending without an
  // availableAt date so the automatic settlement cron cannot release them.
  // Admin releases each transaction only after the matching CPX invoice is paid.
  const earning = await Transaction.create({ userId: user._id, type: "earning", currency: "PHT", amount: Math.floor(amountLocal), status: "pending", source: "cpx", reference, metadata: { transId, amountUsd, amountLocal, settlementMode: "invoice-paid-manual", cpxStatus: 1, userShare: Number(process.env.CPX_CURRENCY_FACTOR || 400) / 1000, offerId: params.get("offer_id"), subId, subId2 } });
  await User.findByIdAndUpdate(user._id, { $inc: { pendingPht: earning.amount } });
  await queueReferralReward(earning);
  return NextResponse.json({ ok: true, rewardPht: earning.amount, status: "pending" });
}
