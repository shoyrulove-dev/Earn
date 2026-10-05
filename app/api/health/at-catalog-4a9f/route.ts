import { NextResponse } from "next/server";
import { getAccessTradeCatalog } from "@/lib/accesstrade";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const campaigns = await getAccessTradeCatalog();
    return NextResponse.json({ data: campaigns.filter((c) => String(c.approval || "").toLowerCase() === "unregistered").map((c) => ({ id: c.id || c.campaign_id, name: c.name || c.title, merchant: c.merchant, category: c.category, type: c.type, description: c.description, status: c.status, start_time: c.start_time, end_time: c.end_time })) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 503 }); }
}
