import mongoose, { Schema, models } from "mongoose";

const ReferralRewardSchema = new Schema(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      unique: true,
      sparse: true,
    },
    rewardTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    kind: {
      type: String,
      enum: ["revenue-share", "activation", "welcome"],
      required: true,
    },
    rate: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    referrerTier: String,
    status: {
      type: String,
      enum: ["pending", "approved", "reversed", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

ReferralRewardSchema.index(
  { referredUserId: 1, kind: 1 },
  { unique: true, partialFilterExpression: { kind: "activation" } },
);
export default models.ReferralReward ||
  mongoose.model("ReferralReward", ReferralRewardSchema);
