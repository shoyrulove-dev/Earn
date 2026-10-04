import mongoose, { Schema, models } from "mongoose";
const MinijobSchema = new Schema({ title: { type: String, required: true }, description: String, source: { type: String, default: "MINIJOB" }, reward: { type: Number, required: true }, icon: String, tags: [String], active: { type: Boolean, default: true }, proofRequired: { type: Boolean, default: true } }, { timestamps: true });
export default models.Minijob || mongoose.model("Minijob", MinijobSchema);
