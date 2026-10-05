import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import AuditLog from "@/models/AuditLog";
import { MIN_WITHDRAW_PHT, PHT_PER_USD, tierFor, VND_PER_USD } from "@/lib/pht";

const vnMethods = ["BANK_VN", "MOMO", "USDT_BSC"];
export async function POST(request: Request) {
  const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json(); const amount = Math.floor(Number(body.phtAmount)); const method = String(body.method || ""); const account = String(body.account || "").trim();
  if (!Number.isFinite(amount) || amount < MIN_WITHDRAW_PHT) return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAW_PHT.toLocaleString()} PHT` }, { status: 400 });
  await connectDB(); const current = await User.findById(session.user.id).select("country phtBalance").lean() as { country?: string; phtBalance?: number } | null; if (!current) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const detected = request.headers.get("x-vercel-ip-country"); const isVietnam = current.country === "VN" && (!detected || detected === "VN"); const allowed = isVietnam ? vnMethods : ["USDT_BSC", "LTC"];
  if (!allowed.includes(method)) return NextResponse.json({ error: "This withdrawal method is not available in your country" }, { status: 400 });
  if (method === "USDT_BSC" && !/^0x[a-fA-F0-9]{40}$/.test(account)) return NextResponse.json({ error: "Enter a valid BSC address" }, { status: 400 });
  if (method === "LTC" && !/^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,90}$/i.test(account)) return NextResponse.json({ error: "Enter a valid Litecoin address" }, { status: 400 });
  if (method === "MOMO" && !/^(0|\+84)\d{9,10}$/.test(account.replace(/\s/g, ""))) return NextResponse.json({ error: "Enter a valid MoMo phone number" }, { status: 400 });
  if (method === "BANK_VN" && (!body.bankName || !body.accountName || account.length < 6)) return NextResponse.json({ error: "Bank, account holder and account number are required" }, { status: 400 });
  if (method === "MOMO" && !body.accountName) return NextResponse.json({ error: "MoMo account holder is required" }, { status: 400 });
  const tier = tierFor(Number(current.phtBalance || 0)); const feePht = Math.floor(amount * tier.feeRate); const netPht = amount - feePht; const netUsd = netPht / PHT_PER_USD; const user = await User.findOneAndUpdate({ _id: session.user.id, phtBalance: { $gte: amount } }, { $inc: { phtBalance: -amount } }, { new: true });
  if (!user) return NextResponse.json({ error: "Insufficient PHT balance" }, { status: 400 });
  const metadata = { account, bankName: body.bankName, accountName: body.accountName, country: current.country, tier: tier.name, feePht, netPht, netUsd, estimatedVnd: Math.floor(netUsd * VND_PER_USD), priority: tier.priority };
  await Transaction.create({ userId: user._id, type: "withdrawal", currency: "PHT", amount: -amount, status: "pending", source: method, reference: `withdrawal:${user._id}:${Date.now()}`, metadata });
  await AuditLog.create({ actorId: user._id, action: "withdrawal.requested", target: String(user._id), metadata: { amount, method, ...metadata } });
  return NextResponse.json({ ok: true, phtBalance: user.phtBalance, feePht, netPht, netUsd, tier: tier.name });
}
