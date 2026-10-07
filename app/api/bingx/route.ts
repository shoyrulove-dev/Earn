import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";
import BingXSubmission from "@/models/BingXSubmission";
import { rateLimit, requestIp, verifyTurnstile } from "@/lib/security";
import { normalizeBingXConfig } from "@/lib/bingx";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const [setting, submissions] = await Promise.all([
    AppSetting.findOne({ key: "bingx" }).lean(),
    BingXSubmission.find({ userId: session.user.id }).sort({ tier: 1 }).lean(),
  ]);
  const value =
    (setting as { value?: Record<string, unknown> } | null)?.value || {};
  const config = normalizeBingXConfig(value);
  return NextResponse.json({
    config: {
      ...config,
      affiliateUrl: config.active ? config.affiliateUrl : "",
    },
    submissions,
  });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const {
    tier: rawTier,
    bingxUid,
    proofImageUrl,
    turnstileToken,
  } = await request.json();
  const tier = Number(rawTier);
  if (![1, 2, 3].includes(tier))
    return NextResponse.json({ error: "Invalid BingX tier" }, { status: 400 });
  const limited = await rateLimit("bingx-proof", session.user.id, 5, 3600000);
  if (!limited.allowed)
    return NextResponse.json(
      { error: "Too many submissions" },
      { status: 429 },
    );
  if (!(await verifyTurnstile(turnstileToken, requestIp(request))))
    return NextResponse.json(
      { error: "Security check failed" },
      { status: 400 },
    );
  if (!/^\d{5,30}$/.test(String(bingxUid || "")))
    return NextResponse.json(
      { error: "Enter a valid numeric BingX UID" },
      { status: 400 },
    );
  try {
    new URL(String(proofImageUrl || ""));
  } catch {
    return NextResponse.json(
      { error: "Enter a valid KYC proof image URL" },
      { status: 400 },
    );
  }
  await connectDB();
  const setting = (await AppSetting.findOne({ key: "bingx" }).lean()) as {
    value?: Record<string, unknown>;
  } | null;
  const config = normalizeBingXConfig(setting?.value || {}),
    tierConfig = config.tiers[String(tier) as "1" | "2" | "3"];
  if (!config.active || !tierConfig.active)
    return NextResponse.json(
      { error: "This BingX tier is not active" },
      { status: 409 },
    );
  if (tier > 1) {
    const previous = await BingXSubmission.findOne({
      userId: session.user.id,
      tier: tier - 1,
      status: "approved",
    });
    if (!previous)
      return NextResponse.json(
        { error: `Tier ${tier - 1} must be approved first` },
        { status: 409 },
      );
    if (previous.bingxUid !== String(bingxUid))
      return NextResponse.json(
        { error: "Use the same BingX UID for every tier" },
        { status: 409 },
      );
  }
  const existing = await BingXSubmission.findOne({
    userId: session.user.id,
    tier,
  });
  if (existing) {
    if (existing.status !== "rejected")
      return NextResponse.json(
        { error: `Tier ${tier} was already submitted` },
        { status: 409 },
      );
    existing.bingxUid = String(bingxUid);
    existing.proofImageUrl = String(proofImageUrl);
    existing.rewardPht = tierConfig.rewardPht;
    existing.holdDays = tierConfig.holdDays;
    existing.status = "pending";
    existing.reviewNote = undefined;
    existing.reviewedAt = undefined;
    existing.reviewedBy = undefined;
    await existing.save();
    return NextResponse.json({ submission: existing });
  }
  try {
    const submission = await BingXSubmission.create({
      userId: session.user.id,
      tier,
      bingxUid: String(bingxUid),
      proofImageUrl: String(proofImageUrl),
      rewardPht: tierConfig.rewardPht,
      holdDays: tierConfig.holdDays,
    });
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      return NextResponse.json(
        { error: `This user or BingX UID has already submitted Tier ${tier}` },
        { status: 409 },
      );
    throw error;
  }
}
