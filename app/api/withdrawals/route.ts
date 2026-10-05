import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import AuditLog from "@/models/AuditLog";

const vnMethods = ["USDT_BSC", "BANK_VN", "MOMO", "VIETQR"];
export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json(); const amount = Number(body.amount); const method = String(body.method || ""); const account = String(body.account || "").trim();
  if (!Number.isFinite(amount) || amount < 5) return NextResponse.json({ error: "Minimum withdrawal is $5" }, { status: 400 });
  await connectDB(); const current = await User.findById(session.user.id).select("country").lean() as { country?: string } | null;
  const detected = request.headers.get("x-vercel-ip-country"); const isVietnam = current?.country === "VN" && (!detected || detected === "VN");
  const allowed = isVietnam ? vnMethods : ["USDT_BSC"];
  if (!allowed.includes(method)) return NextResponse.json({ error: "This withdrawal method is not available in your country" }, { status: 400 });
  if (method === "USDT_BSC" && !/^0x[a-fA-F0-9]{40}$/.test(account)) return NextResponse.json({ error: "Enter a valid BSC address (0x + 40 hexadecimal characters)" }, { status: 400 });
  if (method === "MOMO" && !/^(0|\+84)\d{9,10}$/.test(account.replace(/\s/g, ""))) return NextResponse.json({ error: "Enter a valid MoMo phone number" }, { status: 400 });
  if (["BANK_VN", "VIETQR"].includes(method) && (!body.bankName || !body.accountName || account.length < 6)) return NextResponse.json({ error: "Bank, account holder and account number are required" }, { status: 400 });
  const user = await User.findOneAndUpdate({ _id: session.user.id, balance: { $gte: amount } }, { $inc: { balance: -amount, pendingBalance: amount } }, { new: true });
  if (!user) return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
  const metadata = { account, bankName: body.bankName, accountName: body.accountName, qrUrl: body.qrUrl, country: current?.country };
  await Transaction.create({ userId: user._id, type: "withdrawal", amount: -amount, status: "pending", source: method, reference: `withdrawal:${user._id}:${Date.now()}`, metadata });
  await AuditLog.create({ actorId: user._id, action: "withdrawal.requested", target: String(user._id), metadata: { amount, method, ...metadata } });
  return NextResponse.json({ ok: true, balance: user.balance, pendingBalance: user.pendingBalance });
}
