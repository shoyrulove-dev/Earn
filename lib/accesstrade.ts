import { cachedAccessTradeCatalog } from "./accesstrade-cache";
import { readAccessTradePages } from "./accesstrade-pagination";
import { createHash } from "node:crypto";
const BASE = process.env.ACCESSTRADE_API_URL || "https://api.accesstrade.vn";
type JsonRecord = Record<string, unknown>;
function headers() { const key = process.env.ACCESSTRADE_API_KEY; if (!key) throw new Error("Missing ACCESSTRADE_API_KEY"); return { "Content-Type": "application/json", Authorization: `Token ${key}` }; }
function list(payload: unknown, depth = 0): JsonRecord[] { if (Array.isArray(payload)) return payload as JsonRecord[]; if (!payload || typeof payload !== "object" || depth > 3) return []; const value = payload as JsonRecord; for (const candidate of [value.data, value.campaigns, value.items, value.results]) { const nested = list(candidate, depth + 1); if (nested.length) return nested; } return []; }
const getPages = (path: (page: number) => string) => readAccessTradePages((page) => fetch(BASE + path(page), { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(6_000) }), list);
function plainText(value: unknown): string {
  const raw = typeof value === "string" ? value : value && typeof value === "object" ? Object.values(value as Record<string, unknown>).filter(x => typeof x === "string").join(" ") : "";
  return raw.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
function fixedPayoutVnd(value: unknown): number {
  const text = plainText(value);
  const match = text.match(/(?:income|hoa\s*hồng|commission|phí|thưởng)[^\d]{0,100}(\d{1,3}(?:[.,]\d{3})+|\d{4,8})\s*(?:đ|vnd)/i);
  return match ? Number(match[1].replace(/[.,]/g, "")) : 0;
}
function classify(c: JsonRecord) { const text=[c.name,c.title,c.merchant,c.category,c.sub_category,JSON.stringify(c.description||{})].filter(Boolean).join(" ").toLowerCase(); const referral=/accesstrade\s*referral|access\s*trade\s*referral/.test(text); const cps=/shopee|lazada|tiktok|tiki|cellphones|aeon|eshop|thương mại điện tử|ecommerce|mua sắm|retail|cps/.test(text); const game=/game|gaming|trò chơi/.test(text); const finance=/bank|ngân hàng|wallet|ví điện tử|momo|vnpay|kbank|mbbank|cake|tnex/.test(text); const loan=/loan|vay|tín dụng|credit|cpl/.test(text); const kind=game?"GAME":loan?"CPL":finance?"CPA":cps?"CPS":"OTHER"; return { referral, kind, fastReward:["CPA","GAME"].includes(kind) }; }
export async function getAccessTradeCampaigns(options: { includeUnpriced?: boolean } = {}) {
  const cacheId = "catalog-raw-v2:" + createHash("sha256").update(BASE).digest("hex");
  const { campaigns, rates } = await cachedAccessTradeCatalog(cacheId, async () => {
    const campaigns = await getPages(page => `/v1/campaigns?page=${page}&limit=20&approval=successful`);
    await new Promise(resolve => setTimeout(resolve, 350));
    const rates = await getPages(page => `/v1/cashback/campaigns?page=${page}&page_size=20`);
    return { campaigns, rates };
  });
  const unique = [...new Map(campaigns.map(c => [String(c.id || c.campaign_id || ""), c])).values()].filter(c => c.id || c.campaign_id);
  const rateMap = new Map(rates.map(r => [String(r.campaign_id || r.id || ""), r]));
  const blocked = (process.env.ACCESSTRADE_BLOCKED_CAMPAIGNS || "").split(",").map(x => x.trim()).filter(Boolean);
  const holdDays = Math.min(30, Math.max(2, Number(process.env.PHT_PENDING_DAYS || 5)));
  const userShare = Math.min(.8, Math.max(.1, Number(process.env.PHT_USER_SHARE || .4)));
  const vndPerUsd = Math.max(1, Number(process.env.VND_PER_USD || 25000));
  const toPht = (commissionVnd: number) => Math.max(0, Math.floor(commissionVnd / vndPerUsd * userShare * 1000));

  const data = unique.flatMap(c => {
    const id = String(c.campaign_id || c.id || "");
    const policy = classify(c);
    const verifiedHighlands = id === "6709203674879803188" || /highlands\s*redeem\s*zalo/i.test(String(c.name || c.title || c.merchant || ""));
    const verifiedMbIntro = id === "5325601808419035241" || /mb\s*bank.*link.*giới thiệu/i.test(String(c.name || c.title || c.merchant || ""));
    const verifiedShopeePay = id === "7073874095910363548" || /shopeepay.*cpr/i.test(String(c.name || c.title || c.merchant || ""));
    if (String(c.approval || "").toLowerCase() !== "successful" || (Number(c.status ?? 1) !== 1 && !verifiedHighlands && !verifiedMbIntro && !verifiedShopeePay) || policy.referral || blocked.includes(id)) return [];

    const r = rateMap.get(id) || {};
    // Only cashback-listed CPS campaigns may be incentivized to members.
    if (policy.kind === "CPS" && !rateMap.has(id)) return [];
    const isCoffeeHouse = id === "756" || /the\s*coffee\s*house/i.test(String(c.name || c.title || c.merchant || ""));
    const isHighlands = verifiedHighlands;
    const commissionType = String(r.commission_type || c.commission_type || "");
    const isPercentage = /%|percent/i.test(commissionType);
    const variableReward = policy.kind === "CPS" && isPercentage;
    // Campaign 756 pays per successfully redeemed bill. The normalized
    // campaign list does not expose that fixed payout, so keep this verified
    // campaign-level override until the partner API starts returning it.
    const payoutOverrideVnd = isCoffeeHouse ? 10500 : isHighlands ? 9000 : verifiedMbIntro ? 70000 : verifiedShopeePay ? 80000 : fixedPayoutVnd(c.description);
    const campaignHoldDays = isHighlands || verifiedMbIntro || verifiedShopeePay ? 30 : holdDays;
    const minCommission = payoutOverrideVnd || Number(r.min_commission ?? c.min_commission ?? 0);
    const maxCommission = payoutOverrideVnd || Number(r.max_commission ?? c.max_commission ?? minCommission);
    const minRewardPht = isPercentage && !payoutOverrideVnd ? 0 : toPht(minCommission || maxCommission);
    const maxRewardPht = isPercentage && !payoutOverrideVnd ? 0 : toPht(maxCommission || minCommission);
    // Do not advertise an offer until its member payout can be stated clearly.
    // Percentage/CPS and zero-payout campaigns are reconciled differently and
    // would otherwise show a misleading "after validation" reward.
    if (!maxRewardPht && !variableReward && !options.includeUnpriced) return [];
    const exactReward = minRewardPht > 0 && minRewardPht === maxRewardPht;
    const name = String(c.name || c.title || c.merchant || "Available offer");
    const description = plainText(c.description);

    return [{
      campaign_id: id,
      network: "AT",
      name,
      merchant: String(c.merchant || ""),
      logo: c.logo || c.image || c.image_url,
      url: c.url,
      description,
      category: c.category,
      campaign_type: policy.kind,
      max_commission: maxCommission,
      min_commission: minCommission,
      commission_type: commissionType,
      fast_reward: policy.fastReward,
      incentive_allowed: true,
      estimated_reward_pht: exactReward ? minRewardPht : maxRewardPht,
      min_reward_pht: minRewardPht,
      max_reward_pht: maxRewardPht,
      exact_reward: exactReward,
      variable_reward: variableReward,
      max_commission_rate: variableReward ? maxCommission : undefined,
      custom_instructions: variableReward || isCoffeeHouse || isHighlands || verifiedMbIntro || verifiedShopeePay || Boolean(description),
      member_reward_note: variableReward
        ? `Hoa hồng từng đơn có thể khác nhau, tối đa ${maxCommission || 20}%. Pure Earn thưởng ${(userShare * 100).toFixed(0)}% hoa hồng thực tế AT xác nhận, quy đổi sang PHT sau đối soát; đây không phải mức thưởng cố định theo giá trị đơn.`
        : verifiedShopeePay
        ? "Nhận 1.280 PHT cho mỗi lượt ShopeePay hợp lệ được AT xác nhận. Người dùng phải là khách hàng đủ điều kiện, tải ứng dụng lần đầu trên thiết bị, nhập mã giới thiệu AT150 qua landing page, hoàn tất KYC bằng NFC và nạp tối thiểu 10.000đ từ tài khoản ngân hàng liên kết. Thưởng chờ đối soát khoảng 30 ngày."
        : verifiedMbIntro
        ? "Nhận 1.120 PHT cho mỗi hồ sơ MB hợp lệ được AT xác nhận. Người dùng cần mở tài khoản qua đúng liên kết Pure Earn và hoàn tất điều kiện chiến dịch; hồ sơ trùng hoặc thiếu thông tin định danh sẽ không được tính. Thưởng chờ đối soát khoảng 30 ngày."
        : isHighlands
        ? "Nhận 144 PHT cho mỗi hóa đơn đủ điều kiện được AT xác nhận. Người dùng cần mở voucher từ Pure Earn, đưa mã cho nhân viên Highlands trước khi thanh toán và bảo đảm voucher được áp dụng thành công. Đơn hợp lệ sẽ chờ đối soát khoảng 30 ngày."
        : isCoffeeHouse
        ? "Nhận 168 PHT cho mỗi hóa đơn đủ điều kiện được đối tác ghi nhận sử dụng voucher thành công. Chỉ lấy mã nhưng chưa phát sinh hóa đơn sẽ không được thưởng."
        : undefined,
      exchange_rate_vnd: vndPerUsd,
      user_share_rate: userShare,
      hold_days: campaignHoldDays,
      reward_note: variableReward
        ? `Variable CPS reward: ${(userShare * 100).toFixed(0)}% of the commission actually confirmed by AT, converted to PHT after reconciliation.`
        : exactReward
        ? `Reward ${minRewardPht.toLocaleString("en-US")} PHT at the current AT payout. Final credit follows the confirmed commission.`
        : maxRewardPht
          ? `Estimated range ${minRewardPht.toLocaleString("en-US")}-${maxRewardPht.toLocaleString("en-US")} PHT. Final credit follows the commission confirmed by AT.`
          : "Reward is calculated after AT confirms the conversion.",
      instructions: verifiedShopeePay ? [
        "Mở ShopeePay – CPR từ Pure Earn để tạo đúng liên kết tracking.",
        "Tải ứng dụng ShopeePay lần đầu trên thiết bị đang sử dụng và đăng nhập.",
        "Nhập mã giới thiệu chung AT150 qua landing page khi hệ thống yêu cầu.",
        "Hoàn tất xác minh thông tin bằng NFC và nạp tối thiểu 10.000đ từ tài khoản ngân hàng liên kết.",
        "Chỉ người dùng mới đủ điều kiện được AT xác nhận mới nhận 1.280 PHT; không dùng tài khoản trùng hoặc gian lận.",
      ] : verifiedMbIntro ? [
        "Mở MB Bank – Link giới thiệu từ Pure Earn để tạo đúng liên kết tracking.",
        "Đăng ký tài khoản MB mới qua liên kết và hoàn tất các bước xác thực theo hướng dẫn của MB Bank.",
        "Chỉ dùng thông tin thật, không dùng tài khoản trùng, không tự tạo nhiều hồ sơ hoặc gian lận giới thiệu.",
        "Hồ sơ hợp lệ được AT xác nhận sẽ nhận 1.120 PHT sau thời gian đối soát khoảng 30 ngày.",
      ] : isHighlands ? [
        "Mở Highlands Redeem Zalo từ Pure Earn để tạo đúng liên kết theo dõi.",
        "Chọn voucher phù hợp và đọc điều kiện cửa hàng, giá trị hóa đơn và thời gian áp dụng.",
        "Đưa mã voucher cho nhân viên Highlands trước khi thanh toán và kiểm tra mã đã được áp dụng thành công trên hóa đơn.",
        "Chỉ hóa đơn hợp lệ được AT ghi nhận mới nhận 144 PHT; đơn hủy, hoàn hoặc sai điều kiện sẽ không được thưởng.",
        "Thưởng chờ đối soát khoảng 30 ngày trước khi chuyển sang số dư khả dụng.",
      ] : variableReward ? [
        `Mở ${name} từ Pure Earn rồi mua hàng bằng đúng liên kết theo dõi vừa tạo.`,
        "Hoa hồng tùy sản phẩm, ngành hàng và điều kiện chiến dịch; con số tối đa không phải mức bảo đảm cho mọi đơn hàng.",
        "Đơn chỉ được ghi nhận khi thanh toán thành công, không hủy/hoàn và được AT xác nhận hợp lệ. Không tự mua nếu điều khoản chiến dịch cấm self-order.",
        `Pure Earn cộng ${(userShare * 100).toFixed(0)}% hoa hồng thực nhận dưới dạng PHT sau khi đối tác đối soát.`,
      ] : isCoffeeHouse ? [
        "Nhấn Bắt đầu làm trên Pure Earn để mở đúng liên kết nhiệm vụ và nhận mã voucher.",
        "Chia sẻ voucher GIAM50%TU180K: giảm 50.000đ cho hóa đơn từ 180.000đ tại cửa hàng áp dụng trong thời gian chương trình.",
        "Khách đưa mã cho nhân viên trước khi thanh toán và bảo đảm mã được áp dụng thành công trên hóa đơn. Không tự tạo giao dịch giả hoặc dùng trùng mã trái quy định.",
        "Chỉ hóa đơn hợp lệ được đối tác xác nhận mới nhận 168 PHT. Phần thưởng chuyển sang chờ đối soát rồi mới vào số dư khả dụng.",
      ] : description ? [
        `Mở ${name} từ Pure Earn và đọc kỹ điều kiện trước khi thực hiện.`,
        description.slice(0, 900),
        "Chỉ hoàn thành bằng thông tin thật; không dùng VPN, máy ảo, tài khoản trùng lặp hoặc giao dịch giả.",
        `Phần thưởng chỉ được cộng sau khi đối tác xác nhận hợp lệ và qua thời gian đối soát khoảng ${holdDays} ngày.`,
      ] : [
        `Open ${name} from Pure Earn and keep the same browser and device.`,
        description || "Complete every requirement shown by the partner using accurate personal information.",
        "Only new eligible customers qualify. VPN, emulators, duplicate accounts and false identity information are prohibited.",
        `Confirmed rewards remain pending for about ${holdDays} days for reconciliation.`,
      ],
    }];
  });

  const eligibleIds = new Set(data.map(item => item.campaign_id));
  const approved = unique.map(c => {
    const id = String(c.campaign_id || c.id || "");
    const rate = rateMap.get(id) || {};
    const policy = classify(c);
    const commissionType = String(rate.commission_type || c.commission_type || "");
    const isPercentage = /%|percent/i.test(commissionType);
    const reason = eligibleIds.has(id)
      ? "eligible"
      : policy.referral
        ? "referral campaign"
        : policy.kind === "CPS" && !rateMap.has(id)
          ? "not in cashback feed"
          : !rateMap.has(id)
            ? "missing cashback terms"
            : isPercentage
              ? "variable commission without confirmed cashback eligibility"
              : "missing verified payout or blocked";
    return { campaign_id: id, name: String(c.name || c.title || c.merchant || "Available campaign"), merchant: String(c.merchant || ""), category: String(c.category || ""), campaign_type: policy.kind, commission_type: commissionType, min_commission: rate.min_commission ?? c.min_commission, max_commission: rate.max_commission ?? c.max_commission, reason };
  });
  return { data, approved, totalCampaigns: unique.length, excluded: unique.length - data.length, policy: "approved-running-cashback-eligible", verifiedAt: new Date().toISOString() };
}
export async function createAccessTradeLink(campaignId:string,clickId:string,url?:string){const response=await fetch(`${BASE}/v1/product_link/create`,{method:"POST",headers:headers(),body:JSON.stringify({campaign_id:campaignId,urls:url?[url]:undefined,sub1:clickId,utm_source:"pureearn",utm_medium:"offerwall",utm_campaign:campaignId,utm_content:clickId,url_enc:true})});if(!response.ok)throw new Error(`AccessTrade link failed: ${response.status}`);return response.json();}
export async function getAccessTradeTransactions(since:Date,until=new Date()){const query=new URLSearchParams({since:since.toISOString(),until:until.toISOString(),limit:"100",utm_source:"pureearn"});const response=await fetch(`${BASE}/v1/transactions?${query}`,{headers:headers(),cache:"no-store"});if(!response.ok)throw new Error(`AccessTrade transactions failed: ${response.status}`);return list(await response.json());}
