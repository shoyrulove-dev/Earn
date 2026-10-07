import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";
import BingXSubmission from "@/models/BingXSubmission";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { tierFor } from "@/lib/pht";
import { queueReferralReward } from "@/lib/referrals";
import { normalizeBingXConfig } from "@/lib/bingx";

async function admin() {
  const session = await getAuthSession();
  return session?.user?.role === "admin" ? session : null;
}
export async function GET() {
  if (!(await admin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await connectDB();
  const [setting, submissions] = await Promise.all([
    AppSetting.findOne({ key: "bingx" }).lean(),
    BingXSubmission.find({ status: "pending" })
      .populate("userId", "email name userId")
      .sort({ createdAt: 1 })
      .lean(),
  ]);
  return NextResponse.json({
    config: normalizeBingXConfig(
      (setting as { value?: Record<string, unknown> } | null)?.value || {},
    ),
    submissions,
  });
}
export async function PUT(request: Request) {
  if (!(await admin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const value = normalizeBingXConfig(body);
  const invalidTier = (["1", "2", "3"] as const).find(
    (tier) => value.tiers[tier].active && value.tiers[tier].rewardPht <= 0,
  );
  if (invalidTier)
    return NextResponse.json(
      { error: `Tier ${invalidTier} needs a positive PHT reward before activation` },
      { status: 400 },
    );
  if (value.affiliateUrl) {
    try {
      new URL(value.affiliateUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid affiliate URL" },
        { status: 400 },
      );
    }
  }
  await connectDB();
  const previous = (await AppSetting.findOne({ key: "bingx" }).lean()) as {
    value?: { active?: boolean; affiliateUrl?: string };
  } | null;
  await AppSetting.findOneAndUpdate(
    { key: "bingx" },
    { $set: { value } },
    { upsert: true, new: true },
  );
  let announced = false;
  if (
    value.active &&
    value.autoAnnounce &&
    (!previous?.value?.active ||
      previous.value.affiliateUrl !== value.affiliateUrl)
  ) {
    const token = process.env.TELEGRAM_BOT_TOKEN,
      chat_id = process.env.TELEGRAM_NEWS_CHAT_ID || "-1004353318290";
    if (token) {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id,
            text: `🎁 BingX Rewards is live\n\nTier 1: KYC · ${value.tiers["1"].rewardPht} PHT\nTier 2: Deposit · ${value.tiers["2"].rewardPht} PHT\nTier 3: Trading volume · ${value.tiers["3"].active ? `${value.tiers["3"].rewardPht} PHT` : "Coming soon"}\n\nEligible new users may also receive: ${value.mysteryBox}.\n\nOpen Pure Earn → Offers to participate.`,
            disable_web_page_preview: false,
          }),
        },
      );
      announced = response.ok;
    }
  }
  return NextResponse.json({ ok: true, config: value, announced });
}
export async function PATCH(request: Request) {
  const session = await admin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, status, reviewNote } = await request.json();
  if (!id || !["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  await connectDB();
  const submission = await BingXSubmission.findOne({
    _id: id,
    status: "pending",
  });
  if (!submission)
    return NextResponse.json(
      { error: "Already reviewed or not found" },
      { status: 404 },
    );
  submission.status = status;
  submission.reviewNote = String(reviewNote || "");
  submission.reviewedBy = session.user.id as never;
  submission.reviewedAt = new Date();
  if (status === "approved") {
    const user = await User.findById(submission.userId).select(
      "totalEarnedPht",
    );
    const rewardPht = Math.floor(
      Number(submission.rewardPht) *
        (1 + tierFor(Number(user?.totalEarnedPht || 0)).bonusRate),
    );
    submission.releaseAt = new Date(
      Date.now() + submission.holdDays * 86400000,
    );
    await User.findByIdAndUpdate(submission.userId, {
      $inc: { pendingPht: rewardPht },
    });
    const earning = await Transaction.create({
      userId: submission.userId,
      type: "earning",
      currency: "PHT",
      amount: rewardPht,
      status: "pending",
      availableAt: submission.releaseAt,
      source: `bingx-tier-${submission.tier}`,
      reference: `bingx:tier${submission.tier}:${submission._id}`,
      metadata: {
        bingxUid: submission.bingxUid,
        tier: submission.tier,
        kycVerified: submission.tier === 1,
        holdDays: submission.holdDays,
        baseRewardPht: submission.rewardPht,
      },
    });
    await queueReferralReward(earning);
  }
  await submission.save();
  return NextResponse.json({ ok: true, submission });
}
