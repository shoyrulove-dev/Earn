import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    userId: { type: String, unique: true, sparse: true, index: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    image: String,
    passwordHash: String,
    country: { type: String, uppercase: true, trim: true },
    countryName: { type: String, trim: true, maxlength: 80 },
    locale: { type: String, enum: ["en", "vi", "zh", "es"], default: "en" },
    paymentAccounts: { type: Schema.Types.Mixed, default: {} },
    phtBalance: { type: Number, default: 0 },
    pendingPht: { type: Number, default: 0 },
    totalEarnedPht: { type: Number, default: 0, min: 0 },
    vipLevel: {
      type: String,
      enum: ["bronze", "silver", "gold", "diamond"],
      default: "bronze",
    },
    vipInitialized: { type: Boolean, default: false },
    lastCheckinAt: Date,
    checkinStreak: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    memberLevel: {
      type: String,
      enum: ["starter", "active", "pro"],
      default: "starter",
    },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    referralEarnings: { type: Number, default: 0 },
    activationBonusPaidAt: Date,
    signupIpHash: { type: String, select: false },
    referralRisk: { type: [String], default: [] },
  },
  { timestamps: true },
);
export default models.User || mongoose.model("User", UserSchema);
