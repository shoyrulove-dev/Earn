import { scopedModel } from "../lib/mongodb";
import { Schema} from "mongoose";
const OfferClickSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, network: { type: String, enum: ["accesstrade", "timewall", "cpalead"], required: true }, clickId: { type: String, required: true }, subId: String, campaignId: String, ipHash: { type: String, index: true }, status: { type: String, default: "clicked" }, metadata: Schema.Types.Mixed }, { timestamps: true });
OfferClickSchema.index({ network: 1, clickId: 1 }, { unique: true });
OfferClickSchema.index({ network: 1, campaignId: 1, ipHash: 1 });
export default scopedModel("OfferClick", OfferClickSchema);
