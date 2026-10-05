import { NextResponse } from "next/server";
import { getAccessTradeCampaigns } from "@/lib/accesstrade";

export const revalidate = 300;

export async function GET() {
  try {
    const payload = await getAccessTradeCampaigns(1, 200);
    return NextResponse.json({ ok: true, configured: true, approvedCampaigns: Array.isArray(payload.data) ? payload.data.length : 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AccessTrade unavailable";
    return NextResponse.json({ ok: false, configured: !message.includes("Missing ACCESSTRADE_API_KEY"), error: message }, { status: 503 });
  }
}
