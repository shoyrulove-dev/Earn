import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getAccessTradeCampaigns } from "@/lib/accesstrade";
export async function GET(request: Request) { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const page = Number(new URL(request.url).searchParams.get("page") || "1"); try { const payload = await getAccessTradeCampaigns(Number.isFinite(page) ? page : 1, 20); return NextResponse.json(payload && typeof payload === "object" ? payload : { data: [] }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AccessTrade unavailable", data: [] }, { status: 503 }); } }
