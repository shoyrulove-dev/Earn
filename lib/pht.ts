export const PHT_PER_USD = 1000;
export const MIN_WITHDRAW_PHT = 5000;
export const REFERRAL_WELCOME_PHT = 200;
export const REFERRAL_ACTIVATION_PHT = 5000;
export const USER_SHARE = Math.min(
  0.8,
  Math.max(0.1, Number(process.env.PHT_USER_SHARE || 0.5)),
);
export const VND_PER_USD = Math.max(
  1,
  Number(process.env.VND_PER_USD || 24000),
);

export function tierFor(totalEarnedPht: number) {
  if (totalEarnedPht >= 200000)
    return {
      name: "diamond",
      feeRate: 0,
      bonusRate: 0.1,
      priority: true,
      autoReview: true,
    } as const;
  if (totalEarnedPht >= 50000)
    return {
      name: "gold",
      feeRate: 0.01,
      bonusRate: 0.05,
      priority: true,
      autoReview: true,
    } as const;
  if (totalEarnedPht >= 5000)
    return {
      name: "silver",
      feeRate: 0.03,
      bonusRate: 0.02,
      priority: true,
      autoReview: false,
    } as const;
  return {
    name: "bronze",
    feeRate: 0.05,
    bonusRate: 0,
    priority: false,
    autoReview: false,
  } as const;
}
export function networkAmountToUsd(amount: number, currency?: string) {
  return String(currency || "USD").toUpperCase() === "VND"
    ? amount / VND_PER_USD
    : amount;
}
export function offerRewardPht(grossUsd: number, totalEarnedPht = 0) {
  const tier = tierFor(totalEarnedPht);
  return Math.max(
    0,
    Math.floor(grossUsd * USER_SHARE * PHT_PER_USD * (1 + tier.bonusRate)),
  );
}
export const vipLevelFor = (totalEarnedPht: number) =>
  tierFor(totalEarnedPht).name;

export function referralTerms(totalEarnedPht: number) {
  const level = vipLevelFor(totalEarnedPht);
  return level === "diamond"
    ? { level, rate: 0.1, activationBonus: 1000 }
    : level === "gold"
      ? { level, rate: 0.08, activationBonus: 750 }
      : level === "silver"
        ? { level, rate: 0.06, activationBonus: 500 }
        : { level, rate: 0.05, activationBonus: 300 };
}
