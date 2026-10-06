import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { vipLevelFor } from "@/lib/pht";
import { writeAudit } from "@/lib/audit";

export async function applyPhtChargeback(userId: unknown, amount: number, reference: string, metadata: Record<string, unknown> = {}) {
  const user = await User.findById(userId);
  if (!user || amount <= 0) return null;
  const available = Math.max(0, Number(user.phtBalance || 0));
  const deducted = Math.min(available, amount);
  const debt = amount - deducted;
  user.phtBalance = available - deducted;
  user.phtDebt = Number(user.phtDebt || 0) + debt;
  user.totalEarnedPht = Math.max(0, Number(user.totalEarnedPht || 0) - amount);
  user.vipLevel = vipLevelFor(user.totalEarnedPht);
  await user.save();
  await Transaction.create({ userId: user._id, type: "refund", currency: "PHT", amount: -amount, status: "approved", source: "chargeback", reference, metadata: { ...metadata, deducted, debt } });
  await writeAudit({ action: "partner.chargeback", target: String(user._id), metadata: { amount, deducted, debt, reference, ...metadata } });
  return { deducted, debt };
}

export async function creditApprovedPht(userId: unknown, amount: number) {
  const user = await User.findById(userId);
  if (!user || amount <= 0) return { credited: 0, debtPaid: 0 };
  const debtPaid = Math.min(Number(user.phtDebt || 0), amount);
  const credited = amount - debtPaid;
  user.phtDebt = Math.max(0, Number(user.phtDebt || 0) - debtPaid);
  user.phtBalance = Number(user.phtBalance || 0) + credited;
  user.totalEarnedPht = Number(user.totalEarnedPht || 0) + amount;
  user.vipLevel = vipLevelFor(user.totalEarnedPht);
  await user.save();
  return { credited, debtPaid };
}
