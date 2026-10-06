import { NextResponse } from "next/server";
import { createAccessTradeLink, getAccessTradeCampaigns } from "@/lib/accesstrade";
import { connectDB } from "@/lib/mongodb";
import AppSetting from "@/models/AppSetting";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getAccessTradeCampaigns();
    await connectDB();
    const cached = await AppSetting.findOne({ key: "accesstrade-offer-audit" }).lean() as { value?: { checkedAt?: string; results?: unknown[] } } | null;
    const fresh = cached?.value?.checkedAt && Date.now() - new Date(cached.value.checkedAt).getTime() < 6 * 60 * 60 * 1000;
    let results = fresh ? cached?.value?.results || [] : [];
    if (!fresh) {
      results = await Promise.all(payload.data.map(async (campaign) => {
        const text = `${campaign.name} ${campaign.description || ""} ${campaign.category || ""}`.toLowerCase();
        const hard = /vay|loan|credit|tín dụng|nạp|deposit|trade|futures|bảo hiểm|insurance|đầu tư/.test(text);
        const medium = /bank|ngân hàng|wallet|ví|kyc|tài khoản|telecom|nhà mạng/.test(text);
        const difficulty = hard ? "hard" : medium ? "medium" : "easy";
        try {
          const response = await createAccessTradeLink(campaign.campaign_id, `audit_${crypto.randomBytes(8).toString("hex")}`, campaign.url as string | undefined);
          const record = response as Record<string, unknown>;
          const data = (record.data || {}) as Record<string, unknown>;
          const success = Array.isArray(data.success_link) ? data.success_link.length > 0 : Boolean(data.aff_url || data.aff_short_url || record.success);
          return { campaignId: campaign.campaign_id, name: campaign.name, type: campaign.campaign_type, difficulty, linkOk: success, rewardPht: campaign.estimated_reward_pht, holdDays: campaign.hold_days };
        } catch (error) {
          return { campaignId: campaign.campaign_id, name: campaign.name, type: campaign.campaign_type, difficulty, linkOk: false, error: error instanceof Error ? error.message : "Link test failed" };
        }
      }));
      await AppSetting.findOneAndUpdate({ key: "accesstrade-offer-audit" }, { $set: { value: { checkedAt: new Date().toISOString(), results } } }, { upsert: true });
    }
    return NextResponse.json({
      ok: true,
      configured: true,
      approvedCampaigns: payload.data.length,
      totalCampaigns: payload.totalCampaigns,
      approvals: { successful: payload.totalCampaigns },
      checkedAt: fresh ? cached?.value?.checkedAt : new Date().toISOString(),
      offers: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AccessTrade unavailable";
    return NextResponse.json({ ok: false, configured: !message.includes("Missing ACCESSTRADE_API_KEY"), error: message }, { status: 503 });
  }
}
