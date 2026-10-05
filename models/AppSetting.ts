import mongoose, { Schema, models } from "mongoose";

const AppSettingSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default models.AppSetting || mongoose.model("AppSetting", AppSettingSchema);
