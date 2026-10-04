import mongoose, { Schema, models } from "mongoose";
const TransactionSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, type: { type: String, enum: ["earning", "withdrawal", "refund"], required: true }, amount: { type: Number, required: true }, status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, source: String, reference: { type: String, unique: true, sparse: true }, metadata: Schema.Types.Mixed }, { timestamps: true });
export default models.Transaction || mongoose.model("Transaction", TransactionSchema);
