import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getAccessTradeCampaigns } from "@/lib/accesstrade";
export async function GET(request: Request) { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const page = new URL(request.url).searchParams.get("page") || "1"; try { return NextResponse.json(await getAccessTradeCampaigns(Number(page), 20)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AccessTrade unavailable" }, { status: 503 }); } }
