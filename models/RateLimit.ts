import mongoose, { Schema, models } from "mongoose";

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, default: 0 },
  resetAt: { type: Date, required: true, index: { expires: 0 } },
});

export default models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
