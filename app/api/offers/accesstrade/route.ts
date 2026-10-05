import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getAccessTradeCampaigns } from "@/lib/accesstrade";
export async function GET() { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { const payload = await getAccessTradeCampaigns(); return NextResponse.json(payload); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AccessTrade unavailable", data: [] }, { status: 503 }); } }
