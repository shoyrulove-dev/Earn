import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
export async function GET() { const session = await getAuthSession(); if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); await connectDB(); const user = await User.findOne({ email: session.user.email.toLowerCase() }).select("name email image balance pendingBalance role referralCode referralEarnings").lean(); return NextResponse.json({ user }); }
