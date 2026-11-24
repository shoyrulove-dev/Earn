import { scopedModel } from "../lib/mongodb";
import { Schema} from "mongoose";

const AppSettingSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default scopedModel("AppSetting", AppSettingSchema);
