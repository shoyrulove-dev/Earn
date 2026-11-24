import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { vipLevelFor } from "@/lib/pht";

const DAILY_CHECKIN_PHT = 5;
const DAILY_CHECKIN_PE = 0.01;
function vietnamDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}
function previousDate(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}
export async function POST() {
  const session = await getAuthSession();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  const now = new Date();
  const today = vietnamDate(now);
  const last = user.lastCheckinDate ||
    (user.lastCheckinAt ? vietnamDate(user.lastCheckinAt) : "");
  if (last === today)
    return NextResponse.json(
      { error: "Already checked in today", streak: user.checkinStreak },
      { status: 409 },
    );
  const yesterday = previousDate(today);
  const streak =
    last === yesterday ? Math.min(7, Number(user.checkinStreak || 0) + 1) : 1;
  const reward = DAILY_CHECKIN_PHT;
  try {
    await Transaction.create({
      userId: user._id,
      type: "checkin",
      currency: "PHT",
      amount: reward,
      status: "approved",
      source: "daily-checkin",
      reference: `checkin:${user._id}:${today}`,
      metadata: { peReward: DAILY_CHECKIN_PE, checkinDate: today },
    });
  } catch {
    return NextResponse.json(
      { error: "Already checked in today", streak: user.checkinStreak },
      { status: 409 },
    );
  }
  user.checkinStreak = streak;
  user.lastCheckinAt = now;
  user.lastCheckinDate = today;
  user.phtBalance += reward;
  user.totalEarnedPht = Number(user.totalEarnedPht || 0) + reward;
  user.peBalance = Number(user.peBalance || 0) + DAILY_CHECKIN_PE;
  user.totalEarnedPe = Number(user.totalEarnedPe || 0) + DAILY_CHECKIN_PE;
  user.vipLevel = vipLevelFor(user.totalEarnedPht);
  user.vipInitialized = true;
  await user.save();
  return NextResponse.json({
    ok: true,
    reward,
    streak,
    phtBalance: user.phtBalance,
    peBalance: user.peBalance,
    peReward: DAILY_CHECKIN_PE,
    checkinDate: today,
  });
}
