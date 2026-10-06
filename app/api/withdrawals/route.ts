import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { MIN_WITHDRAW_PHT, PHT_PER_USD, tierFor, VND_PER_USD } from "@/lib/pht";
import { rateLimit, requestIp, secureHash } from "@/lib/security";
import { writeAudit } from "@/lib/audit";

const vnMethods = ["BANK_VN", "MOMO", "USDT_BSC"];
export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = await rateLimit("withdrawal", `${session.user.id}:${requestIp(request)}`, 5, 60 * 60 * 1000);
  if (!limited.allowed) return NextResponse.json({ error: "Too many withdrawal requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });
  const body = await request.json();
  const amount = Math.floor(Number(body.phtAmount));
  const method = String(body.method || "");
  const account = String(body.account || "").trim();
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAW_PHT)
    return NextResponse.json(
      {
        error: `Minimum withdrawal is ${MIN_WITHDRAW_PHT.toLocaleString()} PHT`,
      },
      { status: 400 },
    );
  await connectDB();
  const current = (await User.findById(session.user.id)
    .select("country phtBalance phtDebt totalEarnedPht emailVerifiedAt payoutDestinationChangedAt +payoutDestinationHash")
    .lean()) as {
    country?: string;
    phtBalance?: number;
    totalEarnedPht?: number;
    phtDebt?: number;
    emailVerifiedAt?: Date;
    payoutDestinationHash?: string;
    payoutDestinationChangedAt?: Date;
  } | null;
  if (!current)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!current.emailVerifiedAt) return NextResponse.json({ error: "Verify your email before your first withdrawal.", code: "EMAIL_NOT_VERIFIED" }, { status: 403 });
  if (Number(current.phtDebt || 0) > 0) return NextResponse.json({ error: `Your account has ${Math.ceil(Number(current.phtDebt))} PHT outstanding from a reversed partner reward.` }, { status: 409 });
  const detected = request.headers.get("x-vercel-ip-country");
  const isVietnam =
    current.country === "VN" && (!detected || detected === "VN");
  const allowed = isVietnam ? vnMethods : ["USDT_BSC", "LTC"];
  if (!allowed.includes(method))
    return NextResponse.json(
      { error: "This withdrawal method is not available in your country" },
      { status: 400 },
    );
  if (method === "USDT_BSC" && !/^0x[a-fA-F0-9]{40}$/.test(account))
    return NextResponse.json(
      { error: "Enter a valid BSC address" },
      { status: 400 },
    );
  if (
    method === "LTC" &&
    !/^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,90}$/i.test(account)
  )
    return NextResponse.json(
      { error: "Enter a valid Litecoin address" },
      { status: 400 },
    );
  if (
    method === "MOMO" &&
    !/^(0|\+84)\d{9,10}$/.test(account.replace(/\s/g, ""))
  )
    return NextResponse.json(
      { error: "Enter a valid MoMo phone number" },
      { status: 400 },
    );
  if (
    method === "BANK_VN" &&
    (!body.bankName || !body.accountName || account.length < 6)
  )
    return NextResponse.json(
      { error: "Bank, account holder and account number are required" },
      { status: 400 },
    );
  if (method === "MOMO" && !body.accountName)
    return NextResponse.json(
      { error: "MoMo account holder is required" },
      { status: 400 },
    );
  const destinationHash = secureHash(JSON.stringify({ method, account: account.toLowerCase(), bankName: String(body.bankName || "").trim().toLowerCase(), accountName: String(body.accountName || "").trim().toLowerCase() }));
  if (current.payoutDestinationHash && current.payoutDestinationHash !== destinationHash) {
    const changedAt = new Date();
    await User.findByIdAndUpdate(session.user.id, { $set: { payoutDestinationHash: destinationHash, payoutDestinationChangedAt: changedAt } });
    await writeAudit({ actorId: session.user.id, action: "payout.destination.changed", target: session.user.id, ip: requestIp(request), metadata: { method } });
    return NextResponse.json({ error: "Payout details changed. Withdrawals are locked for 24 hours for your protection.", retryAt: new Date(changedAt.getTime() + 86400000) }, { status: 423 });
  }
  if (current.payoutDestinationChangedAt && Date.now() - new Date(current.payoutDestinationChangedAt).getTime() < 86400000)
    return NextResponse.json({ error: "Withdrawals are temporarily locked after a payout detail change.", retryAt: new Date(new Date(current.payoutDestinationChangedAt).getTime() + 86400000) }, { status: 423 });
  if (!current.payoutDestinationHash) await User.findByIdAndUpdate(session.user.id, { $set: { payoutDestinationHash: destinationHash } });
  const tier = tierFor(Number(current.totalEarnedPht || 0));
  const feePht = Math.floor(amount * tier.feeRate);
  const netPht = amount - feePht;
  const netUsd = netPht / PHT_PER_USD;
  const user = await User.findOneAndUpdate(
    { _id: session.user.id, phtBalance: { $gte: amount } },
    { $inc: { phtBalance: -amount } },
    { new: true },
  );
  if (!user)
    return NextResponse.json(
      { error: "Insufficient PHT balance" },
      { status: 400 },
    );
  const metadata = {
    account,
    bankName: body.bankName,
    accountName: body.accountName,
    country: current.country,
    tier: tier.name,
    feePht,
    netPht,
    netUsd,
    estimatedVnd: Math.floor(netUsd * VND_PER_USD),
    priority: tier.priority,
    autoReviewEligible: tier.autoReview,
  };
  await Transaction.create({
    userId: user._id,
    type: "withdrawal",
    currency: "PHT",
    amount: -amount,
    status: "pending",
    source: method,
    reference: `withdrawal:${user._id}:${Date.now()}`,
    metadata,
  });
  await writeAudit({
    actorId: user._id,
    action: "withdrawal.requested",
    target: String(user._id),
    ip: requestIp(request),
    userAgent: request.headers.get("user-agent") || undefined,
    metadata: { amount, method, ...metadata },
  });
  return NextResponse.json({
    ok: true,
    phtBalance: user.phtBalance,
    feePht,
    netPht,
    netUsd,
    tier: tier.name,
  });
}
