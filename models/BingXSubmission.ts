import mongoose, { Schema, models } from "mongoose";

const BingXSubmissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tier: { type: Number, enum: [1, 2, 3], default: 1 },
  bingxUid: { type: String, required: true, trim: true },
  proofImageUrl: { type: String, required: true, trim: true },
  rewardPht: { type: Number, required: true },
  holdDays: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  releaseAt: Date,
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  reviewNote: String,
}, { timestamps: true });

BingXSubmissionSchema.index({ tier: 1, bingxUid: 1 }, { unique: true });
BingXSubmissionSchema.index({ userId: 1, tier: 1 }, { unique: true });
export default models.BingXSubmission || mongoose.model("BingXSubmission", BingXSubmissionSchema);
