import { NextResponse } from "next/server";
import { getAccessTradeCampaigns, getAccessTradeCampaignStatus } from "@/lib/accesstrade";

export const revalidate = 300;

export async function GET() {
  try {
    const [payload, status] = await Promise.all([getAccessTradeCampaigns(1, 20), getAccessTradeCampaignStatus()]);
    return NextResponse.json({ ok: true, configured: true, approvedCampaigns: Array.isArray(payload.data) ? payload.data.length : 0, totalCampaigns: status.total, approvals: status.approvals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AccessTrade unavailable";
    return NextResponse.json({ ok: false, configured: !message.includes("Missing ACCESSTRADE_API_KEY"), error: message }, { status: 503 });
  }
}
