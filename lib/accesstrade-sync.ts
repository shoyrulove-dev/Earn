import { getAccessTradeTransactions } from "@/lib/accesstrade";
import { connectDB } from "@/lib/mongodb";
import { networkAmountToUsd, offerRewardPht, USER_SHARE } from "@/lib/pht";
import OfferClick from "@/models/OfferClick";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

function clickIdOf(row: Record<string, unknown>) {
  const direct = String(row.utm_content || row.sub1 || row.sub_1 || "");
  if (direct.startsWith("pe_")) return direct;
  const url = String(row.click_url || "");
  const found = url.match(/[?&](?:sub1|utm_content)=([^&]+)/);
  return found ? decodeURIComponent(found[1]) : "";
}
export async function syncAccessTradeTransactions() {
  await connectDB();
  const rows = await getAccessTradeTransactions(
    new Date(Date.now() - 90 * 86400000),
  );
  let created = 0,
    updated = 0,
    unmatched = 0;
  const holdDays = Math.min(
    30,
    Math.max(2, Number(process.env.PHT_PENDING_DAYS || 5)),
  );
  for (const row of rows) {
    const clickId = clickIdOf(row),
      conversionId = String(
        row.conversion_id || row.id || row.transaction_id || "",
      );
    if (!clickId || !conversionId) {
      unmatched++;
      continue;
    }
    const click = (await OfferClick.findOne({
      network: "accesstrade",
      clickId,
    }).lean()) as { userId: unknown } | null;
    if (!click) {
      unmatched++;
      continue;
    }
    const status = Number(row.status ?? 0),
      reference = `accesstrade:${conversionId}`;
    let tx = await Transaction.findOne({ reference });
    if (!tx) {
      const user = (await User.findById(click.userId)
        .select("totalEarnedPht")
        .lean()) as { totalEarnedPht?: number } | null;
      if (!user) continue;
      const gross = Number(row.commission || 0),
        grossUsd = networkAmountToUsd(gross, "VND"),
        rewardPht = offerRewardPht(grossUsd, user.totalEarnedPht);
      if (rewardPht <= 0) continue;
      tx = await Transaction.create({
        userId: click.userId,
        type: "earning",
        currency: "PHT",
        amount: rewardPht,
        status: status === 2 ? "rejected" : "pending",
        availableAt:
          status === 1 ? new Date(Date.now() + holdDays * 86400000) : undefined,
        source: "accesstrade",
        reference,
        metadata: {
          clickId,
          conversionId,
          gross,
          grossUsd,
          userShare: USER_SHARE,
          networkStatus: status,
          reasonReject: row.reason_reject || row.reason_rejected,
        },
      });
      if (status !== 2)
        await User.findByIdAndUpdate(click.userId, {
          $inc: { pendingPht: rewardPht },
        });
      created++;
    } else if (Number(tx.metadata?.networkStatus) !== status) {
      if (status === 2 && tx.status === "pending") {
        tx.status = "rejected";
        await User.findByIdAndUpdate(tx.userId, {
          $inc: { pendingPht: -Math.abs(tx.amount) },
        });
      } else if (status === 1 && tx.status === "pending")
        tx.availableAt = new Date(Date.now() + holdDays * 86400000);
      tx.metadata = {
        ...(tx.metadata || {}),
        networkStatus: status,
        reasonReject: row.reason_reject || row.reason_rejected,
      };
      await tx.save();
      updated++;
    }
    await OfferClick.updateOne(
      { network: "accesstrade", clickId },
      {
        $set: {
          status:
            status === 2
              ? "rejected"
              : status === 1
                ? "confirmed"
                : "converted",
          metadata: { conversionId, networkStatus: status },
        },
      },
    );
  }
  return { fetched: rows.length, created, updated, unmatched };
}
