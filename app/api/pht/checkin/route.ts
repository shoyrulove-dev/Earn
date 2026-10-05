import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { vipLevelFor } from "@/lib/pht";

const rewards = [10, 15, 20, 25, 35, 50, 100];
export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const last = user.lastCheckinAt
    ? Date.UTC(
        user.lastCheckinAt.getUTCFullYear(),
        user.lastCheckinAt.getUTCMonth(),
        user.lastCheckinAt.getUTCDate(),
      )
    : 0;
  if (last === today)
    return NextResponse.json(
      { error: "Already checked in today", streak: user.checkinStreak },
      { status: 409 },
    );
  const yesterday = today - 86400000;
  const streak =
    last === yesterday ? Math.min(7, Number(user.checkinStreak || 0) + 1) : 1;
  const reward = rewards[streak - 1];
  try {
    await Transaction.create({
      userId: user._id,
      type: "checkin",
      currency: "PHT",
      amount: reward,
      status: "approved",
      source: "daily-checkin",
      reference: `checkin:${user._id}:${today}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Already checked in today", streak: user.checkinStreak },
      { status: 409 },
    );
  }
  user.checkinStreak = streak;
  user.lastCheckinAt = now;
  user.phtBalance += reward;
  user.totalEarnedPht = Number(user.totalEarnedPht || 0) + reward;
  user.vipLevel = vipLevelFor(user.totalEarnedPht);
  user.vipInitialized = true;
  await user.save();
  return NextResponse.json({
    ok: true,
    reward,
    streak,
    phtBalance: user.phtBalance,
  });
}
