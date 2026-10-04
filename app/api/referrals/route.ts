import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
export async function GET() { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); await connectDB(); const user = await User.findById(session.user.id).select("referralCode referralEarnings").lean(); const members = await User.countDocuments({ referredBy: session.user.id }); return NextResponse.json({ ...user, members }); }
