import {
  REFERRAL_ACTIVATION_PHT,
  REFERRAL_WELCOME_PHT,
  referralTerms,
} from "@/lib/pht";
import ReferralReward from "@/models/ReferralReward";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

type Earning = {
  _id: unknown;
  userId: unknown;
  amount: number;
  status: string;
  availableAt?: Date;
};

async function relation(earnerId: unknown) {
  const earner = (await User.findById(earnerId)
    .select("referredBy")
    .lean()) as { referredBy?: unknown } | null;
  if (!earner?.referredBy) return null;
  const referrer = (await User.findById(earner.referredBy)
    .select("totalEarnedPht")
    .lean()) as { _id: unknown; totalEarnedPht?: number } | null;
  if (!referrer) return null;
  return {
    referrer,
    terms: referralTerms(Number(referrer.totalEarnedPht || 0)),
  };
}

export async function queueReferralReward(earning: Earning) {
  if (earning.status !== "pending" || Number(earning.amount) <= 0) return;
  const linked = await relation(earning.userId);
  if (!linked) return;
  const amount = Math.floor(Number(earning.amount) * linked.terms.rate);
  if (amount <= 0) return;
  const reference = `referral:${earning._id}`;
  if (await Transaction.exists({ reference })) return;
  try {
    const tx = await Transaction.create({
      userId: linked.referrer._id,
      type: "referral",
      currency: "PHT",
      amount,
      status: "pending",
      availableAt: earning.availableAt,
      source: "level-1-referral",
      reference,
      metadata: {
        fromUserId: earning.userId,
        earningId: earning._id,
        rate: linked.terms.rate,
        tier: linked.terms.level,
      },
    });
    await User.findByIdAndUpdate(linked.referrer._id, {
      $inc: { pendingPht: amount },
    });
    await ReferralReward.create({
      referrerId: linked.referrer._id,
      referredUserId: earning.userId,
      originalTransactionId: earning._id,
      rewardTransactionId: tx._id,
      kind: "revenue-share",
      rate: linked.terms.rate,
      amount,
      referrerTier: linked.terms.level,
      status: "pending",
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
}

export async function approveReferralForEarning(earning: Earning) {
  if (Number(earning.amount) <= 0) return;
  const linked = await relation(earning.userId);
  if (!linked) return;
  const reference = `referral:${earning._id}`;
  let rewardTx = await Transaction.findOneAndUpdate(
    { reference, status: "pending" },
    { $set: { status: "approved" } },
    { new: true },
  );
  if (rewardTx) {
    const amount = Math.abs(Number(rewardTx.amount));
    await User.findByIdAndUpdate(rewardTx.userId, {
      $inc: {
        pendingPht: -amount,
        phtBalance: amount,
        referralEarnings: amount,
      },
    });
    await ReferralReward.updateOne(
      { originalTransactionId: earning._id },
      { $set: { status: "approved" } },
    );
  } else if (!(await Transaction.exists({ reference }))) {
    const amount = Math.floor(Number(earning.amount) * linked.terms.rate);
    if (amount > 0) {
      try {
        rewardTx = await Transaction.create({
          userId: linked.referrer._id,
          type: "referral",
          currency: "PHT",
          amount,
          status: "approved",
          source: "level-1-referral",
          reference,
          metadata: {
            fromUserId: earning.userId,
            earningId: earning._id,
            rate: linked.terms.rate,
            tier: linked.terms.level,
          },
        });
        await User.findByIdAndUpdate(linked.referrer._id, {
          $inc: { phtBalance: amount, referralEarnings: amount },
        });
        await ReferralReward.create({
          referrerId: linked.referrer._id,
          referredUserId: earning.userId,
          originalTransactionId: earning._id,
          rewardTransactionId: rewardTx._id,
          kind: "revenue-share",
          rate: linked.terms.rate,
          amount,
          referrerTier: linked.terms.level,
          status: "approved",
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
    }
  }
  await releaseReferralMilestones(earning.userId, linked.referrer._id);
}

export async function rejectReferralForEarning(earningId: unknown) {
  const tx = await Transaction.findOneAndUpdate(
    { reference: `referral:${earningId}`, status: "pending" },
    { $set: { status: "rejected" } },
    { new: true },
  );
  if (tx)
    await User.findByIdAndUpdate(tx.userId, {
      $inc: { pendingPht: -Math.abs(Number(tx.amount)) },
    });
  await ReferralReward.updateOne(
    { originalTransactionId: earningId },
    { $set: { status: "rejected" } },
  );
}

export async function createWelcomeReward(
  userId: unknown,
  referrerId: unknown,
) {
  const reference = `referral:welcome:${userId}`;
  if (await Transaction.exists({ reference })) return;
  const tx = await Transaction.create({
    userId,
    type: "bonus",
    currency: "PHT",
    amount: REFERRAL_WELCOME_PHT,
    status: "pending",
    source: "referral-welcome",
    reference,
    metadata: { referrerId, unlock: "first-approved-earning" },
  });
  await User.findByIdAndUpdate(userId, {
    $inc: { pendingPht: REFERRAL_WELCOME_PHT },
  });
  await ReferralReward.create({
    referrerId,
    referredUserId: userId,
    rewardTransactionId: tx._id,
    kind: "welcome",
    amount: REFERRAL_WELCOME_PHT,
    status: "pending",
  });
}

async function releaseReferralMilestones(userId: unknown, referrerId: unknown) {
  const welcome = await Transaction.findOneAndUpdate(
    { reference: `referral:welcome:${userId}`, status: "pending" },
    { $set: { status: "approved" } },
    { new: true },
  );
  if (welcome) {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        pendingPht: -REFERRAL_WELCOME_PHT,
        phtBalance: REFERRAL_WELCOME_PHT,
      },
    });
    await ReferralReward.updateOne(
      { referredUserId: userId, kind: "welcome" },
      { $set: { status: "approved" } },
    );
  }
  const earned = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: "earning",
        status: "approved",
        amount: { $gt: 0 },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  if (Number(earned[0]?.total || 0) < REFERRAL_ACTIVATION_PHT) return;
  const marked = await User.findOneAndUpdate(
    { _id: userId, activationBonusPaidAt: { $exists: false } },
    { $set: { activationBonusPaidAt: new Date() } },
    { new: true },
  );
  if (!marked) return;
  const referrer = (await User.findById(referrerId)
    .select("totalEarnedPht")
    .lean()) as { totalEarnedPht?: number } | null;
  const terms = referralTerms(Number(referrer?.totalEarnedPht || 0));
  const reference = `referral:activation:${userId}`;
  try {
    const tx = await Transaction.create({
      userId: referrerId,
      type: "referral",
      currency: "PHT",
      amount: terms.activationBonus,
      status: "approved",
      source: "referral-activation",
      reference,
      metadata: {
        fromUserId: userId,
        threshold: REFERRAL_ACTIVATION_PHT,
        tier: terms.level,
      },
    });
    await User.findByIdAndUpdate(referrerId, {
      $inc: {
        phtBalance: terms.activationBonus,
        referralEarnings: terms.activationBonus,
      },
    });
    await ReferralReward.create({
      referrerId,
      referredUserId: userId,
      rewardTransactionId: tx._id,
      kind: "activation",
      amount: terms.activationBonus,
      referrerTier: terms.level,
      status: "approved",
    });
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
}
