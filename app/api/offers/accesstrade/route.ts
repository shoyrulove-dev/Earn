import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getAccessTradeCampaigns } from "@/lib/accesstrade";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
export async function GET(request: Request) { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); await connectDB(); const user = await User.findById(session.user.id).select("country").lean() as { country?: string } | null; const detected = request.headers.get("x-vercel-ip-country"); if (user?.country !== "VN" || (detected && detected !== "VN")) return NextResponse.json({ data: [], restricted: true, reason: "AccessTrade offers are available in Vietnam only" }); try { const payload = await getAccessTradeCampaigns(); return NextResponse.json(payload); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AccessTrade unavailable", data: [] }, { status: 503 }); } }
