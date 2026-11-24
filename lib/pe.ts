import Transaction from "@/models/Transaction";
import User from "@/models/User";

// PE is a non-withdrawable ecosystem point. Issuance starts deliberately low:
// one PE for every 1,000 PHT from an approved earning.
export function peForApprovedPht(pht: number) {
  return Math.floor(Math.max(0, Number(pht)) / 10) / 100;
}

export async function awardPeForApprovedEarning(transactionId: unknown) {
  const source = await Transaction.findById(transactionId).select("amount").lean() as { amount?: number } | null;
  const pe = peForApprovedPht(Number(source?.amount || 0));
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, type: "earning", currency: "PHT", status: "approved", "metadata.peReward": { $exists: false } },
    { $set: { "metadata.peReward": pe } },
    { new: true },
  );
  if (!tx) return 0;
  if (pe > 0) await User.findByIdAndUpdate(tx.userId, { $inc: { peBalance: pe, totalEarnedPe: pe, taskEarnedPe: pe } });
  return pe;
}
