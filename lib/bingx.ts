export type BingXTierConfig = {
  active: boolean;
  rewardPht: number;
  holdDays: number;
  requirement: string;
};

export type BingXConfig = {
  affiliateId: string;
  affiliateUrl: string;
  active: boolean;
  autoAnnounce: boolean;
  mysteryBox: string;
  tiers: Record<"1" | "2" | "3", BingXTierConfig>;
};

export const BINGX_DEFAULTS: BingXConfig = {
  affiliateId: "1FNYBD",
  affiliateUrl: "https://bingxdao.com/invite/1FNYBD/",
  active: true,
  autoAnnounce: true,
  mysteryBox: "Mystery Box worth at least 5 USDT for eligible new users",
  tiers: {
    "1": {
      active: true,
      rewardPht: 50,
      holdDays: 7,
      requirement: "Đăng ký qua Pure Earn và hoàn tất KYC được xác minh",
    },
    "2": {
      active: true,
      rewardPht: 1500,
      holdDays: 14,
      requirement: "Đang chờ xác minh điều kiện sự kiện BingX hiện hành",
    },
    "3": {
      active: false,
      rewardPht: 0,
      holdDays: 14,
      requirement: "Đang chờ xác minh điều kiện tier 3 từ BingX",
    },
  },
};

export function normalizeBingXConfig(
  raw: Record<string, unknown> = {},
): BingXConfig {
  const rawTiers = (raw.tiers || {}) as Record<
    string,
    Partial<BingXTierConfig>
  >;
  const legacyReward = Number(
    raw.rewardPht || BINGX_DEFAULTS.tiers["1"].rewardPht,
  );
  const legacyHold = Number(raw.holdDays || BINGX_DEFAULTS.tiers["1"].holdDays);
  const tiers = Object.fromEntries(
    ([1, 2, 3] as const).map((tier) => {
      const key = String(tier) as "1" | "2" | "3";
      const fallback = BINGX_DEFAULTS.tiers[key];
      const source = rawTiers[key] || {};
      return [
        key,
        {
          active: Boolean(source.active ?? fallback.active),
          rewardPht: Math.max(
            0,
            Math.floor(
              Number(
                source.rewardPht ??
                  (tier === 1 ? legacyReward : fallback.rewardPht),
              ),
            ),
          ),
          holdDays: Math.min(
            60,
            Math.max(
              1,
              Math.floor(
                Number(
                  source.holdDays ??
                    (tier === 1 ? legacyHold : fallback.holdDays),
                ),
              ),
            ),
          ),
          requirement: String(
            source.requirement || fallback.requirement,
          ).trim(),
        },
      ];
    }),
  ) as BingXConfig["tiers"];
  const affiliateUrl = String(raw.affiliateUrl || BINGX_DEFAULTS.affiliateUrl).trim();
  return {
    affiliateId: String(raw.affiliateId || BINGX_DEFAULTS.affiliateId).trim(),
    affiliateUrl,
    active: Boolean((raw.active ?? BINGX_DEFAULTS.active) && affiliateUrl),
    autoAnnounce: Boolean(raw.autoAnnounce ?? true),
    mysteryBox: String(raw.mysteryBox || BINGX_DEFAULTS.mysteryBox).trim(),
    tiers,
  };
}
