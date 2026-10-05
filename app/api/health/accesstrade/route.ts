import { NextResponse } from "next/server";
import { getAccessTradeCampaigns } from "@/lib/accesstrade";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getAccessTradeCampaigns();
    return NextResponse.json({
      ok: true,
      configured: true,
      approvedCampaigns: payload.data.length,
      totalCampaigns: payload.totalCampaigns,
      approvals: { successful: payload.totalCampaigns },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AccessTrade unavailable";
    return NextResponse.json({ ok: false, configured: !message.includes("Missing ACCESSTRADE_API_KEY"), error: message }, { status: 503 });
  }
}
