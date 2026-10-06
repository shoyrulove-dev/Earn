import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { referralTerms } from "@/lib/pht";
import mongoose from "mongoose";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = (await User.findById(session.user.id)
    .select("referralCode referralEarnings totalEarnedPht")
    .lean()) as {
    referralCode?: string;
    referralEarnings?: number;
    totalEarnedPht?: number;
  } | null;
  const members = await User.countDocuments({ referredBy: session.user.id });
  const recent = await User.find({ referredBy: session.user.id })
    .select(
      "name username image createdAt totalEarnedPht activationBonusPaidAt referralRisk",
    )
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const pending = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(session.user.id),
        type: "referral",
        status: "pending",
      },
    },
    { $group: { _id: null, amount: { $sum: "$amount" } } },
  ]);
  return NextResponse.json({
    ...user,
    members,
    recent,
    pendingReferralPht: Number(pending[0]?.amount || 0),
    terms: referralTerms(Number(user?.totalEarnedPht || 0)),
  });
}
