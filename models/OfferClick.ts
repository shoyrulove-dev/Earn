import mongoose, { Schema, models } from "mongoose";
const OfferClickSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, network: { type: String, enum: ["accesstrade", "timewall", "cpalead"], required: true }, clickId: { type: String, required: true }, subId: String, status: { type: String, default: "clicked" }, metadata: Schema.Types.Mixed }, { timestamps: true });
OfferClickSchema.index({ network: 1, clickId: 1 }, { unique: true });
export default models.OfferClick || mongoose.model("OfferClick", OfferClickSchema);
