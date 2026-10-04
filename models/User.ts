import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, trim: true }, username: { type: String, unique: true, sparse: true, lowercase: true, trim: true }, email: { type: String, unique: true, sparse: true, lowercase: true },
  image: String, passwordHash: String, balance: { type: Number, default: 0 }, pendingBalance: { type: Number, default: 0 }, role: { type: String, enum: ["user", "admin"], default: "user" }, memberLevel: { type: String, enum: ["starter", "active", "pro"], default: "starter" }, referralCode: { type: String, unique: true, sparse: true, index: true }, referredBy: { type: Schema.Types.ObjectId, ref: "User" }, referralEarnings: { type: Number, default: 0 }
}, { timestamps: true });
export default models.User || mongoose.model("User", UserSchema);
