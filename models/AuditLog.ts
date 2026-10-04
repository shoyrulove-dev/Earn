import mongoose, { Schema, models } from "mongoose";
const AuditLogSchema = new Schema({ actorId: { type: Schema.Types.ObjectId, ref: "User" }, action: { type: String, required: true }, target: String, ip: String, userAgent: String, metadata: Schema.Types.Mixed }, { timestamps: true });
export default models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
