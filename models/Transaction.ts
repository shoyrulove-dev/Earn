import { scopedModel } from "../lib/mongodb";
import { Schema} from "mongoose";
const TransactionSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, type: { type: String, enum: ["earning", "withdrawal", "refund", "referral", "checkin", "bonus", "swap"], required: true }, currency: { type: String, enum: ["PHT", "USD", "PE"], default: "PHT" }, amount: { type: Number, required: true }, status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, availableAt: Date, source: String, reference: { type: String, unique: true, sparse: true }, metadata: Schema.Types.Mixed }, { timestamps: true });
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, type: 1, currency: 1, status: 1 });
export default scopedModel("Transaction", TransactionSchema);
