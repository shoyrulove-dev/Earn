import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { connectDB } from "@/lib/mongodb";
import OfferClick from "@/models/OfferClick";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { networkAmountToUsd, offerRewardPht, USER_SHARE } from "@/lib/pht";

const secretFor = (network: string) => ({ accesstrade: process.env.ACCESSTRADE_WEBHOOK_SECRET, timewall: process.env.TIMEWALL_WEBHOOK_SECRET, cpalead: process.env.CPALEAD_WEBHOOK_SECRET }[network]);
export async function POST(request: Request, context: { params: Promise<{ network: string }> }) {
  const { network } = await context.params; const secret = secretFor(network); if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const raw = await request.text(); const signature = request.headers.get("x-webhook-signature") || ""; const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const body = JSON.parse(raw); const clickId = String(body.click_id || body.transaction_id || body.conversion_id || ""); const userId = String(body.user_id || body.sub_id || body.sub1 || ""); const gross = Number(body.amount || body.reward || body.commission || 0);
  if (!clickId || !userId || !Number.isFinite(gross) || gross <= 0) return NextResponse.json({ error: "Invalid postback" }, { status: 400 });
  await connectDB(); const reference = `${network}:${clickId}`; if (await Transaction.exists({ reference })) return NextResponse.json({ ok: true, duplicate: true });
  const user = await User.findById(userId).select("phtBalance"); if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const grossUsd = networkAmountToUsd(gross, body.currency || (network === "accesstrade" ? "VND" : "USD")); const rewardPht = offerRewardPht(grossUsd, user.phtBalance); const holdDays = Math.min(30, Math.max(3, Number(process.env.PHT_PENDING_DAYS || 5))); const availableAt = new Date(Date.now() + holdDays * 86400000);
  await Transaction.create({ userId, type: "earning", currency: "PHT", amount: rewardPht, status: "pending", availableAt, source: network, reference, metadata: { clickId, gross, grossUsd, userShare: USER_SHARE, payload: body } });
  await User.findByIdAndUpdate(userId, { $inc: { pendingPht: rewardPht } }); await OfferClick.updateOne({ network, clickId }, { $set: { status: "converted" } }, { upsert: false });
  return NextResponse.json({ ok: true, rewardPht, status: "pending", availableAt });
}
