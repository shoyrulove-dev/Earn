import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, trim: true }, email: { type: String, unique: true, sparse: true, lowercase: true },
  image: String, passwordHash: String, balance: { type: Number, default: 0 }, pendingBalance: { type: Number, default: 0 }, role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true });
export default models.User || mongoose.model("User", UserSchema);
