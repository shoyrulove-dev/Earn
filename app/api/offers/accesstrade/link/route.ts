import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { createAccessTradeLink } from "@/lib/accesstrade";
export async function POST(request: Request) { const session = await getAuthSession(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json(); if (!body.campaignId) return NextResponse.json({ error: "campaignId is required" }, { status: 400 }); try { return NextResponse.json(await createAccessTradeLink(String(body.campaignId), session.user.id, body.url)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "AccessTrade unavailable" }, { status: 503 }); } }
